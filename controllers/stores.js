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
var queryInput = {'_id':'编号','name':'名称'};

////设置前台表格控件说需要的相关对象及参数End

/**
 * 显示商户门店的列表
 * @param req
 * @param res
 * @param next
 */
exports.index = function(req,res,next){
    if(req.accepts('html')) {
        res.render('stores/index', {queryInput:queryInput});
    }else{
        console.log("获取所有门店信息。。。");
        //start=起始行数&limit=每页显示行数&bt=交易发生时间起点&et=交易发生时间的截至时间&sidx=排序字段名&sord=排序方式asc,desc
        var page = req.query.page; // 取得当前页数,注意这是jqgrid自身的参数
        var start = req.query.start;//起始行数
        var limit = req.query.limit;//每页显示行数
        var bt = req.query.bt;//交易发生时间起点
        var et = req.query.et;//交易发生截至时间
        var sidx = req.query.sidx;//排序字段名
        var sord = req.query.sord;//排序方式

        var ep = EventProxy.create();


        var where = ' ';
        for(key in queryInput){
            var value = req.query[key];
            if(value != undefined){
                where += ' and goods.'+key+' like \'%'+value+'%\' ';
            }
        }

        //回调函数
        function feedback(result) {
            if(200 == result.status) {
                if(result.jsonObj) {
                    var jsonStr = JSON.stringify(result.jsonObj);
                    console.log('jsonStr:'+jsonStr);
                    res.json(result.jsonObj, result.status);
                }else{
                    ep.trigger('error', {status:204, error:'查询结果为空!'});
                }
            }
            else {
                return res.json(result, result.status);
            }
        };

        //当有异常发生时触发
        ep.once('error', function(result) {
            ep.unbind();//remove all event
            return feedback(result);
        });
        ep.on('findByOrgId', function(org_id) {
            findByOrgId(org_id);
        });

        ep.on('findCount', function(where) {
            findCount(where);
        });

        //查询当前所有会员的信息
        ep.on('findAll', function(where) {
            findAll(where);
        });

        //查询当前所有会员的信息，在此方法内部会关联user，role，merchant表，并进行分页处理
        ep.on('findAllForWeb', function(where, count) {
            findAllForWeb(where, count);
        });
        //将传入的json对象发布到前台页面进行表格展示。
        ep.on('showList', function(jsonObj) {
            feedback({status:200, error:'获取数据成功', jsonObj:jsonObj});
        });

        //查询当前登陆用户所属商户
        //  首先获取当前登陆用户的org_id，查询当前用户的商户id
        if(req.session.user.member.org_id){
            ep.trigger('findByOrgId', req.session.user.member.org_id);
        }else{
            ep.trigger('error', {status:400, error:'获取当前用户所属商户失败。'});
        }

        function findByOrgId(org_id){
            where += " and merchant_id = "+org_id;
            //判断当前请求的是客户端还是web端
            var isWeb = req.query.isWeb;
            //开始检查传入参数
            try{
                check(isWeb).notNull().isInt();
                if(1 == isWeb){
                    ep.trigger('findCount', where);
                }else{
                    ep.trigger('findAll', where);
                }
            }catch(e){
                ep.trigger('findAll', where);
            }
        };

        function findCount(where) {
            //获得数据行数，用于分页计算
            Store.count({where:where}, function(err, count) {
                if(err) { ep.unbind(); return next(err);}
                if (!count && !count.count) return ep.trigger('error', {status:204, error:'查询结果为空!'});
                ep.trigger('findAllForWeb', where, count.count);
            });
        };

        function findAllForWeb(where, count) {
            //var showElement = ['_id', 'name', 'merchant_name', 'warehouse_name', 'state', 'create_time'];
            var showElement = ['_id', 'name', 'inventar_num', 'warehouse_id', 'warehouse_name', 'state', 'create_time'];

            if (!count && !count.count) return ep.trigger('error', {status:204, error:'查询结果为空!'});

            if(!sidx){
                sidx = 1;
            }

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

            Store.findAll({where:where, start:start, limit:limit, sidx:sidx, sord:sord, bt:bt, et:et}, function(err, rs) {
                if(err) { ep.unbind(); return next(err);}
                if (!rs || rs == undefined) return ep.trigger('error', {status:204, error:'查询结果为空！'});
                //开始汇总
                ep.after('storeDone', rs.length, function() {
                    //当memberDone被触发rs.length次后，执行以下语句。
                    var jsonObj = new Object();

                    jsonObj.page = page;  // 当前页
                    jsonObj.total = total_pages;    // 总页数
                    jsonObj.records = count;  // 总记录数

                    var rowsArray = new Array();
                    //开始判断：如果rs中包含前台需要显示的数据（showElement包含的名称），则赋值给ay数组并开始拼装json对象。

                    for(var i=0; i<rs.length; i++){
                        // 定义rows
                        var rows = new Object();
                        rows.id = rs[i]._id;
                        //rows.cell = rs[i];
                        var ay = new Array();
                        for(key in rs[i]){
                            var index = showElement.indexOf(key);
                            if(index >= 0){
                                ay[index] = rs[i][key];
                            }
                        }
                        rows.cell = ay;
                        rowsArray[i] = rows;
                    }

                    //将rows数组赋予jsonObj.rows
                    jsonObj.rows = rowsArray;

                    var jsonStr = JSON.stringify(jsonObj);
                    console.log('jsonStr2:'+jsonStr);
                    return res.json(jsonObj, 200);
                });

                //定义rows 数组，保存所有rows数据
                rs.forEach(function(store) {
                    var ep2 = EventProxy.create();

                    ep2.assign('WarehouseDone', function(warehouseEvent) {
                        ep.trigger('storeDone');
                    });

                    Warehouse.findOne({'_id':store.warehouse_id}, function(err, data) {
                        if(err) { ep2.unbind(); return next(err);}
                        if (!data || data == undefined) return ep2.trigger('error', {status:204, error:'查询Warehouse结果为空！'});
                        store.warehouse_name = data.name;
                        ep2.trigger('WarehouseDone', data);
                    });
                });
            });
        };

        function findAll(where) {
            //start=起始行数&limit=每页显示行数&bt=交易发生时间起点&et=交易发生时间的截至时间&sidx=排序字段名&sord=排序方式asc,desc
            Store.find({where:where, start:start, limit:limit, sidx:sidx, sord:sord, bt:bt, et:et}, function(err, rs) {
                if(err) { ep.unbind(); return next(err);}
                if (!rs || rs == undefined) return ep.trigger('error', {status:204, error:'查询结果为空！'});
                var jsonObj = {stores:rs};
                ep.trigger('showList', jsonObj);
            });
        };
        /*
        Store.count({where:where}, function(err,ds){
            if(err) return next(err);

            var page = req.query.page; // 取得当前页数,注意这是jqgrid自身的参数
            var limit = req.query.rows; // 取得每页显示行数，,注意这是jqgrid自身的参数
            var sidx = req.query.sidx; //取得排序字段
            var sord  = req.query.sord;//排序方式asc、desc

            if(!sidx){
                sidx = 1;
            }
            // 计算查询结果总行数
            var count = ds.count;
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

            Store.findAll({where:where, start:start, limit:limit, sidx:sidx, sord:sord}, function(err,ds){
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
        });*/
    }
};


