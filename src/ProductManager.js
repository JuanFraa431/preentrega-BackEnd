const { promises } = require("dns")
const fs = require("fs")
const { json } = require("stream/consumers")

class ProductManager {
    constructor(){
        this.products = []
        this.path = "./data/Products.json"
    }
    async addProduct(title, description,code, price,stock, category ) {
        title = title || undefined;
        description = description || undefined;
        price = price ?? undefined;
        category = category ?? undefined;
        code = code || undefined;
        stock = stock ?? undefined;
    
        if (title == undefined || category == undefined || price == undefined || description == undefined || code == undefined || stock == undefined) {
            return console.log("Es necesario que todos los campos estén completos.");
        }
    
        let id = 0;
        let validoCode = [];
    
        const statsJson = await fs.promises.stat(this.path);
    
        if (statsJson.size === 0) {
            validoCode = this.products.find((codeSearch) => codeSearch.code == code);
        } else {
            const buscaCode = await fs.promises.readFile(this.path, "utf-8");
            const buscaCodeParse = JSON.parse(buscaCode);
            validoCode = buscaCodeParse.find((codeSearch) => codeSearch.code == code);
        }
    
        if (validoCode == undefined) {
            let size = 0;
    
        
            if (statsJson.size !== 0) {
                const leoArchivo = await fs.promises.readFile(this.path, "utf-8");
                const leoArchivoParse = JSON.parse(leoArchivo);
                this.products = leoArchivoParse;
                size = leoArchivoParse.length;
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
            this.products.push({ title, description,code, price,stock, category,id: id });
    
        
            const productosString = JSON.stringify(this.products, null, 2);
            await fs.promises.writeFile(this.path, productosString);
    
            return console.log("Producto ingresado con éxito");
        } else {
            return console.log("Código de producto ya ingresado.");
        }
    }
    async getProducts(limit){
        // siempre verifico que exista algo en el archivo
        const statsJsonProduct = await fs.promises.stat(this.path)
        if (statsJsonProduct.size === 0){
            return [];
        }else{
            const ProductosArchivo = await fs.promises.readFile(this.path, "utf-8")
            const ProductosParse = JSON.parse(ProductosArchivo)
            if (limit){
                return ProductosParse.slice(0,parseInt(limit))
            }else {
                return ProductosParse;
            }
        }
    }
    async getProductById(id) {
        // Siempre verifico que exista algo en el archivo
        const statsJsonId = await fs.promises.stat(this.path);
        
        if (statsJsonId.size === 0) {
            // No hay productos ingresados
            return null; // Devuelvo null para indicar que no se encontró ningún producto
        } else {
            // Busco el id consiguiendo el array que está almacenado en JSON
            const buscaId = await fs.promises.readFile(this.path, "utf-8");
            const buscaIdParse = JSON.parse(buscaId);
            const productoEncontrado = buscaIdParse.find((item) => item.id === parseInt(id));
    
            if (productoEncontrado) {
                return productoEncontrado;
            } else {
                // No se encontró el producto con el ID especificado
                return null; // Devuelvo null para indicar que no se encontró ningún producto
            }
        
        }
        
    }


    async deleteProducts(id){
        const statJsonDelete = await fs.promises.stat(this.path)
        if (statJsonDelete.size === 0){
            return console.log("No hay productos cargados.");
        }else {
            const deleteRead = await fs.promises.readFile(this.path, "utf-8")
            const deleteProducts = JSON.parse(deleteRead)
            const index = deleteProducts.findIndex((item) => item.id === id)
            if (index !== -1){
                deleteProducts.splice(index, 1)
                const deleteContent = JSON.stringify(deleteProducts, null, 2)
                await fs.promises.writeFile(this.path, deleteContent)
                return {status: "ok", message: `Producto con ID ${id} eliminado correctamente`}
            }else {
                throw new Error(`Producto con ID ${id} no encontrado.`)
            }
        }
    }

    async updateProducts(id, updatedProductData){
        const statJsonUpdate = await fs.promises.stat(this.path);
        if (statJsonUpdate.size === 0) {
            throw new Error("No hay productos cargados.");
        }
        let updateContentRead = await fs.promises.readFile(this.path, "utf-8");
        const updateContent = JSON.parse(updateContentRead);
        const indexUpdate = updateContent.findIndex((item) => item.id === id);
        if (indexUpdate !== -1) {
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
    }
}



async function cosasAsincronas(){
    const producto = new ProductManager()
}
cosasAsincronas()

module.exports = ProductManager

