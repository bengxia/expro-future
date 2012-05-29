/*var tag_ctrl = require('./tag');
var user_ctrl = require('./user');
var topic_ctrl = require('./topic');
var config = require('../config').config;
var EventProxy = require('eventproxy').EventProxy;

var sanitize = require('validator').sanitize;
*/
var models = require('../models'),
    Store = models.Store;
var check = require('validator').check,
    sanitize = require('validator').sanitize;
/**
 * 显示商户门店的列表
 * @param req
 * @param res
 * @param next
 */
exports.index = function(req,res,next){
    if(req.accepts('html')) {
      res.render('stores/stores', {});
    }else{
        Store.count(function(err,ds){
            if(err) return next(err);

            var page = req.query.page; // 取得当前页数,注意这是jqgrid自身的参数
            var limit = req.query.rows; // 取得每页显示行数，,注意这是jqgrid自身的参数
            var sidx = req.query.sidx; //取得排序字段
            var sord  = req.query.sord;//排序方式asc、desc
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


            Store.findAll(sidx, sord, function(err,ds){
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
                    rows.cell = [ds[i]._id, ds[i].name, ds[i].merchant_name, ds[i].warehouse_name, ds[i].state, ds[i].create_time];
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

exports.create = function(req, res, next) {
    console.log("保存并新增商户门店数据******");
    //开始校验输入数值的正确性
    //'门店名称', '所属商户','仓库名称','状态','创建时间'
    var name = sanitize(req.body.name).trim();
    var merchant_id = sanitize(req.body.merchant_id).trim();
    var warehouse_id = sanitize(req.body.warehouse_id).trim();
    var state = sanitize(req.body.state).trim();
    req.body.create_time = new Date().toLocaleDateString();

    Store.create(req.body, function(err, info){
        if(err) return next(err);
        return info.insertId;
    });
};

exports.showCreatPage = function(req,res,next){
    console.log("显示新增商户页面。。。");
    res.render('stores/create', { layout: false });
};
