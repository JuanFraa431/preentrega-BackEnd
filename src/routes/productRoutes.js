// productRoutes.js
const express = require("express");
const router = express.Router();
const ProductManager = require("../ProductManager"); // Importa el módulo ProductManager 
const productManager = new ProductManager(); // Crea una instancia de ProductManager

// Ruta para obtener todos los productos
router.get('/', async (req, res) => {
    try {
        const { limit } = req.query;
        const products = await productManager.getProducts(limit);
        return res.status(200).json({ status: "ok", data: products });
    } catch (error) {
        // En caso de error, responde con un estado 500 y un mensaje de error
        res.status(500).json({ status: "error", message: "Error" });
    }
});

// Ruta para obtener un producto por su ID
router.get('/:pid', async (req, res) => {
    try {
        const productId = parseInt(req.params.pid);
        const product = await productManager.getProductById(productId);

        // Si se encuentra el producto, responde con el producto, de lo contrario, con un error 404
        if (product) {
            res.status(200).json({ status: "ok", data: product });
        } else {
            res.status(404).json({ status: "error", message: "Producto no encontrado" });
        }
    } catch (error) {
        // En caso de error, responde con un estado 500 y un mensaje de error
        res.status(500).json({ status: "error", message: "Error" });
    }
});

// Ruta para agregar un nuevo producto
router.post('/', async (req, res) => {
    try {
        let { title, description, code, price, stock, category } = req.body;

        // Llama al método para agregar un producto en el ProductManager
        await productManager.addProduct(title, description, code, price, stock, category);

        // Responde con un estado 201 (creado) y un mensaje de éxito
        res.status(201).json({ message: 'Producto agregado con éxito' });
    } catch (error) {
        console.error(error);
        // En caso de error, responde con un estado 500 y un mensaje de error
        res.status(500).json({ error: 'Ocurrió un error en el servidor' });
    }
});

// Ruta para actualizar un producto por su ID
router.put('/:pid', async (req, res) => {
    try {
        const productId = parseInt(req.params.pid);
        const updatedProductData = req.body;

        // Verifica que se proporcionen datos para la actualización
        if (!Object.keys(updatedProductData).length) {
            return res.status(400).json({ status: "error", message: "Debe proporcionar al menos un campo para actualizar." });
        }

        // Llama al método para actualizar un producto en el ProductManager
        await productManager.updateProducts(productId, updatedProductData);

        // Responde con un estado 200 y un mensaje de éxito
        return res.status(200).json({ status: "ok", message: "Producto actualizado con éxito." });
    } catch (error) {
        console.error(error);
        // En caso de error, responde con un estado 500 y un mensaje de error
        res.status(500).json({ status: "error", message: "Error interno del servidor." });
    }
});

// Ruta para eliminar un producto por su ID
router.delete('/:pid', async (req, res) => {
    try {
        const productId = parseInt(req.params.pid);

        // Llama al método para eliminar un producto en el ProductManager
        const result = await productManager.deleteProducts(productId);

        // Responde con un estado 200 y el resultado de la operación
        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        // En caso de error, responde con un estado 500 y un mensaje de error
        res.status(500).json({ status: "error", message: "Error interno del servidor." });
    }
});

module.exports = router;
