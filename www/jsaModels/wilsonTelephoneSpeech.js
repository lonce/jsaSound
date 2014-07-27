/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/
/* #NOTE
Some of the sound models use microphone input. These models only work when run on a proper web web server (thought
one on the localhost will work fine). Also, when the user opens one of these models, the ALLOW/DISALLOW buttons
show up on the main browser window, not the sound model slider box window so it is easy to miss. If the user
doesn't push the ALLOW button, the model will not work properly. 
*/

/* --------------------------------------------------------------

	Architecture:
		 mic input -> bandpass filter -> gainenv -> gain
******************************************************************************************************
*/

//PARA: config
//		-audioContext
//		-bigNum
define(
	["jsaSound/jsaCore/config", "jsaSound/jsaCore/baseSM", "jsaSound/jsaOpCodes/jsaMicInputNode"],
	function (config, baseSM,  micInputNode) {
		return function () {
			// defined outside "aswNoisyFMInterface" so that they can't be seen be the user of the sound models.
			// They are created here (before they are used) so that methods that set their parameters can be called without referencing undefined objects
			var	lpf1 = config.audioContext.createBiquadFilter(),
				lpf2 = config.audioContext.createBiquadFilter(),
				hpf1 = config.audioContext.createBiquadFilter(),
				hpf2 = config.audioContext.createBiquadFilter(),
				gainEnvNode = config.audioContext.createGain(),
				gainLevelNode = config.audioContext.createGain();


			var microphone;

			// these are both defaults for setting up initial values (and displays) but also a way of remembring across the tragic short lifetime of Nodes.
			var m_gainLevel = 0.20, // the point to (or from) which gainEnvNode ramps glide
				m_freq = 1250,
				m_width = 1500,
				m_attackTime = 0.05,
				m_releaseTime = .1,
				stopTime = 0.0,	// will be > audioContext.currentTime if playing
				now = 0.0;

			// (Re)create the nodes and thier connections.
			(function () {


				lpf1 = config.audioContext.createBiquadFilter();
				lpf2 = config.audioContext.createBiquadFilter();
				hpf1 = config.audioContext.createBiquadFilter();
				hpf2 = config.audioContext.createBiquadFilter();

				lpf1.setType("lowpass");
				lpf1.frequency.value = 2000.0;

				lpf2.setType("lowpass");
				lpf2.frequency.value = 2000.0;

				hpf1.setType("highpass");
				hpf1.frequency.value = 500.0;

				hpf2.setType("highpass");
				hpf2.frequency.value = 500.0;

				lpf1.connect( lpf2 );
				lpf2.connect( hpf1 );
				hpf1.connect( hpf2 );



				gainEnvNode = config.audioContext.createGain();
				gainEnvNode.gain.value = 0;

				gainLevelNode = config.audioContext.createGain();
				gainLevelNode.gain.value = m_gainLevel;

				hpf2.connect(gainEnvNode);

				micInputNode(microphone, lpf1);

				//======================================


				gainEnvNode.connect(gainLevelNode);
			}());

			var myInterface = baseSM({},[],[gainLevelNode]);
			myInterface.setAboutText("You must click the ALLOW button on Main Browser Window before playing. Best with headphones and/or external mic.<br>")


			myInterface.onPlay = function (i_ptime) {
				now = i_ptime || config.audioContext.currentTime;
				gainEnvNode.gain.cancelScheduledValues(now);
				// The rest of the code is for new starts or restarts	
				stopTime = config.bigNum;

				// remember from last time set
				gainLevelNode.gain.value =  m_gainLevel;

				gainEnvNode.gain.setValueAtTime(0, now);
				//gainEnvNode.gain.linearRampToValueAtTime(gainLevelNode.gain.value, now + m_attackTime); // go to gain level over .1 secs			
				gainEnvNode.gain.linearRampToValueAtTime(10, now + m_attackTime); // go to gain level over .1 secs			

			};

			myInterface.registerParam(
				"Center Frequency",
				"range",
				{
					"min": 100,
					"max": 2000,
					"val": m_freq
				},
				function (i_val) {
					m_freq = i_val;
					lpf1.frequency.value = m_freq+m_width/2.;
					lpf2.frequency.value = m_freq+m_width/2.;
					hpf1.frequency.value = m_freq-m_width/2.;
					hpf2.frequency.value = m_freq-m_width/2.;					
				}
			);

			myInterface.registerParam(
				"Filter Width",
				"range",
				{
					"min": 0,
					"max": 4000,
					"val": m_width
				},
				function (i_val) {
					m_width = i_val;
					lpf1.frequency.value = m_freq+m_width/2.;
					lpf2.frequency.value = m_freq+m_width/2.;
					hpf1.frequency.value = m_freq-m_width/2.;
					hpf2.frequency.value = m_freq-m_width/2.;					
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
					m_attackTime = parseFloat(i_val); // javascript makes me cry ....
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
				now = config.audioContext.currentTime;

				// shouldn't need this line, but for long sustain times, the system seems to "forget" what its current value is....
				/*
				if (stopTime > now) { // only do this if we are currently playing
					gainEnvNode.gain.linearRampToValueAtTime(gainLevelNode.gain.value, now);
				}
				*/
				// set new stoptime
				stopTime = now + m_releaseTime;
				gainEnvNode.gain.cancelScheduledValues(now);
				gainEnvNode.gain.setValueAtTime(gainEnvNode.gain.value, now ); 
				gainEnvNode.gain.linearRampToValueAtTime(0, stopTime);

				myInterface.schedule(stopTime, function () {
					myInterface.stop();
				});
			};
			//--------------------------------------------------------------------------------
			// Other methods for the interface
			//----------------------------------------------------------------------------------
			myInterface.getFreq = function () {
				return m_freq;
			};
			//console.log("paramlist = " + myInterface.getParamList().prettyString());					
			return myInterface;
		};
	}
);