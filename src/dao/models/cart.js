// Archivo que define el esquema de la colección 'Carts' en MongoDB utilizando Mongoose
const mongoose = require('mongoose');

// Define el esquema del carrito con un campo 'products' que es un array con un valor predeterminado vacío
const cartSchema = new mongoose.Schema({
    products: {
        type: Array,
        default: []
    },
}, { collection: 'Carts' });

// Crea el modelo 'Cart' basado en el esquema definido
const Cart = mongoose.model('Cart', cartSchema);

// Exporta el modelo 'Cart' para ser utilizado en otras partes de la aplicación
module.exports = Cart;
