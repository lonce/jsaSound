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
		return function (i_fname) {


			var buffLoaded = false;

			var xhr = new XMLHttpRequest();
			//var foo = new ArrayBuffer(100);
			var soundBuff = config.audioContext.createBuffer(2,2,44100); 

			var gainLevelNode = config.audioContext.createGainNode();
			var gainEnvNode = config.audioContext.createGainNode();
			var sourceNode;

			var m_gainLevel = 1.0;
			var m_attackTime = 0.02;
			var m_releaseTime = 1.0;
			var m_soundUrl = "";
			var stopTime = 0.0;
			var now = 0.0;

       		

			var myInterface = baseSM({},[],[gainLevelNode]);
			myInterface.setAboutText("Simple mp3 (or wav) sample player - must load sounds from same domain as server.")



			var init = (function (){
				i_fname && sendXhr(i_fname);
			}());


			// Must keep rebuilding on play() this because sourceNode goes away after you call sourceNode.noeOff()
			buildModelArchitectureAGAIN = function() {
				sourceNode = config.audioContext.createBufferSource();
				sourceNode.buffer = soundBuff;
				sourceNode.loop = false;

				sourceNode.connect(gainEnvNode);
				gainEnvNode.connect(gainLevelNode);
			};

			function sendXhr(i_url) {			
				m_soundUrl 	= i_url;
				buffLoaded = false;
				//SHOULD XHR BE RE-CONSTRUCTED??
				xhr.open('GET', i_url, true);
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
					if (stopTime > i_ptime) {
						gainEnvNode.gain.cancelScheduledValues(i_ptime);
					}
					buildModelArchitectureAGAIN();

					stopTime = config.bigNum;
					sourceNode.noteOff(stopTime);

					sourceNode.noteOn(i_ptime);

					if (arguments.length > 1) {
						myInterface.setParam("Gain", i_gain);
					}

					console.log("Gain set at " + gainLevelNode.gain.value);

					gainEnvNode.gain.setValueAtTime(0, i_ptime);
					gainEnvNode.gain.linearRampToValueAtTime(1, i_ptime + m_attackTime);

					if (myInterface.getNumOutConnections() === 0){
						console.log("connecting MyInterface to audio context desination");
						myInterface.connect(config.audioContext.destination);
				}		


				} else {
					console.log("Buffer NOT loaded yet!");
					//CREATE EXTERNAL CALLBACK HERE!!!
					//alert("Press load and wait!");
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
					"val": i_fname || "jsaResources/drum-samples/LINN/snare.wav"
				},
				function (i_val) {
					sendXhr(i_val);
				}
			);

			myInterface.release = function () {
				now = config.audioContext.currentTime;
				stopTime = now + m_releaseTime;

				gainEnvNode.gain.cancelScheduledValues(now);
				gainEnvNode.gain.setValueAtTime(gainEnvNode.gain.value, now ); 
				gainEnvNode.gain.linearRampToValueAtTime(0, stopTime);
				sourceNode && sourceNode.noteOff(stopTime);
			};


			return myInterface;
		};
	}
);