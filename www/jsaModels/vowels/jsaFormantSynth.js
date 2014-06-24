/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/

define(
	["jsaSound/jsaCore/config", "jsaSound/jsaCore/baseSM", "jsaSound/jsaModels/vowels/GlottalPulse"],
	function (config, baseSM, glottalPulseFactory) {
		return function () {

			k_numFormants=5;
			var i=0;
			var m_freq=240;
			// defined outside "aswNoisyFMInterface" so that they can't be seen be the user of the sound models.
			// They are created here (before they are used) so that methods that set their parameters can be called without referencing undefined objects
			var	gainEnvNode = config.audioContext.createGain(),
				gainLevelNode = config.audioContext.createGain();

			var m_glottalPulseNode;

			var m_filterNode=[];
			var m_filterGainNode=[];

			var m_filterFreq = [];
			var m_filterQ = [];
			var m_filterGain =[];
		
			// these are both defaults for setting up initial values (and displays) but also a way of remembring across the tragic short lifetime of Nodes.
			var m_gainLevel = 2.5, // the point to (or from) which gainEnvNode ramps glide
				m_attackTime = 0.05,
				m_releaseTime = 1.0,
				stopTime = 0.0,	// will be > audioContext.currentTime if playing
				now = 0.0;
		
			// these are both defaults for setting up initial values (and displays) but also a way of remembring across the trme = 0.05,
				m_releaseTime = 1.0,
				stopTime = 0.0,	// will be > audioContext.currentTime if playing
				now = 0.0;


			for(i=0;i<k_numFormants; i++){
				m_filterNode[i]=config.audioContext.createBiquadFilter();
				m_filterGainNode[i] = config.audioContext.createGain();

				m_filterQ[i]=10;
				m_filterGain[i]=.85;
				m_filterFreq[i]=500;
			}
			
			// define the PUBLIC INTERFACE for the model	
			var myInterface = baseSM({},[],[gainLevelNode]);
			myInterface.setAboutText("Formant Synthesizer");


			// Create the nodes and thier connections. Runs once on load
			var buildModelArchitecture = (function () {

				m_glottalPulseNode = glottalPulseFactory();
				m_glottalPulseNode.setParam("Frequency", m_freq);

				gainEnvNode = config.audioContext.createGain();
				gainEnvNode.gain.value = 0;

				//gainLevelNode = config.audioContext.createGain();
				gainLevelNode.gain.value = m_gainLevel;

				for(i=0;i<k_numFormants; i++){
					m_filterNode[i] = config.audioContext.createBiquadFilter();
					m_filterNode[i].setType("bandpass"); 
					m_filterNode[i].frequency.value = m_filterFreq[i];
					m_filterNode[i].Q.value = m_filterQ[i];
					m_filterGainNode[i].gain.value = m_filterGain[i];

					m_glottalPulseNode.connect(m_filterNode[i]); //  noise source to all formants
					m_filterNode[i].connect(m_filterGainNode[i]); // formants to individual gain controls
					m_filterGainNode[i].connect(gainEnvNode); //  all formants sum to env
				}

				gainEnvNode.connect(gainLevelNode);
			}());

			// ----------------------------------------
			myInterface.onPlay = function (i_ptime) {
				now = i_ptime || config.audioContext.currentTime;
				gainEnvNode.gain.cancelScheduledValues(now);
				// The rest of the code is for new starts or restarts	
				stopTime = config.bigNum;

				// if no input, remember from last time set
				gainLevelNode.gain.value = m_gainLevel;

				gainEnvNode.gain.setValueAtTime(0, now);
				gainEnvNode.gain.linearRampToValueAtTime(gainLevelNode.gain.value, now + m_attackTime); // go to gain level over .1 secs


				if (myInterface.getNumOutConnections() === 0){
					myInterface.connect(config.audioContext.destination);
				}

				m_glottalPulseNode.play(i_ptime);
			};

			// ----------------------------------------

	
			myInterface.setFrequency = myInterface.registerParam(
				"Frequency",
				"range",
				{
					"min": 40,
					"max": 1000,
					"val": m_freq
				},
				function (i_val) {
					m_freq=i_val;
					m_glottalPulseNode.setParam("Frequency", m_freq);
				}
			);

			myInterface.registerChildParam(m_glottalPulseNode, "Vibrato Frequency");
			myInterface.registerChildParam(m_glottalPulseNode, "Vibrato Depth");


			myInterface.setCenterFreq=[];
			myInterface.setFilterQ=[];
			myInterface.setFilterGain=[];

			// "Helper" function for creating functions in the loop that follows
			var makeFreqSetter = function(i){
				return function(i_val){
						m_filterFreq[i] = i_val;
						m_filterNode[i].frequency.value = m_filterFreq[i];					
				}
			}

			var makeQSetter = function(i){
				return function(i_val){
						m_filterQ[i] = i_val;
						m_filterNode[i].Q.value = m_filterQ[i];					
				}
			}

			var makeGainSetter = function(i){
				return function(i_val){
						m_filterGain[i] = i_val;
						m_filterGainNode[i].gain.value = m_filterGain[i];					
				}
			}

			for(i=0;i<k_numFormants; i++){
				myInterface.setCenterFreq[i] = myInterface.registerParam(
					"Center Frequency " + i,
					"range",
					{
						"min": 100,
						"max": 4000,
						"val": m_filterFreq[i]
					},
					makeFreqSetter(i)
				);
				// ----------------------------------------
				myInterface.setFilterQ[i] = myInterface.registerParam(
					"Filter Q " + i,
					"range",
					{
						"min": 0,
						"max": 150,
						"val": m_filterQ[i]
					},
					makeQSetter(i)
				);
				// ----------------------- -----------------
				myInterface.setFilterGain[i] = myInterface.registerParam(
					"Filter Gain " + i,
					"range",
					{
						"min": 0,
						"max": 1,
						"val": m_filterGain[i]
					},
					makeGainSetter(i)
				);
			}

			// ----------------------------------------		
			myInterface.setGain = myInterface.registerParam(
				"Gain",
				"range",
				{
					"min": 0,
					"max": 3,
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
				now = config.audioContext.currentTime;
				stopTime = now + m_releaseTime;

				gainEnvNode.gain.cancelScheduledValues(now);
				gainEnvNode.gain.setValueAtTime(gainEnvNode.gain.value, now ); 
				gainEnvNode.gain.linearRampToValueAtTime(0, stopTime);

				m_glottalPulseNode.release(stopTime); 

				myInterface.schedule(stopTime, function () {
					myInterface.stop();
				});

			};
			//--------------------------------------------------------------------------------
			// Other methods for the interface
			//----------------------------------------------------------------------------------

			myInterface.onStop = function (i_time){
				console.log("Formant Synth onStop");
			}
			return myInterface;
		};
	}
);