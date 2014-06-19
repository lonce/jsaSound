/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/

define(
	["jsaSound/jsaCore/config", "jsaSound/jsaCore/baseSM", "jsaSound/jsaModels/templates/child",  "jsaSound/jsaCore/utils"],
	function (config, baseSM, childFactory, voiceData, utils) {
		return function () {

			m_Position=0;

			var childNode;
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
				childNode = childFactory();
				gainLevelNode.gain.value = m_gainLevel;
				childNode.connect(gainLevelNode);
			}());


			// ----------------------------------------
			myInterface.onPlay = function (i_ptime) {
				now = i_ptime || config.audioContext.currentTime;
				// The rest of the code is for new starts or restarts	
				stopTime = config.bigNum;

				// if no input, remember from last time set
				gainLevelNode.gain.value = i_gain || m_gainLevel;

				if (myInterface.getNumOutConnections() === 0){
					myInterface.connect(config.audioContext.destination);
				}

				childNode.play(now);
			};

	
			myInterface.setPosition = myInterface.registerParam(
				"Position",
				"range",
				{
					"min": 40,
					"max": 1000,
					"val": m_Position
				},
				function (i_val) {
					m_Position=i_val;
					//childNode.setParam("Frequency", m_freq);
				}
			);

			myInterface.registerChildParam(childNode, "Attack Time");
			myInterface.registerChildParam(childNode, "Release Time");

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
				childNode.release(); 
				myInterface.stop();
			};
			//--------------------------------------------------------------------------------
			// Other methods for the interface
			//----------------------------------------------------------------------------------

				
			return myInterface;
		};
	}
);