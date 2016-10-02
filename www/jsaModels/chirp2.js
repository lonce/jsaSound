/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/

// ******************************************************************************************************
// A "sound model" (which is essentially just an oscillator).
// There is an attack time, a hold until release() is called, and a decay time.
// ******************************************************************************************************
define(
    ["jsaSound/jsaSndLib/config", "jsaSound/jsaSndLib/baseSM"],
    function (config, baseSM) {
        return function (i_loadedCB) {
            //alert("loaded chirp1");
            var k_latency=0;
            
            var oscNode;// = config.audioContext.createOscillator();  // have to keep recreating this node every time we want to play (if we are not already playing)
            var gainEnvNode = config.audioContext.createGain();
            var gainLevelNode = config.audioContext.createGain(); 

            var k_gainFactor = .5;

            // defaults for setting up initial values (and displays) 
            var m_gainLevel = 0.6;    // the point to (or from) which gainEnvNode ramps glide
            //var m_frequency = 440;

            var k_minCFOctaves = -1; // min for center frequency (octaves re: 440)
            var k_maxCFOctaves = 4;  // min for center frequency (octaves re: 440)
            var k_rangeOMax=2;       // octaves re: CF, up or down

            var m_cFO=2; // octaves (re: 440)
            var m_rangeO=1; //octaves
            var m_frequencyMin = 440*Math.pow(2,m_cFO+m_rangeO);
            var m_frequencyMax = 440*Math.pow(2,m_cFO-m_rangeO);

            var m_duration=.09;
            var m_type=1;

            var stopTime = 0.0;        // will be > config.audioContext.currentTime if playing


            var m_Contour = {
                "tf": [0,.25,.5,1],  // time for freq
                "f": [0,1,.5,1],     // freq val (normalized)
                "ta": [0, .1, .9, 1],// time for amplitude (normalized)
                "a": [0,1,1,0]       // amplitude value
            }

            var scaleFreq=function(normFreq){
                return m_frequencyMin + normFreq*(m_frequencyMax-m_frequencyMin);
            }

            // (Re)create the nodes and thier connections.
            // Must be called everytime we want to start playing since in this model, osc nodes are *deleted* when they aren't being used.
            var buildModelArchitecture = (function () {
                // if you stop a node, you have to recreate it (though doesn't always seem necessary - see jsaFM!
                //oscNode && oscNode.disconnect();
                oscNode = config.audioContext.createOscillator();
                oscNode.setType(m_type);  //square
                oscNode.isPlaying=false;
                //oscNode.frequency.value = m_frequency;

                // make the graph connections
                oscNode.connect(gainEnvNode);
                gainEnvNode.gain.setValueAtTime(0, 0); //(value, time)
                gainEnvNode.connect(gainLevelNode);
                oscNode.start(0);
                oscNode.isPlaying=true;
            })();

            // define the PUBLIC INTERFACE object for the model 
            var myInterface = baseSM({},[],[gainLevelNode]);

            console.log("now I have output nodes");
            myInterface.setAboutText("Simple oscillator (type: sine, square, saw, triangle)");

            // ----------------------------------------
            myInterface.onPlay = function (i_ptime) {
                var now;
                if (i_ptime != undefined){
                    now = Math.max(i_ptime, config.audioContext.currentTime);
                } else {
                    now = config.audioContext.currentTime;
                }


                //console.log("rebuild model node architecture!");
                //buildModelArchitectureAGAIN();   // Yuck - have to do this because we stop() the osc node


                // if no input, remember from last time set
                //oscNode.frequency.value = m_frequency;

                var len = m_Contour.tf.length;
                oscNode.frequency.value = scaleFreq(m_Contour.f[0]);
                //oscNode.frequency.setValueAtTime(0, scaleFreq(m_Contour.f[0]));
                for(var i=0;i<len;i++){
                    //console.log("now = " + now + ", will set freq to " + scaleFreq(m_Contour.f[i]) + " at time " + (now + m_Contour.tf[i]*m_duration));
                    oscNode.frequency.exponentialRampToValueAtTime(scaleFreq(m_Contour.f[i]), (now + k_latency + m_Contour.tf[i]*m_duration));
                }

                len = m_Contour.ta.length;

                gainEnvNode.gain.value = m_Contour.a[0];
                //oscNode.frequency.setValueAtTime(0, scaleFreq(m_Contour.f[0]));

                for(var i=0;i<len;i++){
                     //console.log("now = " + now + ", will set amp to " + m_Contour.a[i] + " at time " + (now + m_Contour.ta[i]*m_duration));
                     gainEnvNode.gain.linearRampToValueAtTime(m_Contour.a[i], (now  + k_latency + m_Contour.ta[i]*m_duration));
                }





                stopTime = config.bigNum;
                gainLevelNode.gain.value = k_gainFactor*m_gainLevel;

            
            };


           myInterface.registerParam(
                "Center Frequency (octaves)",            // the name the user will use to interact with this parameter
                "range",                // the type of the parameter
                {
                    "min": k_minCFOctaves,         // minimum value
                    "max": k_maxCFOctaves,        // maximum value
                    "val": m_cFO  //a variable used to remember value across start/stops
                },
                function (i_arg) {     // function to call when the parameter is changed
                    m_cFO = i_arg;
                    m_frequencyMin = 440*Math.pow(2,m_cFO+m_rangeO);
                    m_frequencyMax = 440*Math.pow(2,m_cFO-m_rangeO);
                }
            );

           myInterface.registerParam(
                "Frequency Range (octaves)",            // the name the user will use to interact with this parameter
                "range",                // the type of the parameter
                {
                    "min": 0,         // minimum value
                    "max": k_rangeOMax,        // maximum value
                    "val": m_rangeO  //a variable used to remember value across start/stops
                },
                function (i_arg) {     // function to call when the parameter is changed
                    m_rangeO = i_arg;
                    m_frequencyMin = 440*Math.pow(2,m_cFO+m_rangeO);
                    m_frequencyMax = 440*Math.pow(2,m_cFO-m_rangeO);
                }
            );

            myInterface.registerParam(
                "Duration",            // the name the user will use to interact with this parameter
                "range",                // the type of the parameter
                {
                    "min": .05,         // minimum value
                    "max": 2,        // maximum value
                    "val": m_duration  //a variable used to remember value across start/stops
                },
                function (i_arg) {     // function to call when the parameter is changed
                    m_duration = i_arg;
                }
            );

            myInterface.registerParam(
                "Type",
                "range",
                {
                    "min": 0,
                    "max": 3.999999,
                    "val": m_type
                },
                function (i_type) {
                    //console.log("in sm.setFreq, oscNode = " + oscNode);
                    i_type=Math.floor(i_type);
                    if (m_type === i_type) return;
                    m_type=i_type;
                    console.log("setting osc type to " + m_type);
                    oscNode && (oscNode.setType(m_type));
                }
            );

 
            myInterface.registerParam(
                "Gain",
                "range",
                {
                    "min": 0,
                    "max": 1,
                    "val": m_gainLevel
                },
                function (i_val) {
                    //console.log("in sm.setGain, gainLevelNode = " + gainLevelNode);
                    m_gainLevel = i_val;
                    gainLevelNode.gain.value = k_gainFactor * m_gainLevel;
                }
            );


            // ----------------------------------------
            myInterface.onRelease = function (i_ptime) {
                var rtime = i_ptime || config.audioContext.currentTime; 

                myInterface.schedule(rtime, function (){
                    var now = config.audioContext.currentTime;
    
                    // ramp gain down to zero over the duration of m_releaseTime
                    gainEnvNode.gain.cancelScheduledValues(now);
                    gainEnvNode.gain.setValueAtTime(gainEnvNode.gain.value, now ); 
                    gainEnvNode.gain.linearRampToValueAtTime(0, now+.001);

                    // when release is finished, stop everything 
                    myInterface.schedule(now + +.001,  function () {
                        if (oscNode && oscNode.isPlaying){
                            //oscNode.stop();
                            oscNode.isPlaying=false; 
                        } 
                        myInterface.stop();
                    });
                });
            };

            i_loadedCB && i_loadedCB(myInterface);
            return myInterface;
        };
    }
);