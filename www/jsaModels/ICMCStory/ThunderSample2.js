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
	["jsaSound/jsaSndLib/config", "jsaSound/jsaSndLib/baseSM"],
	function (config, baseSM) {

		var buffRequested = false;
		var buffLoaded = false; 
		var soundBuff = config.audioContext.createBuffer(2,2,44100); 
		var m_soundUrl = config.resourcesPath + "jsaResources/sounds/ThunderSample2.wav";


		return function (i_loadedCB) {

			var gainLevelNode = config.audioContext.createGain();
			var sourceNode;

			var m_gainLevel = .5;
			var stopTime = 0.0;   		

			var myInterface = baseSM({},[],[gainLevelNode]);
			myInterface.setName("Thunder2");
			myInterface.setAboutText("Simple mp3 (or wav) sample player.")

/*
			var init = (function (){
				if (! buffRequested){
					buffRequested=true;
					myInterface.loadAudioResource(m_soundUrl, onLoadAudioResource);
				} 
			}());
*/

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



			myInterface.onPlay = function (i_ptime) {


				if (buffLoaded) {

					sourceNode && sourceNode.disconnect(0);

					buildModelArchitectureAGAIN();

					stopTime = config.bigNum;

					sourceNode.start(i_ptime);
					sourceNode.isPlaying=true;


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
					"max": 1,
					"val": m_gainLevel
				},
				function (i_val) {
					m_gainLevel = i_val;
					gainLevelNode.gain.value =  i_val;
				}
			);


			myInterface.onRelease = function (i_ptime) {

				sourceNode && sourceNode.isPlaying && sourceNode.stop(0);
				if (sourceNode) sourceNode.isPlaying=false; // WHY DOES THIS NOT WORK: sourceNode && sourceNode.isPlaying=false;
				myInterface.stop();
			};

			myInterface.on("resourceLoaded", function(){
						console.log("Thunder2: soundReady");
						i_loadedCB && i_loadedCB(myInterface);
						myInterface.off("resourceLoaded");
					});
			if (! buffRequested){
				buffRequested=true;
				myInterface.loadAudioResource(m_soundUrl, onLoadAudioResource);
			} 


			return myInterface;
		};
	}
);