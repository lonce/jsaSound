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

			var k_impulseDuration=.001;
			var k_gain_factor=20; // for sounds that just need a boost
			var m_futureinterval = 0.05;  // the amount of time to compute events ahead of now
			var m_gainLevel = .8;



			var playingP=false;
			var child = BufferNoiseNodeFactory(k_impulseDuration); // short burst, created only once
			//var m_conv = jsaConvolverFactory(config.resourcesPath + "jsaResources/sounds/GlottalPulse.wav");
			var m_conv = jsaConvolverFactory(config.resourcesPath + "jsaResources/sounds/knock.wav");
			var	gainLevelNode = config.audioContext.createGain(); // manipulated by sound user


			var requestAnimationFrame = window.requestAnimationFrame;

			// paramterize and connect graph nodes
			m_conv.connect(gainLevelNode);
			gainLevelNode.gain.value = k_gain_factor*m_gainLevel ;

			var releaseTimeOut;

			//  requestAnimationFrame callback function

			var myInterface = baseSM({},[],[gainLevelNode]);
			myInterface.setAboutText("One knock per play click")


			// get a new SourceBufferNode for every event (oi.)
			var init = function () {
					child = BufferNoiseNodeFactory(k_impulseDuration);
					child.playbackRate.value=.1;
					child.connect(m_conv); // collect audio from children output nodes into gainLevelNode 
			};


			myInterface.play = function (i_freq, i_gain) {
				var now = config.audioContext.currentTime;
				//myInterface.stop();
				releaseTimeOut && clearTimeout(releaseTimeOut);

				init();
				child.start(0);
				child.stop(now+k_impulseDuration); // this would have to change if the SourceBuffer.playRate changes...

				playingP=true;

				if (myInterface.getNumOutConnections() === 0){
					myInterface.connect(config.audioContext.destination);
				}

			};





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