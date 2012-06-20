/**
 * Created with JetBrains WebStorm.
 * User: 孟维
 * Date: 12-5-31
 * Time: 下午4:35
 * To change this template use File | Settings | File Templates.
 */
var models = require('../models'),
    Goods = models.Goods,
    GoodsType = models.GoodsType;

var check = require('validator').check,
    sanitize = require('validator').sanitize;

var config = require('../config').config;
var EventProxy = require('eventproxy').EventProxy;

var Log = require('../log.js');
var log = Log.create(Log.INFO, {'file':'public/node.debug'});
var MQClient = require('../libs/mq_client.js');

//var util = require('../libs/util.js');

var getNow=function(){
    var now = new Date();
    var year = now.getFullYear();
    return (year+'-'+(now.getMonth()+1)+'-'+now.getDate()+' '+
        now.getHours()+':'+now.getMinutes()+':'+now.getSeconds());
};

/**
 * 开始设置前台表格控件说需要的相关对象及参数Start
 */
//设置查询区域的查询输入框，规则：{"查询字段名":"页面显示的label文字"}
var queryInput = {'_id':'编号','name':'名称','code':'资产编号', 'price':'售价'};
//设置前台页面显示的表格列头
var colNames = ['编号', '名称', '资产编号','商品类型','状态','售价','创建时间'];
//设置前台页面显示的表格数据
var colModel = [
    {name:'_id',index:'_id', width:100, align:"center",sortable:true},
    {name:'name',index:'name', width:200, align:"center",sortable:true},
    {name:'code',index:'code', width:200,align:"center",sortable:true},
    {name:'goods_type_name',index:'warehouse_id', width:200, align:"center",sortable:true},
    {name:'state',index:'state', width:150, align:"center",sortable:true,formatter:'select', editoptions:{value:"0:下架;1:上架"}},
    {name:'price',index:'price', width:200, align:"center",sortable:true},
    {name:'create_time',index:'create_time', width:300, align:"center",sortable:true,
        formatter : 'date', formatoptions : {srcformat : 'Y-m-d',newformat : 'Y-m-d'}
    }];

//设置前台页面所要显示的数据字段,用于数据筛选
var showElement = getShowElement();
//同上
function getShowElement(){
    var ar = new Array();
    for(var i=0; i<colModel.length; i++){
        ar[i] = colModel[i].name;
    }
    return ar;
}
////设置前台表格控件说需要的相关对象及参数End

/**
 * 显示商品列表
 * @param req
 * @param res
 * @param next
 */
exports.index = function(req,res,next){

    if(req.accepts('html')) {
        res.render('goods/index', {queryInput:queryInput, colModel:colModel, colNames:colNames});
    }else{
        var where = ' ';
        for(key in queryInput){
            var value = req.query[key];
            if(value != undefined){
                where += ' and goods.'+key+' like \'%'+value+'%\' ';
            }
        }

        Goods.count(where, function(err,ds){
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

            Goods.findAll(where, start, limit, sidx, sord, function(err,ds){
                if(err) return next(err);

                if (!ds || ds == undefined){
                    return res.json({error:'查询结果为空！'}, 204);
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
                    //rows.cell = [ds[i]._id, ds[i].name, ds[i].code, ds[i].goods_type_name, ds[i].state, ds[i].price, ds[i].create_time];
                    var ay = new Array();
                    for(key in ds[i]){
                        var index = showElement.indexOf(key);
                        if(index >= 0){
                            ay[index] = ds[i][key];

                        }
                    }
                    rows.cell = ay;
                    rowsArray[i] = rows;
                }
                //将rows数组赋予jsonObj.rows
                jsonObj.rows = rowsArray;

                var jsonStr = JSON.stringify(jsonObj);
                console.log('jsonStr:'+jsonStr);
                return res.json(jsonObj, 200);
            });
        });
    }
};

/**
 * 显示新增商品（无_id）,或已有商品（有_id）页面
 * @param req
 * @param res
 * @param next
 * @return {*}
 */
