var models = require('../models');
var MerchantLevel = models.MerchantLevel;

exports.showMerchantLevel = function(req, res, next) {	
	MerchantLevel.findAll({},function(err, rs) {		
		if(err) return next(err);
		res.json(rs, 200);		
	});
}
