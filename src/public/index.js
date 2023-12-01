const socket = io();

socket.on("updateProducts", (updatedProducts) => {
    const realtimeProductList = document.getElementById("realtimeProductList");
    realtimeProductList.innerHTML = ""; 
    updatedProducts.forEach((product) => {
        const listItem = document.createElement("li");
        listItem.innerHTML = ` <h4>${product.title}</h4>
                            <p>Precio: ${product.price}</p>
                            <p>Stock: ${product.stock} unidades.</p> 
                            <p>Descripcion:${product.description}.</p>
`
        realtimeProductList.appendChild(listItem);
    });
});


function actualizarProductos() {
    socket.emit("updateProducts");
}


actualizarProductos();