exports.showGoods = function(req, res, next) {
    console.log("开始显示 新建||编辑||查看 弹出框。。。");
    var _id = req.params._id;
    var isEdit = req.params.isEdit?req.params.isEdit:"false";
    // 本页面有3个状态： 新增， 查看， 编辑
    // - 新增(pageState=0)： _id 为空，isReadonly=false, 所有输入框为空，显示：保存按钮
    // - 查看(pageState=1)： _id不为空，isReadonly=true， 输入框有数据，显示：关闭按钮
    // - 编辑(pageState=2)： _id不为空，isReadonly=false， 输入框有数据，显示：保存按钮 + 关闭按钮
    var pageState = 2;

    //如果_id不为空，则弹出编辑页面
    if(_id){
        //编辑 和 查看
        if(!isEdit || isEdit != "true"){
            //查看状态
            pageState = 1;
        }

        Goods.findOne({"_id":_id}, function(err,ds){
            if(err) return next(err);
            res.render('goods/goods', { layout: false, goods:ds, pageState:pageState, method:'put'});
        });
    }else{
        //新增
        pageState = 0;
        res.render('goods/goods', { layout: false, pageState:pageState, method:'post'});
    }
};

/**
 * 保存商品
 * @param req
 * @param res
 * @param next
 * @return {*}
 */
exports.saveGoods = function(req,res,next){
    console.log("saveGoods。。。");
    //开始校验输入数值的正确性
    var name = req.body.name;
    var type_id = req.body.type_id;
    var state = req.body.state;
    var price = req.body.price;

    if(!name) return res.send({status:400, error:'名字不能为空!'});
    if(!type_id) return res.send({status:400, error:'请选择商品类型!'});
    if(!state) return res.send({status:400, error:'状态不能为空!'});
    if(!price) return res.send({status:400, error:'售价不能为空!'});


    //说明是新增
    //创建时间
    req.body.create_time = getNow();
    Goods.create(req.body, function(err, info){
        if(err) return next(err);
        res.send({status:201, error:'添加商品信息成功!'});
    });
};

/**
 * 更新商品
 * @param req
 * @param res
 * @param next
 * @return {*}
 */
exports.updateGoods = function(req,res,next){
    console.log("updateGoods。。。");
    //开始校验输入数值的正确性
    var _id = req.body._id;
    var name = req.body.name;

    if(!_id) return res.json({status:400, error:'更新失败，数据流水号为空!'});
    if(!name) return res.json({status:400, error:'名字不能为空!'});

    if(_id){
        //说明是更新数据
        Goods.update(req.body, function(err,info){
            if(err) return next(err);
            res.json({status:200, error:'更新商品信息成功!'});
        });
    }
};

/**
 * 批量删除商品
 * @param req
 * @param res
 * @param next
 */
exports.deleteGoods = function(req,res,next){
    //开始校验输入数值的正确性
    console.log("开始进行删除。。。。");
    var _ids = req.params._ids;
    //console.log('_ids:'+_ids);
    //console.log('parent._ids:'+parent._ids);
    Goods.delete(_ids, function(err,ds){
        if(err) return next(err);
        return res.json({"status":200, "error":'删除商品信息成功!', "_ids":_ids});
    });
};

/**
 * 显示商品类型页面
 * @param req
 * @param res
 * @param next
 */
exports.showTypes = function(req,res,next){
    console.log("开始显示类型。。。。");
    if(req.accepts('html')) {
        res.render('goods/type', { layout: false});
    }else{
        var pId = req.query.id?req.query.id:"0";
        var pName = req.query.n?(req.query.n+"."):"";
        var pLevel = req.query.lv?req.query.lv:"0";
        var pCheck = req.query.chk?req.query.chk:"";

        GoodsType.findAll("", function(err, rs){
            if(err) return next(err);
            var jsonStr = JSON.stringify(rs);
            console.log('jsonStr:'+jsonStr);
            return res.json(rs, 200);
            /*
            if(rs && rs.length>0){
                //如果有数据，则准备展示
                //var jsonStr = JSON.stringify(rs);
                //console.log('jsonStr:'+jsonStr);
                //return res.json({"status":"200", "error":'获取数据成功', "goodsTypes":rs});
                return res.json(rs, 200);
            }else{
                return res.json({"status":"204", "error":'获取数据失败'});
            }*/
        });
    }
};

