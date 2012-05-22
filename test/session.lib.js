var request = require('./support/http');
var crypto = require('crypto');

exports.MD5 = function(str) {
    return crypto.createHash('md5').update(str).digest('hex');
}

exports.getSID = function(res) {
  return res.headers['set-cookie'][0].split(';')[0];
}

exports.getData =function(url, sid) {
    return request()
           .get(url)
           .set('Cookie', sid);
}

exports.postData = function(url, data, sid, accept) {
    var mineType = accept ||'application/json';
    var sessionID = sid||'';
    return  request()
            .post(url)
            .set('content-type', 'application/json')
            .set('Accept', mineType)
            .set('Cookie', sessionID)
            .write(JSON.stringify(data));
}

exports.putData = function(url, data, sid, accept) {
    var mineType = accept ||'application/json';
    var sessionID = sid||'';
    return  request()
            .put(url)
            .set('content-type', 'application/json')
            .set('Accept', mineType)
            .set('Cookie', sessionID)
            .write(JSON.stringify(data));
}
/*
exports.register = function(data) { return  postData('/members/', data, ''); }
exports.signin = function(data，ct) { return  postData('/signin', data, '', ct); }
exports.update = function(id, data, sid) { return  putData('/members/'+id, data, sid); }
exports.query = function(id, sid) {return getData('/members/'+id, sid);}
exports.postData = postData;
*/
