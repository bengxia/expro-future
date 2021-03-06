var mysql = require('../libs/mysql.js');
var SimpleDO = require('../libs/simpleDO');

//var Log = require('../log.js');
//var log = Log.create(Log.INFO, {'file':'public/node.debug'});


function create() {
    return new Deal();
};

function Deal(){
    this.table = 'ef_deal';
};

Deal.prototype = new SimpleDO('`ef_deal`');

Deal.prototype.create = function(deal, cb) {
	var options = {
		table: 'ef_deal',
		fields: deal 
	};	    
	mysql.insert(options, function(err, info) {
		if(err) return cb(err);
		return cb(err, info);
	}); 
};

Deal.prototype.update = function(deal, cb) {	
	var options = {
		table: 'ef_deal',
		fields: deal 
	};	    
	mysql.update(options, function(err, info) {
		if(err) return cb(err);
		return cb(err, info);
	}); 
};

Deal.prototype.delete = function(ids, cb) {
	var sql = 'delete from ef_deal where _id in(' + ids + ') ';
	mysql.query(sql, function(err) {
        if(err) return cb(err);
		return cb(err);
	}); 
};

Deal.prototype.query = function(opt, cb) {	
	var sql = 'select * from ef_deal where _id = '+opt._id;    
	mysql.query(sql, function(err, rs) {
		if(err) return cb(err);
		if(!rs.length) return cb(err);
		cb(err, rs[0]);		
	}); 
};

//Deal.prototype.findOne = function(opt, cb) {
//    where = "";
//    for(var k in opt) {
//        var value = opt[k];
//        if(typeof value != 'object' && typeof value != 'array') {
//            if( typeof value == 'number') {
//                where += " AND " + k + " = " + value;
//            }
//            else {
//                where += " AND " + k + " LIKE  '" + value + "'";
//            }
//        }
//    }
//
//    var sql = "SELECT * FROM `ef_deal` WHERE 1=1"+where;
//    mysql.query(sql, function(err, rs) {
//        if(err) return cb(err);
//        if(!rs.length) return cb(err);
//        cb(err, rs[0]);
//    });
//
//};

/**
 * 查询所有的数据
 * @param opt 参数，包含：opt.where， opt.sidx， opt.sord， opt.start ， opt.limit, bt:bt, et:et;
 * @param cb 回调
 */
Deal.prototype.findAll = function(opt, cb) {
    var sql = " SELECT * FROM ef_deal  "
        +" where 1=1 "+ opt.where;
    if(opt.bt) sql += " and create_time >= '"+ opt.bt + "' ";
    if(opt.et) sql += " and create_time <= '"+ opt.et + "' ";
    if(opt.sidx && opt.sord) sql += " ORDER BY "+opt.sidx+" "+opt.sord;
    if(opt.limit && opt.start) sql += " LIMIT "+ opt.start + " , "+opt.limit;
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        return cb(err, rs);
    });
};

/**
 * 根据条件获得数据的行数
 * @param opt 页面传入的查询条件(where:where, start:start, limit:limit, bt:bt, et:et)
 * @param cb 回调
 */
Deal.prototype.count = function(opt, cb) {

    var sql = "SELECT COUNT(*) AS count FROM ef_deal where 1=1 "
        +opt.where;
    if(opt.bt) sql += " and create_time >= '"+ opt.bt + "' ";
    if(opt.et) sql += " and create_time <= '"+ opt.et + "' ";
    console.log(sql);

    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        return cb(err, rs[0]);
    });
};

exports = module.exports = create;