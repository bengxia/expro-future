var request = require('./support/http');
var member = require('./member.lib.js');

describe('record ', function(){
    var sid = '';
    describe('POST /records', function() {
        it('should sign in first', function(done) {
          member.auth({
              email:'gbo@extensivepro.com'
            , password:'123456'
          })
          .end(function(res) {
                res.statusCode.should.equal(200);
                res.body.should.have.property('username');
//                console.log(res.body);
                sid = member.getSID(res);
                var postJson = { 
                record: {
                examination:1
//                , examinee:2
                , examine_date:'2012-05-04'
                , object_score:6
                , subject_score:7
                , total_score:13
//                , question_records: this.question_records
                }
                };
                member.postData('/records', postJson, sid)
                .end(function(res) {
                    res.should.be.json;
                    console.log(res.body);
                    res.body.should.have.property('gid');
                    done();
                })
          })
        })
    })
})