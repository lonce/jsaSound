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


define(
	["jsaSound/jsaSndLib/config", "jsaSound/jsaSndLib/baseSM", "jsaSound/jsaModels/jsaDrumSample", "jsaSound/jsaSndLib/poly", "jsaSound/jsaSndLib/jsaOpCodes/jsaEventPhasor"],
	function (config, baseSM, jsaDrumFactory, poly, jsaEventPhasor) {
		return function (i_fname, i_poly, i_loadedCB) {

			var fooURL = i_fname;
			var m_poly = i_poly || 8;
			var m_rate = 4.0;
			var m_gainLevel = 0.9;


			var snum=0;
			var child;
			var	gainLevelNode = config.audioContext.createGain();

			var polySource = poly(function(){return jsaDrumFactory(i_fname)}, m_poly, gainLevelNode);


            var m_futureinterval = 0.05;  // the amount of time to compute events ahead of now

			//================================================VVVVVVVVVVVVVVVVVVVVVVVVVVVV
            var m_ephasor = jsaEventPhasor();
            m_ephasor.setFreq(m_rate);
            var requestAnimationFrame = window.requestAnimationFrame;


			var m_beatPattern = [1.0, 0, .5, 0,
								.75, 0, .5, 0,
                          		1.0, 0, .5, 0,
                          		.75, 0, .5, 0];

            var m_beatIndex=0;        		
            var temp_gain;
			var myInterface = baseSM({},[],[gainLevelNode]);

            var playingP=false;
            //  requestAnimationFrame callback function
            var animate = function (e) {
                    if (! (playingP=== true)) return;

                    var now = config.audioContext.currentTime;        // this is the time this callback comes in - there could be jitter, etc.        
                    var next_uptotime = now + m_futureinterval;  // comput events that happen up until this time
                    var nextTickTime = m_ephasor.nextTickTime(); // A "tick" is when the phasor wraps around                

                    var ptime;  // the event play time

                    while (next_uptotime > nextTickTime) {
                            ptime = nextTickTime;

                            temp_gain=m_beatPattern[(m_beatIndex++) % m_beatPattern.length];
                            //console.log("qplay at ptime= " + ptime);

                         	if (temp_gain != 0) {
                         	    myInterface.schedule(ptime, function () {
	                             	child=polySource.getSnd(); 
	                             	if (child) {
	                             		child.setParam("Gain", temp_gain);
	                             		child.play(ptime);
	                             	} else{
	                             		console.log("didn't get a poly sound");
	                             	}
                        		});
                         	}


                            m_ephasor.advanceToTick();
                            nextTickTime = m_ephasor.nextTickTime();                // so when is the next tick?
                    }
                    m_ephasor.advanceToTime(next_uptotime); // advance phasor to the current computed upto time.
                    requestAnimationFrame(animate);
            };


			//================================================^^^^^^^^^^^^^^^^^^^^^^^^^^^
			
			myInterface.setAboutText("Schedules a series of drum hits using the DrumSample model.")

			myInterface.onPlay = function (i_ptime) {
				m_beatIndex=0;
				//child.stop(0); // in case it is still releasing...
                var now = config.audioContext.currentTime;
                m_ephasor.setPhase(0.999999999);        // so that the phaser wraps to generate an event immediately after starting
                m_ephasor.setCurrentTime(now);

                playingP=true;
                requestAnimationFrame(animate);

			};

			myInterface.onRelease = function (i_ptime) {
				child && child.release();
				playingP=false;
				myInterface.schedule(config.audioContext.currentTime+.3, function () { // give children time to release
					myInterface.stop();
				});

			};



			myInterface.setBeatPattern = function(parray){
				m_beatPattern=parray;
			}


			myInterface.registerParam(
				"Rate",
				"range",
				{
					"min": 0,
					"max": 24,
					"val": m_rate
				},
				function (i_val) {					
					m_rate = parseFloat(i_val);
					m_ephasor.setFreq(m_rate); //controls how high the frequency goes
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


			//child.setParam("Sound URL", myInterface.getParam("Sound URL", "val"));
			polySource.setParam("Sound URL", myInterface.getParam("Sound URL", "val"));
			i_loadedCB && i_loadedCB(myInterface);
			return myInterface;
		};
	}
);