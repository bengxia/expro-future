var models = require('../models');
var Deal = models.Deal;
var Deal_item = models.Deal_item;

			}
			Deal.
				
			}						
		}
	    	
	});
	

	
}


exports.addDeal = function(req, res) {
    var json = {};
    json.deal = {};
    var deal_item = req.body.deal.deal_item;
    json.deal.lid = req.body.deal.lid;
    delete req.body.deal.deal_item;
    delete req.body.deal.lid;
    req.body.deal.dealer_id = req.session.user._id;			
    var ep = EventProxy.create();
    var feedback = function(result) {
	    if(201 == result.status) {
	        res.json(result.json, result.status);			
        }
        else {
	        res.end(result.status);
	    }		    		
    }	
    Deal.add(req.body.deal, function(err, info) {		
        if(err) {
	        feedback({status: 400});
	    }
	    else { 								
            json.deal._id = info.insertId;
            json.deal.deal_item = [];
			
            ep.after('deal_item', deal_item.length, function(data) {				
		        feedback({status: 201, json: json});
            });
            deal_item.forEach(function(item) {
	            item.deal_id = info.insertId;
	            Deal_item.add(item, function(err, info2) {
	                if(err) {
		                feedback({status: 400});
		            }
		            else {						
		                json.deal.deal_item.push({
			                _id:info2.insertId,
			                lid:info2.lid,
			                deal_id:info.insertId});					
		            }
			        ep.trigger('deal_item');
		        });
		    });
	    }	    	
	});		
}

exports.deleteDeal = function(req, res, next) {		
    var feedback = function(result) {		
	    res.send(result.status);				
    }
    Deal.query({_id: req.params.id}, function(err, rs){
	    if(err) return next(err);
	    if(!rs || rs.dealer_id != req.session.user._id) {	
	        feedback({status: 401});
	    }
	    else {	
	        Deal.delete({_id: req.params.id}, function(err) {
		        if(err) return next(err); 
	            else {					
		            Deal_item.delete({deal_id: req.params.id}, function(err) {
			            if(err) return next(err); 
			            else {
			                feedback({status: 202});
			            }
		            });
		        }
	        }); 
        }
    });	
}

