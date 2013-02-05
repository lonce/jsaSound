/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/
/*
Author: Lonce Wyse
Date: July 2012
*/

/* This model explores using the steller.js schedular for  generating events for other Audio Node. 	
*/

define(
	["jsaSound/jsaCore/config", "jsaSound/jsaCore/baseSM", "jsaSound/jsaModels/jsaBeatPattern"],
	function (config, baseSM, jsaPatternFactory) {
		return function () {

			var m_rate = 4.0;
			var m_gainLevel = 0.9;

			var	childModel = [];
			var numChildren=0;
			var	gainLevelNode = config.audioContext.createGainNode();

			//================================================VVVVVVVVVVVVVVVVVVVVVVVVVVVV

			var ticks; // a track
			var stp_delay = org.anclab.steller.Param({min: 0.01, max: 60, value: 1./m_rate});
			var stp_playingP = org.anclab.steller.Param({min: 0, max: 1, value: 0});

			var m_beatPattern = [];

			var convolver = config.audioContext.createConvolver();
			var convolverbuffer=0;


			//================================================^^^^^^^^^^^^^^^^^^^^^^^^^^^
			
			(function () {

				childModel[0] = jsaPatternFactory(jsaSoundRelHTML + "/jsaResources/drum-samples/4OP-FM/kick.wav");
				m_beatPattern[0] =  [1.0, .5, .3, 1,
									0, 0, .0, 0.3,
                          			1.0, .5, .3, 1,
                          			0, 0, 0, 0.1];

  				childModel[1] = jsaPatternFactory(jsaSoundRelHTML + "/jsaResources/drum-samples/4OP-FM/snare.wav");
  				
				m_beatPattern[1] =  [0,0,0,0,
									0, 1, 0, 1,
                          			0,0,0,0,
                          			0, 1, 0, 0];

  				childModel[2] = jsaPatternFactory(jsaSoundRelHTML + "/jsaResources/drum-samples/4OP-FM/hihat.wav");
  				
				m_beatPattern[2] =  [.1, .2, .1, 0.4,
									.1, .2, .1, 0.4,
                          			.1, .2, .1, 0.4,
                          			.1, .2, .1, 0.4];


				numChildren = childModel.length;

				for(var i=0;i<numChildren;i++){

					childModel[i].setBeatPattern(m_beatPattern[i]);

					if (childModel[i].hasOutputs()){
						childModel[i].connect(convolver); // collect audio from children output nodes into gainLevelNode 
						//childModel[i].connect(gainLevelNode); // collect audio from children output nodes into gainLevelNode 
					}
					convolver.connect(gainLevelNode);
					childModel[i].setParam("Gain", m_gainLevel);
					
				}

				// load impulse response
				var request = new XMLHttpRequest();
  				//request.open("GET", "jsaResources/impulse-response/diffusor1.wav", true);
  				//request.open("GET", "jsaResources/impulse-response/JMP_Rekorder/marshall_cust_m930.wav", true);
  				request.open("GET", jsaSoundRelHTML + "/jsaResources/impulse-response/jazz/GK09_jazz_chorus_room_K.wav", true);
  				request.responseType = "arraybuffer";
  				request.onload = function () {
   					 convolver.buffer = config.audioContext.createBuffer(request.response, false);
   					 console.log("impulse response loaded");
  				}
  				request.send();



			}());



			var myInterface = baseSM({},[],[gainLevelNode]);
			myInterface.setAboutText("Model hierarchy: Beat Set -> Beat Patterns -> Drum Samples")



			myInterface.play = function (i_freq, i_gain) {

				now = config.audioContext.currentTime;
				stopTime = config.bigNum;

				if (arguments.length > 1) {
					myInterface.setParam("Gain", i_gain);
				}

				if (myInterface.getNumOutConnections() === 0){
					myInterface.connect(config.audioContext.destination);
				}
				
				for(var i=0;i<numChildren;i++){
					childModel[i].play();
				}

			};

			myInterface.release = function () {
				for(var i=0;i<numChildren;i++){
					childModel[i].release();
				}
			};

			myInterface.registerParam(
				"Rate",
				"range",
				{
					"min": 3,
					"max": 5,
					"val": m_rate
				},
				function (i_val) {					
					m_rate = parseFloat(i_val);
					for(var i=0;i<numChildren;i++){
						childModel[i].setParam("Rate", m_rate);
					}
				}
			);

			myInterface.registerParam(
				"Gain",
				"range",
				{
					"min": 0,
					"max": 2,
					"val": m_gainLevel
				},
				function (i_val) {
					gainLevelNode.gain.value = m_gainLevel = i_val;
				}

			);

			return myInterface;
		};
	}
);