var models = require('../models');
var Deal = models.Deal;
var Deal_item = models.Deal_item;

exports.creatDeal = function(req, res) {	
	var deal_item = req.body.deal.deal_item;
	delete req.body.deal.deal_item;
	delete req.body.deal._id;	
	var options = {
		table: 'ef_deal',
		fields: req.body.deal 
	};
	
	Deal.create(options, function(err, info) {
		var len = deal_item.length;
		for(var i = 0; i < len; i++) {
			delete deal_item[i]._id;
			deal_item[i].deal_id = info._id;
			var opt = {
				table: 'ef_deal_item',
				fields: deal_item								
			}
			Deal.
				
			}						
		}
	    	
	});
	

	
}
