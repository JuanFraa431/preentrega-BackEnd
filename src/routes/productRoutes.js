// productRoutes.js
const express = require("express");
const router = express.Router();
const ProductManager = require("../dao/Managers/ProductManagerFileSystem"); // Importa el módulo ProductManager 
const productManager = new ProductManager(); // Crea una instancia de ProductManager
const productosController = require('../controllers/productController');
const Product = require('../dao/models/products');
const ProductManagerDb = require("../dao/Managers/ProductManagerDB");
const productManagerDb = new ProductManagerDb();

/* // Ruta para obtener todos los productos
router.get('/productos', productosController.obtenerProductos);

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

        const io = req.app.get("io");
        io.emit("updateProducts");

        // Responde con un estado 201 (creado) y un mensaje de éxito
        res.status(201).json({ message: 'Producto agregado con éxito'});
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

        const io = req.app.get("io");
        io.emit("updateProducts");

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

        const io = req.app.get("io");
        io.emit("updateProducts");

        // Responde con un estado 200 y el resultado de la operación
        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        // En caso de error, responde con un estado 500 y un mensaje de error
        res.status(500).json({ status: "error", message: "Error interno del servidor." });
    }
});

// Ruta para obtener todos los productos
router.get('/productos', async (req, res) => {
    try {
        const { limit } = req.query;
        const products = await Product.find().limit(limit ? parseInt(limit) : undefined);
        return res.status(200).json({ status: "ok", data: products });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Error" });
    }
});

// Ruta para obtener un producto por su ID
router.get('/:pid', async (req, res) => {
    try {
        const productId = req.params.pid;
        const product = await Product.findById(productId);

        if (product) {
            res.status(200).json({ status: "ok", data: product });
        } else {
            res.status(404).json({ status: "error", message: "Producto no encontrado" });
        }
    } catch (error) {
        res.status(500).json({ status: "error", message: "Error" });
    }
});

// Ruta para agregar un nuevo producto
router.post('/', async (req, res) => {
    try {
        const { title, description, code, price, stock, category } = req.body;

        const newProduct = new Product({
            title,
            description,
            code,
            price,
            stock,
            category
        });

        await newProduct.save();

        const io = req.app.get("io");
        io.emit("updateProducts");

        res.status(201).json({ message: 'Producto agregado con éxito'});
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ocurrió un error en el servidor' });
    }
});

// Ruta para actualizar un producto por su ID
router.put('/:pid', async (req, res) => {
    try {
        const productId = req.params.pid;
        const updatedProductData = req.body;

        if (!Object.keys(updatedProductData).length) {
            return res.status(400).json({ status: "error", message: "Debe proporcionar al menos un campo para actualizar." });
        }

        const updatedProduct = await Product.findByIdAndUpdate(productId, updatedProductData, { new: true });

        if (updatedProduct) {
            const io = req.app.get("io");
            io.emit("updateProducts");

            return res.status(200).json({ status: "ok", message: "Producto actualizado con éxito.", data: updatedProduct });
        } else {
            res.status(404).json({ status: "error", message: "Producto no encontrado" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Error interno del servidor." });
    }
});

// Ruta para eliminar un producto por su ID
router.delete('/:pid', async (req, res) => {
    try {
        const productId = req.params.pid;

        const result = await Product.findByIdAndDelete(productId);

        if (result) {
            const io = req.app.get("io");
            io.emit("updateProducts");

            return res.status(200).json({ status: "ok", message: "Producto eliminado con éxito.", data: result });
        } else {
            res.status(404).json({ status: "error", message: "Producto no encontrado" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Error interno del servidor." });
    }
}); */

//-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Rutas para gestionar operaciones relacionadas con productos

// Ruta para obtener una lista de productos con opción de limitar la cantidad
router.get("/", async (req, res) => {
    try {
        // Obtiene el parámetro de consulta 'limit' para limitar la cantidad de productos
        const { limit } = req.query;

        // Obtiene la lista de productos y aplica el límite si se proporciona
        const products = await Product.find().limit(parseInt(limit) || 0);

        // Devuelve la lista de productos en la respuesta
        return res.status(200).json({ status: "ok", data: products });
    } catch (error) {
        // Maneja los errores y devuelve un mensaje de error
        res.status(500).json({ status: "error", message: "Error interno del servidor." });
    }
});

