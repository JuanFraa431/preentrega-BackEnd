const fs = require("fs");

class CartManager {
    constructor(cartFilePath) {
        this.cartFilePath = cartFilePath;
    }

    async readCartsFile() {
        try {
            const cartsFileContent = await fs.promises.readFile(this.cartFilePath, "utf-8");
            return JSON.parse(cartsFileContent);
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    async writeCartsFile(cartsContent) {
        const cartsString = JSON.stringify(cartsContent, null, 2);
        await fs.promises.writeFile(this.cartFilePath, cartsString);
    }

    async createCart() {
        let cartsContent = await this.readCartsFile();
        const lastCart = cartsContent[cartsContent.length - 1];
        const cartId = lastCart ? lastCart.id + 1 : 1;

        const newCart = {
            id: cartId,
            products: []
        };

        cartsContent.push(newCart);
        await this.writeCartsFile(cartsContent);

        return newCart;
    }

    async getCartById(cartId) {
        const cartsContent = await this.readCartsFile();
        return cartsContent.find((cart) => cart.id === cartId);
    }
    
}

module.exports = CartManager;