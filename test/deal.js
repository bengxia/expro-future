var session = require('./session.lib.js');

function signin(data, ct) {
    return session.postData('/signin', data, '', ct);
}

function addDeal(data, sid, ct) {
	return session.postData('/deals', data, sid, ct);	
}

function deleteDeal(id, sid, ct) {
	return session.deleteData('/deals/'+id, '', sid, ct);	
}

function updateDeal(id, data, sid, ct) {
	return session.putData('/deals/'+id, data, sid, ct);	
}

describe('addDeal', function() {
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
                var postJson = {                                	
					deal: { 
						lid: 123,
						dealer_id: res.body._id,
						type: 1,
						state: 1,
						store_id: 32,
						payment: 23.12,
						cash: 98.12,
						point: 150,
						pay_type: 3,
						create_time: "2012-05-23T08:49:04.000Z",
						customer_id: 23,
						deal_item:[
						    { 
						    	lid : 234,
							    goods_id : 454,
							    num : 2,
							    closing_cost : 98.12,
							    total_cost : 123.32
						    }
						]
					}	
                }
                addDeal(postJson, sid)
                .end(function(res) {
                	res.statusCode.should.equal(201);
                	res.should.be.json;
                	console.log(res.body);
                	res.body.should.have.property('deal');
                	res.body.deal.should.have.property('deal_item');
                	done();
                })                 
            })
        })
    })
})

describe('deleteDeal', function() {
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
                var postJson = {                                	
					deal: { 
						lid: 123,
						dealer_id: res.body._id,
						type: 1,
						state: 1,
						store_id: 32,
						payment: 23.12,
						cash: 98.12,
						point: 150,
						pay_type: 3,
						create_time: "2012-05-23T08:49:04.000Z",
						customer_id: 23,
						deal_item:[
						    { 
						    	lid : 234,
							    goods_id : 454,
							    num : 2,
							    closing_cost : 98.12,
							    total_cost : 123.32
						    }
						]
					}	
                }
                addDeal(postJson, sid)
                .end(function(res) {
                	res.statusCode.should.equal(201);
                	res.should.be.json;
                	console.log(JSON.stringify(res.body));
                	res.body.should.have.property('deal');
                	res.body.deal.should.have.property('deal_item');
                	deleteDeal(res.body.deal._id, sid) 
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
                var postJson = {                                	
					deal: { 
						lid: 123,
						dealer_id: res.body._id,
						type: 1,
						state: 1,
						store_id: 32,
						payment: 23.12,
						cash: 98.12,
						point: 150,
						pay_type: 3,
						create_time: "2012-05-23T08:49:04.000Z",
						customer_id: 23,
						deal_item:[
						    { 
						    	lid : 234,
							    goods_id : 454,
							    num : 2,
							    closing_cost : 98.12,
							    total_cost : 123.32
						    }
						]
					}	
                }
                addDeal(postJson, sid)
                .end(function(res) {
                	res.statusCode.should.equal(201);
                	res.should.be.json;
                	console.log(JSON.stringify(res.body));
                	res.body.should.have.property('deal');
                	res.body.deal.should.have.property('deal_item');
                	var json = {
                		deal: { 						
							lid: 123,
							_id: res.body.deal._id,
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
								_id: res.body.deal.deal_item[0]._id,
								goods_id : 454,
								num : 2,
								closing_cost : 111,
								total_cost : 123.32
								}
							]
						}	
                	}
                	updateDeal(res.body.deal._id, json, sid) 
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
})

function getDealList(sid, done) {
    session.getData('/deals', sid)
        .end(function(res) {
            res.statusCode.should.equal(200);
            res.should.be.json;

            console.log(JSON.stringify(res.body));
            done();
        });
}

describe('#Sign', function() {
    describe('#sign in : POST /signin', function() {
        it('should succes sign in and return json', function(done) {
            signin({
                cellphone:'18912345678',
                password:'123456',
                org:'1'
            })
            .end(function(res) {
                res.statusCode.should.equal(200);
                res.body.should.have.property('name');
                var sid = session.getSID(res);
                getDealList(sid, done);
            })
        })
    })
})
