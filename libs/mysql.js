var mysql = require('mysql')
    ,config= require('../config').config;
var client = mysql.createClient(config.mysql);
client.utc=true;

exports.query = function(sql, cb) {
    console.log(sql);
    client.query(sql, function(err, rs, fields) {
        if(err) console.log(err.stack);
        cb(err, rs, fields);
    });
}

exports.insert = function(opt, cb) {
    var sql = 'insert into '+opt.table+' set ';
    var values = [];
    for(var k in opt.fields) {
        var value = opt.fields[k];
        if(typeof value != 'object' && typeof value != 'array') {
            sql += opt.table+'.'+k+' = ?, ';
            values.push(value);
        }
    }
    sql = sql.slice(0,-2);

    console.log(sql,values);
    client.query(sql, values, function(err, info) {
        if(err) console.log(err.stack);
        cb(err, info);
    });
}