/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/


define(
	["jsaSound/jsaSndLib/config", "jsaSound/jsaSndLib/baseSM", "jsaSound/jsaSndLib/jsaOpCodes/nativeFModOsc", "jsaSound/jsaSndLib/jsaOpCodes/jsaConvolveNode", "jsaSound/jsaSndLib/GraphNode"],
	function (config, baseSM, fmodOscFactory, jsaConvolverFactory, GraphNode) {
        return function () {
            var	oscModulatorNode;
            var m_CarrierNode;
            var	gainEnvNode;
            var m_conv; 
            var	gainLevelNode;


            // these are defaults for setting up initial values (and displays) but also a way of remembring across the tragic short lifetime of Nodes.
            var m_gainLevel = 0.5;    // the point to (or from) which gainEnvNode ramps glide
            var m_car_freq = 60;
            var m_car_type = 2;
            var m_mod_freq = 30;
            var m_modIndex = 60.01;
            var m_modIndexOctaves = -1;
            var m_mod_Type = 2;
            var m_attackTime = 0.05;
            var m_releaseTime = 1.0;

            // Begin Setup
            m_CarrierNode = fmodOscFactory();
            gainEnvNode = config.audioContext.createGain();

            m_conv = jsaConvolverFactory(config.resourcesPath + "jsaResources/sounds/knock.wav");

            gainLevelNode = config.audioContext.createGain();

            //console.log("in BUILD, gain level node is " + gainLevelNode );

            // Also have to set all of their state values since they all get forgotten, too!!
            gainLevelNode.gain.value = m_gainLevel;
            gainEnvNode.gain.value = 0;

            m_CarrierNode.setParam("modIndex", m_modIndex);
            m_CarrierNode.setParam("carrierFrequency", m_car_freq);
            m_CarrierNode.setParam("Type", m_car_type);

            // make the graph connections
            m_CarrierNode.connect(m_conv);

            m_conv.connect(gainEnvNode);

            gainEnvNode.connect(gainLevelNode);
            // -- END Setup --

            var myInterface = baseSM({},[],[gainLevelNode]);
            myInterface.setAboutText("A simple frequency modulator with sample-rate modulation of the carrier frequency.");

            // With no note playing, nothing happens when you
            // try to set the frequency.
            // -Kumar
            //function dummySetFreq(i_freq) {}
            //var setFreq = dummySetFreq;

            // play() is a pure play(). To change frequency,
            // use the parameter setting calls before calling play().
            // -Kumar
            var nodeWrapper;
            myInterface.onPlay = function (i_ptime) {
                var now = i_ptime || config.audioContext.currentTime;

                // The model uses an oscillator "voice" as the input that
                // controls the fmodOsc. We make one of these on every play()
                // and throw it away on every release(). Note that the
                // rest of the graph is not remade.
                // -Kumar
                if (!oscModulatorNode) {
                    oscModulatorNode = config.audioContext.createOscillator();
                    oscModulatorNode.setType(m_mod_Type);  

                    //oscModulatorNode.frequency.value = m_mod_freq = m_car_freq*Math.pow(2,m_modIndexOctaves);
                    myInterface.setParam("Carrier Frequency", m_car_freq);

                    /*
                    nodeWrapper=oscModulatorNode;
                    if (m_CarrierNode.nodeType==="GraphNode"){
                        nodeWrapper=GraphNode({}, [], [oscModulatorNode]);
                        console.log("m_CarrierNode has nodeType = " + m_CarrierNode.nodeType);
                    }
                    nodeWrapper.connect(m_CarrierNode);
                    */

                    oscModulatorNode.connect(m_CarrierNode);

                    
                    oscModulatorNode.start(now);
                    gainLevelNode.gain.value = m_gainLevel;

                    gainEnvNode.gain.cancelScheduledValues(now);
                    gainEnvNode.gain.setValueAtTime(0, now);
                    gainEnvNode.gain.linearRampToValueAtTime(1, now + m_attackTime); // go to gain level over .1 secs	
                }

		
            };

            myInterface.registerParam(
                    "Carrier Frequency",
                    "range",
                    {
                        "min": 60,
                        "max": 1200,
                        "val": m_car_freq
                    },
                    function (i_val) {
                        m_car_freq = i_val;
                        m_CarrierNode.setParam("carrierFrequency", m_car_freq);
                        //setFreq(m_car_freq*Math.pow(2,m_modIndexOctaves));
                        m_mod_freq = m_car_freq*Math.pow(2,m_modIndexOctaves);
                        oscModulatorNode && (oscModulatorNode.frequency.value = m_mod_freq);
                         
                    }
                    );

            myInterface.registerParam(
                    "Carrier Type",
                    "range",
                    {
                        "min": 0,
                        "max": 4.99,
                        "val": m_car_type
                    },
                    function (i_val) {
                        m_car_type = Math.floor(i_val);
                        m_CarrierNode.setParam("Type", m_car_type);
                    }
                    );



            myInterface.registerParam(
                    "Modulation Index",
                    "range",
                    {
                        "min": 0,
                        "max": 100,
                        "val": m_modIndex
                    },
                    function (i_val) {
                        m_modIndex = i_val;
                        m_CarrierNode.setParam("modIndex", m_modIndex);
                    }
                    );

            myInterface.registerParam(
                    "Modulator Frequency (octaves rel carrier)",
                    "range",
                    {
                        "min": -2,
                        "max": 0,
                        "val": m_modIndexOctaves // m_mod_freq
                    },
                    function (i_val) {
                        m_modIndexOctaves=i_val;
                        // Turn around and call whatever setFreq function
                        // is active at the moment. Perhaps a release tail
                        // is still active?
                        // -Kumar
                        //setFreq(m_car_freq*Math.pow(2,m_modIndexOctaves));
                        m_mod_freq = m_car_freq*Math.pow(2,m_modIndexOctaves);
                        oscModulatorNode && (oscModulatorNode.frequency.value = m_mod_freq);
                     
                    }
                    );

            myInterface.registerParam(
                    "Modulator Type",
                    "range",
                    {
                        "min": 0,
                        "max": 4.99,
                        "val": m_mod_Type
                    },
                    function (i_val) {
                        m_mod_Type = Math.floor(i_val);
                        if (oscModulatorNode) {
                            oscModulatorNode.setType(m_mod_Type);  
                        }
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

                    // Schedule the osc node to turn off at the stop
                    // time and forget about the node. I think stop()
                    // can only be called once, based on an earlier discussion
                    // with Chris Rogers. So it is much simpler to just
                    // giveup the reference to the "voice" once you
                    // schedule a stop for it.
                    // -Kumar
                    oscModulatorNode.stop(stopTime);
                    oscModulatorNode = null;

                    myInterface.schedule(stopTime, function () {
                        myInterface.stop();
                    });
                    
                }
            };
            
            return myInterface;
        };
	}
);