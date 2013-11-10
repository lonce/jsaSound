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
// The attack and decay have weirdnesses - I *think* I am doing it correctly, so I blame webaudio beta and Canary....
// The attack and decaya
// ******************************************************************************************************
define(
	["jsaSound/jsaCore/config", "jsaSound/jsaCore/baseSM", "jsaSound/jsaOpCodes/jsaKarplusNode"],
	function (config, baseSM, karplusNodeFactory) {
		return function () {
			// defined outside "oscInterface" so that they can't be seen be the user of the sound models.
			// They are created here (before they are used) so that methods that set their parameters can be called without referencing undefined objects
			var	oscNode;// = config.audioContext.createOscillator();
			var	gainEnvNode = config.audioContext.createGainNode();
			var	gainLevelNode = config.audioContext.createGainNode();


			// these are both defaults for setting up initial values (and displays) but also a way of remembring across the tragic short lifetime of Nodes.
			var m_gainLevel = 0.5;    // the point to (or from) which gainEnvNode ramps glide
			var m_frequency = 440;
			var m_attackTime = 0.005;  //
			var m_sustainTime = 0.1;
			var m_releaseTime = 0.2;
			var stopTime = 0.0;        // will be > config.audioContext.currentTime if playing
			var now = 0.0;

			// (Re)create the nodes and thier connections. Because oscNode.notOff invalidates the node
			var buildModelArchitectureAGAIN = function () {
				oscNode = karplusNodeFactory();
				oscNode.setFrequency(m_frequency);  

				gainEnvNode.disconnect();  // essential, or old nonplaying nodes continue to suck down compute resources!
				gainEnvNode = config.audioContext.createGainNode();


				// make the graph connections
				oscNode.connect(gainEnvNode);
				gainEnvNode.connect(gainLevelNode);
			};

			var myInterface = baseSM({},[],[gainLevelNode]);

			myInterface.play = function (i_freq, i_gain) {
				now = config.audioContext.currentTime;
				if (stopTime <= now) { // not playing
					//console.log("rebuild PLUCK model node architecture!");
					buildModelArchitectureAGAIN();
					//oscNode.noteOn(now);
					//gainEnvNode.gain.value = 0;
				} else {  // no need to recreate architectre - the old one still exists since it is playing
					//console.log(" ... NOT building architecure because stopTime (" + stopTime + ") is greater than now (" + now + ")");
				}
				gainEnvNode.gain.cancelScheduledValues(now);
				// The model turns itself off after a fixed amount of time	
				stopTime = now + m_attackTime + m_sustainTime + m_releaseTime;

				// if no input, remember from last time set
				if (i_freq){
					oscNode.setFrequency(i_freq);
				} else {
					oscNode.setFrequency(m_frequency);
				}

				gainLevelNode.gain.value = i_gain || m_gainLevel;

				// linear ramp attack isn't working for some reason (Canary). It just sets value at the time specified (and thus feels like a laggy response time).
				gainEnvNode.gain.setValueAtTime(0, now);
				gainEnvNode.gain.linearRampToValueAtTime(gainLevelNode.gain.value, now + m_attackTime); // go to gain level over .1 secs			
				gainEnvNode.gain.linearRampToValueAtTime(gainLevelNode.gain.value, now + m_attackTime + m_sustainTime);
				gainEnvNode.gain.linearRampToValueAtTime(0, stopTime);

				if (myInterface.getNumOutConnections() === 0){
					//console.log("________connecting MyInterface to audio context desination");
					myInterface.connect(config.audioContext.destination);
				}		

				oscNode.noteOn(now);
			};

			myInterface.registerParam(
				"Frequency",
				"range",
				{
					"min": 50,
					"max": 1000,
					"val": m_frequency
				},
				function (i_freq) {
					//console.log("in sm.setFreq, oscNode = " + oscNode);
					m_frequency = i_freq;
					oscNode.setFrequency(i_freq);
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
				"Sustain Time",
				"range",
				{
					"min": 0,
					"max": 3,
					"val": m_sustainTime
				},
				function (i_val) {
					m_sustainTime = parseFloat(i_val); // javascript makes me cry ....
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

			myInterface.release = function () {
				if (oscNode) oscNode.noteOff(stopTime);  // "cancels" any previously set future stops, I think
			};
			myInterface.stop = function () {
				if (oscNode) oscNode.noteOff(stopTime);  // "cancels" any previously set future stops, I think
			};




			//console.log("paramlist = " + myInterface.getParamList().prettyString());			
			return myInterface;
		};
	}
);