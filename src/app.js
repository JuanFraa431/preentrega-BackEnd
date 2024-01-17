const express = require("express");
const handlebars = require('express-handlebars')
const app = express();
const PORT = 8080 || process.env.PORT
const { Server } = require('socket.io')
const ProductManager = require("./dao/Managers/ProductManagerFileSystem"); // Importa el módulo ProductManager 
const productManager = new ProductManager(); // Crea una instancia de ProductManager
const fs = require("fs");
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const productosRoutes = require('./routes/productRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const viewRoutes = require('./routes/viewRoutes');
const Product = require("./dao/models/products");
const helpers = require('./public/helpers');
const MongoStore = require("connect-mongo")
const session = require('express-session');
const passport = require('passport');
const User = require('./dao/models/users');
const { initializePassportGitHub, initializePassportLocal } = require('./config/passport.config')




app.use(express.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    store: MongoStore.create({
        mongoUrl: 'mongodb+srv://juanfraa032:Gusblajua19@cluster0.ddudydc.mongodb.net/Eccomerce', 
        mongoOptions: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        },
        ttl: 15000000000,
    }),
    secret: 'secretJuanfra',
    resave: false, 
    saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());

const hbs = handlebars.create({
    extname: '.hbs',
    helpers: helpers,
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    },
});

// Configurar la estrategia de GitHub para Passport
initializePassportGitHub()

// Configurar la estrategia local para Passport
initializePassportLocal()
// Serialize y deserialize user para mantener la sesión
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});

// Configurar Handlebars como motor de plantillas
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs')


// Importar las rutas relacionadas con productos y carritos desde archivos externos
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

// Establece 'io' como una propiedad de la aplicación para poder acceder a ella en otras partes del código
app.set('io', io);

// Maneja eventos de conexión en socket.io
io.on("connection", (socket) => {
    console.log("Nuevo cliente conectado");

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
mongoose.connect('mongodb+srv://juanfraa032:Gusblajua19@cluster0.ddudydc.mongodb.net/Eccomerce', {
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
