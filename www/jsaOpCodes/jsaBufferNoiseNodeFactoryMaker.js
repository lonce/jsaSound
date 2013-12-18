

define(
    ["jsaSound/jsaCore/config", "jsaSound/jsaCore/utils"],
    function (config) {

        //private and shared
        var AC=config.audioContext;

        return function(){  // This is the factoryMaker

            //private to each caller
            var i, N;        
            var noiseBuffer;// = AC.createBuffer(1, 5 * AC.sampleRate, AC.sampleRate);
            var noiseData=0; //= noiseBuffer.getChannelnoiseData(0);



            // Only the bufferSource node needs to be created for every on start() stop() pair - not the buffer.
            // no args means use the same noiseData buffer as before if it exist
            // More than 0 args means recompute the sample buffer
            // norm factor means sample amplitudes should sum to this number (rms might be better)
            return function (i_seconds, i_rms) {  // this is the Node factory
                
                var source = AC.createBufferSource();
                var a_rms;

                seconds = i_seconds || 1;

                if ((noiseData===0) || (arguments.length > 0)){
                    noiseBuffer=AC.createBuffer(1, Math.max(1,AC.sampleRate*seconds), AC.sampleRate);
                    noiseData=noiseBuffer.getChannelData(0);
                    for (var i=0;i<noiseData.length;i++){
                        noiseData[i]=2*Math.random()-1;
                    }
                   // scale to desired rms
                    if (i_rms != undefined){
                        a_rms=noiseData.rms();
                        console.log("++ Before  scaling, rms is " + a_rms);
                        noiseData.scale(i_rms/a_rms);
                    }
                    //console.log("Length of noiseData is " + noiseData.length + ", rms is " + noiseData.rms() + ", and max is " + noiseData.max());
                }


                source.buffer = noiseBuffer;
                source.loop = false;
                //source.gain.value = 1.0;

                return source;
            };
        }; // end of factoryMaker
    }
);