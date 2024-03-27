const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("../app"); 
const expect = chai.expect;

    chai.use(chaiHttp);

    describe("Product Routes", () => {
    describe("GET /products", () => {
        it("should return a list of products", (done) => {
        chai
            .request(app)
            .get("/products")
            .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body).to.be.an("object");
            // Agregar más validaciones según sea necesario
            done();
            });
        });
    });

    describe("GET /products/:pid", () => {
        it("should return a single product", (done) => {
        chai
            .request(app)
            .get("/products/PRODUCT_ID_HERE") // Reemplazar PRODUCT_ID_HERE con un ID válido
            .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body).to.be.an("object");
            // Agregar más validaciones según sea necesario
            done();
            });
        });
    });

    describe("POST /products", () => {
        it("should create a new product", (done) => {
        chai
            .request(app)
            .post("/products")
            .send({
            title: "Test Product",
            description: "Test Description",
            code: "1234",
            price: 10,
            stock: 100,
            category: "Test Category",
            })
            .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body).to.be.an("object");
            // Agregar más validaciones según sea necesario
            done();
            });
        });
    });

    describe("PUT /products/:pid", () => {
        it("should update a product", (done) => {
        chai
            .request(app)
            .put("/products/PRODUCT_ID_HERE") // Reemplazar PRODUCT_ID_HERE con un ID válido
            .send({ title: "Updated Title", description: "Updated Description" }) // Datos de actualización
            .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body).to.be.an("object");
            // Agregar más validaciones según sea necesario
            done();
            });
        });
    });

    describe("DELETE /products/:pid", () => {
        it("should delete a product", (done) => {
        chai
            .request(app)
            .delete("/products/PRODUCT_ID_HERE") // Reemplazar PRODUCT_ID_HERE con un ID válido
            .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body).to.be.an("object");
            // Agregar más validaciones según sea necesario
            done();
            });
        });
    });
    });
