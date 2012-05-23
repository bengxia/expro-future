/*var tag_ctrl = require('./tag');
var user_ctrl = require('./user');
var topic_ctrl = require('./topic');
var config = require('../config').config;
var EventProxy = require('eventproxy').EventProxy;

var sanitize = require('validator').sanitize;
*/
var models = require('../models'),
    Store = models.Store;
exports.index = function(req,res,next){
    if(req.accepts('html')) {
      res.render('stores/stores', {});
    }else{
        Store.findAll(function(err,rows){
            if(err) return next(err);

            //var jsonStr = JSON.stringify(rows);
            var row = rows[0];
            console.log('row id:'+row._id);
        });
    /*
     json格式：
     { total: xxx, page: yyy, records: zzz, rows: [
     {id:”1″,cell:[”Row 1:1″,”Row 1:2″,”Row 1:3″,”Row 1:4″]},
     {id:”2″,cell:[”Row 2:1″,”Row 2:2″,”Row 2:3″,”Row 2:4″]},
     …
     ]}
     */
    var page = req.params.page; // 取得当前页数,注意这是jqgrid自身的参数
    var rows = req.params.rows; // 取得每页显示行数，,注意这是jqgrid自身的参数
    var sidx = req.params.sidx; //取得排序字段
    var sord  = req.params.sord;//排序方式asc、desc

    var total = '2';//总页数
    var records = '13';//总记录数
    page = '1';

    var jsonObj = new Object();
    jsonObj.page = page;  // 当前页
    jsonObj.total = total;    // 总页数
    jsonObj.records = records;  // 总记录数

    //定义rowdata，属于 rows.cell 的子数据
    var rowData = new Array();
    rowData[0] = 111;
    rowData[1] = 222;
    rowData[2] = 'mengwei';
    rowData[3] = 333;
    rowData[4] = 444;
    rowData[5] = 555;

    // 定义rows
    var rows = new Object();
    rows.id = 111;
    rows.cell = rowData;
    //定义rows 数组，保存所有rows数据
    var rowsArray = new Array();
    rowsArray[0] = rows;
    //将rows数组赋予jsonObj.rows
    jsonObj.rows = rowsArray;

    //var jsonStr = JSON.stringify(jsonObj);
    //console.log('jsonStr:'+jsonStr);

    res.json(jsonObj);
    }
};
