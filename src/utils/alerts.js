const Swal = require('sweetalert2');

const createAlert = (type,title,message) => Swal.fire({
    icon:type,
    title,
    text:message,
    timer:3000,
    showConfirmButton:false
})

const createAlertWithCallback = (type, title, message, callback) => {
    Swal.fire({
        icon: type,
        title: title,
        text: message
    }).then((result) => {
        if (result.isConfirmed) {
            setTimeout(callback, 5000); // Ejecuta la función de callback después de 5 segundos
        }
    });
};

module.exports = {
    createAlert,
    createAlertWithCallback
}