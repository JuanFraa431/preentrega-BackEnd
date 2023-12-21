const fs = require("fs");

class CartManager {
    constructor(cartFilePath) {
        // Constructor: Recibe la ruta del archivo de carritos.
        this.cartFilePath = cartFilePath;
    }

    async readCartsFile() {
        try {
            // Lee el contenido del archivo y lo convierte a objeto.
            return JSON.parse(await fs.promises.readFile(this.cartFilePath, "utf-8"));
        } catch (error) {
            // Maneja errores y retorna un array vacío.
            console.error(error);
            return [];
        }
    }

    async writeCartsFile(cartsContent) {
        // Convierte el objeto a formato JSON y lo escribe en el archivo.
        await fs.promises.writeFile(this.cartFilePath, JSON.stringify(cartsContent, null, 2));
    }

    async createCart() {
        // Crea un nuevo carrito con un ID único y sin productos.
        let cartsContent = await this.readCartsFile();
        const lastCart = cartsContent[cartsContent.length - 1];
        const cartId = lastCart ? lastCart.id + 1 : 1;

        const newCart = { id: cartId, products: [] };
        cartsContent.push(newCart);
        await this.writeCartsFile(cartsContent);

        return newCart;
    }

    async getCartById(cartId) {
        // Busca y retorna un carrito por su ID.
        const cartsContent = await this.readCartsFile();
        return cartsContent.find((cart) => cart.id === cartId);
    }
}

module.exports = CartManager;
