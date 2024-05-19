const Cart = require('../dao/models/cart');
const Product = require('../dao/models/products');
const Ticket = require('../dao/models/ticket');
const mailService = require("../utils/mailService");
const { customizeError } = require("../middleware/errorHandler");
const { logger } = require('../utils/logger');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const cartController = {
    getAllCarts: async (req, res) => {
        try {
            const carts = await Cart.find();
            res.status(200).json({ status: 'success', message: 'Carritos encontrados.', data: carts });
        } catch (error) {
            logger.error('Error al obtener los carritos:', error);
            res.status(500).json({ status: 'error', message: customizeError('INTERNAL_SERVER_ERROR') });
        }
    },

    createCart: async (req, res) => {
        const userId = req.params.uid;
        try {
            const existingCart = await Cart.findOne({ UserId: userId });
            if (!existingCart) {
                const newCart = await Cart.create({ products: [], UserId: userId });
                return res.status(201).json({ status: 'ok', message: 'Carrito creado con éxito', data: newCart });
            }
            return res.status(200).json({ status: 'ok', message: 'Ya existe un carrito asociado a este usuario', data: existingCart });
        } catch (error) {
            logger.error(error);
            res.status(500).json({ status: 'error', message: customizeError('INTERNAL_SERVER_ERROR') });
        }
    },

    addProductToCart: async (req, res) => {
        const cartId = req.params.cid;
        const productId = req.params.pid;
        try {
            const cart = await Cart.findById(cartId);
            if (!cart) {
                return res.status(404).json({ status: 'error', message: `Carrito con ID ${cartId} no encontrado.` });
            }
            const product = await Product.findById(productId);
            const user = req.user;
            if (user.role === 'premium') {
                if (product.owner.toString() === user._id.toString()) {
                    return res.status(400).json({ status: 'error', message: 'No puedes agregar tu propio producto al carrito' });
                }
            }
            if (!product) {
                return res.status(404).json({ status: 'error', message: `Producto con ID ${productId} no encontrado en Products.` });
            }
            const productIndex = cart.products.findIndex((item) => item.product.toString() === productId);
            if (productIndex !== -1) {
                cart.products[productIndex].quantity += 1;
            } else {
                cart.products.push({ product: productId, quantity: 1 });
            }
            await cart.save();
            return res.status(200).json({ status: 'ok', message: 'Producto agregado al carrito con éxito.', data: cart });
        } catch (error) {
            logger.error(error);
            return res.status(500).json({ status: 'error', message: customizeError('INTERNAL_SERVER_ERROR') });
        }
    },

    getPurchasePage: async (req, res) => {
        const cartId = req.params.cid;
        try {
            const cart = await Cart.findById(cartId);
            if (!cart) {
                return res.status(404).json({ status: 'error', message: `Carrito con ID ${cartId} no encontrado.` });
            }
            const productsInfo = await Promise.all(cart.products.map(async (item) => {
                const product = await Product.findById(item.product);
                return {
                    id: product._id,
                    title: product.title,
                    price: product.price,
                    quantity: item.quantity,
                    subtotal: product.price * item.quantity,
                    cartId: cartId
                };
            }));
            const totalAmount = productsInfo.reduce((acc, curr) => acc + curr.subtotal, 0);
            res.render('cartEnd', { productsInfo, totalAmount, cartId });
        } catch (error) {
            logger.error(error);
            res.status(500).json({ status: 'error', message: customizeError('INTERNAL_SERVER_ERROR') });
        }
    },

    removeProductFromCart: async (req, res) => {
        const cartId = req.params.cid;
        const productId = req.params.pid;
        try {
            const cart = await Cart.findById(cartId);
            if (!cart) {
                return res.status(404).json({ status: 'error', message: `Carrito con ID ${cartId} no encontrado.` });
            }
            const productIndex = cart.products.findIndex((item) => item.product.toString() === productId);
            if (productIndex !== -1) {
                if (cart.products[productIndex].quantity > 1) {
                    cart.products[productIndex].quantity -= 1;
                } else {
                    cart.products.splice(productIndex, 1);
                }
                await cart.save();
                return res.status(200).json({ status: 'ok', message: 'Producto eliminado del carrito con éxito.', data: cart });
            } else {
                return res.status(404).json({ status: 'error', message: `Producto con ID ${productId} no encontrado en el carrito.` });
            }
        } catch (error) {
            logger.error(error);
            return res.status(500).json({ status: 'error', message: customizeError('INTERNAL_SERVER_ERROR') });
        }
    },

    updateProductQuantity: async (req, res) => {
        const cartId = req.params.cid;
        const productId = req.params.pid;
        const { quantity } = req.body;
        try {
            if (!quantity || isNaN(quantity) || quantity <= 0) {
                return res.status(400).json({ status: 'error', message: 'La cantidad debe ser un número entero positivo.' });
            }
            const cart = await Cart.findById(cartId);
            if (!cart) {
                return res.status(404).json({ status: 'error', message: `Carrito con ID ${cartId} no encontrado.` });
            }
            const productIndex = cart.products.findIndex((item) => item.product.toString() === productId);
            if (productIndex !== -1) {
                cart.products[productIndex].quantity = quantity;
                await cart.save();
                return res.status(200).json({ status: 'ok', message: 'Cantidad de producto actualizada en el carrito con éxito.', data: cart });
            } else {
                return res.status(404).json({ status: 'error', message: `Producto con ID ${productId} no encontrado en el carrito.` });
            }
        } catch (error) {
            logger.error(error);
            return res.status(500).json({ status: 'error', message: customizeError('INTERNAL_SERVER_ERROR') });
        }
    },

    emptyCart: async (req, res) => {
        const cartId = req.params.cid;
        try {
            const cart = await Cart.findById(cartId);
            if (!cart) {
                return res.status(404).json({ status: 'error', message: `Carrito con ID ${cartId} no encontrado.` });
            }
            cart.products = [];
            await cart.save();
            return res.status(200).json({ status: 'ok', message: 'Carrito vaciado con éxito.', data: cart });
        } catch (error) {
            logger.error(error);
            return res.status(500).json({ status: 'error', message: customizeError('INTERNAL_SERVER_ERROR') });
        }
    },

    getUserCart: async (req, res) => {
        const userId = req.params.uid;
        try {
            const cart = await Cart.findOne({ UserId: userId });
            if (!cart) {
                return res.status(404).json({ status: 'error', message: 'Tu carrito está vacío.' });
            }
            return res.status(200).json({ status: 'ok', message: 'Carrito encontrado.', data: cart });
        } catch (error) {
            logger.error('Error al obtener el carrito:', error);
            res.status(500).json({ status: 'error', message: customizeError('INTERNAL_SERVER_ERROR') });
        }
    }
};

module.exports = cartController;