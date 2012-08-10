var session = require('./session.lib.js');
var logEnable = true;
var sid;
var dataId;

var newJson = {
    short_name: "一汽大众",
    full_name: "一汽大众汽车有限公司",
    state: 1,
    type: 2,
    logo_img_path: "",
    charter_num: "050078888",
    charter_img_path: "",
    due_time: "2014-06-23",
    address: "南京路1号",
    website: "http://www.faw-vw.com/",
    phone: "4008-171-888",
    fax: "4008-171-889",
    self_intro: "一汽-大众汽车有限公司（简称一汽-大众）于1991年2月6日成立，是由中国第一汽车集团公司（60%）和德国大众汽车集团（40%）合资经营的大型乘用车生产企业",
    member_intro: "免费试乘试驾，享受优惠折扣，服务专员一对一服务",
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