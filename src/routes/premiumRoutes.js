
const express = require('express');
const router = express.Router();
const User = require('../dao/models/users');
const multer = require('multer');
const path = require('path');


router.post('/premium/:uid', async (req, res) => {
    try {
        // Obtiene el ID de usuario de los parámetros de la URL
        const userId = req.params.uid;

        // Obtiene el nuevo rol del cuerpo de la solicitud
        const { newRole } = req.body;

        // Verifica si el nuevo rol es válido
        if (newRole !== 'admin' && newRole !== 'premium' && newRole !== 'user') {
            return res.status(400).json({ status: 'error', message: 'Rol inválido' });
        }

        // Busca el usuario por su ID en la base de datos
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
        }

        // Verifica si el usuario tiene los archivos necesarios para ser premium
        const requiredDocuments = ['Documentacion', 'ConstanciaDireccion', 'ConstanciaCuenta'];
        const userDocuments = user.documents.map(doc => doc.name);
        const hasRequiredDocuments = requiredDocuments.every(doc => userDocuments.includes(doc));
        console.log('Nombres de documentos del usuario:', userDocuments);
        console.log('Documentos requeridos:', requiredDocuments);
        console.log(hasRequiredDocuments, "esto es lo que estas buscando")
        if (!hasRequiredDocuments) {
            return res.status(400).json({ status: 'error', message: 'El usuario no tiene los documentos necesarios para ser premium' });
        }

        // Actualiza el rol del usuario y guarda los cambios en la base de datos
        user.role = newRole;
        await user.save();

        // Devuelve una respuesta exitosa
        return res.status(200).json({ status: 'success', message: 'Rol de usuario actualizado correctamente a premium', user });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
});


router.get('/documents', (req, res) => {
    if (req.isAuthenticated()) {
        const userId = req.user._id;
        console.log("este es el usuario", req.user._id,"aca termina")
        
        res.render('documents', { userId: userId });
    } else {
        res.redirect('/login');
    }
});

const checkDocumentLimit = async (req, res, next) => {
    try {
        const userId = req.params.uid;

        // Busca el usuario por su ID en la base de datos para obtener sus documentos
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
        }

        // Verifica la longitud del array de documentos del usuario
        if (user.documents.length >= 3) {
            return res.status(400).json({ status: 'error', message: 'Se excede el límite de documentos permitidos (máximo 3)' });
        }

        // Si no se excede el límite, continúa con el siguiente middleware
        next();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/') // Ruta donde se guardarán los archivos
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now()) // Nombre del archivo
    }
});

const upload = multer({ storage });

router.post('/:uid/documents', checkDocumentLimit, upload.array('documents', 3), async (req, res) => {
    try {
        // Obtiene el ID de usuario de los parámetros de la URL
        const userId = req.params.uid;

        // Busca el usuario por su ID en la base de datos
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
        }

        // Itera sobre los archivos cargados
        req.files.forEach(file => {
            // Extrae el nombre del archivo sin la extensión
            const fileNameWithoutExtension = file.originalname.split('.').slice(0, -1).join('.');

            // Agrega la información relevante de cada archivo al array 'documents' del usuario
            user.documents.push({
                name: fileNameWithoutExtension,
                reference: file.path // O la ubicación donde se guarda el archivo en tu sistema
            });
        });

        // Guarda los cambios en el usuario en la base de datos
        await user.save();

        // Devuelve una respuesta exitosa
        return res.status(200).json({ status: 'success', message: 'Documentos Cargados con exito', user });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
});













module.exports = router;
