/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/

/* --------------------------------------------------------------
	Just filtered noise band.
	The index of modulation allows for "faking" narrow-band noise from pure tone to noise. 

	Architecture:
		Gaussian noise Node -> bandpass filter -> gainenv -> gain
******************************************************************************************************
*/

//PARA: config
//		-audioContext
//		-bigNum
define(
	["jsaSound/jsaSndLib/config", "jsaSound/jsaSndLib/baseSM", "jsaSound/jsaSndLib/jsaOpCodes/nativeNoiseNode"],
	function (config, baseSM, noiseNodeFactory) {
		return function () {
			// defined outside "aswNoisyFMInterface" so that they can't be seen be the user of the sound models.
			// They are created here (before they are used) so that methods that set their parameters can be called without referencing undefined objects
			var	m_noiseNode,
				m_filterNode = config.audioContext.createBiquadFilter(),
				gainEnvNode = config.audioContext.createGain(),
				gainLevelNode = config.audioContext.createGain();

			var	oscNode;
			// these are both defaults for setting up initial values (and displays) but also a way of remembring across the tragic short lifetime of Nodes.
			var m_gainLevel = 1, // the point to (or from) which gainEnvNode ramps glide
				m_freq = 880,
				m_Q = 10.0,
				m_attackTime = 0.05,
				m_releaseTime = 1.0,
				stopTime = 0.0,	// will be > audioContext.currentTime if playing
				now = 0.0;

			
			// define the PUBLIC INTERFACE for the model	
			var myInterface = baseSM({},[],[gainLevelNode]);

			myInterface.setAboutText("Simple bandpass-filtered noise");

			var buildModelArchitectureAGAIN = function () {
				oscNode=config.audioContext.createOscillator();
				oscNode.frequency.value = m_freq;
				oscNode.connect(m_filterNode);

			}
			// Create the nodes and thier connections. Runs once on load
			var buildModelArchitecture = (function () {

				m_noiseNode = noiseNodeFactory();


				m_filterNode = config.audioContext.createBiquadFilter();
				m_filterNode.setType("bandpass");
				m_filterNode.frequency.value = m_freq;
				m_filterNode.Q.value = m_Q;

				gainEnvNode = config.audioContext.createGain();
				gainEnvNode.gain.value = 0;

				//gainLevelNode = config.audioContext.createGain();
				gainLevelNode.gain.value = m_gainLevel;
				//console.log("build arch with gain" +  gainLevelNode.gain.value);

				// make the graph connections
				m_noiseNode.connect(m_filterNode);


				m_filterNode.connect(gainEnvNode);

				gainEnvNode.connect(gainLevelNode);

				buildModelArchitectureAGAIN();

			}());



			// ----------------------------------------
			myInterface.onPlay = function (i_ptime) {
			//myInterface.on("play", function(e){
				// if no input, remember from last time set
				now = i_ptime || config.audioContext.currentTime;

				gainLevelNode.gain.value = m_gainLevel;
				//console.log("m_gainLevel ... play with gain " +  gainLevelNode.gain.value);


				gainEnvNode.gain.cancelScheduledValues(now);

				stopTime = config.bigNum;

				gainEnvNode.gain.setValueAtTime(0, now);
				gainEnvNode.gain.linearRampToValueAtTime(1, now + m_attackTime); // go to gain level over .1 secs
				
				oscNode.start(now);
			};

			//console.log("setting play callback on interface owned by " + myInterface.owner);
			//myInterface.on("play", function(e){onPlay(e.i_ptime);});

			// ----------------------------------------
			myInterface.setCenterFreq = myInterface.registerParam(
				"Center Frequency",
				"range",
				{
					"min": 100,
					"max": 2000,
					"val": m_freq
				},
				function (i_val) {
					m_freq = i_val;
					m_filterNode.frequency.value = m_freq;
				}
			);
			// ----------------------------------------
			myInterface.setFilterQ = myInterface.registerParam(
				"Filter Q",
				"range",
				{
					"min": 0,
					"max": 40,
					"val": m_Q
				},
				function (i_val) {
					m_Q = i_val;
					m_filterNode.Q.value = m_Q;
				}
			);

			// ----------------------------------------		
			myInterface.setGain = myInterface.registerParam(
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

			// ----------------------------------------		
			myInterface.setAttackTime = myInterface.registerParam(
				"Attack Time",
				"range",
				{
					"min": 0,
					"max": 1,
					"val": m_attackTime
				},
				function (i_val) {
					m_attackTime = parseFloat(i_val); // javascript makes me cry ....
				}
			);

			// ----------------------------------------		
			myInterface.setReleaseTime = myInterface.registerParam(
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
				now = i_ptime || config.audioContext.currentTime;
				stopTime = now + m_releaseTime;

				//console.log("now is " + now + ", and stopTime is " + stopTime);


				gainEnvNode.gain.cancelScheduledValues(now);
				gainEnvNode.gain.setValueAtTime(gainEnvNode.gain.value, now ); 
				//console.log("current gain is " + gainEnvNode.gain.value);
				gainEnvNode.gain.linearRampToValueAtTime(0, stopTime);

				//myInterface.schedule(stopTime, function () {
					//myInterface.stop(stopTime);
				//});

			};

			//--------------------------------------------------------------------------------
			// Other methods for the interface
			//----------------------------------------------------------------------------------
			myInterface.getFreq = function () {
				return m_freq;
			};
				


			return myInterface;
		};
	}
);