exports.pageNew = function(req, res, next) {
    console.log("新建弹出框。。。");
    // 3个状态： 新增， 查看， 编辑
    // - 新增(pageState=0)： _id 为空，isReadonly=false, 所有输入框为空，显示：保存按钮
    // - 查看(pageState=1)： _id不为空，isReadonly=true， 输入框有数据，显示：关闭按钮
    // - 编辑(pageState=2)： _id不为空，isReadonly=false， 输入框有数据，显示：保存按钮 + 关闭按钮
    var pageState = 0;
    res.render('stores/store', { layout: false, pageState:pageState});
};

/**
 * 显示新增商品（无_id）,或已有商品（有_id）页面
 * @param req
 * @param res
 * @param next
 * @return {*}
 */
exports.pageView = function(req, res, next) {
    console.log("开始 pageView 。。。");
    var _id = req.params._id;
    // 本页面有3个状态： 新增， 查看， 编辑
    // - 新增(pageState=0)： 所有输入框为空，显示：保存按钮
    // - 查看(pageState=1)： 输入框有数据，显示：关闭按钮
    // - 编辑(pageState=2)： 输入框有数据，显示：保存按钮 + 关闭按钮
    var pageState = 1;
    try {
        check(_id, "流水号不能为空！").notNull();
        res.render('stores/store', { layout: false, _id:_id, pageState:pageState});
    }catch(e){
        res.json({status:400, error:e.message}, 400);
    }
};

exports.pageEdit = function(req, res, next) {
    console.log("开始 pageEdit 。。。");
    var _id = req.params._id;
    // 本页面有3个状态： 新增， 查看， 编辑
    // - 新增(pageState=0)： 所有输入框为空，显示：保存按钮
    // - 查看(pageState=1)： 输入框有数据，显示：关闭按钮
    // - 编辑(pageState=2)： 输入框有数据，显示：保存按钮 + 关闭按钮
    var pageState = 2;
    try {
        check(_id, "流水号不能为空！").notNull();
        res.render('stores/store', { layout: false, _id:_id, pageState:pageState});
    }catch(e){
        res.json({status:400, error:e.message}, 400);
    }
};

exports.findOne = function(req, res, next) {
    console.log("开始 findOne 。。。");
    var _id = req.params._id;
    try {
        check(_id, "流水号不能为空！").notNull();
        Store.findOne({"_id":_id}, function(err,store){
            if(err) return next(err);
            if(!store) return res.json({status:400, error:"查询门店结果为空!"}, 400);
            if(!store.warehouse_id) return res.json({status:400, error:"关联仓库为空!"}, 400);
            Warehouse.findOne({"_id":store.warehouse_id}, function(err,warehouse){
                if(err) return next(err);
                if(!warehouse) return res.json({status:400, error:"查询仓库结果为空!"}, 400);
                store.warehouse_name = warehouse.name;
                var jsonObj = {store:store};
                res.json(jsonObj, 200);
            });
        });
    }catch(e){
        res.json({status:400, error:e.message}, 400);
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

    if(!req.session.user.member.org_id) return res.json({error:'未登录或当前用户不是商户员工!'}, 405);

    try {
        check(name, "保存失败，名称不能为空！").notNull();

        //创建门店仓库
        Warehouse.create(name, function(err, info){
            if(err) return next(err);
            //获得门店仓库的ID，并与门店关联
            req.body.warehouse_id = info.insertId;
            req.body.create_time = getNow();
            req.body.merchant_id = req.session.user.member.org_id;

            Store.create(req.body, function(err, info){
                if(err) return next(err);
                var jsonObj = {store:{_id:info.insertId}};
                return res.json(jsonObj, 201);
            });
        });
    }catch(e){
        res.json({status:400, error:e.message}, 400);
    }
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

    try {
        check(_id, "更新失败，数据流水号为空！").notNull();
        check(name, "更新失败，名称不能为空！").notNull();

        //说明是更新数据
        Store.update(req.body, function(err,info){
            if(err) return next(err);
            res.json({status:200, error:'更新门店信息成功!'});
        });
    }catch(e){
        res.json({status:400, error:e.message}, 400);
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