const socket = io();  // Inicializa el socket para la conexión en tiempo real

// Escucha el evento "updateProducts" enviado por el servidor
socket.on("updateProducts", (updatedProducts) => {
    const realtimeProductList = document.getElementById("realtimeProductList");  // Obtiene el elemento HTML para mostrar la lista de productos en tiempo real
    realtimeProductList.innerHTML = "";  // Limpia el contenido existente en la lista

    // Itera sobre los productos actualizados y crea elementos HTML para cada uno
    updatedProducts.forEach((product) => {
        const listItem = document.createElement("li");
        listItem.innerHTML = ` <h4>${product.title}</h4>
                            <p>Precio: ${product.price}</p>
                            <p>Stock: ${product.stock} unidades.</p> 
                            <p>Descripcion:${product.description}.</p>
`;
        realtimeProductList.appendChild(listItem);  // Agrega cada elemento a la lista en tiempo real
    });
});

// Función para enviar una solicitud al servidor de actualización de productos
function actualizarProductos() {
    socket.emit("updateProducts");
}

actualizarProductos();  // Llama a la función para actualizar productos al cargar la página
