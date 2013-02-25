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
	//["jsaSound/jsaCore/config", "jsaSound/jsaCore/baseSM", "jsaSound/jsaOpCodes/jsaBufferNoiseNode"],
	["jsaSound/jsaCore/config", "jsaSound/jsaCore/baseSM", "jsaSound/jsaOpCodes/jsaNoiseNode"],
	function (config, baseSM, noiseNodeFactory) {
		return function () {
			var m_attack = 0.002;
			var m_sustain = 0.01;
			var m_release = 0.002;
			var stopTime = 0.0;        // will be > audioContext.currentTime if playing
			var now;


			var noiseNode = noiseNodeFactory();
				noiseNode.setType("white");
				noiseNode.keep();

			var m_gainLevel = 0.40;
			var	gainLevelNode = config.audioContext.createGainNode();
			
			// permanent part of graph
			var	gainEnvNode = config.audioContext.createGainNode();	
				gainEnvNode.gain.setValueAtTime(0, 0);		
				noiseNode.connect(gainEnvNode);		
				gainEnvNode.connect(gainLevelNode);

			

			var myInterface = baseSM({},[],[gainLevelNode]);
			myInterface.setAboutText("EXPERIMENTAL. Noise tick qith qplay(time) method - used in NoiseTrigger2");

			myInterface.play = function () {
				myInterface.qplay(config.audioContext.currentTime);
			};

			myInterface.qplay = function (i_ptime) {
				if (myInterface.getNumOutConnections() === 0){
					myInterface.connect(config.audioContext.destination);
				}

				now = config.audioContext.currentTime;
				//console.log("NodeNoiseTick: now is " + now + ", and ptime is " + i_ptime);
				
				console.log("Noise tick play call at time = " + now);
				var ptime = Math.max(now, i_ptime || now);
				
				//var ptime = i_ptime;


				gainEnvNode.gain.cancelScheduledValues(ptime);
				// The model turns itself off after a fixed amount of time	
				stopTime = ptime + m_attack + m_sustain + m_release;

				// Generate the "event"
				gainEnvNode.gain.setValueAtTime(0, ptime);
				gainEnvNode.gain.linearRampToValueAtTime(1, ptime + m_attack);
				gainEnvNode.gain.linearRampToValueAtTime(1, ptime + m_attack + m_sustain);
				gainEnvNode.gain.linearRampToValueAtTime(0, ptime + m_attack + m_sustain + m_release);
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

			myInterface.release = function () {
				now = config.audioContext.currentTime;
				stopTime = now + m_release;

				gainEnvNode.gain.cancelScheduledValues(now);
				gainEnvNode.gain.setValueAtTime(gainEnvNode.gain.value, now ); 
				gainEnvNode.gain.linearRampToValueAtTime(0, stopTime);
			};


			//console.log("paramlist = " + myInterface.getParamList().prettySstring());					
			return myInterface;
		};
	}
);