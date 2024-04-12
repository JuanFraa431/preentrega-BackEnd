const Product = require('../models/products.js');
const { promises } = require("dns");
const fs = require("fs");
const { json } = require("stream/consumers");
const logger = require("../../utils/logger.js")

// Clase que gestiona las operaciones relacionadas con la base de datos para productos
class ProductManagerDb {
    constructor() {
        this.path = "Products.json";
    }

    // Método asincrónico que agrega un nuevo producto a la base de datos
    async addProduct(productData) {
        try {
            const { title, description, price, code, stock, category, thumbnails } = productData;

            // Verifica si ya existe un producto con el mismo código
            const existingProduct = await Product.findOne({ code });

            if (existingProduct) {
                logger.warning("Código de producto ya ingresado.");
                return;
            }

            // Crea un nuevo objeto Product con los datos proporcionados
            const newProduct = new Product({
                title,
                description,
                price,
                code,
                stock,
                status: true,
                category,
                thumbnails,
            });

            // Guarda el nuevo producto en la base de datos
            await newProduct.save();

            logger.info("Producto ingresado con éxito");
        } catch (error) {
            logger.error("Error al agregar el producto:", error);
        }
    }

    // Método asincrónico que obtiene productos de la base de datos, opcionalmente limitando la cantidad
    async getProducts(limit) {
        try {
            let query = Product.find();

            // Si se proporciona el parámetro 'limit', limita la cantidad de productos devueltos
            if (limit) {
                query = query.limit(parseInt(limit));
            }

            // Ejecuta la consulta y devuelve la lista de productos
            const products = await query.exec();
            return products;
        } catch (error) {
            logger.error("Error al obtener productos:", error);
            return [];
        }
    }

    // Método asincrónico que obtiene un producto por su ID de la base de datos
    async getProductById(id) {
        try {
            const product = await Product.findById(id);
            
            // Verifica si el producto fue encontrado y lo devuelve, o imprime un mensaje si no se encuentra
            if (product) {
                return product;
            } else {
                logger.info("Producto no encontrado");
                return null;
            }
        } catch (error) {
            logger.error("Error al obtener el producto por ID:", error);
            return null;
        }
    }

    // Método asincrónico que elimina un producto por su ID de la base de datos
    async deleteProducts(id) {
        try {
            // Busca y elimina el producto por su ID, devuelve un mensaje de éxito si se elimina correctamente
            const result = await Product.findByIdAndDelete(id);
            if (result) {
                logger.info(`Producto con ID ${id} eliminado correctamente`);
                return { status: "ok", message: `Producto con ID ${id} eliminado correctamente` };
            } else {
                throw new Error(`Producto con ID ${id} no encontrado.`);
            }
        } catch (error) {
            logger.error("Error al eliminar el producto:", error);
            return { status: "error", message: "Error al eliminar el producto." };
        }
    }

    // Método asincrónico que actualiza un producto por su ID en la base de datos
    async updateProducts(id, updatedProductData) {
        try {
            // Busca y actualiza el producto por su ID, devuelve el producto actualizado si se realiza correctamente
            const result = await Product.findByIdAndUpdate(id, updatedProductData, { new: true });
            if (result) {
                logger.info("Producto actualizado con éxito");
                return result;
            } else {
                throw new Error(`Producto con ID ${id} no encontrado.`);
            }
        } catch (error) {
            logger.error("Error al actualizar el producto:", error);
            throw error;
        }
    }
}

module.exports = ProductManagerDb;
