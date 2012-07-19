var mysql = require('../libs/mysql.js');
var SimpleDO = require('../libs/simpleDO');

function createRoute() {
    return new Route();
};

function Route() {
};

Route.prototype = new SimpleDO('ef_route');

Route.prototype.findAll = function(opt, cb) {
    var sql = " SELECT * FROM ef_route  "
        +" where 1=1 "+ opt.where;
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        cb(err, rs);
    });
};


exports = module.exports = createRoute;