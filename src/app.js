// Importa el módulo Express
const express = require("express");
// Crea una instancia de la aplicación Express
const app = express();
// Puerto en el que el servidor escuchará las solicitudes
const port = 8080;

// Middleware para procesar datos en formato JSON
app.use(express.json());

// Importa las rutas relacionadas con productos y carritos desde archivos externos
const productRoutes = require('./routes/productRoutes'); // Rutas para productos
const cartRoutes = require('./routes/cartRoutes');       // Rutas para carritos

// Asocia las rutas a las rutas base correspondientes
app.use('/api/products', productRoutes);
app.use('/api/carts', cartRoutes);

// Inicia el servidor y escucha en el puerto especificado
app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});
