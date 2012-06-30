var session = require('./session.lib.js');

describe('##Sync merchant', function() {
    it('#Should success', function(done) {
        session.getData('/sync/merchants/1', '')
        .end(function(res) {
            res.statusCode.should.equal(200);
            console.log(JSON.stringify(res.body));
            done();
        })
    })
})