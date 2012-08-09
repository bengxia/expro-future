var session = require('./session.lib.js');
var logEnable = true;
var sid;
var dataId;

var newJson = {
    short_name: "一气",
    full_name: "第一气化",
    state: 1,
    type: 1,
    logo_img_path: "",
    charter_num: "11112222",
    charter_img_path: "",
    create_time: "2012-05-23T08:49:04.000Z",
    due_time: "2012-06-23T08:49:04.000Z",
    address: "一名路1号",
    website: "www.yiqi.com",
    phone: "12345678912",
    fax: "02512345678",
    self_intro: "气化建设",
    member_intro: "月薪2000",
    district_code: "086-025-2211100",
    comment: "很好",
    merchant_level_id: 1
};

function log(obj){
    if(logEnable){
        console.log(JSON.stringify(obj));
    }
};

function signin(data, done, ct) {
    session.postData('/signin', data, '', ct)
        .end(function(res) {
            res.statusCode.should.equal(200);
            res.body.should.have.property('name');
            sid = session.getSID(res);
            done();
        });
};

function getList(sid, done) {
    session.getData('/merchants', sid)
        .end(function(res) {
            res.statusCode.should.equal(200);
            res.should.be.json;
            log(res.body);
            done();
        });
};



describe('----商户管理测试模块----', function() {
    it('验证用户登录，并获得sid。', function(done) {
        signin({
            cellphone:'18912345678',
            password:'123456',
            org:'1'
        }, done);
    });
    it('返回当前平台的所有商户信息列表。', function(done) {
        getList(sid, done);
    });
});