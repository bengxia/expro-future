//mocha test/deal.js 
var session = require('./session.lib.js');

function signin(data, ct) {
    return session.postData('/signin', data, '', ct);
};

function addData(data, sid, ct) {
    return session.postData('/goods', data, sid, ct);
};

function deleteData(id, sid, ct) {
    return session.deleteData('/goods/'+id, '', sid, ct);
};

function updateData(id, data, sid, ct) {
    return session.putData('/goods/'+id, data, sid, ct);
};

function getList(sid, done) {
    session.getData('/goods', sid)
        .end(function(res) {
            res.statusCode.should.equal(200);
            res.should.be.json;

            console.log(JSON.stringify(res.body));
            done();
        });
};

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

describe('商户商品测试模块。', function() {
    describe('#获取全部商品列表', function() {
        it('返回当前商户的所有商品信息列表。', function(done) {
            signin({
                cellphone:'18912345678',
                password:'123456',
                org:'1'
            })
                .end(function(res) {
                    res.statusCode.should.equal(200);
                    res.body.should.have.property('name');
                    var sid = session.getSID(res);
                    getList(sid, done);
                })
        })
    });
    describe('#创建商品并关联商户', function() {
        it('返回创建商品后的Json数据', function(done) {
            signin({
                cellphone:'18912345678',
                password:'123456',
                org:'1'
            })
            .end(function(res) {
                res.statusCode.should.equal(200);
                res.body.should.have.property('name');
                var sid = session.getSID(res);
                addData(newJson, sid)
                    .end(function(res2) {
                        res2.statusCode.should.equal(201);
                        res2.should.be.json;
                        console.log(JSON.stringify(res2.body));
                        dataId = res2.body.goods._id;
                        done();
                    })
            })
        })
    });
    describe('#取消商品与商户的关联，删除数据', function() {
        it('返回取消商品的ID。', function(done) {
            signin({
                cellphone:'18912345678',
                password:'123456',
                org:'1'
            })
                .end(function(res) {
                    res.statusCode.should.equal(200);
                    res.body.should.have.property('name');
                    var sid = session.getSID(res);
                    deleteData(dataId, sid)
                        .end(function(res2) {
                            res2.statusCode.should.equal(202);
                            res2.should.be.json;
                            console.log(JSON.stringify(res2.body));
                            done();
                        })
                })
        })
    });
});
/*
function getGoodsList(sid, done) {
    session.getData('/goods', sid)
        .end(function(res) {
            res.statusCode.should.equal(200);
            res.should.be.json;

            console.log(JSON.stringify(res.body));
            done();
        });
};

function findOne(id, sid, done) {
    return session.getData('/goods/'+id, sid).end(function(res) {
        res.statusCode.should.equal(200);
        res.should.be.json;
        res.body.should.have.property('goods');

        console.log(JSON.stringify(res.body));
        done();
    });
}

describe('#查询当前商户所有的商品', function() {
    describe('#Show Goods List', function() {
        it('should succes show goods dataList and return json', function(done) {
            signin({
                cellphone:'18912345678',
                password:'123456',
                org:'1'
            })
            .end(function(res) {
                res.statusCode.should.equal(200);
                res.body.should.have.property('name');
                var sid = session.getSID(res);
                    getGoodsList(sid, done);
            })
        })
    })
});

describe('#查询一个商品。', function() {
    describe('开始查询', function() {
        it('开始测试：查询一个商品.', function(done) {
            signin({
                cellphone:'18912345678',
                password:'123456',
                org:'1'
            })
                .end(function(res) {
                    res.statusCode.should.equal(200);
                    res.body.should.have.property('name');
                    var sid = session.getSID(res);
                    findOne(1, sid, done);

                })
        })
    })
});
    */