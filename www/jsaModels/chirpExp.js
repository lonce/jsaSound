/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/


define(
	["jsaSound/jsaSndLib/config", "jsaSound/jsaSndLib/baseSM", "jsaSound/jsaSndLib/jsaOpCodes/nativeFModOsc","jsaSound/jsaSndLib/GraphNode"],
	function (config, baseSM, fmodOscFactory, GraphNode) {
        return function (i_loadedCB) {
            var	oscModulatorNode;
            var m_CarrierNode;
            var	gainEnvNode;
            var	gainLevelNode;

            // these are defaults for setting up initial values (and displays) but also a way of remembring across the tragic short lifetime of Nodes.
            var m_gainLevel = .25;    // the point to (or from) which gainEnvNode ramps glide
            var m_car_freq = 4200;
            var m_mod_freq = 16;
            var m_modIndex = 1000;
            var m_attackTime = 0.05;
            var m_releaseTime = 0.1;


            var m_type=1;

            // Setup the fixed nodes that the FM modulator node (oscModulatorNode)
            // must connect to.
            // -Kumar
            // -- BEGIN FIXED SETUP --
            m_CarrierNode = fmodOscFactory();
            gainEnvNode = config.audioContext.createGain();
            gainLevelNode = config.audioContext.createGain();

            //console.log("in BUILD, gain level node is " + gainLevelNode );

            // Also have to set all of their state values since they all get forgotten, too!!
            gainLevelNode.gain.value = m_gainLevel;
            gainEnvNode.gain.value = 0;

            m_CarrierNode.setParam("modIndex", m_modIndex);
            m_CarrierNode.setParam("Type", m_type);

            // make the graph connections
            m_CarrierNode.connect(gainEnvNode);

            gainEnvNode.connect(gainLevelNode);
            // -- END FIXED SETUP --

            var myInterface = baseSM({},[],[gainLevelNode]);
            myInterface.setAboutText("A simple frequency modulator with sample-rate modulation of the carrier frequency.");


             myInterface.setAboutText("A simple frequency modulator with sample-rate modulation of the carrier frequency.");

  
            var nodeWrapper;
            myInterface.onPlay = function (i_ptime) {
                var now = config.audioContext.currentTime;

                // The model uses an oscillator "voice" as the input that
                // controls the fmodOsc. We make one of these on every play()
                // and throw it away on every release(). Note that the
                // rest of the graph is not remade.
                // -Kumar

                if (!oscModulatorNode) {
                    oscModulatorNode = config.audioContext.createOscillator();
                    oscModulatorNode.setType(0);  //sin
                    oscModulatorNode.frequency.value = m_mod_freq;

                    /*
                    nodeWrapper=oscModulatorNode;
                    if (m_CarrierNode.nodeType==="GraphNode"){
                        nodeWrapper=GraphNode({}, [], [oscModulatorNode]);
                        //console.log("m_CarrierNode has nodeType = " + m_CarrierNode.nodeType);
                    }
                    nodeWrapper.connect(m_CarrierNode);
                    */
                    oscModulatorNode.connect(m_CarrierNode);
                    oscModulatorNode.start(now);
                }
                    

                    gainLevelNode.gain.value = m_gainLevel;

                    gainEnvNode.gain.cancelScheduledValues(now);
                    gainEnvNode.gain.setValueAtTime(0, now);
                    gainEnvNode.gain.linearRampToValueAtTime(gainLevelNode.gain.value, now + m_attackTime); // go to gain level over .1 secs	


            };

            myInterface.onRelease = function (i_ptime) {
                if (oscModulatorNode) {
                    // Good to keep these local variables instead of
                    // common model ones
                    // -Kumar
                    var now = config.audioContext.currentTime;
                    var stopTime = now + m_releaseTime;

                    gainEnvNode.gain.cancelScheduledValues(now);
                    gainEnvNode.gain.setValueAtTime(gainEnvNode.gain.value, now ); 
                    gainEnvNode.gain.linearRampToValueAtTime(0, stopTime);

                    myInterface.schedule(stopTime, function () {
                        myInterface.stop(stopTime);
                        oscModulatorNode && oscModulatorNode.stop(stopTime);
                        oscModulatorNode = null;
                   });

                }
            };

            myInterface.onStop = function (i_ptime){
                
            }


            myInterface.registerParam(
                    "Carrier Frequency",
                    "range",
                    {
                        "min": 3500,
                        "max": 5000,
                        "val": m_car_freq
                    },
                    function (i_val) {
                        m_car_freq = i_val;
                        m_CarrierNode.setParam("carrierFrequency", m_car_freq);
                    }
                    );

            myInterface.registerParam(
                    "Modulation Index",
                    "range",
                    {
                        "min": 0,
                        "max": 1200,
                        "val": m_modIndex
                    },
                    function (i_val) {
                        m_modIndex = i_val;
                        m_CarrierNode.setParam("modIndex", m_modIndex);
                    }
                    );

           myInterface.registerParam(
                    "Modulator Frequency",
                    "range",
                    {
                        "min": 12,
                        "max": 24,
                        "val": m_mod_freq
                    },
                    function (i_val) {
                        m_mod_freq = i_val;
                        oscModulatorNode && (oscModulatorNode.frequency.value = m_mod_freq);

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
                    //oscNode && (oscNode.setType(m_type));
                    m_CarrierNode.setParam("Type", m_type);
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
                        gainLevelNode.gain.value = m_gainLevel = i_val;
                    }
                    );

            myInterface.registerParam(
                    "Attack Time",
                    "range",
                    {
                        "min": 0,
                        "max": 1,
                        "val": m_attackTime
                    },
                    function (i_val) {
                        m_attackTime = parseFloat(i_val);  // javascript makes me cry ....
                    }
                    );

            myInterface.registerParam(
                    "Release Time",
                    "range",
                    {
                        "min": 0,
                        "max": 3,
                        "val": m_releaseTime
                    },
                    function (i_val) {
                        m_releaseTime = parseFloat(i_val); // javascript makes me cry ....
                    }
                    );

            

            /* just experimenting ....
            myInterface.storeCurrentPSet();
            myInterface.setParamNorm("Gain", 0.1);
            myInterface.storeCurrentPSet();
            myInterface.savePSets();
            */


            m_CarrierNode.setParam("carrierFrequency", m_car_freq);
            i_loadedCB && i_loadedCB("chirpExp");
            return myInterface;
        };
    }
);