const express = require("express");
const handlebars = require('express-handlebars')
const app = express();
const { Server } = require('socket.io')
const ProductManager = require("./dao/Managers/ProductManagerFileSystem"); // Importa el módulo ProductManager 
const productManager = new ProductManager(); // Crea una instancia de ProductManager
const fs = require("fs");
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const productosRoutes = require('./routes/productRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const viewRoutes = require('./routes/viewRoutes');
const mockingProductsRoute = require('./routes/mockingProductsRoutes')
const Product = require("./dao/models/products");
const helpers = require('./public/helpers');
const MongoStore = require("connect-mongo")
const session = require('express-session');
const passport = require('passport');
const User = require('./dao/models/users');
const sessionController = require('./controllers/sessionController');
const config = require('./config/config');

const PORT = config.PORT;
const MONGO_URL = config.MONGO_URL;
const SESSION_SECRET = config.SESSION_SECRET;


app.use(express.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    store: MongoStore.create({
        mongoUrl:MONGO_URL, 
        mongoOptions: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        },
        ttl: 15000000000,
    }),
    secret: SESSION_SECRET,
    resave: false, 
    saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());

sessionController;


const hbs = handlebars.create({
    extname: '.hbs',
    helpers: helpers,
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    },
});

//aca iba serializate dessealizate y los github y local

// Configurar Handlebars como motor de plantillas
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs')


// Importar las rutas relacionadas con productos y carritos desde archivos externos
app.use('/mockingproducts', mockingProductsRoute);
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');

// Configuración de archivos estáticos
app.use(express.static('public'));
app.use('/api/products', productRoutes);
app.use('/api/carts', cartRoutes);
app.use('/products', productRoutes);
app.use('/carts', cartRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/', viewRoutes);



app.get('/home', async (req, res) => {
    try {
        const products = await Product.find().lean();
        console.log(products);
        res.render('home', { products });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error interno del servidor', error });
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

app.set('io', io);

io.on("connection", (socket) => {
    console.log("Nuevo cliente conectado");

    socket.on("productDeleted", async function(productId) {
        try {
            await Product.findByIdAndDelete(productId);
            sendProductsUpdate();
        } catch (error) {
            console.error(error);
        }
    });

    // Función para enviar actualizaciones de productos a los clientes conectados
    const sendProductsUpdate = async () => {
        try {
            // Obtener todos los productos desde MongoDB
            const products = await Product.find();
            
            // Emite un evento "updateProducts" a todos los clientes conectados con la lista de productos
            io.emit("updateProducts", products);
        } catch (error) {
            console.error(error);
        }
    };

    // Envía una actualización de productos cuando un cliente se conecta
    sendProductsUpdate();

    // Escucha el evento "updateProducts" desde el cliente y envía una actualización de productos
    socket.on("updateProducts", () => {
        sendProductsUpdate();
    });

    // Llama a sendProductsUpdate al final de la conexión del cliente (no está claro si es necesario)
    sendProductsUpdate();
});

// Conexión a MongoDB usando Mongoose
mongoose.connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;

// Maneja eventos de conexión y error en la base de datos MongoDB
db.on('error', console.error.bind(console, 'Error de conexión a MongoDB:'));
db.once('open', () => {
    console.log('Conexión exitosa a MongoDB');
});

// Establece las rutas para las operaciones relacionadas con productos
app.use('/api', productosRoutes);
