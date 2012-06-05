var mysql = require('../libs/mysql.js');

function create() {
    return new Member();
};

function Member() {
};

Member.prototype.findOne = function(opt, cb) {
    var sql = 'SELECT * FROM ef_member WHERE org_id = '+opt.org+' AND user_id = '+opt.user;
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        cb(err, rs[0]);
    });
};

exports = module.exports = create;