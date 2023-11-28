// cartRoutes.js
const express = require("express");
const router = express.Router();
const fs = require("fs");
const ProductManager = require("../ProductManager"); // Importa el módulo ProductManager 
const productManager = new ProductManager(); // Crea una instancia de ProductManager

// Ruta para crear un carrito
router.post('/', async (req, res) => {
    try {
        let cartsContent = [];

        try {
            // Lee el contenido del archivo Cart.json
            const cartsFileContent = await fs.promises.readFile("Cart.json", "utf-8");
            cartsContent = JSON.parse(cartsFileContent);

            // Obtiene el último carrito para generar un nuevo ID
            const lastCart = cartsContent[cartsContent.length - 1];
            const cartId = lastCart ? lastCart.id + 1 : 1;

            // Crea un nuevo carrito con un ID único
            const newCart = {
                id: cartId,
                products: []
            };

            // Agrega el nuevo carrito al contenido de carritos
            cartsContent.push(newCart);

            // Convierte el contenido de carritos a formato JSON con formato legible
            const cartsString = JSON.stringify(cartsContent, null, 2);

            // Escribe el contenido actualizado en el archivo Cart.json
            await fs.promises.writeFile("Cart.json", cartsString);

            // Responde con la confirmación de la creación del carrito
            return res.status(201).json({ status: "ok", message: "Carrito creado con éxito", data: newCart });
        } catch (error) {
            // En caso de error al leer o escribir en el archivo, crea un carrito con ID predeterminado
            const cartId = 1;
            const newCart = {
                id: cartId,
                products: []
            };

            cartsContent.push(newCart);

            const cartsString = JSON.stringify(cartsContent, null, 2);
            await fs.promises.writeFile("Cart.json", cartsString);

            return res.status(201).json({ status: "ok", message: "Carrito creado con éxito", data: newCart });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Error interno del servidor." });
    }
});

// Ruta para obtener productos de un carrito por ID
router.get('/:cid', async (req, res) => {
    try {
        const cartId = parseInt(req.params.cid);

        // Lee el contenido del archivo Cart.json
        const cartsFileContent = await fs.promises.readFile("Cart.json", "utf-8");
        const cartsContent = JSON.parse(cartsFileContent);

        // Busca el carrito por ID
        const cart = cartsContent.find((cart) => cart.id === cartId);

        if (!cart) {
            return res.status(404).json({ error: `Carrito con ID ${cartId} no encontrado` });
        }

        // Devuelve los productos del carrito
        return res.status(200).json(cart.products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Error interno del servidor." });
    }
});

// Ruta para agregar un producto a un carrito
router.post('/:cid/product/:pid', async (req, res) => {
    try {
        const cartId = parseInt(req.params.cid);
        const productId = parseInt(req.params.pid);

        // Verifica si el producto existe en Products.json
        const productDetails = await productManager.getProductById(productId);

        if (!productDetails) {
            return res.status(404).json({ error: `Producto con ID ${productId} no encontrado` });
        }

        // Lee el contenido del archivo Cart.json
        const cartsFileContent = await fs.promises.readFile("Cart.json", "utf-8");
        let cartsContent = JSON.parse(cartsFileContent);

        // Busca el carrito por ID
        const cart = cartsContent.find((cart) => cart.id === cartId);

        if (!cart) {
            return res.status(404).json({ error: `Carrito con ID ${cartId} no encontrado` });
        }

        // Verifica si el producto ya está en el carrito
        const existingProduct = cart.products.find((product) => product.product === productId);

        if (existingProduct) {
            // Si el producto ya está en el carrito, incrementa la cantidad
            existingProduct.quantity += 1;
        } else {
            // Si el producto no está en el carrito, agrégalo con cantidad 1
            cart.products.push({
                product: productId,
                quantity: 1,
            });
        }

        // Escribe el array actualizado de carritos en el archivo Cart.json
        const cartsString = JSON.stringify(cartsContent, null, 2);
        await fs.promises.writeFile("Cart.json", cartsString);

        // Responde con la confirmación de que el producto se agregó al carrito
        return res.status(200).json({ status: "ok", message: "Producto agregado al carrito con éxito", data: cart });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Error interno del servidor." });
    }
});

module.exports = router;
