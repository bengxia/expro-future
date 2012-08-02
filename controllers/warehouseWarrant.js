var models = require('../models');var WarehouseWarrant = models.WarehouseWarrant;var Member = models.Member;var WarehouseWarrantItem = models.WarehouseWarrantItem;var Warehouse = models.Warehouse;var Goods = models.Goods;var check = require('validator').check,    sanitize = require('validator').sanitize;var config = require('../config').config;var EventProxy = require('eventproxy').EventProxy;//var Log = require('../log.js');//var log = Log.create(Log.INFO, {'file':'public/node.debug'});var MQClient = require('../libs/mq_client.js');var getNow=function(){    var now = new Date();    var year = now.getFullYear();    return (year+'-'+(now.getMonth()+1)+'-'+now.getDate()+' '+        now.getHours()+':'+now.getMinutes()+':'+now.getSeconds());};/** * 开始设置前台表格控件说需要的相关对象及参数Start *///设置查询区域的查询输入框，规则：{"查询字段名":"页面显示的label文字"}var queryInput = {'_id_1':'编号'};////设置前台表格控件说需要的相关对象及参数End/** * 显示交易列表 * @param req * @param res * @param next */exports.index = function(req,res,next){    console.log("开始显示列表。。。");    if(req.accepts('html')) {        res.render('warehouse_warrant/index', {queryInput:queryInput});    }else{        //start=起始行数&limit=每页显示行数&bt=交易发生时间起点&et=交易发生时间的截至时间&sidx=排序字段名&sord=排序方式asc,desc        var start = req.query.start;//起始行数        var limit = req.query.limit;//每页显示行数        var bt = req.query.bt;//交易发生时间起点        var et = req.query.et;//交易发生截至时间        var sidx = req.query.sidx;//排序字段名        var sord = req.query.sord;//排序方式        var ep = EventProxy.create();        //根据前台页面传入的查询条件，开始拼接where语句        var where = ' ';        for(key in queryInput){            var value = req.query[key];            if(value != undefined){                where += ' and '+key+' like \'%'+value+'%\' ';            }        }        //回调函数        function feedback(result) {            if(200 == result.status) {                if(result.jsonObj) {                    //var jsonStr = JSON.stringify(result.jsonObj);                    //console.log('jsonStr:'+jsonStr);                    res.json(result.jsonObj, 200);                }else{                    ep.trigger('error', {status:400, error:'查询结果为空!'});                }            }            else {                return res.json(result);            }        };        //当有异常发生时触发        ep.once('error', function(result) {            ep.unbind();//remove all event            return feedback(result);        });        //查询商户下所有的员工        ep.on('findMembersByOrgId', function(org_id) {            findMembersByOrgId(org_id);        });        ep.on('findCount', function(where) {            findCount(where);        });        ep.on('findAllForWeb', function(where, count) {            findAllForWeb(where, count);        });        //for client        ep.on('findAll', function(where) {            findAll(where);        });        //将传入的json对象发布到前台页面进行表格展示。        ep.on('showList', function(jsonObj) {            feedback({status:200, error:'获取数据成功', jsonObj:jsonObj});        });        //查询当前登陆用户所属商户        //  首先获取当前登陆用户的org_id，查询当前用户的商户id        if(req.session.user.member.org_id){            ep.trigger('findMembersByOrgId', req.session.user.member.org_id);        }else{            ep.trigger('error', {status:400, error:'获取当前用户所属商户失败。'});        }        //查询商户下所有的员工,并将查询到的member ids 拼接到已有where语句后，形成如下形式：        //" and dealer_id in( 24, 23, 25, 26)";        function findMembersByOrgId(org_id){            Member.findAll({where:' and org_id='+org_id}, function(err, rs){                if(err) { ep.unbind(); return next(err);}                if (!rs || rs == undefined) return ep.trigger('error', {status:400, error:'商户查询结果为空！'});                where += " and operator_id in(";                for(var i=0; i<rs.length; i++){                    where += " "+rs[i]._id;                    if(i != rs.length-1){                        where += ",";                    }else{                        where += ") ";                    }                }                //判断当前请求的是客户端还是web端                var isWeb = req.query.isWeb;                //开始检查传入参数                try{                    check(isWeb).notNull().isInt();                    if(1 == isWeb){                        ep.trigger('findCount', where);                    }else{                        ep.trigger('findAll', where);                    }                }catch(e){                    ep.trigger('findAll', where);                }            });        };        //查询count数        function findCount(where){            //获得数据行数，用于分页计算            WarehouseWarrant.count({where:where, bt:bt, et:et}, function(err, count) {                if(err) { ep.unbind(); return next(err);}                if (!count && !count.count) return ep.trigger('error', {status:400, error:'查询结果为空!'});                ep.trigger('findAllForWeb', where, count.count);            });        }        //转为web服务        function findAllForWeb(where, count) {            var showElement = ['_id', 'recipient_name', 'recipient_id', 'operator_name', 'operator_id', 'source_name', 'source_id', 'create_time', 'comment'];            if (!count && !count.count) return ep.trigger('error', {status:400, error:'查询结果为空!'});            var page = req.query.page;//起始行数 for jqgrid            if(!sidx){                sidx = 1;            }            // 查询结果总页数            var total_pages = 0;            // 计算查询结果页数            if(count > 0 && limit > 0){                total_pages = Math.ceil(count/limit);            }            // 若请求页大于总页数，设置请求页为最后一页            if (page > total_pages) page = total_pages;            // 计算起始行            var start = limit * page - limit;            // 若起始行为0            if(start < 0) start = 0;            WarehouseWarrant.findAllData({where:where, start:start, limit:limit, sidx:sidx, sord:sord, bt:bt, et:et}, function(err, rs) {                if(err) { ep.unbind(); return next(err);}                if (!rs || rs == undefined) return ep.trigger('error', {status:400, error:'查询结果为空！'});                var rsnew = [];                var i = 0;                rs.forEach(function(data) {                    //                    var ep2 = EventProxy.create();                    //查询商户下所有的员工                    ep2.on('findRecipientName', function(row) {                        findRecipientName(row);                    });                    ep2.on('findSourceName', function(row) {                        findSourceName(row);                    });                    ep2.on('findOperatorName', function(row) {                        findOperatorName(row);                    });                    function findRecipientName(row){                        Warehouse.findOne({_id:row.recipient_id}, function(err, data){                            if(err) { ep.unbind(); return next(err);}                            if (!data || data == undefined) return ep.trigger('error', {status:400, error:'查询仓库结果为空！'});                            //rs[i].recipient_name = data.name;                            row['recipient_name'] = data.name;                            ep2.trigger('findRecipientNameDone', row);                        });                    }                    function findSourceName(row){                        Warehouse.findOne({_id:row.source_id}, function(err, data){                            if(err) { ep.unbind(); return next(err);}                            if (!data || data == undefined) return ep.trigger('error', {status:400, error:'查询仓库结果为空！'});                            //rs[i].source_name = data.name;                            row['source_name'] = data.name;                            ep2.trigger('findSourceNameDone', row);                        });                    }                    function findOperatorName(row){                        Member.findOne({_id:row.operator_id}, function(err, data){                            if(err) { ep.unbind(); return next(err);}                            if (!data || data == undefined) return ep.trigger('error', {status:400, error:'查询用户结果为空！'});                            //rs[i].operator_name = data.pet_name;                            row['operator_name'] = data.pet_name;                            ep2.trigger('findOperatorNameDone', row);                        });                    }                    ep2.trigger('findRecipientName', data);                    ep2.trigger('findSourceName', data);                    ep2.trigger('findOperatorName', data);                    ep2.assign('findRecipientNameDone', 'findSourceNameDone', 'findOperatorNameDone', function(row) {                        rsnew[i] = row;                        i++;                        ep.trigger('allDone');                    });                });                ep.after('allDone', rs.length, function() {                    var jsonObj = new Object();                    jsonObj.page = page;  // 当前页                    jsonObj.total = total_pages;    // 总页数                    jsonObj.records = count;  // 总记录数                    //定义rows 数组，保存所有rows数据                    var rowsArray = new Array();                    for(var i=0; i<rsnew.length; i++){                        var ay = new Array();                        // 定义rows                        var rows = new Object();                        rows.id = rsnew[i]._id;                        for(key in rsnew[i]){                            var index = showElement.indexOf(key);                            if(index >= 0){                                ay[index] = rsnew[i][key];                            }                        }                        //                        rows.cell = ay;                        rowsArray[i] = rows;                    }                    //将rows数组赋予jsonObj.rows                    jsonObj.rows = rowsArray;                    var jsonStr = JSON.stringify(jsonObj);                    console.log('jsonStr2:'+jsonStr);                    return res.json(jsonObj, 200);                });            });        };        function findAll(where) {            WarehouseWarrant.findAllData({where:where, start:start, limit:limit, sidx:sidx, sord:sord, bt:bt, et:et}, function(err, rs) {                if(err) { ep.unbind(); return next(err);}                if (!rs || rs == undefined) return ep.trigger('error', {status:400, error:'查询结果为空！'});                var jsonObj = {warehousewarrants:rs};                ep.trigger('showList', jsonObj);            });        };    }};/** * 显示新增页面 * @param req * @param res * @param next * @return {*} */exports.showWarehouseWarrant = function(req, res, next) {    console.log("开始显示 弹出框。。。");    if(req.accepts('html')) {        //当前为显示创建的空页面，页面上的数据由页面自身发起ajax请求获取。        res.render('warehouse_warrant/warehouse_warrant', {});    }else{        //    }};exports.creatWarehouseWarrant = function(req, res, next) {    console.log("开始显示 弹出框。。。");    if(req.accepts('html')) {        //当前为显示创建的空页面，页面上的数据由页面自身发起ajax请求获取。        //res.render('warehouse_warrant/warehouse_warrant', {});    }else{        if(!req.body.warehouse_warrant || !req.body.warehouse_warrant.warehouse_warrant_item) return res.json({error:'提交数据错误!'}, 400);        console.log("-----:"+JSON.stringify(req.body));        var warehouse_warrant = Object.create(req.body.warehouse_warrant);        delete warehouse_warrant.warehouse_warrant_item;        var warehouse_warrant_item = req.body.warehouse_warrant.warehouse_warrant_item;        if(warehouse_warrant_item.length <= 0) return res.json({error:'未选择进货商品!'}, 400);        if(req.session.user){            warehouse_warrant.operator_id = req.session.user.member._id;            warehouse_warrant.create_time = getNow();            WarehouseWarrant.create(warehouse_warrant, function(err, info){                if(err) return next(err);                if(!info || !info.insertId) return res.json({error:'数据入库出错!'}, 500);                for(var i = 0; i < warehouse_warrant_item.length; i++){                    warehouse_warrant_item[i].warehouse_warrant_id = info.insertId;                    //console.log("-----:"+JSON.stringify(warehouse_warrant_item[i]));                    WarehouseWarrantItem.create(warehouse_warrant_item[i], function(err, info){                        if(err) return next(err);                        if(!info || !info.insertId) return res.json({error:'数据入库出错!'}, 500);                    });                }                res.json({warehouse_warrant:{_id:info.insertId}}, 201);            });        }else{            res.json({error:'用户未登录!'}, 401);        }    }};exports.findWarehouseWarrant = function(req, res, next) {    console.log("开始显示 弹出框。。。");    var _id = req.params.id;    console.log(">>>>ID:"+req.params.id);    if(!_id) res.json({error:'未选择需要查看详细的货单!'}, 400);    if(req.accepts('html')) {        console.log("111111");        res.render('warehouse_warrant/warehouse_warrant', {_id:_id});    }else{        console.log("222222");        var ep = EventProxy.create();        WarehouseWarrant.findOne({_id:_id}, function(err, info){            if(err) return next(err);            if(!info) return res.json({error:'获取数据出错!'}, 500);            WarehouseWarrantItem.findAll({warehouse_warrant_id:_id}, function(err, rs){                if(err) return next(err);                if(!rs) return res.json({error:'获取数据出错!'}, 500);                rs.forEach(function(row) {                    var ep2 = EventProxy.create();                    ep2.on('findGoodsDetail', function(row) {                        findGoodsDetail(row);                    });                    function findGoodsDetail(row){                        Goods.findOne({_id:row.goods_id}, function(err, data){                            if(err) { ep2.unbind(); return next(err);}                            if (!data || data == undefined) return ep2.trigger('error', {status:204, error:'查询商品结果为空！'});                            row['name'] = data.name;                            row['price'] = data.price;                            ep.trigger('allDone');                        });                    }                    //start                    ep2.trigger('findGoodsDetail', row);                });                ep.after('allDone', rs.length, function() {                    info.warehouse_warrant_item = rs;                    console.log("-----:"+JSON.stringify({warehouse_warrant:info}));                    res.json({warehouse_warrant:info}, 200);                });            });        });    }};exports.deleteWarehouseWarrant = function(req, res, next) {    console.log("开始进行删除。。。。");    var _ids = req.params.id;    console.log("hahahahah:"+_ids);    WarehouseWarrant.delete(_ids, function(err,ds){        if(err) return next(err);        var idsAy = _ids.split(",");        idsAy.forEach(function(id){            WarehouseWarrantItem.findAll({warehouse_warrant_id:id}, function(err, rs){                if(err) return next(err);                rs.forEach(function(row){                    if(row){                        WarehouseWarrantItem.delete(row._id, function(err,ds){                            if(err) return next(err);                        });                    }                });            });        });        return res.json({"status":202, "error":'删除货单成功!', "_ids":_ids}, 202);    });};