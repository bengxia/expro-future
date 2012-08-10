var session = require('./session.lib.js');
var logEnable = true;
var sid;
var dataId;

var newJson = {
    short_name: "一汽大众汽车-测试可删",
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
            log(res.body);
            res.statusCode.should.equal(200);
            res.should.be.json;
            done();
        });
};

function addData(data, sid, done, ct) {
    session.postData('/merchant', data, sid, ct)
        .end(function(res) {
            log(res.body);
            res.statusCode.should.equal(201);
            res.should.be.json;
            res.body.should.have.property('_id');
            dataId = res.body._id;
            done();
        })
};

function findOneData(id, sid, done, ct) {
    session.getData('/merchant/'+id, sid)
        .end(function(res) {
            log(res.body);
            res.statusCode.should.equal(200);
            res.should.be.json;
            done();
        })
};

function updateData(data, sid, done, ct) {
    session.putData('/merchant', data, sid, ct)
        .end(function(res) {
            log(res.body);
            res.statusCode.should.equal(200);
            res.should.be.json;
            done();
        })
};

function deleteData(id, sid, done, ct) {
    session.deleteData('/merchant/'+id, '', sid, ct)
        .end(function(res) {
            log(res.body);
            res.statusCode.should.equal(202);
            res.should.be.json;
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
    it('创建商户', function(done) {
        addData(newJson, sid, done);
    });
    it('查询创建的商户', function(done) {
        findOneData(dataId, sid, done);
    });
    it('更新商户', function(done) {
        newJson._id = dataId;
        newJson.short_name = "一汽大众汽车-update测试可删";
        newJson.due_time = "2018-06-23";
        newJson.address = "南京路2号";
        newJson.website = "http://www.google.com/";
        newJson.phone = "4008-171-999";
        updateData(newJson, sid, done);
    });
    it('查询更新的商户', function(done) {
        findOneData(dataId, sid, done);
    });
    it('删除商户。', function(done) {
        deleteData(dataId, sid, done);
    });
});