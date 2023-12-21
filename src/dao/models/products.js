// Archivo que define el esquema de la colección 'Products' en MongoDB utilizando Mongoose
const mongoose = require('mongoose');

// Define el esquema del producto con varios campos y restricciones
const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    description: String,
    code: {
        type: String,
        required: true,
        unique: true,
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
    },
    status: {
        type: Boolean,
        default: true,
    },
    category: {
        type: String,
        required: true,
    },
}, { collection: 'Products' });

// Crea el modelo 'Product' basado en el esquema definido
const Product = mongoose.model('Product', productSchema);

// Exporta el modelo 'Product' para ser utilizado en otras partes de la aplicación
module.exports = Product;
