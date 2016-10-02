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
        return function (i_loadedCB) {
            var	oscModulatorNode;
            var m_CarrierNode;
            var	gainEnvNode;
            var m_conv; 
            var	gainLevelNode;

            var compressorNode;


            // these are defaults for setting up initial values (and displays) but also a way of remembring across the tragic short lifetime of Nodes.
            var m_gainLevel = 0.5;    // the point to (or from) which gainEnvNode ramps glide
            var m_car_freq = 40;
            var m_car_type = 2;
            var m_mod_freq;  // not used to initialize
            var m_modIndex = 60.0;
            var m_modIndexOctaves = -.81;
            var m_mod_Type = 3;
            var m_attackTime = 0.05;
            var m_releaseTime = 1.0;

            // Begin Setup
            m_CarrierNode = fmodOscFactory();
            gainEnvNode = config.audioContext.createGain();

            m_conv = jsaConvolverFactory(config.resourcesPath + "jsaResources/sounds/knock.wav");

compressorNode = config.audioContext.createDynamicsCompressor();

            gainLevelNode = config.audioContext.createGain();

            gainLevelNode.gain.value = m_gainLevel;
            gainEnvNode.gain.value = 0;

            m_CarrierNode.setParam("modIndex", m_modIndex);
            m_CarrierNode.setParam("carrierFrequency", m_car_freq);
            m_CarrierNode.setParam("Type", m_car_type);

            // make the graph connections
            m_CarrierNode.connect(compressorNode);

            compressorNode.connect(m_conv);

            m_conv.connect(gainEnvNode);

            

            gainEnvNode.connect(gainLevelNode);
            // -- END Setup --

            var myInterface = baseSM({},[],[gainLevelNode]);
            myInterface.setAboutText("Dragaster engine idling to rev");


            var nodeWrapper;
            myInterface.onPlay = function (i_ptime) {
                var now = i_ptime || config.audioContext.currentTime;

                if (!oscModulatorNode) {
                    oscModulatorNode = config.audioContext.createOscillator();
                    oscModulatorNode.setType(m_mod_Type);  

                    myInterface.setParam("Revs", m_car_freq);

                    oscModulatorNode.connect(m_CarrierNode);
               
                    oscModulatorNode.start(now);
                    gainLevelNode.gain.value = m_gainLevel;

                    gainEnvNode.gain.cancelScheduledValues(now);
                    gainEnvNode.gain.setValueAtTime(0, now);
                    gainEnvNode.gain.linearRampToValueAtTime(1, now + m_attackTime); // go to gain level over .1 secs	
                }

            };

            myInterface.registerParam(
                    "Revs",
                    "range",
                    {
                        "min": 40,
                        "max": 400,
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
                    "Badness",
                    "range",
                    {
                        "min": 0,
                        "max": 150,
                        "val": m_modIndex
                    },
                    function (i_val) {
                        m_modIndex = i_val;
                        m_CarrierNode.setParam("modIndex", m_modIndex);
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



            myInterface.onRelease = function (i_ptime) {
                if (oscModulatorNode) {
                    var now = config.audioContext.currentTime;
                    var stopTime = now + m_releaseTime;

                    gainEnvNode.gain.cancelScheduledValues(now);
                    gainEnvNode.gain.setValueAtTime(gainEnvNode.gain.value, now ); 
                    gainEnvNode.gain.linearRampToValueAtTime(0, stopTime);

                    oscModulatorNode.stop(stopTime);
                    oscModulatorNode = null;

                    myInterface.schedule(stopTime, function () {
                        myInterface.stop();
                    });
                    
                }
            };
            i_loadedCB && i_loadedCB(myInterface);
            return myInterface;
        };
	}
);