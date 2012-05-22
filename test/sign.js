//var request = require('./support/http');
var session = require('./session.lib.js');

function signin(data, ct) {
    return session.postData('/signin', data, '', ct);
};

describe('Sign', function() {
    describe('sign in : POST /signin', function() {
        it('should succes sign in and return json', function(done) {
            signin({
                  cellphone:'18912345678'
                , password:'123456'
            })
            .end(function(res) {
                res.statusCode.should.equal(200);
                res.body.should.have.property('name');
                console.log(res.body);
                done();
            })
        })
        
        it('should succes sign in and return html', function(done) {
            signin({
                  cellphone:'18912345678'
                , password:'123456'
            }, 'text/html')
            .end(function(res) {
                res.statusCode.should.equal(200);
                res.body.should.have.property('name');
                console.log(res.body);
                done();
            })
        })
    })
})