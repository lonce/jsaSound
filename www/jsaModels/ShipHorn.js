/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/

define(
	["jsaSound/jsaCore/config", "jsaSound/jsaCore/baseSM", "jsaSound/jsaModels/jsaFMnative2",  "jsaSound/jsaCore/utils"],
	function (config, baseSM, childFactory, utils) {
		return function () {

			m_Position=0;

			var numChildren=3;
			var childNode=[];
			var	gainLevelNode = config.audioContext.createGain();

		
			// these are both defaults for setting up initial values (and displays) but also a way of remembring across the tragic short lifetime of Nodes.
			var m_gainLevel = 2.5, // the point to (or from) which gainEnvNode ramps glide
				stopTime = 0.0,	// will be > audioContext.currentTime if playing
				now = 0.0;


			// define the PUBLIC INTERFACE for the model	
			var myInterface = baseSM({},[],[gainLevelNode]);
			myInterface.setAboutText("Template");


			// Create the nodes and thier connections. Runs once on load
			var buildModelArchitecture = (function () {
				for(var i=0;i<numChildren;i++){
					childNode[i] = childFactory();
					childNode[i].connect(gainLevelNode);
				}	
				gainLevelNode.gain.value = m_gainLevel;
			}());


			// ----------------------------------------
			myInterface.onPlay = function (i_ptime) {

				// The rest of the code is for new starts or restarts	
				stopTime = config.bigNum;

				// if no input, remember from last time set
				gainLevelNode.gain.value = m_gainLevel;

				if (myInterface.getNumOutConnections() === 0){
					myInterface.connect(config.audioContext.destination);
				}

				for(var i=0;i<numChildren;i++){
					childNode[i].play(i_ptime);
				}
			};

	
			var ipvals = [0, 309.34, 72.84, 99.31, 0.32, 0.21, 1.55, 0, 309.34, 58.3, 77.85, 0.31, 0.41, 1.43, 0, 309.34, 53.46, 50.87, 0.16, 0.56, 1.49] ;
			var j=0;
			for(var i=0;i<numChildren;i++){
				console.log("each child has " + childNode[i].getNumParams() + " params");
				for(var k=0;k<childNode[i].getNumParams();k++){
					console.log("child[" + i + "].param["+k+"]= ipvals["+j+"]");
					childNode[i].setParam(childNode[i].getParam(k,"name"), ipvals[j++]);
				}

				/* for development 
				myInterface.registerChildParam(childNode[i], "Carrier Frequency", "Carrier Frequency " + i);
				myInterface.registerChildParam(childNode[i], "Modulation Index", "Modulation Index " + i);
				myInterface.registerChildParam(childNode[i], "Modulator Frequency", "Modulator Frequency " + i);
				myInterface.registerChildParam(childNode[i], "Gain", "Gain " + i);
				myInterface.registerChildParam(childNode[i], "Attack Time", "Attack Time " + i);
				myInterface.registerChildParam(childNode[i], "Release Time", "Release Time " + i);
				*/
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
			myInterface.onRelease = function (i_ptime) {

				for(var i=0;i<numChildren;i++){
					childNode[i].release(); 
				}

				myInterface.stop();
			};
			//--------------------------------------------------------------------------------
			// Other methods for the interface
			//----------------------------------------------------------------------------------

				
			return myInterface;
		};
	}
);