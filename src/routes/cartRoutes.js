const express = require("express");
const router = express.Router();
const CartManager = require("../dao/Managers/CartManagerFileSystem");
const ProductManager = require("../dao/Managers/ProductManagerFileSystem");
const cartManager = new CartManager();  // Instancia del gestor de carritos
const productManager = new ProductManager();  // Instancia del gestor de productos
const Cart = require('../dao/models/cart');
const Product = require('../dao/models/products');

/* // Ruta para crear un nuevo carrito
router.post('/', async (req, res) => {
    try {
        const newCart = await cartManager.createCart();  // Crea un nuevo carrito
        return res.status(201).json({ status: "ok", message: "Carrito creado con éxito", data: newCart });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Error interno del servidor." });
    }
});

// Ruta para obtener los productos de un carrito específico por su ID
router.get('/:cid', async (req, res) => {
    try {
        const cartId = parseInt(req.params.cid);
        const cart = await cartManager.getCartById(cartId);  // Obtiene un carrito por su ID

        if (!cart) {
            return res.status(404).json({ error: `Carrito con ID ${cartId} no encontrado` });
        }

        return res.status(200).json(cart.products);  // Devuelve los productos del carrito
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Error interno del servidor." });
    }
});

// Ruta para agregar un producto a un carrito específico
router.post('/:cid/product/:pid', async (req, res) => {
    try {
        const cartId = parseInt(req.params.cid);
        const productId = parseInt(req.params.pid);

        const productDetails = await productManager.getProductById(productId);  // Obtiene detalles del producto por su ID

        if (!productDetails) {
            return res.status(404).json({ error: `Producto con ID ${productId} no encontrado` });
        }

        const cartsContent = await cartManager.readCartsFile();
        const cart = cartsContent.find((cart) => cart.id === cartId);  // Encuentra el carrito por su ID

        if (!cart) {
            return res.status(404).json({ error: `Carrito con ID ${cartId} no encontrado` });
        }

        const existingProduct = cart.products.find((product) => product.product === productId);

        if (existingProduct) {
            existingProduct.quantity += 1;  // Incrementa la cantidad si el producto ya está en el carrito
        } else {
            cart.products.push({
                product: productId,
                quantity: 1,
            });  // Agrega el producto al carrito con cantidad 1 si no estaba en el carrito
        }

        await cartManager.writeCartsFile(cartsContent);  // Guarda los cambios en el archivo de carritos

        return res.status(200).json({ status: "ok", message: "Producto agregado al carrito con éxito", data: cart });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Error interno del servidor." });
    }
}); */

//---------------------------------------------------------------------------------------



// Ruta para crear un nuevo carrito
router.post('/', async (req, res) => {
    try {
        // Crea un nuevo carrito con una lista vacía de productos
        const newCart = await Cart.create({ products: [] });
        return res.status(201).json({ status: 'ok', message: 'Carrito creado con éxito', data: newCart });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
});

// Ruta para agregar un producto a un carrito específico
router.post('/:cid/product/:pid', async (req, res) => {
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

// Ruta para obtener los productos en un carrito específico
router.get('/:cid', async (req, res) => {
    try {
        // Obtiene el identificador del carrito desde los parámetros de la solicitud
        const cartId = req.params.cid;

        // Busca el carrito en la base de datos
        const cart = await Cart.findById(cartId);

        if (!cart) {
            return res.status(404).json({ status: 'error', message: `Carrito con ID ${cartId} no encontrado.` });
        }

        // Devuelve la lista de productos en el carrito
        return res.status(200).json({ status: 'ok', data: cart.products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
});

// Exporta el enrutador para ser utilizado en otras partes de la aplicación
module.exports = router;
