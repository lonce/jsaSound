/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/

/* --------------------------------------------------------------
	Just a short blast of noise
*/

define(
	//["jsaSound/jsaSoundLib/config", "jsaSound/jsaSoundLib/baseSM", "jsaSound/jsaSoundLib/jsaOpCodes/jsaBufferNoiseNode"],
	["jsaSound/jsaSoundLib/config", "jsaSound/jsaSoundLib/baseSM", "jsaSound/jsaSoundLib/jsaOpCodes/jsaBufferNoiseNodeFactoryMaker"],
	function (config, baseSM, noiseNodeFactoryMaker) {
		return function () {

			var noiseNodeFactory = noiseNodeFactoryMaker();


			var m_attack = 0.002;
			var m_sustain = 0.01;
			var m_release = 2.002;
			var stopTime = 0.0;        // will be > audioContext.currentTime if playing
			var now;

			// new for each tick
			var noiseNode;

			var m_gainLevel = 0.40;
			var	gainLevelNode = config.audioContext.createGain();
			
			// permanent part of graph
			var	gainEnvNode;


			var myInterface = baseSM({},[],[gainLevelNode]);
			myInterface.setAboutText("EXPERIMENTAL. Noise tick qith qplay(time) method - used in NoiseTrigger2");

			function rebuildArchitecture(){
				gainEnvNode = config.audioContext.createGain();	
				gainEnvNode.gain.setValueAtTime(0, 0);		
				//noiseNode.connect(gainEnvNode);		
				gainEnvNode.connect(gainLevelNode);

				noiseNode = noiseNodeFactory();
				noiseNode.loop=true;
				noiseNode.connect(gainEnvNode);
			}

			//myInterface.qplay = function (i_ptime) {};

			myInterface.onPlay = function (i_ptime) {
				var ptime = (! i_ptime)? 0 : i_ptime; 
				now = config.audioContext.currentTime;
				ptime = Math.max(now, ptime || now);



				rebuildArchitecture();

				noiseNode.start();

				console.log("noiseTick qplay -----")

				//console.log("NodeNoiseTick: now is " + now + ", and ptime is " + i_ptime);
				
				//console.log("Noise tick play call at time = " + now);

				
				//var ptime = i_ptime;


				//gainEnvNode.gain.cancelScheduledValues(ptime);
				// The model turns itself off after a fixed amount of time	
				stopTime = ptime + m_attack + m_sustain + m_release;
				console.log("now is " + now + ", and stop time is " + stopTime);

				// Generate the "event"
				gainEnvNode.gain.setValueAtTime(0, ptime);
				gainEnvNode.gain.linearRampToValueAtTime(1, ptime + m_attack);
				gainEnvNode.gain.linearRampToValueAtTime(1, ptime + m_attack + m_sustain);
				gainEnvNode.gain.linearRampToValueAtTime(0, ptime + m_attack + m_sustain + m_release);
				noiseNode.stop(ptime + m_attack + m_sustain + m_release);
			};

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
					"val": m_attack
				},
				function (i_val) {
					m_attack = parseFloat(i_val);  // javascript makes me cry ....
				}
			);

			myInterface.registerParam(
				"Sustain Time",
				"range",
				{
					"min": 0,
					"max": 300,
					"val": m_sustain
				},
				function (i_val) {
					m_sustain = parseFloat(i_val); // javascript makes me cry ....
				}
			);

			myInterface.registerParam(
				"Release Time",
				"range",
				{
					"min": 0,
					"max": 3,
					"val": m_release
				},
				function (i_val) {
					m_release = parseFloat(i_val); // javascript makes me cry ....
				}
			);

			myInterface.onRelease = function (i_ptime) {
				now = config.audioContext.currentTime;
				stopTime = now + m_release;
				console.log("release called at time " + now + ", and will stop at time " + stopTime);

				gainEnvNode.gain.cancelScheduledValues(now);
				gainEnvNode.gain.setValueAtTime(gainEnvNode.gain.value, now ); 
				gainEnvNode.gain.linearRampToValueAtTime(0, stopTime);
				noiseNode.stop(stopTime);

				myInterface.schedule(stopTime, function () {
					myInterface.stop();
				});
			};


			//console.log("paramlist = " + myInterface.getParamList().prettySstring());					
			return myInterface;
		};
	}
);