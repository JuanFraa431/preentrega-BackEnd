// Importa la biblioteca Handlebars
const Handlebars = require('handlebars');

// Registra un nuevo helper llamado 'multiply'
Handlebars.registerHelper('multiply', function (a, b) {
    // Devuelve el resultado de multiplicar los argumentos 'a' y 'b'
    return a * b;
});

/* Handlebars.registerHelper('isAdmin', function (role) {
    // Devuelve true si el rol es 'admin', de lo contrario, false
    return role === 'admin';
}); */

// Exporta el objeto Handlebars modificado con el nuevo helper
module.exports = Handlebars;
