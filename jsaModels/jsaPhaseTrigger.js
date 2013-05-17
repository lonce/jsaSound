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
/* #INCLUDE
jsaComponents/jsaAudioComponents.js
	for baseSM 
	
jsaModels/jsaSimpleNoiseTick2.js
	 for jsaSimpleNoiseTickFactory2
	 
*/
/* This model explores using JavaScriptAudioNode.onaudioprocess() as a callback for generating events for other Audio Node. 
	A phasor is used to trigger events for another SoundModel each time it "ticks" (wraps around).
	
*/

define(
	["jsaSound/jsaCore/config", "jsaSound/jsaCore/baseSM", "jsaSound/jsaModels/JSNodeNoiseTick2", "jsaSound/jsaOpCodes/jsaEventPhasor"],
	//["jsaSound/jsaCore/config", "jsaSound/jsaCore/baseSM", "jsaSound/jsaModels/BufferNodeNoiseTick2", "jsaSound/jsaOpCodes/jsaEventPhasor"],
	function (config, baseSM, JSNodeNoiseTick2Factory, jsaEventPhasor) {
		return function () {
			var m_futureinterval = 0.05;  // the amount of time to compute events ahead of now

			var m_rate = 1;  // in events per second
			var m_gainLevel = 0.40;

			var playingP=false;

			var child = JSNodeNoiseTick2Factory();

			var	gainLevelNode = config.audioContext.createGainNode();


			var m_ephasor = jsaEventPhasor();
			m_ephasor.setFreq(m_rate);

			var requestAnimationFrame = window.webkitRequestAnimationFrame;

			//  requestAnimationFrame callback function
			var animate = function (e) {
				if (! (playingP=== true)) return;

				var now = config.audioContext.currentTime;	// this is the time this callback comes in - there could be jitter, etc.	
				var next_uptotime = now + m_futureinterval;
				var nextTickTime = m_ephasor.nextTickTime(); // A "tick" is when the phasor wraps around		

				//console.log("cb now = " + now + ", next TickTime is " + nextTickTime + ", uptoTime is " + next_uptotime);

				var ptime;  // the event play time

				while (next_uptotime > nextTickTime) {
					ptime = nextTickTime;

					child.qplay(ptime);

					m_ephasor.advanceToTick();
					nextTickTime = m_ephasor.nextTickTime();		// so when is the next tick?
				}
				m_ephasor.advanceToTime(next_uptotime); // advance phasor to the current computed upto time.
				requestAnimationFrame(animate);
			};

			var myInterface = baseSM({},[],[gainLevelNode]);
			myInterface.setAboutText("This is a timing experiment  using requestAnimationFrame")


			var init = (function () {
				if (child.hasOutputs()){
					child.connect(gainLevelNode); // collect audio from children output nodes into gainLevelNode 
				}
				child.setParamNorm("Gain", m_gainLevel);
			}());


			myInterface.play = function (i_freq, i_gain) {
				var now = config.audioContext.currentTime;
				m_ephasor.setPhase(0.999999999);	// so that the phaser wraps to generate an event immediately after starting
				m_ephasor.setCurrentTime(now);

				playingP=true;
				requestAnimationFrame(animate);

				if (myInterface.getNumOutConnections() === 0){
					myInterface.connect(config.audioContext.destination);
				}
			};

			myInterface.release = function () {
				child.release();
				playingP=false;
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
					m_ephasor.setFreq(m_rate);
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