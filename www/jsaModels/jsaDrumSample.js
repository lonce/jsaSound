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

			var soundBuff = config.audioContext.createBuffer(2,2,44100); 

			var gainLevelNode = config.audioContext.createGain();
			var sourceNode;

			var m_gainLevel = 1.0;
			var m_defaultsoundURL = config.resourcesPath + "jsaResources/drum-samples/LINN/snare.wav";
			var stopTime = 0.0;

       		

			var myInterface = baseSM({},[],[gainLevelNode]);
			myInterface.setAboutText("Simple mp3 (or wav) sample player - must load sounds from same domain as server.")



			var init = (function (){
				i_fname && myInterface.loadAudioResource(i_fname, onLoadAudioResource);
			}());


			// Must keep rebuilding on play() this because sourceNode goes away after you call sourceNode.noeOff()
			var buildModelArchitectureAGAIN = function() {
				sourceNode = config.audioContext.createBufferSource();
				sourceNode.buffer = soundBuff;
				sourceNode.loop = false;
				sourceNode.isPlaying=false;


				sourceNode.connect(gainLevelNode);
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
					console.log("build");
					buildModelArchitectureAGAIN();

					stopTime = config.bigNum;

					if (arguments.length > 1) {
						myInterface.setParam("Gain", i_gain);
					}

					sourceNode.start(i_ptime);
					sourceNode.isPlaying=true;


					sourceNode.onended = function(){
						this.isPlaying && this.stop(0);
						this.isPlaying=false;
					};


					if (myInterface.getNumOutConnections() === 0){
						//console.log("connecting MyInterface to audio context desination");
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
				"Sound URL",
				"url",
				{
					"val": i_fname || m_defaultsoundURL
				},
				function (i_val) {
					val=i_val;
					myInterface.loadAudioResource(val, onLoadAudioResource);
				}
			);

			myInterface.release = function () {

				//sourceNode && sourceNode.stop(0);
				console.log("release");
				sourceNode && sourceNode.isPlaying && sourceNode.stop(0);
				if (sourceNode) sourceNode.isPlaying=false; // WHY DOES THIS NOT WORK: sourceNode && sourceNode.isPlaying=false;

			};

			buffLoaded = false;
			myInterface.loadAudioResource(myInterface.getParam("Sound URL", "val"), onLoadAudioResource);
			return myInterface;
		};
	}
);