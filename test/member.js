//mocha test/deal.js 
var session = require('./session.lib.js');

function signin(data, ct) {
    return session.postData('/signin', data, '', ct);
}

function addMember(data, sid, ct) {
	return session.postData('/member', data, sid, ct);
}

function deleteMember(id, sid, ct) {
	return session.deleteData('/member/'+id, '', sid, ct);
}

function updateMember(id, data, sid, ct) {
    return session.putData('/member/'+id, data, sid, ct);
}

function getMemberList(sid, done) {
    session.getData('/member/index', sid)
        .end(function(res) {
            res.statusCode.should.equal(200);
            res.should.be.json;

            console.log(JSON.stringify(res.body));
            done();
        });
}



var memberId;

var newMemberJson = {
    pet_name:"测试会员02",
    cellphone:13880970128,
    role_id:1,
    state:1,
    sex:0,
    birthday:"1977-11-11",
    due_time:"2024-12-30",
    //user_id:1,
    privacy:0,
    point:200,
    savings:100,
    comment:"备注一下"
};

var updateMemberJson = {
    pet_name:"测试会员01-modify",
    role_id:1,
    state:0,
    sex:0,
    birthday:"1979-12-01",
    due_time:"2012-12-30",
    privacy:1,
    point:100,
    savings:200,
    comment:"备注一下2"
};



describe('获取全部会员列表', function() {
    describe('#测试返回会员列表数据', function() {
        it('should succes return deals json', function(done) {
            signin({
                cellphone:'18912345678',
                password:'123456',
                org:'1'
            })
                .end(function(res) {
                    res.statusCode.should.equal(200);
                    res.body.should.have.property('_id');
                    var sid = session.getSID(res);
                    getMemberList(sid, done);
                })
        })
    })
});

describe('创建新会员并与商户关联。', function() {
    describe('POST /signin', function() {
        it('开始测试：创建会员，关联商户.', function(done) {
            signin({
                cellphone:'18912345678',
                password:'123456',
                org:'1'
            })
            .end(function(res) {
                res.statusCode.should.equal(200);
                res.body.should.have.property('name');
                var sid = session.getSID(res);
                addMember(newMemberJson, sid)
                .end(function(res2) {
                    res2.statusCode.should.equal(201);
                    res2.should.be.json;
                    console.log(JSON.stringify(res2.body));
                    memberId = res2.body.member._id;
                    done();
                })
            })
        })
    })
});

describe('更新会员信息。', function() {
    describe('POST /signin', function() {
        it('开始测试：更新会员信息。', function(done) {
            signin({
                cellphone:'18912345678',
                password:'123456',
                org:'1'
            })
            .end(function(res) {
                res.statusCode.should.equal(200);
                res.body.should.have.property('name');
                var sid = session.getSID(res);

                updateMember(memberId, updateMemberJson, sid)
                .end(function(res2) {
                    res2.statusCode.should.equal(200);
                    res2.should.be.json;
                    console.log(JSON.stringify(res2.body));
                    done();
                })
            })
        })
    })
});

describe('取消会员与商户的关联。', function() {
    describe('POST /signin', function() {
        it('开始测试：取消会员与商户的关联。', function(done) {
            signin({
                cellphone:'18912345678',
                password:'123456',
                org:'1'
            })
            .end(function(res) {
                res.statusCode.should.equal(200);
                res.body.should.have.property('name');
                var sid = session.getSID(res);
                deleteMember(memberId, sid)
                .end(function(res2) {
                    res2.statusCode.should.equal(202);
                    res2.should.be.json;
                    console.log(JSON.stringify(res2.body));
                    done();
                })
            })
        })
    })
});




/*
describe('deleteTestMember', function() {
    describe('POST /signin', function() {
        it('should succes sign in and return json', function(done) {
            signin({
                cellphone:'18912345678',
                password:'123456',
                org:'1'
            })
            .end(function(res) {                
                res.statusCode.should.equal(200);
                res.body.should.have.property('_id');
                var sid = session.getSID(res); 
                //postJson.dealer_id = res.body._id;
                addMember(postJson, sid)
                .end(function(res) {
                	res.statusCode.should.equal(201);
                	res.should.be.json;
                	console.log(JSON.stringify(res.body));
                	//res.body.should.have.property('cbdeal');
                	//res.body.cbdeal.should.have.property('cbdeal_item');
                    deleteMember(testMemberIds, sid)
                	.end(function(res) {
                		res.statusCode.should.equal(202);
                		done();                		
                	})                		                	
                })                 
            })
        })
    })
})

describe('updateDeal', function() {
    describe('POST /signin', function() {
        it('should succes sign in and return json', function(done) {
            signin({
                cellphone:'18912345678',
                password:'123456',
                org:'1'
            })
            .end(function(res) {                
                res.statusCode.should.equal(200);
                res.body.should.have.property('_id');
                var sid = session.getSID(res); 
                postJson.dealer_id = res.body._id;                                               
                addDeal(postJson, sid)
                .end(function(res) {
                	res.statusCode.should.equal(201);
                	res.should.be.json;
                	console.log(JSON.stringify(res.body));
                	res.body.should.have.property('cbdeal');
                	res.body.cbdeal.should.have.property('cbdeal_item');
                	var json = {           						
							lid: 123,							
							dealer_id: res.body._id,
							type: 1,
							state: 1,
							store_id: 32,
							payment: 44,
							cash: 98.12,
							point: 150,
							pay_type: 3,
							create_time: "2012-05-23T08:49:04.000Z",
							customer_id: 23,
							deal_item:[{							
								lid : 234,
								_id: res.body.cbdeal.cbdeal_item[0]._id,
								goods_id : 454,
								num : 2,
								closing_cost : 111,
								total_cost : 123.32
								}
							]
                	}
                	updateDeal(res.body.cbdeal._id, json, sid) 
                	.end(function(res) {
                		res.statusCode.should.equal(201);
                		res.should.be.json;
                	    console.log(JSON.stringify(res.body));
                	    res.body.should.have.property('deal');
                	    res.body.deal.should.have.property('deal_item');
                		done();                		
                	})                		                	
                })                 
            })
        })
    })
})*/

