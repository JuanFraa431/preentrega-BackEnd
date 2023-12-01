const express = require("express");
const handlebars = require('express-handlebars')
const app = express();
const PORT = 8080 || process.env.PORT
const { Server } = require('socket.io')
const ProductManager = require("./ProductManager"); // Importa el módulo ProductManager 
const productManager = new ProductManager(); // Crea una instancia de ProductManager
const fs = require("fs");


app.use(express.json());

// Configurar Handlebars como motor de plantillas
app.engine('hbs', handlebars.engine({
    extname: '.hbs'
}))
app.set('view engine', 'hbs')

// Importar las rutas relacionadas con productos y carritos desde archivos externos
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');

// Configuración de archivos estáticos
app.use(express.static('public'));
app.use('/api/products', productRoutes);
app.use('/api/carts', cartRoutes);


app.get('/home', async (req, res) => {
    try {
        const { limit } = req.query;
        const products = await productManager.getProducts(limit);
        res.render('home', { products })
    } catch (error) {
        // En caso de error, responde con un estado 500 y un mensaje de error
        res.status(500).json({ status: "error", message: "Error" });
    }
});

// Ruta para obtener todos los productos
app.get('/realtimeproducts', (req, res) => {
    res.render('realtimeproducts');
});


// Configurar Socket.io
const httpServer = app.listen(PORT, err =>{
    if (err)  console.log(err)
    console.log(`Escuchando en el puerto ${PORT}`)
})

// insatanciando un server io
const io = new Server(httpServer)

io.on("connection", (socket) => {
    console.log("Nuevo cliente conectado");
    const sendProductsUpdate = () => {
        const productsData = fs.readFileSync("./data/Products.json", "utf-8");
        const products = JSON.parse(productsData);
        io.emit("updateProducts", products);
    };
    sendProductsUpdate(); 
    socket.on("updateProducts", () => {
        sendProductsUpdate();
    });
});
