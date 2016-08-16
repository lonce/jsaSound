/*
	The reason I use a soundbank is because I can't figure out how and when 
	ScriptAudioNodes are released (or not), so I can't just get a new sound from 
	the factory every time an event starts or else the system becomes bogged down 
	in calls to the ScriptAudioNode generate audio functions!!!
*/
/**
* Provides polyphonic support
* @module poly.js
* @main poly.js
*/
/**
* @class poly (Function)
*
*/
define(
	["jsaSound/jsaSndLib/config"],
	function (config) {


    /**
    * Creates a pool of instances of a sound model so that they can be played polyphonically
    * @method (poly)
    * @param {Sound Model Factory Function} funciton to be used for creating instances of a sound model
    * @param {Number} poly How large the pool (maximum polyphony) should be
    * @param {audioNode} node that the polyphonic model(s) should connect to  (managed dynamically as nodes are called into and put out of action)
    * @return {Interface Object} the "soundbank" Interface object that exposes all the other methods in this module.
    */
       return function (sndFactory, poly, i_outNode) {

    	   var soundbank = {};
    	   var m_maxPolyphony;

            var m_polyNum; 
            var snds=[];   

            var outNode;

            /**
            * Sets a parameter value (on all polyphonic instances in the pool)
            * @method setParam
            * @param {String} parameter name
            * @param {number} parameter value
            */
            soundbank.setParam = function(name, val){
                    for (var i=0;i<m_maxPolyphony;i++){
                         snds[i].setParam(name, val);   
                    }
            }

 
            /**
            * Sets a normalized parameter value (in [0,1] (on all polyphonic instances in the pool)
            * @method setParamNorm
            * @param {String} parameter name
            * @param {number} parameter value
            */
           soundbank.setParamNorm = function(name, val){
                    for (var i=0;i<m_maxPolyphony;i++){
                         snds[i].setParamNorm(name, val);   
                    }
            }


            /**
            * gets an available sound from the polyphony pool
            * @method getSnd
            */
            soundbank.getSnd = function(){
    		   var i=0;
                nextSndNum=m_polyNum;

                //console.log("soundbank.getSnd:  nextSndNum = " + nextSndNum);

            	while(i<m_maxPolyphony) {
            		nextSndNum=(nextSndNum+1)%m_maxPolyphony;
                                  
            		if (! snds[nextSndNum].polyLock){
            			snds[nextSndNum].polyLock=true; 
                        
                        if (snds[nextSndNum].hasOutputs()){
                            snds[nextSndNum].connect(outNode); // collect audio from children output nodes into gainLevelNode 
                        }

                        m_polyNum=nextSndNum;
                        //console.log("poly getSnd num " + snds[nextSndNum].polyNum)
            			return snds[nextSndNum];
            		} else{
            			i=i+1;
            		}
            	}

                    
            	console.log("No sounds currently available - reached maximum polyphony");
            	return undefined;
            }

            var releaseSnd = function(snd){

            }

//            soundbank.addSnd = function(sndFactory, poly, i_outNode){
            outNode=i_outNode;

            m_maxPolyphony=poly;
            for(var i=0;i<poly;i++){
                snds[i]=sndFactory();
                snds[i].polyLock=false;
                snds[i].polyNum=i;
                snds[i].on("stop", function(e){
                    //console.log("releaseSnd");
                    e.snd.polyLock=false;
                    /*
                    if (e.snd.hasOutputs()){
                        //console.log("poly stop callback, snd " + e.snd.polyNum );
                        e.snd.disconnect(); // collect audio from children output nodes into gainLevelNode 
                    }
                    */
                });

            }
            m_polyNum=0;


            

            return soundbank;
        }
});
