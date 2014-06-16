/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/

define(
	["jsaSound/jsaCore/config", "jsaSound/jsaCore/baseSM", "jsaSound/jsaOpCodes/googleJungle", "jsaSound/jsaOpCodes/jsaMicInputNode"],
	function (config, baseSM, jungleNodeFactory, micInputNode) {
		return function () {


			// defined outside "aswNoisyFMInterface" so that they can't be seen be the user of the sound models.
			// They are created here (before they are used) so that methods that set their parameters can be called without referencing undefined objects
			var	m_jungleNode, // = new Jungle( config.audioContext ),
				gainLevelNode; // = config.audioContext.createGain();

			var microphone;

			// these are both defaults for setting up initial values (and displays) but also a way of remembring across the tragic short lifetime of Nodes.
			var m_gainLevel = 2, // the point to (or from) which gainEnvNode ramps glide
				stopTime = 0.0,	// will be > audioContext.currentTime if playing
				now = 0.0;


			// Create the nodes and thier connections. Runs once on load.
			var buildModelArchitecture = (function () {

				m_jungleNode = new Jungle( config.audioContext );

				gainLevelNode = config.audioContext.createGain();
				gainLevelNode.gain.value = 0;


				micInputNode(microphone, m_jungleNode.input);
				m_jungleNode.output.connect(gainLevelNode);

				//gainLevelNode.connect(config.audioContext.destination);
			}());
			

			var myInterface = baseSM({},[],[gainLevelNode]);
			myInterface.setAboutText("NOTE:  Press ALLOW on Main Browser Window before playing.  Uses Chris Wilson's Jungle code (http://webaudiodemos.appspot.com)")


			myInterface.onPlay = function (i_freq, i_gain) {
				now = config.audioContext.currentTime
				stopTime = config.bigNum;

				gainLevelNode.gain.value = i_gain || m_gainLevel;

				if (myInterface.getNumOutConnections() === 0){
					console.log("connecting MyInterface to audio context desination");
					myInterface.connect(config.audioContext.destination);
				}
			};


			myInterface.registerParam(
				"Gain",
				"range",
				{
					"min": 0,
					"max": 2,
					"val": m_gainLevel
				},
				function (i_val) {
					m_gainLevel = i_val;
					now = config.audioContext.currentTime;
					if (stopTime > now)  { // if playing
						gainLevelNode.gain.value = m_gainLevel = i_val;
					}
				}
			);


			myInterface.onRelease = function () {
				now = config.audioContext.currentTime;
				stopTime = now;
				//gainLevelNode.gain.setValueAtTime(0, now);
				gainLevelNode.gain.value = 0;
				console.log("releasing Monster setting gain to = "+ gainLevelNode.gain.value);

				myInterface.stop();
			};

			myInterface.registerParam(
				"Delay Time",
				"range",
				{
					"min": 0.05,
					"max": 0.2,
					"val": .1
				},
				function (i_val) {
					m_jungleNode.setDelay(i_val);
				}
			);



			return myInterface;
		};
	}
);