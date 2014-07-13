/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/

/* --------------------------------------------------------------
	This drone model was inspired by a Matt Diamond post to the public-audio@w3.org list.
	
	The idea here is to have one sound model control a bunch of others (Thus the "meta" in the name).
	Architecture:
		MetaDrone2 has an array of other soundmodles that it starts, stops, and controls through paramters.
		It grabs output from the "children" models and routs it through its own gainLevel node before passing it on. 
******************************************************************************************************
*/

define(
	["jsaSound/jsaCore/config", "jsaSound/jsaCore/baseSM", "jsaSound/jsaCore/utils", "jsaSound/jsaModels/jsaMicThru", "jsaSound/jsaModels/jsaMonsterVoice"],
	function (config, baseSM, utils, jsaMicThruFactory, jsaMonsterFactory) {
		return function () {
			var	childModel = [];
			var k_maxNumChildren = 2;

			var m_currentNumChildrenActive = 2;
			

			var stopTime = 0.0;        // will be > audioContext.currentTime if playing
			var now = 0.0;

			var m_gainLevel = 3;
			var gainLevelNode = config.audioContext.createGain();  // will collect output the children

			var m_drywet=0; //dry;


			// Init runs once when the sound model is constructed only
			var foo = 0;
			var init = (function () {
				var i;
				childModel[0] = jsaMicThruFactory();
				childModel[1] = jsaMonsterFactory();
				for (i = 0; i < k_maxNumChildren; i += 1) {
					if (childModel[i].hasOutputs()){
						childModel[i].connect(gainLevelNode); // collect audio from children output nodes into gainLevelNode 
					}
				}
				//gainLevelNode.connect(config.defaultDesintation);
				//childModel[0].play(); // turn on unprocessed microphone
			}());

			// define the PUBLIC INTERFACE for the model	
			var myInterface = baseSM({},[],[gainLevelNode]); // make gainLevelNode available for connections
			myInterface.setAboutText("Press ALLOW (twice) on Main Browser Window before playing.  Uses Chris Wilson's Jungle code (http://webaudiodemos.appspot.com)");

			// ----------------------------------------
			myInterface.onPlay = function (i_ptime) {
				var i;
				now = config.audioContext.currentTime;
				stopTime = config.bigNum;
				//console.log("Drone: PLAY! time = " + now);

				if (myInterface.getNumOutConnections() === 0){
					myInterface.connect(config.defaultDesintation);
				}

				gainLevelNode.gain.value = m_gainLevel;  // collector turn back up


				//Start telephone Speech
				childModel[0].setParam("Gain", 1-m_drywet);
				childModel[1].setParam("Gain", m_drywet);
				childModel[1].setParam("Delay Time", .07);
				childModel[1].play();
				childModel[0].play();


			};

			myInterface.onRelease = function (i_ptime) {
				var i;
				now = config.audioContext.currentTime;
				stopTime = now;
				//console.log("RELEASE! time = " + now + ", and stopTime = " + stopTime);
				//console.log("will send release to " + m_currentNumChildrenActive + " currently active children");
				
				// Revert to playin unprocessed microphone
				childModel[0].release();
				childModel[1].release();

				//console.log("------------[released]");
			};


			// ----------------------------------------
			//	Parameters 
			// ----------------------------------------

			myInterface.registerParam(
				"DryWet",
				"range",
				{
					"min": 0,
					"max": 1,
					"val": m_drywet
				},

				function (i_val) {
					m_drywet = i_val;
					childModel[0].setParam("Gain", 1-m_drywet);
					childModel[1].setParam("Gain", m_drywet);
				}

			);


			myInterface.registerParam(
				"Gain",
				"range",
				{
					"min": 0,
					"max": 4,
					"val": m_gainLevel
				},

				function (i_val) {
					gainLevelNode.gain.value = m_gainLevel = i_val;
				}

			);

			//console.log("paramlist = " + myInterface.getParamList().prettyString());			
			return myInterface;
		};
	}
);