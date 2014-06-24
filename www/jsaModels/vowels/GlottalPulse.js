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
Date: June 2013
*/

define(
	["jsaSound/jsaCore/config", "jsaSound/jsaCore/baseSM", "jsaSound/jsaOpCodes/jsaBufferNoiseNodeFactoryMaker", "jsaSound/jsaOpCodes/jsaConvolveNode", "jsaSound/jsaOpCodes/jsaEventPhasor"],
	function (config, baseSM, BufferNoiseNodeFactoryMaker, jsaConvolverFactory, jsaEventPhasor) {
		return function () {
			                        
			var BufferNoiseNodeFactory = BufferNoiseNodeFactoryMaker();


			var k_impulseDuration=.003;
			var k_gain_factor=5; // for sounds that just need a boost
			var m_futureinterval = 0.05;  // the amount of time to compute events ahead of now
			var m_gainLevel = .9;

			var m_frequency=200;
			// for triggering periodic events
			var m_ephasor = jsaEventPhasor();
			m_ephasor.setFreq(m_frequency);

			// Vibrato by modulating the frequency of the glottal pulse triggering phasor
			var m_modF=4.5;     // modulation frequency (vibrato)
			var m_modPercent=.015; // modultation index (range of vibrato)
			var m_modPhasor=jsaEventPhasor(); 
			m_modPhasor.setFreq(m_modF);


			var playingP=false;
			var child = BufferNoiseNodeFactory(k_impulseDuration); // short burst, created only once
			//var m_conv = jsaConvolverFactory(config.resourcesPath + "jsaResources/sounds/GlottalPulse.wav");
			var m_conv = jsaConvolverFactory(config.resourcesPath + "jsaResources/sounds/GlottalPulse.wav");
			var	gainLevelNode = config.audioContext.createGain(); // manipulated by sound user


			var requestAnimationFrame = window.requestAnimationFrame;

			// paramterize and connect graph nodes
			m_conv.connect(gainLevelNode);
			gainLevelNode.gain.value = k_gain_factor*m_gainLevel ;

			var releaseTimeOut;

			//  requestAnimationFrame callback function
			var animate = function (e) {
				if (! (playingP=== true)) return;

				var now = config.audioContext.currentTime;	// this is the time this callback comes in - there could be jitter, etc.	

				var ph = m_modPhasor.advanceToTime(now);
				var tempf = m_frequency*(1+m_modPercent*Math.sin(2*Math.PI*ph));
				m_ephasor.setFreq(tempf);

				var next_uptotime = now + m_futureinterval;  // comput events that happen up until this time
				var nextTickTime = m_ephasor.nextTickTime(); // A "tick" is when the phasor wraps around		

				var ptime;  // the event play time

				while (next_uptotime > nextTickTime) {
					ptime = nextTickTime;

					//child.qplay(ptime);
					init();
					child.start(ptime);
					child.stop(ptime+k_impulseDuration); // this would have to change if the SourceBuffer.playRate changes...

					m_ephasor.advanceToTick();
					nextTickTime = m_ephasor.nextTickTime();		// so when is the next tick?
				}
				m_ephasor.advanceToTime(next_uptotime); // advance phasor to the current computed upto time.


				requestAnimationFrame(animate);
			};

			var myInterface = baseSM({},[],[gainLevelNode]);
			myInterface.setAboutText("Glottal pulse meant to be used within other sounds (like voies)")


			// get a new SourceBufferNode for every event (oi.)
			var init = function () {
					child = BufferNoiseNodeFactory();
					child.connect(m_conv); // collect audio from children output nodes into gainLevelNode 
			};


			myInterface.onPlay = function (i_ptime) {
				var now = i_ptime || config.audioContext.currentTime;
				//myInterface.stop(now);

				m_ephasor.setPhase(0.999999999);	// so that the phaser wraps to generate an event immediately after starting
				m_ephasor.setCurrentTime(now);

				playingP=true;
				requestAnimationFrame(animate);

				if (myInterface.getNumOutConnections() === 0){
					myInterface.connect(config.audioContext.destination);
				}
			};

			myInterface.onRelease = function (i_time) {
				// stops the animation frame callbacks
				if (arguments.length===0){
					myInterface.stop();
				} else{
					//releaseTimeOut=setTimeout(function(){myInterface.stop();},dur);
						myInterface.schedule(i_time, function () {
							myInterface.stop();
						});
				}

			};

			myInterface.onStop = function () {
				// stops the animation frame callbacks
				console.log("golttal stop!");
				playingP=false;
			};

			// Exposed soundmodel parameters --------------------

			myInterface.registerParam(
				"Frequency",
				"range",
				{
					"min": 40,
					"max": 1000,
					"val": m_frequency
				},
				function (i_val) {
					m_frequency=i_val;
					// with vibrato, we set this in animate()
					//m_ephasor.setFreq(m_frequency); //controls how high the frequency goes

				}
			);

			myInterface.registerParam(
				"Vibrato Frequency",
				"range",
				{
					"min": 0,
					"max": 6,
					"val": m_modF
				},
				function (i_val) {
					m_modF=i_val;
					m_modPhasor.setFreq(m_modF);
					// force depth to 0 as mod frequency gets close to 0
					m_modPercent = (this.getParam("Vibrato Depth", "val")/100.0) * Math.min(1, m_modF*3 );
					console.log("modPercent is " + m_modPercent);
				}
			);

			myInterface.registerParam(
				"Vibrato Depth",
				"range",
				{
					"min": 0,
					"max": 5,
					"val": m_modPercent*100
				},
				function (i_val) {
					// force depth to 0 as mod frequency gets close to 
					m_modPercent = (i_val/100.0) * Math.min(1, m_modF*3 );
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