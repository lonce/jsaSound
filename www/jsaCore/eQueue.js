define(
    ["jsaSound/jsaCore/config", "jsaSound/jsaCore/utils"],
    function eQueueFactory(config, utils){

    	var reqaframe = utils.getRequestAnimationFrameFunc();

    	var interval = .07; //ms to "play ahead" meant to cover events happening between now and the next call back time
    	var queueManager =  {
    		"q" : [], // array of sorted time-stamped objects
    		"nextTime" : 0, // the time of the first event on the q
    		"reqaframe" : function(arg){ reqaframe(arg);},
    		// Q will be sorted from high time to low time
    		// searched from high time to low time
    		// insert so that if time = previous node, playing will happen in order of insert
    		"schedule": function(t, f){
    			for(var i=0;i<queueManager.q.length;i++){
    				if (queueManager.q[i].time <= t){
    					queueManager.q.splice(i,0,{"time": t, "func": f}); 
    					return;
    				}
    			}
    			// either q.length i 0 or t < all queued items, so insert
    			queueManager.q.splice(i,0,{"time": t, "func": f});
    		},
    		"processQ": function(){
    			var now = config.audioContext.currentTime;
    			for (var i=queueManager.q.length-1;i>=0;i--){
    				if (queueManager.q[i].time <= now+interval){
    					queueManager.q[i].func(queueManager.q[i].time);
                        console.log("fire from queue at time " + now + "with timestamp " + queueManager.q[i].time);
    					queueManager.q.pop();
    				} 
    			}
    			queueManager.reqaframe(queueManager.processQ);
    		},

		};


		// fire it up.
		queueManager.reqaframe(queueManager.processQ);
/*
		// test it - development only
		(function (){
			var now = config.audioContext.currentTime;
			var cb = function(time){
				console.log("firing at time " + time);
			}
			for(var i=1;i<4;i++){
				console.log("inserting with time stamp " + (now+i));
				queueManager.schedule(now+i, cb);
			}

		})();
*/
		return queueManager;
    }
);
