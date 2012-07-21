/*var tag_ctrl = require('./tag');
var user_ctrl = require('./user');
var topic_ctrl = require('./topic');
var config = require('../config').config;
var EventProxy = require('eventproxy').EventProxy;

var sanitize = require('validator').sanitize;
*/
var models = require('../models'),
    Merchant = models.Merchant;

var check = require('validator').check,
    sanitize = require('validator').sanitize;    
    
var queryInput = {'_id': '编号', 'short_name': '简称'};
/**
 * 显示商户列表
 * @param req
 * @param res
 * @param next
 */
exports.index = function(req,res,next){
    if(req.accepts('html')) {    	
      res.render('merchants/merchants', {queryInput: queryInput});
    }else{
        Merchant.count(function(err,ds){        	
            if(err) return next(err);

            var page = req.query.page; // 取得当前页数,注意这是jqgrid自身的参数
            var limit = req.query.rows; // 取得每页显示行数，,注意这是jqgrid自身的参数
            var sidx = req.query.sidx; //取得排序字段
            var sord = req.query.sord;//排序方式asc、desc                      
            
            if(!sidx){
                sidx = 1;
            }
            // 计算查询结果总行数
            var count = ds[0].count;
            // 查询结果总页数
            var total_pages = 0;

            // 计算查询结果页数
            if(count > 0 && limit > 0){
                total_pages = Math.ceil(count/limit);
            }
            // 若请求页大于总页数，设置请求页为最后一页
            if (page > total_pages) page=total_pages;

            // 计算起始行
            var start = limit * page - limit;
            // 若起始行为0
            if(start < 0) start = 0;
                
            var where = ' ';
            for(key in queryInput) {
                var value = req.query[key];
                if(value != undefined) {
                    where += ' and '+key+' like \'%'+value+'%\' ';
                }
            }                            
            
            Merchant.findAll({where:where, start:start, limit:limit, sidx:sidx, sord:sord}, function(err,ds) {           	
                if(err) return next(err);
                //-------------------------------------------
                if (!ds || ds == undefined){
                    return res.json({status:'查询结果为空！'}, 204);
                }                                    	               
                
                var jsonObj = new Object();
                jsonObj.page = page;  // 当前页
                jsonObj.total = total_pages;    // 总页数
                jsonObj.records = count;  // 总记录数

                //定义rows 数组，保存所有rows数据
                var rowsArray = new Array();

                for(var i=0; i<ds.length; i++){
                    // 定义rows
                    var rows = new Object();
                    rows.id = ds[i]._id;                    
                    ds[i].create_time = formatDate(ds[i].create_time);
                    ds[i].due_time = formatDate(ds[i].due_time);
                    rows.cell = [ds[i]._id, ds[i].short_name, ds[i].state, ds[i].type, ds[i].phone, ds[i].create_time, ds[i].due_time];
                    rowsArray[i] = rows;
                }
                //将rows数组赋予jsonObj.rows
                jsonObj.rows = rowsArray;
                //-------------------------------------------

                var jsonStr = JSON.stringify(jsonObj);
                console.log('jsonStr:'+jsonStr);
                return res.json(jsonObj);
            });                             
        });
    };
};

/**
 * 获得商户列表List
 * @param req
 * @param res
 * @param next
 */
exports.getList = function(req,res,next){
    Merchant.findAll({}, function(err,ds){
        if(err) return next(err);
        if(!ds || ds.length)  return res.json({status:204, error:'查询结果为空！'});
        return res.json({status:200, merchants:ds});
    });
};

