// productRoutes.js
const express = require("express");
const router = express.Router();
const ProductManager = require("../dao/Managers/ProductManagerFileSystem"); // Importa el módulo ProductManager
const productManager = new ProductManager(); // Crea una instancia de ProductManager
const productosController = require("../controllers/productController");
const Product = require("../dao/models/products");
const ProductManagerDb = require("../dao/Managers/ProductManagerDB");
const productManagerDb = new ProductManagerDb();
const mongoosePaginate = require("mongoose-paginate-v2");


// Ruta para obtener una lista de productos con opción de limitar la cantidad
router.get("/", async (req, res) => {
    try {
        
        const user = req.user;
        // Parámetros de consulta
        const { limit = 10, page = 1, category, availability, sort } = req.query;
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: parseSortQuery(sort),
        };

        // Filtros de búsqueda
        const filters = {};
        if (category) filters.category = category;
        if (availability) filters.availability = availability;

        // Realiza la búsqueda con paginación y filtros
        const products = await Product.paginate(filters, { ...options, sort: { _id: 1 } });

        // Construye la respuesta según los requisitos
        const totalPages = products.totalPages;
        const hasPrevPage = products.hasPrevPage;
        const hasNextPage = products.hasNextPage;
        const prevPage = hasPrevPage ? page - 1 : null;
        const nextPage = hasNextPage ? page + 1 : null;
        const prevLink = hasPrevPage ? generatePageLink(req, prevPage) : null;
        const nextLink = hasNextPage ? generatePageLink(req, nextPage) : null;

        // Renderiza la vista de productos
        res.render("products", {
            user,
            products: products.docs,
            totalPages,
            prevPage,
            nextPage,
            page,
            hasPrevPage,
            hasNextPage,
            prevLink,
            nextLink,
        });
    } catch (error) {
        // Maneja los errores y devuelve un mensaje de error
        res
            .status(500)
            .json({ status: "error", message: "Error interno del servidor." });
    }
});

// Función para parsear la cadena de ordenamiento y devolver el objeto de ordenamiento adecuado
function parseSortQuery(sortQuery) {
    // Implementa la lógica para analizar el parámetro de ordenamiento y devolver el objeto de ordenamiento adecuado
    return sortQuery === "desc" ? { price: -1 } : { price: 1 };
}

// Función para generar el enlace de página con los parámetros de consulta adecuados
function generatePageLink(req, page) {
    const baseUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    const queryParams = { ...req.query, page };
    return `${baseUrl}?${new URLSearchParams(queryParams)}`;
}

// Ruta para obtener un producto por su ID
router.get("/:cid", async (req, res) => {
    try {
        const cartId = req.params.cid;

        // Busca el carrito y popula los productos para obtener la información completa
        const cart = await Cart.findById(cartId).populate({
            path: "products.product",
            model: "Product",
        });

        if (!cart) {
            return res
                .status(404)
                .json({
                    status: "error",
                    message: `Carrito con ID ${cartId} no encontrado.`,
                });
        }

        // Renderiza la vista de carrito con los productos asociados
        res.render("cart", { cart });
    } catch (error) {
        console.error(error);
        res
            .status(500)
            .json({ status: "error", message: "Error interno del servidor." });
    }
});

// Ruta para agregar un nuevo producto
router.post("/", async (req, res) => {
    try {
        // Obtiene los datos del producto desde el cuerpo de la solicitud
        const { title, description, code, price, stock, category, thumbnails } =
            req.body;

        // Valida que se proporcionen todos los campos obligatorios
        if (!title || !description || !code || !price || !stock || !category) {
            return res
                .status(400)
                .json({
                    status: "error",
                    message: "Todos los campos son obligatorios.",
                });
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
        return res
            .status(201)
            .json({
                status: "ok",
                message: "Producto agregado con éxito.",
                data: newProduct,
            });
    } catch (error) {
        // Maneja los errores y devuelve un mensaje de error
        console.error(error);
        res
            .status(500)
            .json({ status: "error", message: "Error interno del servidor." });
    }
});

// Ruta para actualizar un producto por su ID
router.put("/:pid", async (req, res) => {
    try {
        // Obtiene el ID del producto y los datos actualizados desde los parámetros y el cuerpo de la solicitud
        const productId = req.params.pid;
        const updatedProductData = req.body;

        // Valida que se proporcione al menos un campo para actualizar
        if (!Object.keys(updatedProductData).length) {
            return res
                .status(400)
                .json({
                    status: "error",
                    message: "Debe proporcionar al menos un campo para actualizar.",
                });
        }

        // Actualiza el producto en la base de datos y obtiene el producto actualizado
        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            updatedProductData,
            { new: true }
        );

        // Emite un evento de actualización de productos a través de socket.io
        const io = req.app.get("io");
        io.emit("updateProducts", await Product.find());

        // Devuelve una respuesta con el producto actualizado
        return res
            .status(200)
            .json({
                status: "ok",
                message: "Producto actualizado con éxito.",
                data: updatedProduct,
            });
    } catch (error) {
        // Maneja los errores y devuelve un mensaje de error
        console.error(error);
        res
            .status(500)
            .json({ status: "error", message: "Error interno del servidor." });
    }
});

// Ruta para eliminar un producto por su ID
router.delete("/:pid", async (req, res) => {
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
        res
            .status(500)
            .json({ status: "error", message: "Error interno del servidor." });
    }
});

// Exporta el enrutador para ser utilizado en otras partes de la aplicación
module.exports = router;
