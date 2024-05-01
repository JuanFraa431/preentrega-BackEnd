const express = require('express');
const router = express.Router();
const User = require('../dao/models/users');
const multer = require('multer');
const path = require('path');
const mailService = require('../utils/mailService'); 
const { logger } = require('../utils/logger');


//-------------------------------------------------------------------------------------------------------------------


router.get('/', async (req, res) => {
    try {
        const users = await User.find({}, { first_name: 1, email: 1, role: 1 }); 

        res.json(users);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener usuarios' });
    }
});


router.delete('/', async (req, res) => {
    try {
        const dosDiasAtras = new Date();
        dosDiasAtras.setDate(dosDiasAtras.getDate() - 2); // Restar 2 días a la fecha actual

        // Convertir la fecha de dos días atrás a formato ISO 8601
        const dosDiasAtrasISO = dosDiasAtras.toISOString();

        console.log("esta es la fecha", dosDiasAtrasISO)

        // Obtener los correos electrónicos de los usuarios que cumplen con la condición
        const usuariosEliminados = await User.find({ last_connection: { $lt: dosDiasAtrasISO } }).select('email');

        // Almacenar los correos electrónicos en un array
        const correosUsuariosEliminados = usuariosEliminados.map(usuario => usuario.email);

        // Eliminar los usuarios que cumplen con la condición
        await User.deleteMany({ last_connection: { $lt: dosDiasAtrasISO } });
        
        const subject = "Notificacion de eliminacion de cuenta por inactividad"
        // Enviar correos electrónicos de notificación a los usuarios eliminados
        for (const correo of correosUsuariosEliminados) {
            const message = `
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Notificación de eliminación de cuenta por inactividad</title>
                    <style>
                        /* Estilos CSS aquí */
                    </style>
                </head>
                <body>
                    <h1>Notificación de eliminación de cuenta por inactividad</h1>
                    <p>Hola,</p>
                    <p>Tu cuenta ha sido eliminada debido a la inactividad durante más de 2 días.</p>
                    <p>Si necesitas recuperar tu cuenta, por favor contáctanos.</p>
                    <p>Saludos,</p>
                    <p>Tu equipo</p>
                </body>
                </html>
            `;
            await mailService.sendNotificationEmail(correo, message, subject);
        }

        res.json({ message: 'Usuarios inactivos eliminados correctamente' });
    } catch (error) {
        console.error('Error al limpiar usuarios inactivos:', error);
        res.status(500).json({ message: 'Error interno del servidor al limpiar usuarios inactivos' });
    }
});

router.post('/premium/:uid', async (req, res) => {
    try {
        // Obtiene el ID de usuario de los parámetros de la URL
        const userId = req.params.uid;

        // Obtiene el nuevo rol del cuerpo de la solicitud
        const { newRole } = req.body;

        // Verifica si el nuevo rol es válido
        if (newRole !== 'admin' && newRole !== 'premium' && newRole !== "user") {
            return res.status(400).json({ status: 'error', message: 'Rol inválido' });
        }

        // Busca el usuario por su ID en la base de datos
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
        }

        // Si el usuario que está realizando la solicitud no es un administrador,
        // verifica si el usuario tiene los archivos necesarios para ser premium
        if (req.user.role !== 'admin') {
            const requiredDocuments = ['Documentacion', 'ConstanciaDireccion', 'ConstanciaCuenta'];
            const userDocuments = user.documents.map(doc => doc.name);
            const hasRequiredDocuments = requiredDocuments.every(doc => userDocuments.includes(doc));
            logger.info('Nombres de documentos del usuario:', userDocuments);
            logger.info('Documentos requeridos:', requiredDocuments);
            if (!hasRequiredDocuments) {
                return res.status(400).json({ status: 'error', message: 'El usuario no tiene los documentos necesarios para ser premium' });
            }
        }

        // Simula un retraso de un segundo antes de actualizar el rol del usuario
        setTimeout(async () => {
            // Actualiza el rol del usuario y guarda los cambios en la base de datos
            user.role = newRole;
            await user.save();

            // Devuelve una respuesta exitosa después del retraso
            return res.redirect("/userProfile")
        }, 1000); // Retraso de 1 segundo
    } catch (error) {
        logger.error(error);
        return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
});



router.get('/documents', (req, res) => {
    if (req.isAuthenticated()) {
        const userId = req.user._id;
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
        logger.error(error);
        return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '/uploads') // Ruta donde se guardarán los archivos
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now()) // Nombre del archivo
    }
});

const upload = multer({ storage });

router.post('/:uid/documents', upload.array('documents', 3), async (req, res) => {
    try {
        // Obtiene el ID de usuario de los parámetros de la URL
        const userId = req.params.uid;

        // Busca el usuario por su ID en la base de datos
        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
        }

        // Limpiar documentos anteriores si existen
        user.documents = [];

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
        user = await user.save();

        // Devuelve una respuesta exitosa
        return res.status(200).json({ status: 'success', message: 'Documentos actualizados con éxito', user });

    } catch (error) {
        logger.error(error);
        return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
});

// Ruta para eliminar un usuario de la base de datos
router.post('/delete-user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        // Encuentra al usuario que se eliminará
        const deletedUser = await User.findByIdAndDelete(userId);
        
        // Verifica si se encontró y eliminó al usuario
        if (!deletedUser) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const subject = 'Notificación de eliminación de cuenta';
        const message = `
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${subject}</title>
                <style>
                    /* Estilos CSS aquí */
                </style>
            </head>
            <body>
                <h1>${subject}</h1>
                <p>Hola ${deletedUser.first_name},</p>
                <p>Tu cuenta ha sido eliminada por un administrador.</p>
                <p>Si tienes alguna pregunta, contáctanos.</p>
                <p>Saludos,</p>
                <p>Tu equipo</p>
            </body>
            </html>
        `;
        await mailService.sendNotificationEmail(deletedUser.email, message, subject);
        
        // Redirige a la página de edición de usuarios
        res.redirect('/userEdit');
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar usuario' });
    }
});


module.exports = router;
