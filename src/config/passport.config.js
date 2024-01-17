const passport = require('passport')
const GitHubStrategy = require('passport-github2')
const User = require("../dao/models/users")
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
// const { createToken, authenticationToken } = require('../utils/jwt')

exports.initializePassportGitHub = () => {
    passport.use(new GitHubStrategy({
        clientID: 'Iv1.bae1b407c6a21b7a',
        clientSecret: '9efac3cfd1014b4e04b82be282ea631bc97ba8b2',
        callbackURL: 'http://localhost:8080/api/sessions/githubcallback',
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const githubEmail = profile.emails ? profile.emails[0].value : null;

            const existingUser = await User.findOne({ email: githubEmail });

            if (existingUser) {
                return done(null, existingUser);
            } else {
                const password = "1234";
                const hashedPassword = await bcrypt.hash(password, 10);
                const newUser = new User({
                    first_name: profile.displayName,
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
}

//----------------------------------------------------------

exports.initializePassportLocal = () =>{
    passport.use('local.register', new LocalStrategy(
        { usernameField: 'email', passReqToCallback: true },
        async (req, email, password, done) => {
            try {
                const { first_name } = req.body;

                if (!first_name || !email || !password) {
                    return done(null, false, 'Faltan completar campos obligatorios');
                }

                const userFound = await User.findOne({ email });
                if (userFound) {
                    return done(null, false, 'Ya existe el usuario');
                }

                const hashedPassword = await bcrypt.hash(password, 10);
                const role = (email === "adminCoder@coder.com") ? "admin" : "user";

                const newUser = {
                    first_name,
                    email,
                    password: hashedPassword,
                    role: role
                };

                const result = await User.create(newUser);
                // const token = createToken({id: result._id})
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
                    console.log('Usuario no encontrado');
                    return done(null, false, 'Email o contraseña equivocado');
                }

                const passwordMatch = await bcrypt.compare(password, user.password);

                if (!passwordMatch) {
                    console.log('Contraseña incorrecta');
                    return done(null, false, 'Email o contraseña equivocado');
                }

                console.log('Inicio de sesión exitoso');
                // const token = createToken({id: user._id, role: user.role })
                return done(null, user);
            } catch (error) {
                console.error('Error durante el inicio de sesión:', error);
                return done(error);
            }
        }
    ));
}