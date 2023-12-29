const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

// Define el esquema del carrito con un campo 'products' que es un array con un valor predeterminado vacío
const cartSchema = new mongoose.Schema({
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            mutable: true 
        }
    }]
});

cartSchema.plugin(mongoosePaginate);
// Crea el modelo 'Cart' basado en el esquema definido
const Cart = mongoose.model('Cart', cartSchema);

// Exporta el modelo 'Cart' para ser utilizado en otras partes de la aplicación
module.exports = Cart;
