document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("showAlertBtn").addEventListener("click", function() {
        Swal.fire({
            icon: 'success',
            title: '¡Bienvenido!',
            text: 'Esperamos que disfrutes tu visita.'
        });
    });
});