exports.create = function(req, res, next) {
    console.log("保存并新增商户数据******");
    //开始校验输入数值的正确性
    /*
    var short_name = sanitize(req.body.short_name).trim();
    var full_name = sanitize(req.body.full_name).trim();
    var state = sanitize(req.body.state).trim();
    var type = sanitize(req.body.type).trim();
    var logo_img_path = sanitize(req.body.logo_img_path).trim();
    var charter_num = sanitize(req.body.charter_num).trim();
    var charter_img_path = sanitize(req.body.charter_img_path).trim();
    var address = sanitize(req.body.address).trim();
    var website = sanitize(req.body.website).trim();
    var phone = sanitize(req.body.phone).trim();
    var fax = sanitize(req.body.fax).trim();
    var self_intro = sanitize(req.body.self_intro).trim();
    var member_intro = sanitize(req.body.member_intro).trim();
    var district_code = sanitize(req.body.district_code).trim();
    var merchant_level_id = sanitize(req.body.merchant_level_id).trim();
    var comment = sanitize(req.body.comment).trim();
    var create_time = getNow();
    var due_time = sanitize(req.body.due_time).trim();
    */
    //Merchant.create(merchant);
    var where = 'and short_name = '+req.body.short_name;
    
    Merchant.findAll({where: where}, function(err, rs) {
    	if(err) return next(err);
    	if(!rs) {
            Merchant.create(req.body, function(err, info){
                if(err) return next(err);
                //req.body.create_time = getNow(); 
                res.send({status:201, error:'添加商户信息成功!', merchant: {_id: info.insertId}}, 201);        
            });
        }
        else {
        	res.send({status: 404, error:'该商户简称已存在!'});
        }
    }); 
};

exports.deleteMerchant = function(req,res,next) {
	var _ids = req.params.id;
	Merchant.delete(_ids, function(err, rs) {
		if(err) return next(err);
		return res.json({"status":202, "error":'删除商户信息成功!', "_ids":_ids}, 202);
	});		
}

exports.editMerchant = function(req,res,next) {	
	var _id = req.body._id;
	if(!_id) return res.json({status:400, error:'更新失败，数据流水号为空!'});
	if(_id) {
	    Merchant.update(req.body, function(err) {
		    if(err) return next(err);
		    res.json({status:201, error:'更新商户信息成功!'});
	    });	
	}	
}

exports.showMerchant = function(req, res, next) {
	if(req.accepts('html')) {   
		var _id = req.params.id;
		var isEdit = req.params.isEdit?req.params.isEdit:"false";
		// 本页面有3个状态： 新增， 查看， 编辑
		// - 新增(pageState=0)： _id 为空，isReadonly=false, 所有输入框为空，显示：保存按钮
		// - 查看(pageState=1)： _id不为空，isReadonly=true， 输入框有数据，显示：关闭按钮
		// - 编辑(pageState=2)： _id不为空，isReadonly=false， 输入框有数据，显示：保存按钮 + 关闭按钮
		var pageState = 2;

		//如果_id不为空，则弹出编辑页面
		if(_id) {
			//编辑 和 查看
			if(!isEdit || isEdit != "true") {
				//查看状态
				pageState = 1;
			}

			Merchant.findOne({"_id": _id}, function(err, rs) {
				if(err) return next(err);				
				rs.create_time = formatDate(rs.create_time);
				rs.due_time = formatDate(rs.due_time);
				res.render('merchants/create', {layout: false, merchant: rs, pageState: pageState, method: 'put'});
			});
		} else {
			//新增
			pageState = 0;
			res.render('merchants/create', {layout: false, pageState: pageState, method: 'post'});
		}
    }
    else {
    	var _id = req.params.id;
    	if(_id) {
    		Merchant.findOne({"_id": _id}, function(err, rs) {
    		    if(err) return next(err); 
    		    res.json({merchant: rs}, 200); 
    		});  		     
    	}
    	else {
    		Merchant.findAll({}, function(err, rs) {
    			if(err) return next(err); 
    		    res.json({merchant: rs}, 200);
    		});    			   			
        }    			
    }
};

var getNow=function(){
    var now = new Date();
    var year = now.getFullYear();
    return (year+'-'+(now.getMonth()+1)+'-'+now.getDate()+' '+
        now.getHours()+':'+now.getMinutes()+':'+now.getSeconds());
};

var formatDate = function(date) {
	if(!date || date =='Invalid Date') {
		return '';
    }
	else {		
		var year = date.getFullYear();
		return (year + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds());              
    }	
}
