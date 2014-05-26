/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/

//PARA: config
//		-audioContext
//		bigNum
define(
	["jsaSound/jsaCore/config", "jsaSound/jsaCore/baseSM"],
	function (config, baseSM) {


		var buffRequested = false;
		var buffLoaded = false; 
		var soundBuff = config.audioContext.createBuffer(2,2,44100); 
		var m_soundUrl = config.resourcesPath + "jsaResources/sounds/141252__oroborosnz__parrots-in-tree.mp3";


		return function () {


			var playWhenBufferLoadsP =false;

			var gainEnvNode = config.audioContext.createGain();
			var gainLevelNode = config.audioContext.createGain();
			var sourceNode;

			var m_gainLevel = .5;

			var m_attackTime = 1,
			m_releaseTime = 3.0,
			stopTime = 0.0,	// will be > audioContext.currentTime if playing
			now = 0.0;


			var myInterface = baseSM({},[],[gainLevelNode]);
			myInterface.setAboutText("Simple mp3 (or wav) sample player - must load sounds from same domain as server.")


			var init = (function (){
				if (! buffRequested){
					buffRequested=true;
					myInterface.loadAudioResource(m_soundUrl, onLoadAudioResource);
				} 
			}());


			// Must keep rebuilding on play() this because sourceNode goes away after you call sourceNode.noeOff()
			var buildModelArchitectureAGAIN = function() {
				sourceNode = config.audioContext.createBufferSource();
				sourceNode.buffer = soundBuff;
				sourceNode.loop = true;
				sourceNode.isPlaying=false;


				gainEnvNode = config.audioContext.createGain();
				gainEnvNode.gain.value = 0;

				sourceNode.connect(gainEnvNode);
				gainEnvNode.connect(gainLevelNode);
			};

			function onLoadAudioResource(b){
				soundBuff = b;
				buffLoaded = true;
				console.log("Buffer Loaded!");
			}

			myInterface.play = function (i_gain) {
				if (arguments.length > 0) {
					myInterface.qplay(config.audioContext.currentTime, i_gain);
				} else{
					myInterface.qplay(config.audioContext.currentTime);
				}
			};

			myInterface.qplay = function (i_ptime, i_gain) {
				if (myInterface.getNumOutConnections() === 0){
					myInterface.connect(config.audioContext.destination);
				}

				if (buffLoaded) {

					sourceNode && sourceNode.disconnect(0);


					buildModelArchitectureAGAIN();

					stopTime = config.bigNum;

					if (arguments.length > 1) {
						myInterface.setParam("Gain", i_gain);
					}

					sourceNode.start(i_ptime);
					sourceNode.isPlaying=true;


					if (myInterface.getNumOutConnections() === 0){
						//console.log("connecting MyInterface to audio context desination");
						myInterface.connect(config.audioContext.destination);
				}		


				} else {
					console.log("Buffer NOT loaded yet! - Will load and play");
					playWhenBufferLoadsP=true;

				}

				now = config.audioContext.currentTime;

				gainEnvNode.gain.cancelScheduledValues(now);
				stopTime = config.bigNum;
				gainEnvNode.gain.setValueAtTime(0, now);
				gainEnvNode.gain.linearRampToValueAtTime(1, now + m_attackTime); // go to gain level over .1 secs

				//gainLevelNode = config.audioContext.createGain();
				gainLevelNode.gain.value = m_gainLevel;


			};

						// ----------------------------------------		
			myInterface.setAttackTime = myInterface.registerParam(
				"Attack Time",
				"range",
				{
					"min": 0,
					"max": 1,
					"val": m_attackTime
				},
				function (i_val) {
					m_attackTime = parseFloat(i_val); // javascript makes me cry ....
				}
			);

			// ----------------------------------------		
			myInterface.setReleaseTime = myInterface.registerParam(
				"Release Time",
				"range",
				{
					"min": 0,
					"max": 3,
					"val": m_releaseTime
				},
				function (i_val) {
					m_releaseTime = parseFloat(i_val); // javascript makes me cry ....
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
					gainLevelNode.gain.value =  i_val;
				}
			);


			myInterface.release = function () {
				now = config.audioContext.currentTime;
				stopTime = now + m_releaseTime;


				gainEnvNode.gain.cancelScheduledValues(now);
				gainEnvNode.gain.setValueAtTime(gainEnvNode.gain.value, now ); 
				gainEnvNode.gain.linearRampToValueAtTime(0, stopTime);

				sourceNode && sourceNode.isPlaying && sourceNode.stop(stopTime);
				if (sourceNode) sourceNode.isPlaying=false; // WHY DOES THIS NOT WORK: sourceNode && sourceNode.isPlaying=false;
			};


			return myInterface;
		};
	}
);