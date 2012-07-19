var mysql = require('../libs/mysql.js');
var SimpleDO = require('../libs/simpleDO');

function createRoleRoute() {
    return new RoleRoute();
};

function RoleRoute() {
};

RoleRoute.prototype = new SimpleDO('ef_role_route');

RoleRoute.prototype.findAll = function(opt, cb) {
    var sql = " SELECT * FROM ef_role_route  "
        +" where 1=1 "+ opt.where;
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        cb(err, rs);
    });
};


exports = module.exports = createRoleRoute;