/**
 *
 * @param req
 * @param res
 * @param next
 */
exports.showTypeDetail = function(req,res,next){
    console.log("开始显示类型详情。。。。");
    if(req.accepts('html')) {
        res.render('goods/type', { layout: false});
    }else{
        var _id = req.params._id;
        if(_id){
            GoodsType.findOne(_id, function(err, rs){
                if(err) return next(err);
                var jsonStr = JSON.stringify(rs);
                console.log('jsonStr:'+jsonStr);
                return res.json(rs, 200);
            });
        }
    }
};

/**
 * 创建新商品类型
 *   新类型为叶子节点，如果有父（非root），并且父为叶子，则设置父类型为枝节点。
 * @param req
 * @param res
 * @param next
 * @return {*}
 */
exports.creatType = function(req,res,next){
    //开始校验输入数值的正确性
    var _id = req.body._id;
    var parent_id = req.body.parent_id;
    var isleaf = req.body.isleaf;
    var level = req.body.level;
    var name = req.body.name;
    var comment = req.body.comment;

    if(!name) return res.json({status:400, error:'名字不能为空!'});

    //创建
    req.body.create_time = getNow();

    GoodsType.create(req.body, function(err, info){
        if(err) return next(err);
        if(parent_id && parent_id != ""){
            //新类型为叶子节点，如果有父（非root），并且父为叶子，则设置父类型为枝节点。
            GoodsType.findOne(parent_id, function(err, parent){
                if(err) return next(err);
                if(parent){
                    parent.isleaf = 0;
                    GoodsType.update(parent, function(err, rs){
                        if(err) return next(err);
                        res.json({status:201, error:'创建成功!'});
                    });
                }
            });
        }
    });
};

exports.updateType = function(req,res,next){
    //开始校验输入数值的正确性
    var _id = req.body._id;
    var parent_id = req.body.parent_id;
    var isleaf = req.body.isleaf;
    var level = req.body.level;
    var name = req.body.name;
    var comment = req.body.comment;

    if(!name) return res.json({status:400, error:'名字不能为空!'});

    if(_id && _id != ""){
        //流水号不为空，说明是更新
        GoodsType.update(req.body, function(err, rs){
            if(err) return next(err);
            res.json({status:200, error:'更新成功!'});
        });
    }else{
        res.json({status:400, error:'流水号为空，更新失败!'});
    }
};
exports.deleteType = function(req,res,next){
    //开始校验输入数值的正确性
    console.log("开始进行删除。。。。");
    var _id = req.params._id;
    console.log('_id:'+_id);
    var parent = new Object();
    //parent._id = _id;
    //parent._ids = _id;
    delChildren(_id);
    //console.log('parent._ids:'+parent._ids);
    GoodsType.delete(_id, function(err,ds){
        if(err) return next(err);
        return res.json({status:200, error:'删除成功!'});
    });
};

/**
 * 递归循环删除 以_id 为父节点的所有子节点
 * @param _id
 */
function delChildren(_id){
    if(_id)
    {
        var where = " and goods_type.parent_id="+_id;
        GoodsType.findAll(where, function(err, rs){
            if(err) return next(err);
            if(rs && rs.length){
                //如果有数据
                var _ids = "";
                for(var i = 0; i < rs.length; i++)
                {
                    _ids += (_ids.length > 0 ? ",":"")+rs[i]._id;
                    delChildren(rs[i]._id);
                }
                GoodsType.delete(_ids, function(err,ds){
                    if(err) return next(err);
                });
            }
        });
    }
};