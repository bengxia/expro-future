var mysql = require('../libs/mysql.js');

function createRoute_table() {
    return new Route_table();
};

function Route_table() {
};

Route_table.prototype.findAll = function(cb) {
    var sql = 'SELECT * FROM ef_route_table';
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        cb(err, rs);
    });
};

exports = module.exports = createRoute_table;