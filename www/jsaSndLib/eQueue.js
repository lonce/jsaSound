define(
    ["jsaSound/jsaSndLib/config", "jsaSound/jsaSndLib/utils"],
    function eQueueFactory(config, utils){



        return function(){
        	var reqaframe = utils.getRequestAnimationFrameFunc();

        	var interval = .01; //ms to "play ahead" meant to cover events happening between now and the next call back time
        	var queueManager =  {
        		"q" : [], // array of sorted time-stamped objects
        		"nextTime" : 0, // the time of the first event on the q
        		"reqaframe" : function(arg){ reqaframe(arg);},
        		// Q will be sorted from high time to low time
        		// searched from high time to low time
        		// insert so that if time = previous node, playing will happen in order of insert
        		"schedule": function(t, f){
                
                
                    if (t <= config.audioContext.currentTime){
                            f(t);
                            console.log("nosched t= " + t + ", but ct = " + config.audioContext.currentTime);
                            return;
                    }
                    
                    //if quque was empty before, initiate callbacks now
                    if (queueManager.q.length === 0) queueManager.reqaframe(queueManager.processQ);
        			for(var i=0;i<queueManager.q.length;i++){
        				if (queueManager.q[i].time <= t){
        					queueManager.q.splice(i,0,{"time": t, "func": f}); 
        					return;
        				}
        			}
        			// either q.length i 0 or t < all queued items, so insert at the end
        			queueManager.q.splice(queueManager.q.length,0,{"time": t,  "func": f});
        		},
        		"processQ": function(){
        			var now = config.audioContext.currentTime;
        			for (var i=queueManager.q.length-1;i>=0;i--){
        				if (queueManager.q[i].time <= now+interval){
                            //console.log("fire from queue at time " + now + "with timestamp " + queueManager.q[i].time);
        					queueManager.q[i].func(queueManager.q[i].time);
        					queueManager.q.pop();
        				} 
        			}
                    // Only keep callbacks going if there are more queued elements
        			if (queueManager.q.length > 0) queueManager.reqaframe(queueManager.processQ);
        		},

                // remove all elements with time stamps >= than i_time
                "qClear": function(i_time){
                    if ((i_time === undefined) || (i_time === 0)) {
                        queueManager.q=[];
                        return;
                    } 

                    for (var i=0;i<queueManager.q.length; i++){
                        if (queueManager.q[0].time >= i_time){ // queue is ordered from high time to low time
                            queueManager.q.shift();
                        } else{ // we are done - all the rest are lower time
                            return;
                        }
                    }
                }
    		};  // end queueManager


    /*
    		// test it - development only
    		(function (){
    			var now = config.audioContext.currentTime;
    			var cb = function(time){
    				console.log("firing at time " + time);
    			}
    			for(var i=1;i<4;i++){
    				console.log("inserting with time stamp " + (now+i));
    				queueManager.schedule(now+i, tag, cb);
    			}

    		})();
    */
    		return queueManager;
        }
    }
);
