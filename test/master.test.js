const expect = require('chai').expect;
const request = require('request');
const url = 'localhost:9001';

describe('Master api', () => {
    describe('get state by country id', () => {
        it('Status', (done) => {
            let country_id = 0;
            request.get(`localhost:9001/getStates?country_id=${country_id}`, {}, (_, response) => {
                console.log(response);
                expect(response).to.equal(400);
                done();
                console.log(response);
            });
        });
    });
});
