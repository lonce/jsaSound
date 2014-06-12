/*
	The reason I use a soundbank is because I can't figure out how and when 
	ScriptAudioNodes are released (or not), so I can't just get a new sound from 
	the factory every time an event starts or else the system becomes bogged down 
	in calls to the ScriptAudioNode generate audio functions!!!
*/
define(
	["jsaSound/jsaCore/config"],
	function (config) {

	var soundbank = {};
	var m_maxPolyphony;

        var m_polyNum; 
        var snds=[];   

        soundbank.setParam = function(name, val){
                for (var i=0;i<m_maxPolyphony;i++){
                     snds[i].setParam(name, val);   
                }
        }

        soundbank.addSnd = function(sndFactory, poly, outNode){
        	m_maxPolyphony=poly;
        	for(var i=0;i<poly;i++){
        		snds[i]=sndFactory();
        		snds[i].available=true;
                        if (snds[i].hasOutputs()){
                                snds[i].connect(outNode); // collect audio from children output nodes into gainLevelNode 
                        }
        	}
                m_polyNum=0;
        }

        soundbank.getSnd = function(){
		var i=0;
                nextSndNum=m_polyNum;

                console.log("soundbank.getSnd:  nextSndNum = " + nextSndNum);

        	while(i<m_maxPolyphony) {
        		nextSndNum=(nextSndNum+1)%m_maxPolyphony;


                        m_polyNum=nextSndNum;
                        return snds[nextSndNum];
                        /*      
        		if (snds[nextSndNum].available){
        			snds[nextSndNum].available=false;
                                m_polyNum=nextSndNum;
        			return snds[nextSndNum];
        		} else{
        			i=i+1;
        		}
                        */

        	}

                
        	console.log("No sounds currently available - reached maximum polyphony");
        	return undefined;
        }

        soundbank.releaseSnd = function(snd){
        	snd.available=true;
        }


        return soundbank;
});
