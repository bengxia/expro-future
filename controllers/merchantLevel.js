var models = require('../models');
var MerchantLevel = models.MerchantLevel;

exports.showMerchantLevel = function(req, res, next) {	
	MerchantLevel.find({},function(err, rs) {
		if(err) return next(err);
		res.json({merchantlevels:rs}, 200);
	});
}
