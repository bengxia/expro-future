var session = require('./session.lib.js');

describe('##Sync store', function() {
    it('#Should success', function(done) {
        session.getData('/sync/stores/111', '')
        .end(function(res) {
            res.statusCode.should.equal(200);
            console.log(JSON.stringify(res.body));
            done();
        })
    })
})