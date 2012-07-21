var session = require('./session.lib.js');

function signin(data, ct) {
    return session.postData('/signin', data, '', ct);
}

function getMerchant(sid) {
	return session.getData('/merchants/1', sid, '');	
}

function getMerchants(sid) {
	return session.getData('/merchants', sid, '');	
}

function addMerchant(data, sid, ct) {
	return session.postData('/merchants', data, sid, ct);	
}

function deleteMerchant(id, sid, ct) {
	return session.deleteData('/merchants/'+id, '', sid, ct);	
}

var postJson = {
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
}

describe('get merchant', function() {
    describe('POST /signin', function() {
        it('should succes sign in and return json', function(done) {
            signin({
                cellphone:'18912345678',
                password:'123456',
                org:'1'
            })
            .end(function(res) {                
                res.statusCode.should.equal(200);                
                var sid = session.getSID(res);                                               
                getMerchant(sid)
                .end(function(res) {
                	res.statusCode.should.equal(200);
                	res.should.be.json;
                	console.log(JSON.stringify(res.body));
                	res.body.should.have.property('merchant');                	
                	done();
                })                 
            })
        })
    })
})

describe('get merchants', function() {
    describe('POST /signin', function() {
        it('should succes sign in and return json', function(done) {
            signin({
                cellphone:'18912345678',
                password:'123456',
                org:'1'
            })
            .end(function(res) {                
                res.statusCode.should.equal(200);                
                var sid = session.getSID(res);                                               
                getMerchants(sid)
                .end(function(res) {
                	res.statusCode.should.equal(200);
                	res.should.be.json;
                	console.log(JSON.stringify(res.body));
                	res.body.should.have.property('merchant');                	
                	done();
                })                 
            })
        })
    })
})

describe('add and deleteMerchant', function() {
    describe('POST /signin', function() {
        it('should succes sign in and return json', function(done) {
            signin({
                cellphone:'18912345678',
                password:'123456',
                org:'1'
            })
            .end(function(res) {                
                res.statusCode.should.equal(200);                
                var sid = session.getSID(res);                                                               
                addMerchant(postJson, sid)
                .end(function(res) {
                	res.statusCode.should.equal(201);
                	res.should.be.json;
                	console.log(JSON.stringify(res.body));
                	res.body.should.have.property('merchant');
                	res.body.merchant.should.have.property('_id');
                	deleteMerchant(res.body.merchant._id, sid) 
                	.end(function(res) {
                		res.statusCode.should.equal(202);
                		done();                		
                	})                		                	
                })                 
            })
        })
    })
})