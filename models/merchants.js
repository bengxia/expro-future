var mysql = require('../libs/mysql.js');

var check = require('validator').check,
    sanitize = require('validator').sanitize;

function createMerchant() {
    return new Merchant();
};

function Merchant() {
    this.table = '`ef_merchant`';
};

Merchant.prototype.save = function(obj, cb) {
    console.log("Merchant Save``````````````````");
};

Merchant.prototype.findAll = function(sidx, sord, cb) {
    var sql = "SELECT _id, short_name, state, type, phone, create_time, due_time FROM `ef_merchant` ORDER BY "+sidx+" "+sord;
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        cb(err, rs);
    });
};

Merchant.prototype.create = function(body, cb) {
    var short_name = sanitize(body.short_name).trim();
    var full_name = sanitize(body.full_name).trim();
    var state = sanitize(body.state).trim();
    var type = sanitize(body.type).trim();
    var logo_img_path = sanitize(body.logo_img_path).trim();
    var charter_num = sanitize(body.charter_num).trim();
    var charter_img_path = sanitize(body.charter_img_path).trim();
    var address = sanitize(body.address).trim();
    var website = sanitize(body.website).trim();
    var phone = sanitize(body.phone).trim();
    var fax = sanitize(body.fax).trim();
    var self_intro = sanitize(body.self_intro).trim();
    var member_intro = sanitize(body.member_intro).trim();
    var district_code = sanitize(body.district_code).trim();
    var merchant_level_id = sanitize(body.merchant_level_id).trim();
    var comment = sanitize(body.comment).trim();
    var create_time = new Date().toGMTString();
    var due_time = new Date().toGMTString();
    var opt = {
        table: 'ef_merchant',
        fields: body
    };
    mysql.insert(opt, function(err, info) {
        if(err) return next(err);
        else {
            return cb(err, info);
        }
    });
    /*
    mysql.query('insert into `ef_merchant` set  '
        +'short_name=?, '
        +'state=?, '
        +'type=?, '
        +'charter_num=?, '
        +'create_time=?, '
        +'due_time=?,  '
        +'district_code=?, '
        +'merchant_ level_id=? ',
        [short_name, state, type, charter_num, create_time, due_time, district_code, merchant_level_id], function(err, result) {
            if(err) return next(err);
            res.redirect('/');
        });
        */
/*
    mysql.query('insert into `ef_merchant` set  '
        +'short_name=?, '
        +'full_name=?, '
        +'state=?, '
        +'type=?, '
        +'logo_img_path=?, '
        +'charter_num=?, '
        +'charter_img_path=?, '
        +'address=?, '
        +'website=?, '
        +'phone=?, '
        +'fax=?, '
        +'self_intro=?, '
        +'member_intro=?, '
        +'district_code=?, '
        +'merchant_ level_id=?, '
        +'comment=?, '
        +'create_time=now(), '
        +'due_time=now()  ',
        [short_name, full_name, state, type, logo_img_path, charter_num, charter_img_path, address,
        website, phone, fax, self_intro, member_intro, district_code, merchant_level_id, comment], function(err, result) {
                if(err) return next(err);
                res.redirect('/');
    });
*/
    /*
    var sql =  'INSERT INTO `ef_merchant` '+
            'SET short_name = ?, state = ?, type = ?, phone = ?, create_time = ?, due_time = ? ';
    mysql.query(sql, ['super cool', 'this is a nice text', '2010-08-16 10:00:23']);
    */
};

Merchant.prototype.count = function(cb) {
    var sql = "SELECT COUNT(*) AS count FROM `ef_merchant`";
    mysql.query(sql, function(err, rs) {
        if(err) return cb(err);
        if(!rs.length) return cb(err);
        cb(err, rs);
    });
};

exports = module.exports = createMerchant;