/*var tag_ctrl = require('./tag');
var user_ctrl = require('./user');
var topic_ctrl = require('./topic');
var config = require('../config').config;
var EventProxy = require('eventproxy').EventProxy;

var sanitize = require('validator').sanitize;
*/
var models = require('../models'),
    Store = models.Store,
    Merchant = models.Merchant,
    Warehouse = models.Warehouse;

var check = require('validator').check,
    sanitize = require('validator').sanitize;

var getNow=function(){
    var now = new Date();
    var year = now.getFullYear();
    return (year+'-'+(now.getMonth()+1)+'-'+now.getDate()+' '+
        now.getHours()+':'+now.getMinutes()+':'+now.getSeconds());
};

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
        var where = ' ';
        var _id = req.query._id;
        var name = req.query.name;
//        console.log('_id:      '+_id);
//        console.log('name:      '+name);

        if(_id != undefined){
            where += ' and store._id like \'%'+_id+'%\' ';
        }
        if(name != undefined){
            where += ' and store.name like \'%'+name+'%\' ';
        }
        console.log('------:'+where);

        Store.count(where, function(err,ds){
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


            Store.findAll(where, start, limit, sidx, sord, function(err,ds){
                if(err) return next(err);
                //-------------------------------------------
                if (ds == undefined){
                    return res.json({status:'查询结果为空！'});
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
    var name = sanitize(req.body.name).trim();
    var merchant_id = sanitize(req.body.merchant_id).trim();
    var state = sanitize(req.body.state).trim();
    var inventar_num = sanitize(req.body.inventar_num).trim();
    var district_code = sanitize(req.body.district_code).trim();

    if(!inventar_num) return res.json({status:'资产编号不能为空！'});
    if(!name) return res.json({status:'名字不能为空！'});
    if(!merchant_id) return res.json({status:'请选择所属商户！'});
    if(!state) return res.json({status:'请选择状态！'});
    if(!district_code) return res.json({status:'地区编号不能为空！'});

    //创建门店仓库
    Warehouse.create(name, function(err, info){
        if(err) return next(err);
        //获得门店仓库的ID，并与门店关联
        req.body.warehouse_id = info.insertId;
        req.body.create_time = getNow();

        Store.create(req.body, function(err, info){
            if(err) return next(err);
            //return info.insertId;
            res.json({status:'success'});
        });
    });
};

exports.showCreatPage = function(req,res,next){
    console.log("显示新增商户页面。。。");
    Merchant.findAll(null, null, function(err,ds){
        if(err) return next(err);
        res.render('stores/create', { layout: false, merchants:ds});
    });
};

exports.showEditPage = function(req,res,next){
    console.log("显示修改商户页面。。。");
    var _id = req.query._id;
    console.log('id:'+_id);
    Store.findOne({'_id':_id},function(err,store){
        if(err) return next(err);
        Merchant.findAll(null, null, function(err,rs){
          if(err) return next(err);
          res.render('stores/create', { layout: false, merchants:rs, store:store});
        });
    });
};

exports.delete = function(req, res, next) {
    console.log("删除选中的商户门店数据******");
    //开始校验输入数值的正确性
    var _ids = req.query._ids;
    console.log('ids:'+_ids);
    Store.delete(_ids, function(err,ds){
        if(err) return next(err);
        //return res.write(_ids);
        return res.json({'_ids':_ids});
    });
};