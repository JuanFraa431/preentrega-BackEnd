const passport = require('passport');
const GitHubStrategy = require('passport-github2');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User = require('../dao/models/users');
const { logger } = require('../utils/logger');
const mailService = require("../utils/mailService");

//------------------------------------------------------------------------------------------------------------------
exports.initializePassportGitHub = () => {
    passport.use(new GitHubStrategy({
        clientID: 'Iv1.bae1b407c6a21b7a',
        clientSecret: '9efac3cfd1014b4e04b82be282ea631bc97ba8b2',
        callbackURL: 'http://preentrega-backend-production.up.railway.app/api/sessions/githubcallback',
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const githubEmail = profile.emails ? profile.emails[0].value : null;

            console.log("este es el mail que intente usar:", githubEmail)

            const existingUser = await User.findOne({ email: githubEmail });

            if (existingUser) {
                return done(null, existingUser);
            } else {
                const password = "1234";
                const hashedPassword = await bcrypt.hash(password, 10);
                const newUser = new User({
                    first_name: profile.displayName,
                    last_name:"usuarioGithub",
                    email: githubEmail,
                    password: hashedPassword,
                    role: "user"
                });
                await newUser.save();
                return done(null, newUser);
            }
        } catch (error) {
            return done(error, null);
        }
    }));
};

exports.initializePassportLocal = () => {
    passport.use('local.register', new LocalStrategy(
        { usernameField: 'email', passReqToCallback: true },
        async (req, email, password, done) => {
            try {
                const { first_name, last_name, age, secret_word } = req.body;

                if (!first_name || !last_name || !email || !password) {
                    return done(null, false, 'Faltan completar campos obligatorios');
                }

                const userFound = await User.findOne({ email });
                if (userFound) {
                    return done(null, false, 'Ya existe el usuario');
                }

                const hashedPassword = await bcrypt.hash(password, 10);

               let  role = 'user';

                if (email === 'adminCoder@coder.com') {
                    role = 'admin';
                }

                const newUser = {
                    first_name,
                    last_name,
                    email,
                    age,
                    password: hashedPassword,
                    role
                };

                const result = await User.create(newUser);
                // Envío del correo electrónico al usuario registrado
                    const message = `
                    <html>
                    <head>
                        <style>
                            /* Estilos CSS para el correo electrónico */
                        </style>
                    </head>
                    <body>
                        <p>Hola ${first_name} ${last_name},</p>
                        <p>¡Gracias por registrarte en nuestro sitio!</p>
                        <p>Esperamos que disfrutes de nuestros servicios.</p>
                        <p>Saludos,</p>
                        <p>Tu equipo</p>
                    </body>
                    </html>
                `;
                const subject = 'Registro exitoso';
                await mailService.sendNotificationEmail(email, message, subject);
                
                return done(null, result);
            } catch (error) {
                return done(error);
            }
        }
    ));

    passport.use('local.login', new LocalStrategy(
        { usernameField: 'email', passReqToCallback: true },
        async (req, email, password, done) => {
            try {
                const user = await User.findOne({ email });

                if (!user) {
                    logger.error('Usuario no encontrado');
                    return done(null, false, 'Email o contraseña equivocado');
                }

                const passwordMatch = await bcrypt.compare(password, user.password);

                if (!passwordMatch) {
                    logger.error('Contraseña incorrecta');
                    return done(null, false, 'Email o contraseña equivocado');
                }

                try {
                    await User.findOneAndUpdate(
                        { email: user.email },
                        { last_connection: new Date() }
                    );
                } catch (error) {
                    console.error('Error al actualizar last_connection:', error);
                }
                console.log('Inicio de sesión exitoso');
                return done(null, user);
            } catch (error) {
                console.error('Error durante el inicio de sesión:', error);
                return done(error);
            }
        }
    ));
};
