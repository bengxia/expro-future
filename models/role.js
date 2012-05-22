var mysql = require('../libs/mysql.js');

function createRole() {
    return new Role();
};

function User() {
//    this.table = '`ef_user`';
};

User.prototype.findOne = function(opt, cb) {
    var sql = 'SELECT t1.*, t2. FROM ef_role as t1, ef_role_privilage as t2, ef_route_table as t3+
              'WHERE t1._id = t2.role_id AND t3._id = t2.route_table_id AND t1._id = '+opt.role;
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        cb(err, rs[0]);
    });
};

exports = module.exports = createRole;