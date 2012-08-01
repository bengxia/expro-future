//mocha test/deal.js 
var session = require('./session.lib.js');
var logEnable = true;
var sid;
var dataId;
var newJson = {
    name:"测试-商品-将被删除",
    type_id:1,
    state:1,
    code:"0001",
    price:11.22,
    create_time:"2012-12-30",
    comment:"备注一下"
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
    session.postData('/goods', data, sid, ct)
        .end(function(res2) {
        res2.statusCode.should.equal(201);
        res2.should.be.json;
        log(res2.body);
        dataId = res2.body.goods._id;
        done();
    })
};

function findOneData(id, sid, done, ct) {
    session.getData('/goods/'+id, sid)
        .end(function(res2) {
            res2.statusCode.should.equal(200);
            res2.should.be.json;
            log(res2.body);
            done();
        })
};

function deleteData(id, sid, done, ct) {
    session.deleteData('/goods/'+id, '', sid, ct)
        .end(function(res2) {
            res2.statusCode.should.equal(202);
            res2.should.be.json;
            log(res2.body);
            done();
        });
};

function updateData(data, sid, done, ct) {
    session.putData('/goods', data, sid, ct)
        .end(function(res2) {
            res2.statusCode.should.equal(200);
            res2.should.be.json;
            log(res2.body);
            done();
        })
};

function getList(sid, done) {
    session.getData('/goods', sid)
        .end(function(res) {
            res.statusCode.should.equal(200);
            res.should.be.json;
            log(res.body);
            done();
        });
};


describe('商户商品测试模块。', function() {
    describe('----商户商品测试模块----', function() {
        it('验证用户登录，并获得sid。', function(done) {
            signin({
                cellphone:'18912345678',
                password:'123456',
                org:'1'
            }, done);
        });
        it('返回当前商户的所有商品信息列表。', function(done) {
            getList(sid, done);
        });
        it('创建商品并关联商户', function(done) {
            addData(newJson, sid, done);
        });
        it('查询新增的商品', function(done) {
            findOneData(dataId, sid, done);
        });
        it('更新商品', function(done) {
            newJson._id = dataId;
            newJson.name = "测试更新-商品-将被删除";
            updateData(newJson, sid, done);
        });
        it('查询更新的商品', function(done) {
            findOneData(dataId, sid, done);
        });
        it('取消商品与商户的关联，删除数据。', function(done) {
            deleteData(dataId, sid, done);
        })
    });
});