//mocha test/deal.jsvar session = require('./session.lib.js');function signin(data, ct) {    return session.postData('/signin', data, '', ct);}function getWarehouseList(sid, done) {    session.getData('/warehouse', sid)        .end(function(res) {            res.statusCode.should.equal(200);            res.should.be.json;            console.log(JSON.stringify(res.body));            done();        });}describe('#Sign', function() {    describe('#sign in : POST /signin', function() {        it('should succes sign in and return json', function(done) {            signin({                cellphone:'18912345678',                password:'123456',                org:'1'            })                .end(function(res) {                    res.statusCode.should.equal(200);                    res.body.should.have.property('name');                    var sid = session.getSID(res);                    getWarehouseList(sid, done);                })        })    })})