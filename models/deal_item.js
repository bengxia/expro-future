var mysql = require('../libs/mysql.js');

function create() {
    return new Deal_item();
};

function Deal_item() {
    this.table = 'ef_deal_item';
};

Deal_item.prototype.create = function(opt, cb) {    
	mysql.insert(opt, function(err, info) {
		cb(err, info);		
	}); 
};


Deal_item.prototype.findOne = function(opt, cb) {
    where = "";
    for(var k in opt) {
        var value = opt[k];
        if(typeof value != 'object' && typeof value != 'array') {
            if( typeof value == 'number') {
                where += " AND " + k + " = " + value;
            }
            else {
                where += " AND " + k + " LIKE  '" + value + "'";
            }
        }
    }

    var sql = "SELECT * FROM `ef_deal_item` WHERE 1=1"+where;
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        cb(err, rs[0]);
    });



};

/**
 * 查询所有的数据
 * @param opt 参数，包含：opt.where， opt.sidx， opt.sord， opt.start ， opt.limit;
 * @param cb 回调
 */
Deal_item.prototype.findAll = function(opt, cb) {
    var sql = " SELECT * FROM ef_deal_item  "
        +" where 1=1 "+ opt.where
    if(opt.sidx && opt.sord) sql += " ORDER BY "+opt.sidx+" "+opt.sord;
    if(opt.limit) sql += " LIMIT "+ opt.start + " , "+opt.limit;
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        cb(err, rs);
    });
};


/**
 * 根据条件获得数据的行数
 * @param where 页面传入的查询条件
 * @param cb 回调
 */
Deal_item.prototype.count = function(opt, cb) {
    var sql = "SELECT COUNT(*) AS count FROM ef_deal_item where 1=1 "+opt.where;
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        cb(err, rs[0]);
    });
};

exports = module.exports = create;