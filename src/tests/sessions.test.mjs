import * as chai from "chai";
import supertest from "supertest";

const expect = chai.expect;
const requester = supertest("http://localhost:8080");

describe('Session Router', () => {

    it('Debería iniciar sesión con éxito', async () => {
        const loginData = {
            email: 'userTest@gmail.com',
            password: '1234'
        };
        const res = await requester.post('/api/sessions/login').send(loginData);
        expect(res.status).to.equal(302);
    });

    it('Debería cerrar sesión con éxito', async () => {
        const res = await requester.get('/api/sessions/logout');
        
        expect(res.status).to.equal(302);
    });
});

export { expect, requester };