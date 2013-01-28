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
	function (config, baseSM, jsaPatterFactory) {
		return function () {

			var m_rate = 5.0;
			var m_gainLevel = 0.9;

			var	childModel = [];
			var numChildren=0;
			var	gainLevelNode = config.audioContext.createGainNode();

			//================================================VVVVVVVVVVVVVVVVVVVVVVVVVVVV
			var sh = new org.anclab.steller.Scheduler(config.audioContext);
			sh.running = true;
			var ticks; // a track
			var stp_delay = org.anclab.steller.Param({min: 0.01, max: 60, value: 1./m_rate});
			var stp_playingP = org.anclab.steller.Param({min: 0, max: 1, value: 0});

			var m_beatPattern = [];





			//================================================^^^^^^^^^^^^^^^^^^^^^^^^^^^
			
			var init = (function () {

				childModel[0] = jsaPatterFactory("jsaResources/drum-samples/LINN/kick.wav");
				m_beatPattern[0] =  [1.0, .9, .7, 0.5,
									1, 0.0, .0, 0.5,
                          			1.0, 0.5, .0, 0,
                          			0, 0, 0, 0.3];
				childModel[1] = jsaPatterFactory("jsaResources/drum-samples/LINN/snare.wav");
				m_beatPattern[1] =  [1.0, 0.1, .15, 0.2,
									.25, 0.3, .35, 0.4,
                          			0.45, 0.5, .55, 0.6,
                          			.75, 0.8, 8.5, 0];

				numChildren = childModel.length;

				for(var i=0;i<numChildren;i++){

					childModel[i].setBeatPattern(m_beatPattern[i]);
/*
					if (childModel[i].hasOutputs()){
						childModel[i].connect(gainLevelNode); // collect audio from children output nodes into gainLevelNode 
					}
					childModel[i].setParam("Gain", m_gainLevel);
					*/
				}
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
					"min": 0,
					"max": 100,
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
					"max": 1,
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