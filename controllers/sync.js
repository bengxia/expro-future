var models = require('../models');
var EventProxy = require('eventproxy').EventProxy;
var Merchant = models.Merchant;
var Member = models.Member;
var GoodsType = models.GoodsType;
var Role = models.Role;
var Route_table = models.Route_table;
//var Merchant_goods = models.Merchant_goods;
var User = models.User;
var mysql = require('../libs/mysql.js');
           
exports.merchant = function(req, res) {
	var where = ' and 1=1';
	var count = 0;
	var count1 = 0;
	var count2 = 0;
	res.result = {};
	var goods = [];
	var users = [];
	var ep = EventProxy.create();
	
	function feedback(result) {	
		console.log(result);
        console.log(res.result);		
        if(200 == result.status) {                           
            res.json(res.result, result.status);            
        }
        else {
        	if(404 == result.status) {          
                res.send(result.status);
            }
            else {
            	
            }             
        }
                
    };

    ep.once('error', function(result) {
        ep.unbind();//remove all event
        return feedback(result);
    });
    
    ep.on('merchant', function(merchant) {
    	Role.findAll(function(err, roles){
            if(err) { ep.unbind();}
            if(!roles) {
            	res.result.merchant.role = [];
            	ep.trigger('routeFinish');
            }
            else {
                res.result.merchant.role = roles;
                var len = roles.length;
                ep.after('route', len, function(){        	        	
        	        ep.trigger('routeFinish');        	
                });
                for(var i = 0; i < len; i++) {
        	        findRoute(roles[i]._id);        	        	
                }
            }        
        }); 
        
        GoodsType.findAll(where,function(err, goodsTypes){
            if(err) { ep.unbind();}
            if(!goodsTypes) {
            	res.result.merchant.goods_type = [];
            }
            else {
                res.result.merchant.goods_type = goodsTypes;                               
            }
            ep.trigger('goodsTypes');
        });
        
        Route_table.findAll(function(err, route_tables) {
    	    if(err) { ep.unbind();}
            if(!route_tables) {
            	res.result.merchant.route_table = [];
            }
            else {
                res.result.merchant.route_table = route_tables;
            }
            ep.trigger('route_table');    	
        });
        
        findMembers(merchant._id);
        findMerchant_goods(merchant._id);        
    });  
    
    ep.on('members', function(members) {
    	var len = members.length;
    	for(var i = 0; i < len; i++ ) { 
            findUser(members[i].user_id); 
        }              
    });
  
    ep.assign('goodsFinish', 'routeFinish', 'userFinish', 'route_table', 'goodsTypes', 'member', function() {    	  
    	feedback({status:200});        
    });
        
    Merchant.findOneById({id:req.params.id},function(err, merchant){
        if(err) { ep.unbind(); return next(err);}        
        if(!merchant) return ep.trigger('error', {status:404});        
        res.result.merchant = merchant; 
        ep.trigger('merchant', merchant);
    });
                            
    function findMembers(merchant_id) {
        Member.findOnesByCondition({org_id:merchant_id},function(err,members){
          	if(err) { ep.unbind();}
            if(!members) {
            	res.result.merchant.member = [];
            	ep.trigger('member');
            	res.result.merchant.user = users;
            	ep.trigger('userFinish');
            }
            else {
                res.result.merchant.member = members;
                ep.trigger('member');
                var len = members.length;
                ep.after('user', len, function(){
                	res.result.merchant.user = users;                	
        	        ep.trigger('userFinish');        	
                });
                for(var i = 0; i < len; i++) {
        	        findUser(members[i].user_id);         	        	
                }
            }                   
        });
    }
    
    function findUser(user_id) {
        User.findOneById({_id:user_id},function(err,user){
          	if(err) { ep.unbind();}
            if(!user) {}
            else {
                users[count] = user;
                count++;
            }
            ep.trigger('user');           
        });
    }
    
    function findRoute(role_id) {
        findRoutesById({role_id:role_id},function(err,route){
          	if(err) { ep.unbind();}
            if(!route) {}
            else {            
                res.result.merchant.role[count1].route_table = route;
    	        count1++;
    	    }                                   
            ep.trigger('route');           
        });
    }
    
    function findGood(goods_id) {
        findGoodById({_id:goods_id},function(err,good){
          	if(err) { ep.unbind();}
            if(!good) {}
            else {
                goods[count2] = good;
                count2++;
            }            
            ep.trigger('good');           
        });
    }
    
    
    function findMerchant_goods(merchant_id) {
        findOnesById({merchant_id:merchant_id},function(err,merchant_goods){
          	if(err) { ep.unbind();}
            if(!merchant_goods) {
            	res.result.merchant.goods = [];
            	ep.trigger('goodsFinish');
            }
            else {
                var len = merchant_goods.length;
                ep.after('good', len, function(){
                	res.result.merchant.goods = goods;                	
        	        ep.trigger('goodsFinish');        	
                });
                for(var i = 0; i < len; i++) {
        	        findGood(merchant_goods[i].goods_id);         	        	
                }
            }            
        });
    }
/*    
    function match(element, index, array) {
    	return (element.type_id == this._id)    	
    } 
*/       	  
}

function findRoutesById(opt, cb) {
	var sql = 'SELECT route_table_id _id FROM ef_role_privilage WHERE role_id ='+opt.role_id;
	mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        cb(err, rs);
    });	
}

function findOnesById(opt, cb) {
	var sql = 'SELECT goods_id FROM ef_merchant_goods WHERE merchant_id ='+opt.merchant_id;
	mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        cb(err, rs);
    });	
}

function findGoodById(opt, cb) {
	var sql = 'SELECT * FROM ef_goods WHERE _id ='+opt._id;
	mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        cb(err, rs[0]);
    });	
}