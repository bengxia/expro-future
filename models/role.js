var mysql = require('../libs/mysql.js');
var SimpleDO = require('../libs/simpleDO');

function create() {
    return new Role();
};

function Role() {
    this.table = 'ef_role';
};

Role.prototype = new SimpleDO('ef_role');

Role.prototype.findOneWithRoute = function(opt, cb) {
    var sql = 'SELECT t1.*, t3.* FROM ef_role as t1, ef_role_route as t2, ef_route as t3 '+
              'WHERE t1._id = t2.role_id AND t3._id = t2.route_id AND t1._id = '+opt.role;
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        cb(err, rs[0]);
    });
};


Role.prototype.findAll = function(opt, cb) {
    var sql = " SELECT * FROM ef_role  "
        +" where 1=1 ";
    if(opt.where){
        sql += opt.where;
    }
    if(opt.sidx && opt.sord){
        sql += " ORDER BY "+opt.sidx+" "+opt.sord;
    }
    if(opt.start && opt.limit){
        sql += " LIMIT "+ opt.start + " , "+opt.limit;
    }
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        cb(err, rs);
    });
};

exports = module.exports = create;