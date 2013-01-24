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
	["jsaSound/jsaCore/config", "jsaSound/jsaCore/baseSM", "jsaSound/jsaModels/jsaSimpleNoiseTick2"],
	function (config, baseSM, jsaSimpleNoiseTick2Factory) {
		return function () {

			var m_rate = 5.0;
			var m_gainLevel = 0.9;
			var child = jsaSimpleNoiseTick2Factory();
			var	gainLevelNode = config.audioContext.createGainNode();

			//================================================VVVVVVVVVVVVVVVVVVVVVVVVVVVV
			var sh = new org.anclab.steller.Scheduler(config.audioContext);
			sh.running = true;
			var ticks; // a track
			var stp_delay = org.anclab.steller.Param({min: 0.01, max: 60, value: 1./m_rate});
			var stp_playingP = org.anclab.steller.Param({min: 0, max: 1, value: 0});

			function st_play() {
         		return sh.fire(function (clock) {
             	child.play();
         		});
	     	}
			//================================================^^^^^^^^^^^^^^^^^^^^^^^^^^^
			
			var init = (function () {
				if (child.hasOutputs()){
					child.connect(gainLevelNode); // collect audio from children output nodes into gainLevelNode 
				}
				child.setParam("Gain", m_gainLevel);
			}());



			var myInterface = baseSM({},[],[gainLevelNode]);
			myInterface.setAboutText("This is a steller.js schedular timing experiment.")



			myInterface.play = function (i_freq, i_gain) {
				//================================================VVVVVVVVVVVVVVVVVVVVVVVVVVVV
				stp_playingP.value=1;
				ticks = sh.track([
		            st_play(), sh.delay(stp_delay)
		            ]);
				pattern = sh.loop_while(stp_playingP, ticks);
				sh.play(pattern);
				//================================================^^^^^^^^^^^^^^^^^^^^^^^^^^^

				if (myInterface.getNumOutConnections() === 0){
					myInterface.connect(config.audioContext.destination);
				}
			};

			myInterface.release = function () {
				child.release();
				//================================================VVVVVVVVVVVVVVVVVVVVVVVVVVVV
				stp_playingP.value=0;
				sh.stop();
				//================================================^^^^^^^^^^^^^^^^^^^^^^^^^^^
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
					//================================================VVVVVVVVVVVVVVVVVVVVVVVVVVVV
					stp_delay.value = (m_rate===0) ? config.bigNum : 1./m_rate; 
					//================================================^^^^^^^^^^^^^^^^^^^^^^^^^^^
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