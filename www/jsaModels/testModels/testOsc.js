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
	["jsaSound/jsaCore/config", "jsaSound/jsaCore/baseSM", "jsaSound/jsaOpCodes/ringModulatorNode", "jsaSound/jsaCore/GraphNode"],
	function (config, baseSM, ringModulatorFactory, GraphNode) {
		return function () {
			
			var	oscNode;// = config.audioContext.createOscillator();  // have to keep recreating this node every time we want to play (if we are not already playing)
			var oscNodeUnwrapped;

			var	gainEnvNode = config.audioContext.createGain();
			var	gainLevelNode = config.audioContext.createGain(); 

			// defaults for setting up initial values (and displays) 
			var m_gainLevel = 0.25;    // the point to (or from) which gainEnvNode ramps glide
			var m_frequency = 440;
			var m_attackTime = 0.05;
			var m_releaseTime = 1.0;
			var stopTime = 0.0;        // will be > config.audioContext.currentTime if playing
			var now = 0.0;

			var rm = ringModulatorFactory();



			// (Re)create the nodes and thier connections.
			// Must be called everytime we want to start playing since in this model, osc nodes are *deleted* when they aren't being used.
			var buildModelArchitectureAGAIN = function () {
				// if you stop a node, you have to recreate it (though doesn't always seem necessary - see jsaFM!
				oscNodeUnwrapped && oscNodeUnwrapped.disconnect();

				//oscNodeUnwrapped = config.audioContext.createOscillator();
				//oscNode=org.anclab.steller.GraphNode(oscNodeUnwrapped, [], [oscNodeUnwrapped]);


				oscNodeUnwrapped = config.audioContext.createOscillator();
				oscNode=GraphNode({}, [], [oscNodeUnwrapped]);

				oscNodeUnwrapped.type = 1;  //square
				oscNodeUnwrapped.isPlaying=false;

				// make the graph connections


				//oscNode.connect(gainEnvNode);
				oscNode.connect(rm);

				rm.connect(gainEnvNode);

				gainEnvNode.connect(gainLevelNode);
			};

			// define the PUBLIC INTERFACE for the model	
			var myInterface = baseSM({},[],[gainLevelNode]);
			myInterface.setAboutText("Simple square wave with attack, hold, release");

			// ----------------------------------------
			myInterface.play = function (i_freq, i_gain) {
				now = config.audioContext.currentTime;

				console.log("rebuild model node architecture!");
				buildModelArchitectureAGAIN();   // Yuck - have to do this because we stop() the osc node
				oscNodeUnwrapped.start(now);


				oscNodeUnwrapped.isPlaying=true;
				gainEnvNode.gain.value = 0;

				gainEnvNode.gain.cancelScheduledValues(now);

				stopTime = config.bigNum;

				// if no input, remember from last time set
				oscNodeUnwrapped.frequency.value = i_freq || m_frequency;

				gainEnvNode.gain.setValueAtTime(0, now);
				gainEnvNode.gain.linearRampToValueAtTime(1, now + m_attackTime); // go to gain level over .1 secs
				gainLevelNode.gain.value = i_gain || m_gainLevel;

				if (myInterface.getNumOutConnections() === 0){
					console.log("connecting MyInterface to audio context desination");
					myInterface.connect(config.audioContext.destination);
				}
			};

			myInterface.registerParam(
				"Frequency",
				"range",
				{
					"min": 200,
					"max": 1000,
					"val": m_frequency
				},
				function (i_freq) {
					//console.log("in sm.setFreq, oscNode = " + oscNode);
					oscNodeUnwrapped.frequency.value = m_frequency = i_freq;
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

			// ----------------------------------------
			myInterface.release = function () {
			    var now = config.audioContext.currentTime;
                var stopTime = now + m_releaseTime;

                gainEnvNode.gain.cancelScheduledValues(now);
                gainEnvNode.gain.setValueAtTime(gainEnvNode.gain.value, now ); 
                gainEnvNode.gain.linearRampToValueAtTime(0, stopTime);


				oscNodeUnwrapped && oscNodeUnwrapped.isPlaying && oscNodeUnwrapped.stop(stopTime);
				if (oscNodeUnwrapped) oscNodeUnwrapped.isPlaying=false; // WHY DOES THIS NOT WORK: sourceNode && sourceNode.isPlaying=false;

			};

			myInterface.registerChildParam(rm, "modFreq");
			myInterface.registerChildParam(rm, "DryWet");

			return myInterface;
		};
	}
);