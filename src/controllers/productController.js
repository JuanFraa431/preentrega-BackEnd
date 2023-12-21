// controllers/productosController.js
const Product = require('../dao/models/products');

// Función que obtiene todos los productos de la base de datos y los devuelve como respuesta en formato JSON.
const obtenerProductos = async (req, res) => {
    try {
        const productos = await Product.find(); // Consulta todos los registros de la colección 'Product'
        res.json(productos); // Envia los productos como respuesta en formato JSON
    } catch (error) {
        res.status(500).json({ error: error.message }); // Maneja errores y devuelve un mensaje de error en caso de fallo
    }
};

module.exports = {
    obtenerProductos,
};