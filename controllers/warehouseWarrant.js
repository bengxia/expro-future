var models = require('../models');var WarehouseWarrant = models.WarehouseWarrant;var Member = models.Member;var check = require('validator').check,    sanitize = require('validator').sanitize;var config = require('../config').config;var EventProxy = require('eventproxy').EventProxy;var Log = require('../log.js');var log = Log.create(Log.INFO, {'file':'public/node.debug'});var MQClient = require('../libs/mq_client.js');var getNow=function(){    var now = new Date();    var year = now.getFullYear();    return (year+'-'+(now.getMonth()+1)+'-'+now.getDate()+' '+        now.getHours()+':'+now.getMinutes()+':'+now.getSeconds());};/** * 开始设置前台表格控件说需要的相关对象及参数Start *///设置查询区域的查询输入框，规则：{"查询字段名":"页面显示的label文字"}var queryInput = {'_id':'编号'};////设置前台表格控件说需要的相关对象及参数End/** * 显示交易列表 * @param req * @param res * @param next */exports.index = function(req,res,next){    if(req.accepts('html')) {        res.render('warehouse_warrant/index', {queryInput:queryInput});    }else{        //start=起始行数&limit=每页显示行数&bt=交易发生时间起点&et=交易发生时间的截至时间&sidx=排序字段名&sord=排序方式asc,desc        var start = req.query.start;//起始行数        var limit = req.query.limit;//每页显示行数        var bt = req.query.bt;//交易发生时间起点        var et = req.query.et;//交易发生截至时间        var sidx = req.query.sidx;//排序字段名        var sord = req.query.sord;//排序方式        var ep = EventProxy.create();        //根据前台页面传入的查询条件，开始拼接where语句        var where = ' ';        for(key in queryInput){            var value = req.query[key];            if(value != undefined){                where += ' and '+key+' like \'%'+value+'%\' ';            }        }        //开始检查传入参数        /*        try{            check(start).notNull().isInt();            check(limit).notNull().isInt();        }catch(e){            ep.trigger('error', {status:400, error:'start&limit参数不可为空。'});        }*/        //回调函数        function feedback(result) {            if(200 == result.status) {                if(result.jsonObj) {                    //var jsonStr = JSON.stringify(result.jsonObj);                    //console.log('jsonStr:'+jsonStr);                    res.json(result.jsonObj, 200);                }else{                    ep.trigger('error', {status:204, error:'查询结果为空!'});                }            }            else {                return res.json(result);            }        };        //当有异常发生时触发        ep.once('error', function(result) {            ep.unbind();//remove all event            return feedback(result);        });        //查询商户下所有的员工        ep.on('findMembersByOrgId', function(org_id) {            findMembersByOrgId(org_id);        });        ep.on('findCount', function(where) {            findCount(where);        });        ep.on('findAllForWeb', function(where, count) {            findAllForWeb(where, count);        });        //for client        ep.on('findAll', function(where) {            findAll(where);        });        //将传入的json对象发布到前台页面进行表格展示。        ep.on('showList', function(jsonObj) {            feedback({status:200, error:'获取数据成功', jsonObj:jsonObj});        });        //查询当前登陆用户所属商户        //  首先获取当前登陆用户的org_id，查询当前用户的商户id        if(req.session.user.member.org_id){            ep.trigger('findMembersByOrgId', req.session.user.member.org_id);        }else{            ep.trigger('error', {status:400, error:'获取当前用户所属商户失败。'});        }        //查询商户下所有的员工,并将查询到的member ids 拼接到已有where语句后，形成如下形式：        //" and dealer_id in( 24, 23, 25, 26)";        function findMembersByOrgId(org_id){            Member.findAll({where:' and org_id='+org_id}, function(err, rs){                if(err) { ep.unbind(); return next(err);}                if (!rs || rs == undefined) return ep.trigger('error', {status:204, error:'商户查询结果为空！'});                where += " and operator_id in(";                for(var i=0; i<rs.length; i++){                    where += " "+rs[i]._id;                    if(i != rs.length-1){                        where += ",";                    }else{                        where += ") ";                    }                }                //判断当前请求的是客户端还是web端                var isWeb = req.query.isWeb;                //开始检查传入参数                try{                    check(isWeb).notNull().isInt();                    if(1 == isWeb){                        ep.trigger('findCount', where);                    }else{                        ep.trigger('findAll', where);                    }                }catch(e){                    ep.trigger('findAll', where);                }            });        };        //查询count数        function findCount(where){            //获得数据行数，用于分页计算            WarehouseWarrant.count({where:where, bt:bt, et:et}, function(err, count) {                if(err) { ep.unbind(); return next(err);}                if (!count && !count.count) return ep.trigger('error', {status:204, error:'查询结果为空!'});                ep.trigger('findAllForWeb', where, count.count);            });        }        //转为web服务        function findAllForWeb(where, count) {            var showElement = ['_id', 'recipient_id', 'operator_id', 'source_id', 'create_time', 'comment'];            if (!count && !count.count) return ep.trigger('error', {status:204, error:'查询结果为空!'});            var page = req.query.page;//起始行数 for jqgrid            if(!sidx){                sidx = 1;            }            // 查询结果总页数            var total_pages = 0;            // 计算查询结果页数            if(count > 0 && limit > 0){                total_pages = Math.ceil(count/limit);            }            // 若请求页大于总页数，设置请求页为最后一页            if (page > total_pages) page = total_pages;            // 计算起始行            var start = limit * page - limit;            // 若起始行为0            if(start < 0) start = 0;            WarehouseWarrant.findAllData({where:where, start:start, limit:limit, sidx:sidx, sord:sord, bt:bt, et:et}, function(err, rs) {                if(err) { ep.unbind(); return next(err);}                if (!rs || rs == undefined) return ep.trigger('error', {status:204, error:'查询结果为空！'});                var jsonObj = new Object();                jsonObj.page = page;  // 当前页                jsonObj.total = total_pages;    // 总页数                jsonObj.records = count;  // 总记录数                //定义rows 数组，保存所有rows数据                var rowsArray = new Array();                for(var i=0; i<rs.length; i++){                    // 定义rows                    var rows = new Object();                    rows.id = rs[i]._id;                    //rows.cell = rs[i];                    var ay = new Array();                    for(key in rs[i]){                        var index = showElement.indexOf(key);                        if(index >= 0){                            ay[index] = rs[i][key];                        }                    }                    rows.cell = ay;                    rowsArray[i] = rows;                }                //将rows数组赋予jsonObj.rows                jsonObj.rows = rowsArray;                var jsonStr = JSON.stringify(jsonObj);                console.log('jsonStr2:'+jsonStr);                return res.json(jsonObj, 200);            });        };        function findAll(where) {            //start=起始行数&limit=每页显示行数&bt=交易发生时间起点&et=交易发生时间的截至时间&sidx=排序字段名&sord=排序方式asc,desc            WarehouseWarrant.findAllData({where:where, start:start, limit:limit, sidx:sidx, sord:sord, bt:bt, et:et}, function(err, rs) {                if(err) { ep.unbind(); return next(err);}                if (!rs || rs == undefined) return ep.trigger('error', {status:204, error:'查询结果为空！'});                ep.trigger('showList', rs);            });        };    }};