// Ruta para obtener un producto por su ID
router.get('/:pid', async (req, res) => {
    try {
        // Obtiene el ID del producto desde los parámetros de la solicitud
        const productId = req.params.pid; 

        // Busca el producto por su ID
        const product = await Product.findById(productId);

        // Devuelve el producto si se encuentra, de lo contrario, devuelve un mensaje de error
        if (product) {
            res.status(200).json({ status: "ok", data: product });
        } else {
            res.status(404).json({ status: "error", message: "Producto no encontrado" });
        }
    } catch (error) {
        // Maneja los errores y devuelve un mensaje de error
        res.status(500).json({ status: "error", message: "Error interno del servidor." });
    }
});

// Ruta para agregar un nuevo producto
router.post('/', async (req, res) => {
    try {
        // Obtiene los datos del producto desde el cuerpo de la solicitud
        const { title, description, code, price, stock, category, thumbnails } = req.body;

        // Valida que se proporcionen todos los campos obligatorios
        if (!title || !description || !code || !price || !stock || !category) {
            return res.status(400).json({ status: "error", message: "Todos los campos son obligatorios." });
        }

        // Crea un objeto con los datos del nuevo producto
        const productData = {
            title,
            description,
            code,
            price,
            stock,
            status: true,
            category,
            thumbnails,
        };

        // Crea el nuevo producto en la base de datos
        const newProduct = await Product.create(productData);

        // Emite un evento de actualización de productos a través de socket.io
        const io = req.app.get("io");
        io.emit("updateProducts");

        // Devuelve una respuesta con el nuevo producto creado
        return res.status(201).json({ status: "ok", message: "Producto agregado con éxito.", data: newProduct });
    } catch (error) {
        // Maneja los errores y devuelve un mensaje de error
        console.error(error);
        res.status(500).json({ status: "error", message: "Error interno del servidor." });
    }
});

// Ruta para actualizar un producto por su ID
router.put('/:pid', async (req, res) => {
    try {
        // Obtiene el ID del producto y los datos actualizados desde los parámetros y el cuerpo de la solicitud
        const productId = req.params.pid;
        const updatedProductData = req.body;

        // Valida que se proporcione al menos un campo para actualizar
        if (!Object.keys(updatedProductData).length) {
            return res.status(400).json({ status: "error", message: "Debe proporcionar al menos un campo para actualizar." });
        }

        // Actualiza el producto en la base de datos y obtiene el producto actualizado
        const updatedProduct = await Product.findByIdAndUpdate(productId, updatedProductData, { new: true });

        // Emite un evento de actualización de productos a través de socket.io
        const io = req.app.get("io");
        io.emit("updateProducts", await Product.find());

        // Devuelve una respuesta con el producto actualizado
        return res.status(200).json({ status: "ok", message: "Producto actualizado con éxito.", data: updatedProduct });
    } catch (error) {
        // Maneja los errores y devuelve un mensaje de error
        console.error(error);
        res.status(500).json({ status: "error", message: "Error interno del servidor." });
    }
});

// Ruta para eliminar un producto por su ID
router.delete('/:pid', async (req, res) => {
    try {
        // Obtiene el ID del producto desde los parámetros de la solicitud
        const productId = req.params.pid;

        // Elimina el producto de la base de datos y obtiene el resultado de la operación
        const result = await Product.findByIdAndDelete(productId);

        // Emite un evento de actualización de productos a través de socket.io
        const io = req.app.get("io");
        io.emit("updateProducts");

        // Devuelve una respuesta con el resultado de la operación
        return res.status(200).json(result);
    } catch (error) {
        // Maneja los errores y devuelve un mensaje de error
        console.error(error);
        res.status(500).json({ status: "error", message: "Error interno del servidor." });
    }
});

// Exporta el enrutador para ser utilizado en otras partes de la aplicación
module.exports = router;
