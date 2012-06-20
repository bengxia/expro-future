var models = require('../models');
var Deal = models.Deal;
var Deal_item = models.Deal_item;
var Member = models.Member;
var Goods = models.Goods;


var config = require('../config').config;
var EventProxy = require('eventproxy').EventProxy;

var check = require('validator').check,
    sanitize = require('validator').sanitize;

var Log = require('../log.js');
var log = Log.create(Log.INFO, {'file':'public/node.debug'});
var MQClient = require('../libs/mq_client.js');

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
var queryInput = {'_id':'编号','deal_id':'交易号','num':'交易数量','closing_cost':'单价','total_cost':'总价'};

//设置前台页面显示的表格数据
var colModel = [
    {name:'ef_deal_item._id',index:'ef_deal_item._id', width:100, align:'center',sortable:true},
    {name:'ef_deal_item.deal_id',index:'ef_deal_item.deal_id', width:200, align:'center',sortable:false},
    {name:'ef_deal_item.goods_name',index:'ef_deal_item.goods_name', width:200, align:'center',sortable:false},
    {name:'ef_deal_item.num',index:'ef_deal_item.num', width:200, align:'center',sortable:true},
    {name:'ef_deal_item.closing_cost',index:'ef_deal_item.closing_cost', width:200, align:'center',sortable:true},
    {name:'ef_deal_item.total_cost',index:'ef_deal_item.total_cost', width:200,align:'center',sortable:true}];

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
 * 查询指定交易的一批交易明细
 * @param req
 * @param res
 * @param next
 */
exports.index = function(req,res,next){
    var id = req.params.id;
    if(!id) return next('error', {status:400, error:'交易号不能为空！'});

    if(req.accepts('html')) {
        res.render('deal/deal_items', {queryInput:queryInput, id:id});
    }else{
        var ep = EventProxy.create();

        //根据前台页面传入的查询条件，开始拼接where语句
        var where = ' ';
        for(key in queryInput){
            var value = req.query[key];
            if(value != undefined){
                where += ' and '+key+' like \'%'+value+'%\' ';
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
                return res.json(result);
            }
        };
        //当有异常发生时触发
        ep.once('error', function(result) {
            ep.unbind();//remove all event
            return feedback(result);
        });
        //专为web服务
        ep.on('findDealItemsCount', function(where) {
            findDealItemsCount(where);
        });

        ep.on('findAllDealItemsForWeb', function(count, where) {
            findAllDealItemsForWeb(count, where);
        });

        //为客户端服务
        ep.on('findDealAndDealItems', function(dealId) {
            findDealAndDealItems(dealId);
        });

        ep.on('findDealById', function() {
            findDealById();
        });

        ep.on('findDealItemsByDealId', function() {
            findDealItemsByDealId();
        });

        //将传入的json对象发布到前台页面进行表格展示。
        ep.on('showList', function(jsonObj) {
            feedback({status:200, error:'获取数据成功', jsonObj:jsonObj});
        });

        //判断当前请求的是客户端还是web端
        var isWeb = req.query.isWeb;
        //开始检查传入参数
        try{
            check(isWeb).notNull().isInt();
            if(isWeb == 1){
                //增加查询条件
                where += " and _id="+id;
                ep.trigger('findDealItemsCount', where);
            }else{
                ep.trigger('findDealAndDealItems', id);
            }
        }catch(e){
            ep.trigger('findDealAndDealItems', id);
        }

        function findDealItemsCount(where){
            Deal_item.count({where:where}, function(err, count) {
                if(err) { ep.unbind(); return next(err);}
                if (!count && !count.count) return ep.trigger('error', {status:204, error:'查询结果为空!'});
                ep.trigger('findAllDealItemsForWeb', count.count, where);
            });
        }

        function findDealAndDealItems(dealId) {
            ep.trigger('findDealById');
            ep.trigger('findDealItemsByDealId');

            ep.assign('findDealByIdDone', 'findDealItemsByDealIdDone', function(deal, dealItems) {
                var jsonObj = new Object();
                deal["deal_item"] = dealItems;
                jsonObj["deal"] = deal;
                ep.trigger('showList', jsonObj);
            });
        }

        function findDealById(){
            Deal.findOne({_id:parseInt(id)}, function(err, rs){
                if(err) { ep.unbind(); return next(err);}
                if (!rs || rs == undefined) return ep.trigger('error', {status:204, error:'查询交易结果为空！'});
                ep.trigger('findDealByIdDone', rs);
            });
        }

        function findDealItemsByDealId(){
            Deal_item.findAll({where:" and deal_id="+id}, function(err, rs){
                if(err) { ep.unbind(); return next(err);}
                if (!rs || rs == undefined) return ep.trigger('error', {status:204, error:'查询交易明细结果为空！'});
                ep.trigger('findDealItemsByDealIdDone', rs);
            });
        }

        function findAllDealItemsForWeb(count, where) {
            //开始初始化查询条件
            var page = req.query.page; // 取得当前页数,注意这是jqgrid自身的参数
            var limit = req.query.rows; // 取得每页显示行数，,注意这是jqgrid自身的参数
            var sidx = req.query.sidx; //取得排序字段
            var sord  = req.query.sord;//排序方式asc、desc

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

            Deal_item.findAll({where:where, start:start, limit:limit, sidx:sidx, sord:sord}, function(err, rs) {
                if(err) { ep.unbind(); return next(err);}
                if (!rs || rs == undefined) return ep.trigger('error', {status:204, error:'查询结果为空！'});
                for(var i=0; i<rs.length; i++){
                    for ( key in rs[i]) {
                        rs[i]["ef_deal_item."+key] = rs[i][key];
                        delete rs[i][key];
                    }
                }
                //开始汇总
                ep.after('dealItemDone', rs.length, function() {
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
                        rows.id = rs[i][Deal_item.table+"._id"];
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

                    //var jsonStr = JSON.stringify(jsonObj);
                    //console.log('jsonStr:'+jsonStr);
                    ep.trigger('showList', jsonObj);
                });

                //定义rows 数组，保存所有rows数据
                rs.forEach(function(deal_item) {
                    var ep2 = EventProxy.create();
                    ep2.assign('GoodsDone', function(operaterEvent, customerEvent) {
                        ep.trigger('dealItemDone');
                    });
                    Goods.findOne({'_id':deal_item[Deal_item.table+".goods_id"]}, function(err, goods) {
                        if(err) { ep2.unbind(); return next(err);}
                        if (!goods || goods == undefined) return ep2.trigger('error', {status:204, error:'查询商品结果为空！'});
                        deal_item[Deal_item.table+".goods_name"] = goods["name"];
                        ep2.trigger('GoodsDone', deal_item);
                    });
                });
            });
        };
    }
};

