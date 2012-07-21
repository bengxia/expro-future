var mysql = require('../libs/mysql.js');
var SimpleDO = require('../libs/simpleDO');

function createMerchantLevel() {
    return new MerchantLevel();
};

function MerchantLevel() {
    this.table = '`ef_merchant_level`';
};

MerchantLevel.prototype = new SimpleDO('`ef_merchant_level`');

MerchantLevel.prototype.findAll = function(opt,cb) {
	var sql = " SELECT * FROM ef_merchant_level  "
        +" where 1=1 ";
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        cb(err, rs);
    });        
}

exports = module.exports = createMerchantLevel;