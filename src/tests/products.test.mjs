import * as chai from "chai";
import supertest from "supertest";

const expect = chai.expect;
const requester = supertest("http://localhost:8080");


describe('Products Router', () => {
    it('Debería obtener la lista de productos después de iniciar sesión', async () => {
        const userData = {
            _id: '660db1561f0fc83c9d65b882', 
            first_name: 'prueba',
            last_name: 'test',
            email: 'userTest@gmail.com',
            age: 999,
            password: '$2b$10$7EUtVhevP3t.QHuaNKXxSeLy/1dRShwVEi5RcZGJIYyvVsNrlPTbu',
            role: 'user',
            __v: 0
        };
        const loginRes = await requester.post('/api/sessions/login').send({
            email: userData.email,
            password: '1234' 
        });

        expect(loginRes.status).to.equal(302);

        const userCookie = loginRes.headers['set-cookie'][0];
        const productsRes = await requester.get('/products')
            .set('Cookie', userCookie);

        expect(productsRes.status).to.equal(200);
        expect(productsRes.body).to.be.an('object')
    });

    it('Debería retornar un producto por ID', async () => {
        try { 
            const res = await requester.get(`/products/658345b612a530ba9edc6259`);
            expect(res.status).to.equal(200);
            expect(res.body).to.be.an('object');
        } catch (error) {
            throw error;
        }
    });

});

export { expect, requester };