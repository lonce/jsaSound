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
		return function () {
			//Useful addition:
			//When the file finishes playing, change release time to 0;
			//otherwise it's confusing: Press release and it will wait for the release time, but won't really DO anything
			//user may just click play immediately, and the architecture won't be rebuilt, so noting will happen

			//CUrrently, I've just enabled looping to overcome that problem

			var sm=new Object();

			sm.buffLoaded = false;
			sm.soundBuff = config.audioContext.createBuffer(2,2,44100); 

			sm.gainLevelNode = config.audioContext.createGain();
			sm.gainEnvNode = config.audioContext.createGain();


			sm.m_gainLevel = 1.0;
			sm.m_attackTime = 0.05;
			sm.m_releaseTime = 1.0;
			sm.m_soundUrl = "";
			sm.stopTime = 0.0;
			sm.now = 0.0;


			var myInterface = baseSM({},[],[sm.gainLevelNode]);
			//myInterface.sourceNode;
			myInterface.setAboutText("Simple mp3 (or wav) player.")


			

			// Must keep rebuilding on play() this because myInterface.sourceNode goes away after you call myInterface.sourceNode.noeOff()
			myInterface.buildModelArchitectureAGAIN = function() {
				myInterface.sourceNode = config.audioContext.createBufferSource();
				myInterface.sourceNode.buffer = sm.soundBuff;
				myInterface.sourceNode.loop = false;

				myInterface.sourceNode.connect(sm.gainEnvNode);
				sm.gainEnvNode.connect(sm.gainLevelNode);
			};

			function onLoadAudioResource(b){
				sm.soundBuff = b;
				sm.buffLoaded = true;
				console.log("Buffer Loaded!");
			}


			myInterface.onPlay = function (i_ptime) {
				if (sm.buffLoaded) {
					if (i_ptime != undefined){
						sm.now = i_ptime;
					} else {
						sm.now = config.audioContext.currentTime;
					}

					console.log("rebuilding");
					myInterface.sourceNode && myInterface.sourceNode.disconnect(0); // in case it wasn't stop()ed, we still want to get rid of it before rebuilding.
					myInterface.buildModelArchitectureAGAIN();
					myInterface.sourceNode.start(sm.now);
					sm.gainEnvNode.gain.value = 0;

					sm.gainEnvNode.gain.cancelScheduledValues(sm.now);

					sm.stopTime = config.bigNum;

					sm.gainLevelNode.gain.value = sm.m_gainLevel;
					console.log("Gain set at " + sm.gainLevelNode.gain.value);

					sm.gainEnvNode.gain.setValueAtTime(0, sm.now);
					sm.gainEnvNode.gain.linearRampToValueAtTime(1, sm.now + sm.m_attackTime);

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
					"val": sm.m_gainLevel
				},
				function (i_val) {
					sm.m_gainLevel = i_val;
					sm.gainLevelNode.gain.value =  i_val;
				}
			);

			myInterface.registerParam(
				"Attack Time",
				"range",
				{
					"min": 0,
					"max": 1,
					"val": sm.m_attackTime
				},
				function (i_val) {
					sm.m_attackTime = parseFloat(i_val);
				}
			);

			myInterface.registerParam(
				"Release Time",
				"range",
				{
					"min": 0,
					"max": 3,
					"val": sm.m_releaseTime
				},
				function (i_val) {
					sm.m_releaseTime = parseFloat(i_val);
				}
			);

			myInterface.registerParam(
				"Sound URL",
				"url",
				{
					"val": config.resourcesPath + "jsaResources/sounds/BeingRural22k.mp3"
				},
				function (i_val) {
					sm.m_soundUrl = i_val;
					sm.buffLoaded = false;
					myInterface.loadAudioResource(sm.m_soundUrl, onLoadAudioResource);
				}
			);

			myInterface.onRelease = function (i_ptime) {
				sm.now = config.audioContext.currentTime;
				sm.stopTime = sm.now + sm.m_releaseTime;

				sm.gainEnvNode.gain.cancelScheduledValues(sm.now);
				sm.gainEnvNode.gain.setValueAtTime(sm.gainEnvNode.gain.value, sm.now ); 
				sm.gainEnvNode.gain.linearRampToValueAtTime(0, sm.stopTime);
				myInterface.sourceNode && myInterface.sourceNode.stop(sm.stopTime);
				console.log("ok, releasing");

				myInterface.schedule(sm.stopTime, function () {
					myInterface.stop();
				});

			};




			return myInterface;
		};
	}
);