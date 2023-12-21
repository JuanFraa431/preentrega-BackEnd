// Este código se ejecuta cuando el contenido HTML ha sido completamente cargado en el navegador

document.addEventListener("DOMContentLoaded", function () {
    // Crea una instancia de socket.io y establece una conexión con el servidor
    const socket = io();

    // Escucha el evento "updateProducts" enviado desde el servidor
    socket.on("updateProducts", (updatedProducts) => {
        // Llama a la función updateProductList con la lista de productos actualizada
        updateProductList(updatedProducts);
    });

    // Función que actualiza la lista de productos en el frontend
    function updateProductList(products) {
        // Obtiene el elemento HTML con el id "realtimeProductList"
        const realtimeProductList = document.getElementById("realtimeProductList");
        
        // Limpia el contenido actual del elemento
        realtimeProductList.innerHTML = "";

        // Itera sobre la lista de productos y crea elementos de lista con la información del producto
        products.forEach((product) => {
            const listItem = document.createElement("li");
            listItem.innerHTML = `
                <strong>Nombre: ${product.title}</strong>
                <p>Descripcion: ${product.description}</p>
                <p>Precio: $${product.price}</p>
                <p>Stock: ${product.stock} unidades </p>
            `;
            // Agrega el elemento de lista al elemento "realtimeProductList"
            realtimeProductList.appendChild(listItem);
        });
    }
});
