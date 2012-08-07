//mocha test/deal.js 
var session = require('./session.lib.js');
var logEnable = true;
var sid;
var dataId;
var newJson = {
    type: 1,
    state: 1,
    store_id: 111,
    payment: 12000.00,
    cash: 12000.00,
    point: 0.00,
    pay_type: 0,
    customer_id: 23,
    deal_items: [{
        goods_id: 82,
        num: 2,
        closing_cost: 4000.00,
        total_cost: 8000.00
    },{
        goods_id: 86,
        num: 1,
        closing_cost: 3000.00,
        total_cost: 3000.00
    }]
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

function count(sid, done) {
    session.getData('/deal/count', sid)
        .end(function(res) {
            res.statusCode.should.equal(200);
            res.should.be.json;
            log(res.body);
            done();
        });
};

function addData(data, sid, done, ct) {
    session.postData('/deal', data, sid, ct)
        .end(function(res) {
            res.statusCode.should.equal(201);
            res.should.be.json;
            res.body.should.have.property('deal');
//            res.body.should.have.property('deal_item');
            log(res.body);
            dataId = res.body.deal._id;
            done();
        })
};

function findOneData(id, sid, done, ct) {
    session.getData('/deal/'+id, sid)
        .end(function(res2) {
            res2.statusCode.should.equal(200);
            res2.should.be.json;
            log(res2.body);
            done();
        })
};

function deleteData(id, sid, done, ct) {
    session.deleteData('/deal/'+id, '', sid, ct)
        .end(function(res2) {
            res2.statusCode.should.equal(202);
            res2.should.be.json;
            log(res2.body);
            done();
        });
};

function updateData(data, sid, done, ct) {
    session.putData('/deal', data, sid, ct)
        .end(function(res2) {
            res2.statusCode.should.equal(200);
            res2.should.be.json;
            log(res2.body);
            done();
        })
};

function getList(sid, done) {
    session.getData('/deals', sid)
        .end(function(res) {
            res.statusCode.should.equal(200);
            res.should.be.json;
            log(res.body);
            done();
        });
};

describe('----商户交易测试模块----', function() {
    it('验证用户登录，并获得sid。', function(done) {
        signin({
            cellphone:'18912345678',
            password:'123456',
            org:'1'
        }, done);
    });
    it('返回当前商户的所有交易条数。', function(done) {
        count(sid, done);
    });
    it('返回当前商户的所有交易信息列表。', function(done) {
        getList(sid, done);
    });
    it('创建交易', function(done) {
        addData(newJson, sid, done);
    });
    it('查询新增的交易', function(done) {
        findOneData(dataId, sid, done);
    });
    it('更新交易', function(done) {
        newJson._id = dataId;
        newJson.cash = 1000.00;
        newJson.point = 2000.00;
        newJson.pay_type = 3;
        updateData(newJson, sid, done);
    });
    it('查询更新的交易', function(done) {
        findOneData(dataId, sid, done);
    });
    it('删除交易记录。', function(done) {
        deleteData(dataId, sid, done);
    });
});