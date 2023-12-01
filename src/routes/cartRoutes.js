const express = require("express");
const router = express.Router();
const CartManager = require("../CartManager");
const ProductManager = require("../ProductManager");
const cartManager = new CartManager();
const productManager = new ProductManager();

router.post('/', async (req, res) => {
    try {
        const newCart = await cartManager.createCart();
        return res.status(201).json({ status: "ok", message: "Carrito creado con éxito", data: newCart });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Error interno del servidor." });
    }
});

router.get('/:cid', async (req, res) => {
    try {
        const cartId = parseInt(req.params.cid);
        const cart = await cartManager.getCartById(cartId);

        if (!cart) {
            return res.status(404).json({ error: `Carrito con ID ${cartId} no encontrado` });
        }

        return res.status(200).json(cart.products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Error interno del servidor." });
    }
});

router.post('/:cid/product/:pid', async (req, res) => {
    try {
        const cartId = parseInt(req.params.cid);
        const productId = parseInt(req.params.pid);

        const productDetails = await productManager.getProductById(productId);

        if (!productDetails) {
            return res.status(404).json({ error: `Producto con ID ${productId} no encontrado` });
        }

        const cartsContent = await cartManager.readCartsFile();
        const cart = cartsContent.find((cart) => cart.id === cartId);

        if (!cart) {
            return res.status(404).json({ error: `Carrito con ID ${cartId} no encontrado` });
        }

        const existingProduct = cart.products.find((product) => product.product === productId);

        if (existingProduct) {
            existingProduct.quantity += 1;
        } else {
            cart.products.push({
                product: productId,
                quantity: 1,
            });
        }

        await cartManager.writeCartsFile(cartsContent);

        return res.status(200).json({ status: "ok", message: "Producto agregado al carrito con éxito", data: cart });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Error interno del servidor." });
    }
});

module.exports = router;