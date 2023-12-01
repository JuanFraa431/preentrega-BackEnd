const express = require("express");
const router = express.Router();
const CartManager = require("../CartManager");
const ProductManager = require("../ProductManager");
const cartManager = new CartManager();  // Instancia del gestor de carritos
const productManager = new ProductManager();  // Instancia del gestor de productos

// Ruta para crear un nuevo carrito
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
});

module.exports = router;
