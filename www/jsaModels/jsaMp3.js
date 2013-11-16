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
		return function () {
			//Useful addition:
			//When the file finishes playing, change release time to 0;
			//otherwise it's confusing: Press release and it will wait for the release time, but won't really DO anything
			//user may just click play immediately, and the architecture won't be rebuilt, so noting will happen

			//CUrrently, I've just enabled looping to overcome that problem

			var buffLoaded = false;

			var xhr = new XMLHttpRequest();

			var soundBuff = config.audioContext.createBuffer(2,2,44100); 

			var gainLevelNode = config.audioContext.createGain();
			var gainEnvNode = config.audioContext.createGain();
			var sourceNode;

			var m_gainLevel = 1.0;
			var m_attackTime = 0.05;
			var m_releaseTime = 1.0;
			var m_soundUrl = "";
			var stopTime = 0.0;
			var now = 0.0;

			var myInterface = baseSM({},[],[gainLevelNode]);
			myInterface.setAboutText("Simple mp3 (or wav) player - must load sounds from same domain as server.")

			// Must keep rebuilding on play() this because sourceNode goes away after you call sourceNode.noeOff()
			buildModelArchitectureAGAIN = function() {
				sourceNode = config.audioContext.createBufferSource();
				sourceNode.buffer = soundBuff;
				sourceNode.loop = true;

				sourceNode.connect(gainEnvNode);
				gainEnvNode.connect(gainLevelNode);
			};

			function sendXhr() {				
				//SHOULD XHR BE RE-CONSTRUCTED??
				xhr.open('GET', m_soundUrl, true);
				xhr.responseType = 'arraybuffer';
				xhr.onerror = function (e) {
					console.error(e);
				};
				xhr.onload = function () {
					console.log("Sound(s) loaded");
					soundBuff = config.audioContext.createBuffer(xhr.response, false);
					buffLoaded = true;
					console.log("Buffer Loaded!");
				};
				xhr.send();		
			}

			myInterface.play = function (i_gain) {
				if (buffLoaded) {
					now = config.audioContext.currentTime;

					console.log("rebuilding");
					sourceNode && sourceNode.disconnect(0); // in case it wasn't stop()ed, we still want to get rid of it before rebuilding.
					buildModelArchitectureAGAIN();
					sourceNode.start(now);
					gainEnvNode.gain.value = 0;

					gainEnvNode.gain.cancelScheduledValues(now);

					stopTime = config.bigNum;

					gainLevelNode.gain.value = i_gain || m_gainLevel;
					console.log("Gain set at " + gainLevelNode.gain.value);

					gainEnvNode.gain.setValueAtTime(0, now);
					gainEnvNode.gain.linearRampToValueAtTime(1, now + m_attackTime);

					if (myInterface.getNumOutConnections() === 0){
						console.log("connecting MyInterface to audio context desination");
						myInterface.connect(config.audioContext.destination);
					}		


				} else {
					console.log("Buffer NOT loaded yet!");
					//CREATE EXTERNAL CALLBACK HERE!!!
					alert("Press load and wait!");
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
					gainLevelNode.gain.value =  i_val;
				}
			);

			myInterface.registerParam(
				"Attack Time",
				"range",
				{
					"min": 0,
					"max": 1,
					"val": m_attackTime
				},
				function (i_val) {
					m_attackTime = parseFloat(i_val);
				}
			);

			myInterface.registerParam(
				"Release Time",
				"range",
				{
					"min": 0,
					"max": 3,
					"val": m_releaseTime
				},
				function (i_val) {
					m_releaseTime = parseFloat(i_val);
				}
			);

			myInterface.registerParam(
				"Sound URL",
				"url",
				{
					"val": config.resourcesPath + "jsaResources/sounds/BeingRural22k.mp3"
				},
				function (i_val) {
					m_soundUrl = i_val;
					buffLoaded = false;
					sendXhr();
				}
			);

			myInterface.release = function () {
				now = config.audioContext.currentTime;
				stopTime = now + m_releaseTime;

				gainEnvNode.gain.cancelScheduledValues(now);
				gainEnvNode.gain.setValueAtTime(gainEnvNode.gain.value, now ); 
				gainEnvNode.gain.linearRampToValueAtTime(0, stopTime);
				sourceNode && sourceNode.stop(stopTime);
				console.log("ok, releasing");
			};

			return myInterface;
		};
	}
);