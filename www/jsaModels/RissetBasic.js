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
			
			var oscNodes=[];
			var numOscs=10; 

			//var	oscNode;// = config.audioContext.createOscillator();  // have to keep recreating this node every time we want to play (if we are not already playing)
			var	gainEnvNode = config.audioContext.createGain();
			var	gainLevelNode = config.audioContext.createGain(); 

			var k_gainFactor = .1;

			// defaults for setting up initial values (and displays) 
			var m_gainLevel = 0.3;    // the point to (or from) which gainEnvNode ramps glide
			var m_frequency = 60;

			var m_spacing=.05;

			var m_type=1;

			var m_attackTime = 0.25;
			var m_releaseTime = 1.0;
			var stopTime = 0.0;        // will be > config.audioContext.currentTime if playing


			// (Re)create the nodes and thier connections.
			// Must be called everytime we want to start playing since in this model, osc nodes are *deleted* when they aren't being used.
			var buildModelArchitectureAGAIN = function () {
				// if you stop a node, you have to recreate it (though doesn't always seem necessary - see jsaFM!

				for(var i=0;i<numOscs;i++){
					oscNodes[i] && oscNodes[i].disconnect();
					oscNodes[i] = config.audioContext.createOscillator();
					oscNodes[i].setType(m_type);  //square
					oscNodes[i].isPlaying=false;
					oscNodes[i].frequency.value = m_frequency+i*m_spacing;

					// make the graph connections
					oscNodes[i].connect(gainEnvNode);
				}
				gainEnvNode.connect(gainLevelNode);
			};

			// define the PUBLIC INTERFACE object for the model	
			var myInterface = baseSM({},[],[gainLevelNode]);

			console.log("now I have output nodes");
			myInterface.setAboutText("Simple oscillator (type: sine, square, saw, triangle)");

			// ----------------------------------------
			myInterface.onPlay = function (i_ptime) {
				var now = i_ptime || config.audioContext.currentTime;

				console.log("rebuild model node architecture!");
				buildModelArchitectureAGAIN();   // Yuck - have to do this because we stop() the osc node
				for (var i=0;i<numOscs;i++){
					oscNodes[i].start(now);
					oscNodes[i].isPlaying=true;
					// if no input, remember from last time set
					oscNodes[i].frequency.value = m_frequency+i*m_spacing;
				}

				gainLevelNode.gain.value = k_gainFactor*m_gainLevel;

				//gainEnvNode.gain.value = 0
				gainEnvNode.gain.cancelScheduledValues(now);

				stopTime = config.bigNum;

				gainEnvNode.gain.setValueAtTime(0, now);
				gainEnvNode.gain.linearRampToValueAtTime(1, now + m_attackTime); // go to gain level over .1 secs

			
			};

			myInterface.registerParam(
				"Frequency",			// the name the user will use to interact with this parameter
				"range",				// the type of the parameter
				{
					"min": 20,			// minimum value
					"max": 100,		// maximum value
					"val": m_frequency  //a variable used to remember value across start/stops
				},
				function (i_freq) {		// function to call when the parameter is changed
					m_frequency = i_freq;
					for(var i=0;i<numOscs;i++){
						oscNodes[i] && (oscNodes[i].frequency.value = m_frequency+i*m_spacing);
					}
				}
			);

			myInterface.registerParam(
				"Type",
				"range",
				{
					"min": 1,
					"max": 2.999999,
					"val": m_type
				},
				function (i_type) {
					//console.log("in sm.setFreq, oscNode = " + oscNode);
					i_type=Math.floor(i_type);
					if (m_type === i_type) return;
					m_type=i_type;
					console.log("setting osc type to " + m_type);
					for(var i=0;i<numOscs;i++){
						oscNodes[i] && (oscNodes[i].setType(m_type));
					}
				}
			);


			myInterface.registerParam(
				"Spacing",
				"range",
				{
					"min": 0,
					"max": .25,
					"val": m_spacing
				},
				function (i_arg) {
					m_spacing = i_arg;
					for(var i=0;i<numOscs;i++){
						oscNodes[i] && (oscNodes[i].frequency.value = m_frequency+i*m_spacing);
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
					//console.log("in sm.setGain, gainLevelNode = " + gainLevelNode);
					m_gainLevel = i_val;
					gainLevelNode.gain.value = k_gainFactor * m_gainLevel;
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
			myInterface.onRelease = function (i_ptime) {
				var rtime = i_ptime || config.audioContext.currentTime; 

				myInterface.schedule(rtime, function (){
					var now = config.audioContext.currentTime;
	
					// ramp gain down to zero over the duration of m_releaseTime
					gainEnvNode.gain.cancelScheduledValues(now);
					gainEnvNode.gain.setValueAtTime(gainEnvNode.gain.value, now ); 
					gainEnvNode.gain.linearRampToValueAtTime(0, now + m_releaseTime);

					// when release is finished, stop everything 
					myInterface.schedule(now + m_releaseTime,  function () {
						for(var i=0; i<numOscs;i++){
							if (oscNodes[i] && oscNodes[i].isPlaying){
								oscNodes[i].stop();
								oscNodes[i].isPlaying=false; 
							} 
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