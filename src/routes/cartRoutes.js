const express = require("express");
const router = express.Router();
const Cart = require('../dao/models/cart');
const Product = require('../dao/models/products');
const Ticket = require('../dao/models/ticket');
const isAuthenticated = require('../middleware/auth.middleware')
const cartController = require('../controllers/cartController');
const { customizeError } = require("../middleware/errorHandler");
const { logger } = require('../utils/logger')
const mailService = require("../utils/mailService")
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

//---------------------------------------------------------------------------------------

async function generateUniqueCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code;
    let exists = true;
    while (exists) {
        code = '';
        for (let i = 0; i < 6; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        
        const existingTicket = await Ticket.findOne({ code });
        exists = !!existingTicket;
    }
    return code;
}


router.post('/:cid/purchase', async (req, res) => {
    try {
        const cartId = req.params.cid;
        const cart = await Cart.findById(cartId);
        if (!cart) {
            return res.status(404).json({ status: 'error', message: `Carrito con ID ${cartId} no encontrado.` });
        }

        if (cart.products.length === 0) {
            return res.status(400).json({ status: 'error', message: 'El carrito está vacío. No se puede finalizar la compra.' });
        }

        const products = cart.products;
        let totalAmount = 0;
        const ticketProducts = [];
        for (const item of products) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({ status: 'error', message: `Producto con ID ${item.product} no encontrado en Products.` });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({ status: 'error', message: `Stock insuficiente para el producto ${product._id}.` });
            }
            totalAmount += product.price * item.quantity;
            ticketProducts.push({
                productId: product._id,
                quantity: item.quantity,
                price: product.price
            });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Compra de productos', 
                        },
                        unit_amount: totalAmount * 100, 
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: 'https://preentrega-backend-production.up.railway.app/products', 
            cancel_url: 'https://tu-web.com/cancel', 
        });


        return res.redirect(303, session.url); 
    } catch (error) {
        console.error('Error en la compra:', error);
        return res.status(500).json({ status: 'error', message: 'Error interno del servidor. ' + error.message });
    }
});



router.post('/webhook/respuesta', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        const buffer = [];
        req.on('data', (chunk) => {
            buffer.push(chunk);
        });

        req.on('end', async () => {
            const rawBody = Buffer.concat(buffer).toString();

            try {
                event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
            } catch (err) {
                console.error('Webhook Error:', err.message);
                return res.status(400).send(`Webhook Error: ${err.message}`);
            }

            console.log('Evento recibido:', event.type);

            if (event.type === 'checkout.session.completed') {
                const session = event.data.object;
                const customerEmail = session.customer_email;
                const message = `¡Gracias por tu compra! Tu código de compra es: ${session.payment_intent}`;
                const subject = 'Compra realizada exitosamente';
                await mailService.sendNotificationEmail(customerEmail, message, subject);
            } else if (event.type === 'checkout.session.async_payment_failed') {
                const session = event.data.object;
                const customerEmail = session.customer_email;
                const message = `Hubo un problema con el pago de tu compra. Por favor, intenta nuevamente.`;
                const subject = 'Pago fallido';
                await mailService.sendNotificationEmail(customerEmail, message, subject);
            }

            // Devolver una respuesta exitosa al webhook de Stripe
            res.status(200).end();
        });
    } catch (error) {
        console.error('Error en el webhook:', error);
        return res.status(500).json({ status: 'error', message: 'Error interno del servidor. ' + error.message });
    }
});


module.exports = router;

router.get('/', async (req, res) => {
    try {
        const carts = await Cart.find();
        res.status(200).json({ status: 'success', message: 'Carritos encontrados.', data: carts });
    } catch (error) {
        logger.error('Error al obtener los carritos:', error);
        res.status(500).json({ status: 'error', message: customizeError('INTERNAL_SERVER_ERROR') });
    }
});

router.post('/:uid', isAuthenticated, async (req, res) => {
    const userId = req.params.uid; 
    try {
        const existingCart = await Cart.findOne({ UserId: userId })
        if (!existingCart) {
            const newCart = await Cart.create({ products: [], UserId: userId }); 
            return res.status(201).json({ status: 'ok', message: 'Carrito creado con éxito', data: newCart });
        }
        return res.status(200).json({ status: 'ok', message: 'Ya existe un carrito asociado a este usuario', data: existingCart });
    } catch (error) {
        logger.error(error);
        
        res.status(500).json({ status: 'error', message: customizeError('INTERNAL_SERVER_ERROR') });
    }
});

router.post('/:cid/product/:pid', async (req, res) => {
    try {
        const cartId = req.params.cid;
        const productId = req.params.pid; 
        const cart = await Cart.findById(cartId);
        if (!cart) {
            return res.status(404).json({ status: 'error', message: `Carrito con ID ${cartId} no encontrado.` });
        }
        const product = await Product.findById(productId);
        const user = req.user;
        if (user.role === 'premium') {
            // Verificar si el usuario es propietario del producto
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
            cart.products.push({
                product: productId,
                quantity: 1
            });
        }
        await cart.save();
        return res.status(200).json({ status: 'ok', message: 'Producto agregado al carrito con éxito.', data: cart });
    } catch (error) {
        logger.error(error);
        return res.status(500).json({ status: 'error', message: customizeError('INTERNAL_SERVER_ERROR') });
    }
});

router.get('/:cid/purchase', async (req, res) => {
    try {
        const cartId = req.params.cid;
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
        res.render('cartEnd', { productsInfo, totalAmount, cartId}); 
    } catch (error) {
        logger.error(error);
        res.status(500).json({ status: 'error', message: customizeError('INTERNAL_SERVER_ERROR') });
    }
});

router.delete('/:cid/products/:pid', async (req, res) => {
    try {
        const cartId = req.params.cid;
        const productId = req.params.pid;
        const cart = await Cart.findById(cartId);
        if (!cart) {
            return res.status(404).json({ status: 'error', message:` Carrito con ID ${cartId} no encontrado.`});
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
});

router.put('/:cid/products/:pid', async (req, res) => {
    try {
        const cartId = req.params.cid;
        const productId = req.params.pid;
        const { quantity } = req.body;
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
});

router.delete('/:cid', async (req, res) => {
    try {
        const cartId = req.params.cid;
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
});

router.get('/:uid', async (req, res) => {
    try {
        const userId = req.params.uid;
        const cart = await Cart.findOne({ UserId: userId });
        if (!cart) {
            return res.status(404).json({ status: 'error', message: 'Tu carrito está vacío.' });
        }
        return res.status(200).json({ status: 'ok', message: 'Carrito encontrado.', data: cart });
    } catch (error) {
        logger.error('Error al obtener el carrito:', error);
        res.status(500).json({ status: 'error', message: customizeError('INTERNAL_SERVER_ERROR') });
    }
});

module.exports = router;

