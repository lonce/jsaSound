
// node -> ring
// osc -> ring.gain -> external

define(
    ["jsaSound/jsaSndLib/config", "jsaSound/jsaSndLib/baseSM"],
    function (config, baseSM) {

        return function(){
            var inputGain = config.audioContext.createGain();   // just to get access to the input signal so I can split it in to wet and dry paths
            var outputLevelNode = config.audioContext.createGain();

            var dryGain = config.audioContext.createGain();
            var wetGain = config.audioContext.createGain();
            var ringMod = config.audioContext.createGain();


            var osc = config.audioContext.createOscillator();
            osc.setType(osc.SINE);
            osc.frequency.value = 0; //Math.pow( 2, parseFloat( document.getElementById("rmfreq").value ) );


            inputGain.gain.value=1.0; 
            dryGain.gain.value=1.0;
            wetGain.gain.value=0;


            inputGain.connect(ringMod);  // signal is "carrier" input to modulator
            osc.connect(ringMod.gain); // sample-rate modulation of input 

            inputGain.connect(dryGain);  // input also has a dry "level" (path bypasses the modulator)
            dryGain.connect(outputLevelNode); 

            ringMod.connect(wetGain);    // wet level 
            wetGain.connect(outputLevelNode); 

            var modFreq_default=20;
            var dryWet_default=0;

            var myInterface = baseSM({},[inputGain],[outputLevelNode]);

            myInterface.registerParam(
                    "Gain",
                    "range",
                    {
                        "min": 0,
                        "max": 1,
                        "val": .75
                    },
                    function (i_val) {
                        outputLevelNode.gain.value =  i_val;
                    }
                );

            myInterface.registerParam(
                    "modFreq",
                    "range",
                    {
                        "min": 0,
                        "max": 400,
                        "val": modFreq_default
                    },
                    function (i_val) {
                        osc.frequency.value =  i_val;
                    }
                );

            myInterface.registerParam(
                    "DryWet",
                    "range",
                    {
                        "min": 0,
                        "max": 1,
                        "val": dryWet_default
                    },
                    function (i_val) {
                        // equal-power crossfade
                        dryGain.gain.value = Math.cos(i_val * 0.5*Math.PI);
                        wetGain.gain.value = Math.cos((1.0-i_val) * 0.5*Math.PI);
                    }
                );

            //initialization  for "processing" node that will not have a play() call...
            myInterface.setParam("modFreq", modFreq_default);
            myInterface.setParam("DryWet", dryWet_default);
            osc.start(0);

            return myInterface;
        };
    }
);
