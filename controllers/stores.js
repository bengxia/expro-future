var models = require('../models'),
    Store = models.Store,
    Merchant = models.Merchant,
    Warehouse = models.Warehouse;

var check = require('validator').check,
    sanitize = require('validator').sanitize;

var Log = require('../log.js');
var log = Log.create(Log.INFO, {'file':'public/node.debug'});
var MQClient = require('../libs/mq_client.js');

var util = require('../libs/util.js');

var config = require('../config').config;
var EventProxy = require('eventproxy').EventProxy;

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
var queryInput = {'_id':'编号','name':'名称','merchant_name':'商户名称'};
//设置前台页面显示的表格列头
var colNames = ['门店编号', '门店名称', '所属商户','仓库名称','状态','创建时间'];
//设置前台页面显示的表格数据
var colModel = [
    {name:'_id',index:'_id', width:100, align:"center",sortable:true},
    {name:'name',index:'name', width:120, align:"center",sortable:true},
    {name:'merchant_name',index:'merchant_id', width:120,align:"center",sortable:true},
    {name:'warehouse_name',index:'warehouse_id', width:150, align:"center",sortable:true},
    {name:'state',index:'state', width:80, align:"center",sortable:true,formatter:'select', editoptions:{value:"0:封闭;1:正常;2:公开;3:不公开"}},
    {name:'create_time',index:'create_time', width:200, align:"center",sortable:true,
        formatter : 'date', formatoptions : {srcformat : 'Y-m-d H:i:s',newformat : 'Y-m-d H:i:s'}
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
 * 显示商户门店的列表
 * @param req
 * @param res
 * @param next
 */
exports.index = function(req,res,next){
    if(req.accepts('html')) {
        res.render('stores/index', {queryInput:queryInput, colModel:colModel, colNames:colNames});
    }else{
        var where = ' ';
        for(key in queryInput){
            var value = req.query[key];
            if(value != undefined){
                where += ' and goods.'+key+' like \'%'+value+'%\' ';
            }
        }
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
        /*
        var where = ' ';
        var _id = req.query._id;
        var name = req.query.name;

        if(_id != undefined){
            where += ' and store._id like \'%'+_id+'%\' ';
        }
        if(name != undefined){
            where += ' and store.name like \'%'+name+'%\' ';
        }

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

                //var jsonStr = JSON.stringify(jsonObj);
                //console.log('jsonStr:'+jsonStr);
                return res.json(jsonObj);
            });
        });*/
    }
};

/**
 * 显示新增门店（无_id）,或已有门店（有_id）页面
 * @param req
 * @param res
 * @param next
 * @return {*}
 */
exports.showStore = function(req, res, next) {
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


        Store.findOne({"_id":_id}, function(err,ds){
            if(err) return next(err);
            res.render('stores/store', { layout: false, store:ds, pageState:pageState, method:'put'});
        });
    }else{
        //新增
        pageState = 0;
        res.render('stores/store', { layout: false, pageState:pageState, method:'post'});
    }
};

/**
 * 保存
 * @param req
 * @param res
 * @param next
 * @return {*}
 */
exports.saveStore = function(req,res,next){
    console.log("saveStore。。。");
    //开始校验输入数值的正确性
    var name = req.body.name;
    //var type_id = req.body.type_id;
    //var state = req.body.state;
    //var price = req.body.price;

    if(!name) return res.send({status:400, error:'名字不能为空!'});
    //if(!type_id) return res.send({status:400, error:'请选择商品类型!'});
    //if(!state) return res.send({status:400, error:'状态不能为空!'});
    //if(!price) return res.send({status:400, error:'售价不能为空!'});

    //创建门店仓库
    Warehouse.create(name, function(err, info){
        if(err) return next(err);
        //获得门店仓库的ID，并与门店关联
        req.body.warehouse_id = info.insertId;
        req.body.create_time = getNow();

        Store.create(req.body, function(err, info){
            if(err) return next(err);
            res.send({status:201, error:'添加商品信息成功!'});
        });
    });
};

/**
 * 更新商品
 * @param req
 * @param res
 * @param next
 * @return {*}
 */
exports.updateStore = function(req,res,next){
    console.log("updateStore。。。");
    //开始校验输入数值的正确性
    var _id = req.body._id;
    var name = req.body.name;

    if(!_id) return res.json({status:400, error:'更新失败，数据流水号为空!'});
    if(!name) return res.json({status:400, error:'名字不能为空!'});

    if(_id){
        //说明是更新数据
        Store.update(req.body, function(err,info){
            if(err) return next(err);
            res.json({status:200, error:'更新门店信息成功!'});
        });
    }
};

/**
 * 批量删除商品
 * @param req
 * @param res
 * @param next
 */
exports.deleteStore = function(req,res,next){
    //开始校验输入数值的正确性
    console.log("开始进行删除。。。。");
    var _ids = req.params._ids;
    //console.log('_ids:'+_ids);
    //console.log('parent._ids:'+parent._ids);
    Store.delete(_ids, function(err,ds){
        if(err) return next(err);
        return res.json({"status":200, "error":'删除门店信息成功!', "_ids":_ids});
    });
};


/////////////////////////////////
/**
 * 创建一个新的商户门店
 * @param req
 * @param res
 * @param next
 * @return {*}
 */
exports.create = function(req, res, next) {
    //开始校验输入数值的正确性
    var _id = sanitize(req.body._id).trim();
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
    if(_id){
        //流水号不为空，说明是更新
        Store.update(req.body, function(err, rs){
            if(err) return next(err);
            res.json({status:'success'});
        });
    }else{
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
    }
};

/**
 * 显示新增页面
 * @param req
 * @param res
 * @param next
 */
exports.showCreatPage = function(req,res,next){
    Merchant.findAll(null, null, function(err,ds){
        if(err) return next(err);
        res.render('stores/create', { layout: false, merchants:ds});
    });
};

/**
 * 显示修改页面
 * @param req
 * @param res
 * @param next
 */
exports.showEditPage = function(req,res,next){
    var _id = req.query._id;
    Store.findOne({'_id':_id},function(err,store){
        if(err) return next(err);
        Merchant.findAll(null, null, function(err,rs){
          if(err) return next(err);
          res.render('stores/create', { layout: false, merchants:rs, store:store});
        });
    });
};

/**
 * 批量删除商户门店
 * @param req
 * @param res
 * @param next
 */
exports.delete = function(req, res, next) {
    //开始校验输入数值的正确性
    var _ids = req.query._ids;
    console.log('ids:'+_ids);
    Store.delete(_ids, function(err,ds){
        if(err) return next(err);
        //return res.write(_ids);
        return res.json({'_ids':_ids});
    });
};