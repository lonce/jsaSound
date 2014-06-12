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
	["jsaSound/jsaCore/config", "jsaSound/jsaCore/baseSM", "jsaSound/jsaModels/jsaDrumSample"],
	function (config, baseSM, jsaDrumFactory) {
		return function (i_fname) {

			var fooURL = i_fname;
			var m_rate = 5.0;
			var m_gainLevel = 0.9;
			var child = jsaDrumFactory(i_fname);
			var	gainLevelNode = config.audioContext.createGain();

			//================================================VVVVVVVVVVVVVVVVVVVVVVVVVVVV
			var sched; // = new org.anclab.steller.Scheduler(config.audioContext);
			//sh.running = true;
			var ticks; // a track
			var stp_delay = org.anclab.steller.Param({min: 0.01, max: 60, value: 1./m_rate});
			var stp_playingP = org.anclab.steller.Param({min: 0, max: 1, value: 0});

			var m_beatPattern = [1.0, 0, .5, 0,
								.75, 0, .5, 0,
                          		1.0, 0, .5, 0,
                          		.75, 0, .5, 0];

            var m_beatIndex=0;        		
            var temp_gain;
			var myInterface = baseSM({},[],[gainLevelNode]);


            (function () {

				sched = myInterface.getSched();

				if (child.hasOutputs()){
					child.connect(gainLevelNode); // collect audio from children output nodes into gainLevelNode 
				}
				child.setParam("Gain", m_gainLevel);
			}());



			function st_play() {
         		return sched.fire(function (clock) {
         			temp_gain=m_beatPattern[(m_beatIndex++) % m_beatPattern.length];
         			if (temp_gain > 0){
             			child.play(clock.t1);
             		}
         		});
	     	}
			//================================================^^^^^^^^^^^^^^^^^^^^^^^^^^^
			
			myInterface.setAboutText("Schedules a series of drum hits using the DrumSample model.")





			myInterface.play = function (i_freq, i_gain) {
				m_beatIndex=0;
				child.stop(0); // in case it is still releasing...
				//================================================VVVVVVVVVVVVVVVVVVVVVVVVVVVV
				stp_playingP.value=1;
				ticks = sched.track([
		            st_play(), sched.delay(stp_delay)
		            ]);
				pattern = sched.loop_while(stp_playingP, ticks);
				sched.play(pattern);
				//================================================^^^^^^^^^^^^^^^^^^^^^^^^^^^

				if (myInterface.getNumOutConnections() === 0){
					myInterface.connect(config.audioContext.destination);
				}
			};

			myInterface.release = function () {
				child.release();
				//================================================VVVVVVVVVVVVVVVVVVVVVVVVVVVV
				stp_playingP.value=0;
				sched.stop();
				//================================================^^^^^^^^^^^^^^^^^^^^^^^^^^^
			};



			myInterface.setBeatPattern = function(parray){
				m_beatPattern=parray;
			}


			myInterface.registerParam(
				"Rate",
				"range",
				{
					"min": 0,
					"max": 12,
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
				"Sound URL",
				"url",
				{
					"val": i_fname || (config.resourcesPath + "jsaResources/drum-samples/LINN/snare.wav")
				},
				function (i_val) {
					val = i_val;
					child.setParam("Sound URL", val);
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

			// load the default sound
			child.setParam("Sound URL", myInterface.getParam("Sound URL", "val"));
			return myInterface;
		};
	}
);