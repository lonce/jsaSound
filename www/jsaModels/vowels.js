/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/

define(
	["jsaSound/jsaSndLib/config", "jsaSound/jsaSndLib/baseSM", "jsaSound/jsaModels/vowels/jsaFormantSynth", "jsaSound/jsaModels/vowels/voiceData", "jsaSound/jsaSndLib/utils"],
	function (config, baseSM, formantSynthFactory, voiceData, utils) {
		return function (i_loadedCB) {

			k_numFormants=5;
			var i=0;

			m_voices=["bass", "tenor", "countertenor", "alto", "suprano"];
			m_vowels=["a", "e", "i", "o", "u"];

			var m_voiceIdx=0;
			var m_vowelIdx=0;

			var formantSynthNode;
			var m_freq=280;
			// defined outside "aswNoisyFMInterface" so that they can't be seen be the user of the sound models.
			// They are created here (before they are used) so that methods that set their parameters can be called without referencing undefined objects
			var	gainLevelNode = config.audioContext.createGain();

		
			// these are both defaults for setting up initial values (and displays) but also a way of remembring across the tragic short lifetime of Nodes.
			var m_gainLevel = .35, // the point to (or from) which gainEnvNode ramps glide
				m_attackTime = 0.05,
				m_releaseTime = 1.0,
				stopTime = 0.0,	// will be > audioContext.currentTime if playing
				now = 0.0;

			// set all formant parameters for voice and vowel type
			var setVoiceData = function(i_type, i_vowel){
				var m_dataSelect=voiceData[i_type][i_vowel];
				for(i=0;i<k_numFormants; i++){

					formantSynthNode.setParam("Center Frequency " + i, m_dataSelect.F[i]);
					
					formantSynthNode.setParam("Filter Q " + i, m_dataSelect.F[i]/m_dataSelect.B[i]);
					formantSynthNode.setParam("Filter Gain " + i, utils.dB2Ratio(m_dataSelect.G[i]));

				};
			};

			// define the PUBLIC INTERFACE for the model	
			var myInterface = baseSM({},[],[gainLevelNode]);
			myInterface.setAboutText("Vowel Synthesizer.\n Voice: bass, tenor, contra, alto, suprano;\n Vowel: a, e, i, o, u");


			// Create the nodes and thier connections. Runs once on load
			var buildModelArchitecture = (function () {

				formantSynthNode = formantSynthFactory();

				setVoiceData(m_voices[m_voiceIdx], m_vowels[m_vowelIdx]);
				//gainLevelNode = config.audioContext.createGain();
				gainLevelNode.gain.value = m_gainLevel;

				formantSynthNode.connect(gainLevelNode);

			}());


			// ----------------------------------------
			myInterface.onPlay = function (i_ptime) {
				now = i_ptime || config.audioContext.currentTime;
				// The rest of the code is for new starts or restarts	
				stopTime = config.bigNum;

				// if no input, remember from last time set
				gainLevelNode.gain.value = m_gainLevel;

				formantSynthNode.play();
				//formantSynthNode.setParam("play", 1);
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
					formantSynthNode.setParam("Frequency", m_freq);
				}
			);

			myInterface.registerChildParam(formantSynthNode, "Vibrato Depth");
			myInterface.registerChildParam(formantSynthNode, "Vibrato Frequency");

			myInterface.setVoice = myInterface.registerParam(
				"Voice",
				"range",
				{
					"min": 0,
					"max": 4.9999,
					"val": 0
				},
				function (i_val) {
					var oldval = m_voiceIdx;
					m_voiceIdx=Math.floor(i_val);
					if (m_voiceIdx !=oldval ){
						setVoiceData(m_voices[m_voiceIdx], m_vowels[m_vowelIdx]);
					}
				}
			);

			myInterface.setVowel = myInterface.registerParam(
				"Vowel",
				"range",
				{
					"min": 0,
					"max": 4.9999,
					"val": 0
				},
				function (i_val) {
					var oldval = m_vowelIdx;
					m_vowelIdx=Math.floor(i_val);
					if (m_vowelIdx !=oldval ){
						setVoiceData(m_voices[m_voiceIdx], m_vowels[m_vowelIdx]);
					}
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
					formantSynthNode.setParam("Attack Time", m_attackTime)
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
					formantSynthNode.setParam("Release Time", m_releaseTime)
				}
			);

			// ----------------------------------------
			myInterface.onRelease = function (i_ptime) {
				now = config.audioContext.currentTime;
				stopTime = now + m_releaseTime;

				//formantSynthNode.release(); // twould be nice to be able to provide a time argument here
				formantSynthNode.setParam("play", 0);

				myInterface.schedule(stopTime, function () {
					myInterface.stop();
				});
				
			};
			//--------------------------------------------------------------------------------
			// Other methods for the interface
			//----------------------------------------------------------------------------------

			myInterface.onStop = function (i_ptime) {
				console.log("vowles: onStop");
			}
			i_loadedCB && i_loadedCB(myInterface);
			return myInterface;
		};
	}
);