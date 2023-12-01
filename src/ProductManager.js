const fs = require("fs");

class ProductManager {
    constructor() {
        // Inicializa la instancia de ProductManager con una lista de productos vacía y la ruta del archivo.
        this.products = [];
        this.path = "./data/Products.json";
    }

    async addProduct(title, description, code, price, stock, category) {
        try {
            // Valida los datos proporcionados.
            title = title || undefined;
            description = description || undefined;
            price = price ?? undefined;
            category = category ?? undefined;
            code = code || undefined;

            if (title == undefined || category == undefined || price == undefined || description == undefined || code == undefined || stock == undefined) {
                return console.log("Es necesario que todos los campos estén completos.");
            }

            // Lee y verifica si el código del producto ya existe en el archivo.
            let id = 0;
            let validCode = [];

            const statsJson = await fs.promises.stat(this.path);

            if (statsJson.size === 0) {
                validCode = this.products.find((codeSearch) => codeSearch.code == code);
            } else {
                const searchCode = await fs.promises.readFile(this.path, "utf-8");
                const searchCodeParse = JSON.parse(searchCode);
                validCode = searchCodeParse.find((codeSearch) => codeSearch.code == code);
            }

            // Si es un nuevo código, asigna un ID único y agrega el producto al archivo.
            if (validCode == undefined) {
                let size = 0;

                if (statsJson.size !== 0) {
                    const readFile = await fs.promises.readFile(this.path, "utf-8");
                    const readFileParse = JSON.parse(readFile);
                    this.products = readFileParse;
                    size = readFileParse.length;
                } else {
                    size = this.products.length;
                }

                for (let i = 0; i < size; i++) {
                    const element = this.products[i];
                    if (element.id > id) {
                        id = element.id;
                    }
                }

                id++;
                this.products.push({ title, description, code, price, stock, category, id: id });

                // Guarda el producto en el archivo.
                const productsString = JSON.stringify(this.products, null, 2);
                await fs.promises.writeFile(this.path, productsString);

                return console.log("Producto ingresado con éxito");
            } else {
                return console.log("Código de producto ya ingresado.");
            }
        } catch (error) {
            console.error(error);
        }
    }

    async getProducts(limit) {
        try {
            // Siempre verifico que exista algo en el archivo.
            const statsJsonProduct = await fs.promises.stat(this.path);
            if (statsJsonProduct.size === 0) {
                return [];
            } else {
                const productsFile = await fs.promises.readFile(this.path, "utf-8");
                const productsParse = JSON.parse(productsFile);
                if (limit) {
                    return productsParse.slice(0, parseInt(limit));
                } else {
                    return productsParse;
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    async getProductById(id) {
        try {
            // Siempre verifico que exista algo en el archivo.
            const statsJsonId = await fs.promises.stat(this.path);

            if (statsJsonId.size === 0) {
                // No hay productos ingresados.
                return null; // Devuelvo null para indicar que no se encontró ningún producto.
            } else {
                // Busco el id consiguiendo el array que está almacenado en JSON.
                const searchId = await fs.promises.readFile(this.path, "utf-8");
                const searchIdParse = JSON.parse(searchId);
                const productFound = searchIdParse.find((item) => item.id === parseInt(id));

                if (productFound) {
                    return productFound;
                } else {
                    // No se encontró el producto con el ID especificado.
                    return null; // Devuelvo null para indicar que no se encontró ningún producto.
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    async deleteProducts(id) {
        try {
            const statJsonDelete = await fs.promises.stat(this.path);
            if (statJsonDelete.size === 0) {
                return console.log("No hay productos cargados.");
            } else {
                const deleteRead = await fs.promises.readFile(this.path, "utf-8");
                const deleteProducts = JSON.parse(deleteRead);
                const index = deleteProducts.findIndex((item) => item.id === id);
                if (index !== -1) {
                    deleteProducts.splice(index, 1);
                    const deleteContent = JSON.stringify(deleteProducts, null, 2);
                    await fs.promises.writeFile(this.path, deleteContent);
                    return { status: "ok", message: `Producto con ID ${id} eliminado correctamente` };
                } else {
                    throw new Error(`Producto con ID ${id} no encontrado.`);
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    async updateProducts(id, updatedProductData) {
        try {
            const statJsonUpdate = await fs.promises.stat(this.path);
            if (statJsonUpdate.size === 0) {
                throw new Error("No hay productos cargados.");
            }
            let updateContentRead = await fs.promises.readFile(this.path, "utf-8");
            const updateContent = JSON.parse(updateContentRead);
            const indexUpdate = updateContent.findIndex((item) => item.id === id);
            if (indexUpdate !== -1) {
                // Actualiza los campos especificados del producto.
                Object.keys(updatedProductData).forEach((key) => {
                    if (key in updateContent[indexUpdate]) {
                        updateContent[indexUpdate][key] = updatedProductData[key];
                    }
                });
                const updateString = JSON.stringify(updateContent, null, 2);
                await fs.promises.writeFile(this.path, updateString);
                console.log("Producto actualizado con éxito");
            } else {
                throw new Error(`Producto con ID ${id} no encontrado.`);
            }
        } catch (error) {
            console.error(error);
        }
    }
}

// Instancia de ProductManager para demostrar su uso asíncrono.
async function cosasAsincronas() {
    const producto = new ProductManager();
}
cosasAsincronas();

module.exports = ProductManager;
