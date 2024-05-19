// productsRouter.js
const express = require("express");
const router = express.Router();
const productsController = require("../controllers/productController");

// Define las rutas relacionadas con los productos
router.get("/", productsController.getProducts);
router.get("/:pid", productsController.getProductById);
router.post("/", productsController.createProduct);
router.put("/:pid", productsController.updateProduct);
router.delete("/:pid", productsController.deleteProduct);
router.get("/itemDetail/:pid", productsController.getItemDetail)

module.exports = router;