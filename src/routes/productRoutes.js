// productRoutes.js
const express = require("express");
const router = express.Router();
const ProductManager = require("../dao/Managers/ProductManagerFileSystem"); 
const productManager = new ProductManager(); 
const productosController = require("../controllers/productController");
const Product = require("../dao/models/products");
const ProductManagerDb = require("../dao/Managers/ProductManagerDB");
const User = require('../dao/models/users');
const { customizeError } = require("../middleware/errorHandler");
const { logger } = require('../utils/logger');

//---------------------------------------------------------------------------------------

router.get("/", async (req, res) => {
    try {
        const user = req.user;
        const { page = 1, limit = 10 } = req.query;
        const pageValue = parseInt(page);
        const limitValue = parseInt(limit);
        const totalProducts = await Product.countDocuments();
        const totalPages = Math.ceil(totalProducts / limitValue);
        const products = await Product.find()
            .limit(limitValue)
            .skip((pageValue - 1) * limitValue)
        const hasPrevPage = pageValue > 1;
        const hasNextPage = pageValue < totalPages;
        const prevLink = hasPrevPage ? `/products?page=${pageValue - 1}&limit=${limitValue}` : null;
        const nextLink = hasNextPage ? `/products?page=${pageValue + 1}&limit=${limitValue}` : null;
        const result = {
            status: "success",
            payload: products,
            totalPage: totalPages,
            prevpage: hasPrevPage ? pageValue - 1 : null,
            nextPage: hasNextPage ? pageValue + 1 : null,
            page: pageValue,
            hasprevpage: hasPrevPage,
            hasnextpage: hasNextPage,
            prevLink: prevLink,
            nextLink: nextLink
        }; 
        const userFromDB = await User.findById(user._id);
        const isAdmin = userFromDB.role === 'admin';
        const isPremium = userFromDB.role === 'premium';
        let isAdminFalse = false
        let isPremiumFalse = false
        if (!isAdmin){
            isAdminFalse = true
        }
        if (!isPremium){
            isPremiumFalse = true
        }
        res.render('product', { products, user: userFromDB, isAdmin, isAdminFalse, isPremium, isPremiumFalse });
    } catch (error) {
        logger.error(error);
        res.status(500).json({ status: "error", message: customizeError('INTERNAL_SERVER_ERROR') });
    }
});
router.get('/:pid', async (req, res) => {
    try {
        const productId = req.params.pid; 
        const product = await Product.findById(productId);
        if (product) {
            res.status(200).json({ status: "ok", data: product });
        } else {
            res.status(404).json({ status: "error", message: customizeError('PRODUCT_NOT_FOUND') });
        }
    } catch (error) {
        res.status(500).json({ status: "error", message: customizeError('ERROR') });
    }
});

router.post('/', async (req, res) => {
    try {
        // Obtenemos el ID del usuario autenticado
        const ownerId = req.user._id;

        const { title, description, code, price, stock, category, thumbnails } = req.body;
        if (!title || !description || !code || !price || !stock || !category) {
            return res.status(400).json({ status: "error", message: customizeError('MISSING_FIELDS') });
        }

        const productData = {
            title,
            description,
            code,
            price,
            stock,
            status: true,
            category,
            thumbnails,
            owner: ownerId, // Almacenamos el ID del usuario como propietario del producto
        };

        const newProduct = await Product.create(productData);
        const io = req.app.get("io");
        io.emit("productAdded", newProduct);
        res.redirect('/products');
    } catch (error) {
        logger.error(error);
        res.status(500).json({ status: "error", message: customizeError('INTERNAL_SERVER_ERROR') });
    }
});

router.put('/:pid', async (req, res) => {
    try {
        const productId = req.params.pid;
        const updatedProductData = req.body;
        if (Object.keys(updatedProductData).length === 0) {
            return res.status(400).json({ status: "error", message: customizeError('EMPTY_UPDATE_FIELDS') });
        }
        const updatedProduct = await Product.findByIdAndUpdate(productId, updatedProductData, { new: true });        
        if (!updatedProduct) {
            return res.status(404).json({ status: "error", message: customizeError('PRODUCT_NOT_FOUND') });
        }

        const io = req.app.get("io");
        io.emit("updateProducts", await Product.find());
        
        return res.status(200).json({ status: "ok", message: customizeError('PRODUCT_UPDATED'), data: updatedProduct });
    } catch (error) {
        logger.error(error);
        res.status(500).json({ status: "error", message: customizeError('INTERNAL_SERVER_ERROR') });
    }
}); 

router.delete('/:pid', async (req, res) => {
    try {
        const productId = req.params.pid;
        await Product.findByIdAndDelete(productId);
        const io = req.app.get("io");
        io.emit("productDeleted", productId); 
        res.status(200).json({ status: "success", message:customizeError('PRODUCT_DELETED') });
    } catch (error) {
        logger.error(error);
        res.status(500).json({ status: "error", message: customizeError('INTERNAL_SERVER_ERROR') });
    }
});

// Exporta el enrutador para ser utilizado en otras partes de la aplicación
module.exports = router;
