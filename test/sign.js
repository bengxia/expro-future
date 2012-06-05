//var request = require('./support/http');
var session = require('./session.lib.js');

function signin(data, ct) {
    return session.postData('/signin', data, '', ct);
};

describe('Sign', function() {
    describe('sign in : POST /signin', function() {
        it('should succes sign in and return json', function(done) {
            signin({
                cellphone:'18912345678',
                password:'123456',
                org:'1'
            })
            .end(function(res) {
//                console.log(res.body);
                res.statusCode.should.equal(200);
                res.body.should.have.property('name');
                done();
            })
        })
        
        it('should succes sign in and return html', function(done) {
            signin({
                cellphone:'18912345678',
                password:'123456',
                org:'1'
            }, 'text/html')
            .end(function(res) {
                res.statusCode.should.equal(302);
                res.headers.should.have.property('location');
//                console.log(res.headers);
                var sid = session.getSID(res);
                var url = require('url').parse(res.headers['location']);
                session.getData(url.path,sid)
                .set('Accept', 'text/html')
                .end(function(res2) {
                    res2.statusCode.should.equal(200);
                    res2.should.be.html;
                    res2.body.should.include('退出');
//                    console.log(res);
                    done();
                })
            })
        })
    })
})