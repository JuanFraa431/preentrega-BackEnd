const express = require("express");
const router = express.Router();
const CartManager = require("../dao/Managers/CartManagerFileSystem");
const ProductManager = require("../dao/Managers/ProductManagerFileSystem");
const cartManager = new CartManager();  // Instancia del gestor de carritos
const productManager = new ProductManager();  // Instancia del gestor de productos
const Cart = require('../dao/models/cart');
const Product = require('../dao/models/products');


//---------------------------------------------------------------------------------------

router.post('/', async (req, res) => {
    try {
        // Lógica para crear un carrito
        const nuevoCarrito = await Cart.create({ products: [] });

        return res.status(201).json({ status: 'ok', message: 'Carrito creado con éxito', data: nuevoCarrito });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
});

// Ruta para agregar un producto a un carrito específico
router.post('/:cid/products/:pid', async (req, res) => {
    try {
        // Obtiene los identificadores del carrito y el producto desde los parámetros de la solicitud
        const cartId = req.params.cid;
        const productId = req.params.pid;

        // Busca el carrito y el producto en las bases de datos
        const cart = await Cart.findById(cartId);

        if (!cart) {
            return res.status(404).json({ status: 'error', message: `Carrito con ID ${cartId} no encontrado.` });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ status: 'error', message: `Producto con ID ${productId} no encontrado en Products.` });
        }

        // Busca el índice del producto en el carrito
        const productIndex = cart.products.findIndex((item) => item.product.toString() === productId);

        // Actualiza la cantidad del producto en el carrito
        if (productIndex !== -1) {
            cart.products[productIndex].quantity += 1;
        } else {
            cart.products.push({
                product: productId,
                quantity: 1
            });
        }

        // Guarda los cambios en el carrito
        await cart.save();

        return res.status(200).json({ status: 'ok', message: 'Producto agregado al carrito con éxito.', data: cart });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
});


// Ruta para eliminar un producto específico del carrito
router.delete('/:cid/products/:pid', async (req, res) => {
    try {
        const { cid, pid } = req.params;

        // Busca el carrito en la base de datos
        const cart = await Cart.findById(cid);

        if (!cart) {
            return res.status(404).json({ status: 'error', message: `Carrito con ID ${cid} no encontrado.` });
        }

        // Filtra los productos para excluir el producto con el ID proporcionado
        cart.products = cart.products.filter((item) => item.product.toString() !== pid);

        // Guarda los cambios en el carrito
        await cart.save();

        return res.status(200).json({ status: 'ok', message: 'Producto eliminado del carrito con éxito.', data: cart });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
});

// Ruta para actualizar el carrito con un arreglo de productos
router.put('/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        const { products } = req.body;

        // Busca el carrito en la base de datos
        const cart = await Cart.findById(cid);

        if (!cart) {
            return res.status(404).json({ status: 'error', message: `Carrito con ID ${cid} no encontrado.` });
        }

        // Actualiza el arreglo de productos en el carrito
        cart.products = products;

        // Guarda los cambios en el carrito
        await cart.save();

        return res.status(200).json({ status: 'ok', message: 'Carrito actualizado con éxito.', data: cart });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
});

// Ruta para actualizar la cantidad de un producto específico en el carrito
router.put('/:cid/products/:pid', async (req, res) => {
    try {
        const { cid, pid } = req.params;
        const { quantity } = req.body;

        // Busca el carrito en la base de datos
        const cart = await Cart.findById(cid);

        if (!cart) {
            return res.status(404).json({ status: 'error', message: `Carrito con ID ${cid} no encontrado.` });
        }

        // Busca el índice del producto en el carrito
        const productIndex = cart.products.findIndex((item) => item.product.toString() === pid);

        // Actualiza la cantidad del producto en el carrito
        if (productIndex !== -1) {
            cart.products[productIndex].quantity = quantity;
        } else {
            return res.status(404).json({ status: 'error', message: `Producto con ID ${pid} no encontrado en el carrito.` });
        }

        // Guarda los cambios en el carrito
        await cart.save();

        return res.status(200).json({ status: 'ok', message: 'Cantidad de producto actualizada con éxito.', data: cart });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
});


// Ruta para eliminar todos los productos del carrito
router.delete('/:cid', async (req, res) => {
    try {
        const { cid } = req.params;

        // Busca el carrito en la base de datos y lo elimina
        await Cart.findByIdAndDelete(cid);

        return res.status(200).json({ status: 'ok', message: 'Carrito eliminado con éxito.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
});

// Ruta para obtener y mostrar los productos en un carrito específico

router.get('/:cid', async (req, res) => {
    try {
        // Obtiene el ID del carrito desde los parámetros de la solicitud
        const cartId = req.params.cid;

        // Busca el carrito en la base de datos y popula los productos asociados
        const cart = await Cart.findById(cartId).populate({
            path: 'products.product',
            model: 'Product'
        });

        // Verifica si el carrito no existe y devuelve un error 404 si no se encuentra
        if (!cart) {
            return res.status(404).json({ status: 'error', message: `Carrito con ID ${cartId} no encontrado.` });
        }

        // Mapea la información de los productos en el carrito para simplificar la estructura
        const productsInfo = cart.products.map(item => ({
            productId: item.product._id,
            title: item.product.title,
            description: item.product.description,
            price: item.product.price,
            quantity: item.quantity
        }));

        // Renderiza la vista 'carts' con la información de los productos en el carrito
        res.render('carts', { productsInfo });
    } catch (error) {
        // Maneja los errores y devuelve un mensaje de error
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
});

module.exports = router;

