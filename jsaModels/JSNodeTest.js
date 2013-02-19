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
	["jsaSound/jsaCore/config", "jsaSound/jsaCore/baseSM"],
	function (config, baseSM) {
		return function () {

			var m_gainLevel = 0.1;
			var	gainLevelNode = config.audioContext.createGainNode();

/*
			var noiseNode = noiseNodeFactory();
			noiseNode.setType("white");
*/
			var count=0;
			var noiseNode = config.audioContext.createScriptProcessor(config.k_bufferLength, 1, 1);
			noiseNode.onaudioprocess = function (e) {
				var outBuffer = e.outputBuffer.getChannelData(0);
				console.log("NoiseNode on audio processes count = " + count++);
				var i;
				//for (i = 0; i < config.k_bufferLength; i += 1) {
				for (i = 0; i < outBuffer.length; i += 1) {
					outBuffer[i] = Math.random() * 2 - 1;
				}
			}


			noiseNode.connect(gainLevelNode);
			gainLevelNode.connect(config.audioContext.destination);
			gainLevelNode.gain.value = 0;

			var myInterface = baseSM({},[],[]);
			myInterface.setAboutText("Bare bones script node test (watch the console window - onAudioProcess just stops being called after an indeterminate amount of time)");


			myInterface.play = function (i_ptime) {
				gainLevelNode.gain.value = m_gainLevel;
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



			myInterface.release = function () {
				gainLevelNode.gain.value = 0;
			};


			//console.log("paramlist = " + myInterface.getParamList().prettySstring());					
			return myInterface;
		};
	}
);