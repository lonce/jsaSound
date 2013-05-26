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
//	["jsaSound/jsaCore/config", "jsaSound/jsaCore/baseSM", "jsaSound/jsaOpCodes/jsaFileBufferNode", "jsaSound/jsaOpCodes/jsaConvolveNode", "jsaSound/jsaOpCodes/jsaEventPhasor"],
	["jsaSound/jsaCore/config", "jsaSound/jsaCore/baseSM", "jsaSound/jsaOpCodes/jsaBufferNoiseNode", "jsaSound/jsaOpCodes/jsaConvolveNode", "jsaSound/jsaOpCodes/jsaEventPhasor"],
	function (config, baseSM, BufferNoiseNodeFactory, jsaConvolverFactory, jsaEventPhasor) {
		return function () {
			var k_gain_factor=5; // for sounds that just need a boost
			var m_futureinterval = 0.05;  // the amount of time to compute events ahead of now
			var m_slipRate=1; // for BufferSourceNode
			var m_doorSwingRate = 0;  // in events per second
			var m_gainLevel = .9;

			var playingP=false;
			var child = BufferNoiseNodeFactory(.001);
			var m_conv = jsaConvolverFactory("jsaResources/sounds/OneDoorCreak.wav");
			var	swingGainNode = config.audioContext.createGainNode();
			var	gainLevelNode = config.audioContext.createGainNode();

			var m_ephasor = jsaEventPhasor();
			m_ephasor.setFreq(m_doorSwingRate);

			var requestAnimationFrame = window.webkitRequestAnimationFrame;

			m_conv.connect(swingGainNode);
			swingGainNode.gain.value=1.0;
			swingGainNode.connect(gainLevelNode);
			gainLevelNode.gain.value = k_gain_factor*m_gainLevel ;

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

					//child.qplay(ptime);
					init();
					//child.playbackRate.value=m_slipRate;
					child.start(ptime);
					child.stop(ptime+.25)

					m_ephasor.advanceToTick();
					nextTickTime = m_ephasor.nextTickTime();		// so when is the next tick?
				}
				m_ephasor.advanceToTime(next_uptotime); // advance phasor to the current computed upto time.
				requestAnimationFrame(animate);
			};

			var myInterface = baseSM({},[],[gainLevelNode]);
			myInterface.setAboutText("This is a timing experiment  using requestAnimationFrame")


			var init = function () {
					child = BufferNoiseNodeFactory();
					child.connect(m_conv); // collect audio from children output nodes into gainLevelNode 
			};


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
				//child.stop();
				playingP=false;
			};

			myInterface.registerParam(
				"Swing Rate",
				"range",
				{
					"min": 0,
					"max": 1,
					"val": m_doorSwingRate
				},
				function (i_val) {
					var s;
					m_doorSwingRate = parseFloat(i_val);
					s=m_doorSwingRate*m_doorSwingRate;

					m_slipRate=Math.floor(s*15); // number of modes

					// creaking gets softer for high swing rates
					if (s<.7){
						swingGainNode.gain.value=1.0;
					} else{
						swingGainNode.gain.value=1.0-(s-.7)*3.3;
					}

					m_ephasor.setFreq(40*s*m_slipRate); //controls how high the frequency goes

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
					m_gainLevel = i_val;
					gainLevelNode.gain.value = k_gain_factor*m_gainLevel ;
				}
			);

			return myInterface;
		};
	}
);