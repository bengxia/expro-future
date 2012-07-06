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
/**
 * 显示商户列表
 * @param req
 * @param res
 * @param next
 */
exports.index = function(req,res,next){
    if(req.accepts('html')) {    	
      res.render('merchants/merchants', {});
    }else{
        Merchant.count(function(err,ds){        	
            if(err) return next(err);

            var page = req.query.page; // 取得当前页数,注意这是jqgrid自身的参数
            var limit = req.query.rows; // 取得每页显示行数，,注意这是jqgrid自身的参数
            var sidx = req.query.sidx; //取得排序字段
            var sord  = req.query.sord;//排序方式asc、desc
            //var total = '1';//总页数
            //var records = '1';//总记录数
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


            Merchant.findAll({sidx:sidx, sord:sord}, function(err,ds){           	
                if(err) return next(err);
                //-------------------------------------------
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
    }
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
    var create_time = new Date().toGMTString();
    var due_time = new Date().toGMTString();

    //Merchant.create(merchant);
    Merchant.create(req.body, function(err, info){
        if(err) return next(err);
        req.body.create_time = getNow();
        return info.insertId;
    });
    //res.render('merchants/merchants', {});
};
exports.showCreatPage = function(req,res,next){
    console.log("显示新增商户页面。。。");
    res.render('merchants/create', { layout: false });
};

var getNow=function(){
    var now = new Date();
    var year = now.getFullYear();
    return (year+'-'+(now.getMonth()+1)+'-'+now.getDate()+' '+
        now.getHours()+':'+now.getMinutes()+':'+now.getSeconds());
};
