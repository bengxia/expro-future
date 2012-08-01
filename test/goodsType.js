//mocha test/deal.js 
var session = require('./session.lib.js');
var logEnable = true;
var sid;
var dataId;
var newJson = {
    parent_id:1,
    isleaf:1,
    level:1,
    name:"测试新增-手机套-测试后删除",
    comment:"用于测试"
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

function addData(data, sid, done, ct) {
    session.postData('/goods/type', data, sid, ct)
        .end(function(res2) {
        res2.statusCode.should.equal(201);
        res2.should.be.json;
        log(res2.body);
        dataId = res2.body.goodstype._id;
        done();
    })
};

function findOneData(id, sid, done, ct) {
    session.getData('/goods/type/'+id, sid)
        .end(function(res2) {
            res2.statusCode.should.equal(200);
            res2.should.be.json;
            log(res2.body);
            done();
        })
};

function deleteData(id, sid, done, ct) {
    session.deleteData('/goods/type/'+id, '', sid, ct)
        .end(function(res2) {
            res2.statusCode.should.equal(202);
            res2.should.be.json;
            log(res2.body);
            done();
        });
};

function updateData(data, sid, done, ct) {
    session.putData('/goods/type', data, sid, ct)
        .end(function(res2) {
            res2.statusCode.should.equal(200);
            res2.should.be.json;
            log(res2.body);
            done();
        })
};

function getList(sid, done) {
    session.getData('/goods/type', sid)
        .end(function(res) {
            res.statusCode.should.equal(200);
            res.should.be.json;
            log(res.body);
            done();
        });
};


describe('----商品类型测试模块----', function() {
    it('验证用户登录，并获得sid。', function(done) {
        signin({
            cellphone:'18912345678',
            password:'123456',
            org:'1'
        }, done);
    });
    it('返回当前所有商品类型信息列表。', function(done) {
        getList(sid, done);
    });
    it('创建商品类型', function(done) {
        addData(newJson, sid, done);
    });
    it('查询新增的商品类型', function(done) {
        findOneData(dataId, sid, done);
    });
    it('更新商品类型', function(done) {
        newJson._id = dataId;
        newJson.name = "测试更新-商品-将被删除";
        updateData(newJson, sid, done);
    });
    it('查询更新的商品类型', function(done) {
        findOneData(dataId, sid, done);
    });
    it('取消商品类型，删除数据。', function(done) {
        deleteData(dataId, sid, done);
    })
});