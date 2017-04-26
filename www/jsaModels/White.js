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
	["jsaSound/jsaSndLib/config", "jsaSound/jsaSndLib/baseSM", "jsaSound/faust/test2"],
	function (config, baseSM) {
		return function (i_loadedCB) {
			

			// defaults for setting up initial values (and displays) 
			var m_gainLevel = 0.2;    // the point to (or from) which gainEnvNode ramps glide
			var m_releaseTime = 1.0;
			var stopTime = 0.0;        // will be > config.audioContext.currentTime if playing

            test2 = faust.test2(config.audioContext, config.k_bufferLength);

            console.log("faust white has " + test2.getNumInputs() + " inputs");


			// (Re)create the nodes and thier connections.
			// Must be called everytime we want to start playing since in this model, osc nodes are *deleted* when they aren't being used.
			var buildModelArchitectureAGAIN = function () {

			};

			// define the PUBLIC INTERFACE object for the model	
			var myInterface = baseSM({},[],[test2]);

			myInterface.setName("white noise");
			myInterface.setAboutText("Faustian white noise");

			// ----------------------------------------
			myInterface.onPlay = function (i_ptime) {
				var now = i_ptime || config.audioContext.currentTime;

				stopTime = config.bigNum;

				//test2.start();
				test2.setParamValue("/0x00/gate", 1);

			
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
					//console.log("in sm.setGain, gainLevelNode = " + gainLevelNode);
					m_gainLevel = i_val;
					test2.setParamValue("/0x00/gain", m_gainLevel);
				}
			);

			// ----------------------------------------
			myInterface.onRelease = function (i_ptime) {
				var rtime = i_ptime || config.audioContext.currentTime; 

				//alert("releasing osc");
				myInterface.schedule(rtime, function (){
					var now = config.audioContext.currentTime;
					// when release is finished, stop everything 
					myInterface.schedule(now + m_releaseTime,  function () {
						myInterface.stop();
					});
				});

				
				test2.setParamValue("/0x00/gate", 0);
				//test2.stop()
			};

			console.log("jsaOsc: soundReady");
			i_loadedCB && i_loadedCB(myInterface);
			return myInterface;
		};
	}
);