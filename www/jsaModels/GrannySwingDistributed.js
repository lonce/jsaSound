/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/

define(
	["jsaSound/jsaSndLib/config", "jsaSound/jsaSndLib/baseSM", "jsaSound/jsaSndLib/utils"],
	function (config, baseSM, utils) {
		return function () {

			var tempNum = 0;
			var i = 0;

			var buffLoaded = false;

			var soundBuff = null;

			var gainLevelNode = config.audioContext.createGain();

			var m_gainLevel = 0.4;

			var m_grainDuration = 0.9;  // units = seconds
			var m_stepSize = .25;  // seconds
			var m_pitch = 0.0;  // octaves
			var m_rpitch=0.0; // octaves


			var bufferDuration = 1.0; 
			var realTime = 0.0;
			var grainTime = 0.0;

			var m_grainPlayInterval = m_stepSize; 

			var p_fileLoopStartRel=0; // in [0,1]
			var p_fileLoopLengthRel=1; // in [0,1]

			var m_fileLoopStart=0; // in seconds
			var m_fileLoopLength=1; // in seconds
			var m_fileLoopEnd; // derived

			var m_fileLoop=false; // boolean flag

			var pitchRate = Math.pow(2.0, m_pitch+m_rpitch*(2*Math.random()-1));

			var grainWindow;
			var grainWindowLength = 16384;
			grainWindow = new Float32Array(grainWindowLength);
			for (i = 0; i < grainWindowLength; i += 1) {
				grainWindow[i] = Math.sin(Math.PI * i / grainWindowLength);
			}

			var continuePlaying = true;

			var myInterface = baseSM({},[],[gainLevelNode]);
			myInterface.setAboutText("Granular Synthesis");

			function onLoadAudioResource(b){  
					console.log("Sound(s) loaded");
					soundBuff = b;
					bufferDuration = soundBuff.duration;

					m_fileLoopStart =  p_fileLoopStartRel*bufferDuration;
					m_fileLoopEnd = Math.min(bufferDuration, bufferDuration*(p_fileLoopStartRel+p_fileLoopLengthRel));

					buffLoaded = true;
					console.log("Buffer Loaded!");				
			}




			function buildModelArchitecture() {
				
			}

			function scheduleGrain() {
				var source = config.audioContext.createBufferSource();
				//console.log("scheduleGrain triggered");
				//console.log("source created");
				source.buffer = soundBuff;
				pitchRate = Math.pow(2.0, m_pitch+m_rpitch*(2*Math.random()-1));
				//console.log("pitchRate = ", pitchRate);
				source.playbackRate.value = pitchRate;
				//console.log("soundBuff created");
				

				var grainWindowNode = config.audioContext.createGain();
				source.connect(grainWindowNode);
				grainWindowNode.connect(gainLevelNode);

				//source.noteGrainOn(realTime, grainTime, m_grainDuration);
				source.start(realTime, grainTime, m_grainDuration);
				source.stop(realTime+m_grainDuration);  // no need with duration specified in start()?

				grainWindowNode.gain.value = 0.0;
				grainWindowNode.gain.setValueCurveAtTime(grainWindow, realTime, m_grainDuration / pitchRate);

				realTime += m_grainPlayInterval;

				grainTime += m_stepSize;
				console.log("graintime = " + grainTime);
				grainTime = Math.max(grainTime, m_fileLoopStart);

				if (grainTime > m_fileLoopEnd) {
					if (m_fileLoop){
						grainTime = m_fileLoopStart;
					} else {
						continuePlaying = false;
					}
				}
				if (grainTime < 0.0) {
					grainTime += m_stepSize; 
				}
			}

			var currentTime;
			function schedule() {
				//console.log("schedule triggered");
				if (!continuePlaying) {
					return;
				}

				currentTime = config.audioContext.currentTime;


				while (realTime < currentTime + 0.100) {
					scheduleGrain();
				}

				//console.log("schedule: currentTime = " + currentTime);
				myInterface.schedule(currentTime+.05, schedule);
			}

			myInterface.onPlay = function (i_ptime) {
				if (buffLoaded) {
					realTime = config.audioContext.currentTime;
					continuePlaying = true;

					schedule();

					gainLevelNode.gain.value = m_gainLevel;
					//console.log("Gain set at " + gainLevelNode.gain.value);




				} else {
					console.log("Buffer NOT loaded yet!");
					alert("Press load and wait!");
				}
			};

			myInterface.registerParam(
				"Pitch",
				"range",
				{
					"min": -2.0,
					"max": 2.0,
					"val": m_pitch
				},
				function (i_val) {
					m_pitch = i_val;
					//pitchRate = Math.pow(2.0, m_pitch+m_rpitch*(2*Math.random()-1));
				}
			);

			myInterface.registerParam(
				"Randomize Pitch",
				"range",
				{
					"min": 0,
					"max": 1,
					"val": m_pitch
				},
				function (i_val) {
					m_rpitch = i_val;
					//pitchRate = Math.pow(2.0, m_pitch+m_rpitch*(2*Math.random()-1));
				}
			);


			myInterface.registerParam(
				"Grain Size",
				"range",
				{
					"min": 0.010,
					"max": 0.5,
					"val": m_grainDuration
				},
				function (i_val) {
					m_grainDuration = i_val;
					//m_grainPlayInterval = 0.25 * grainDuration;
				}
			);


			myInterface.registerParam(
				"Step Size",
				"range",
				{
					"min": 0,
					"max": 2,
					"val": m_stepSize
				},
				function (i_val) {
					m_stepSize =  i_val;
				}
			);

			myInterface.registerParam(
				"Grain Play Interval",
				"range",
				{
					"min": .05,
					"max": 1,
					"val": m_grainPlayInterval
				},
				function (i_val) {
					m_grainPlayInterval =  i_val;
				}
			);

			myInterface.registerParam(
				"File Loop Start",
				"range",
				{
					"min": 0,
					"max": 1,
					"val": p_fileLoopStartRel
				},
				function (i_val) {
					p_fileLoopStartRel = i_val;
					m_fileLoopStart =  p_fileLoopStartRel*bufferDuration;
					m_fileLoopEnd = Math.min(bufferDuration, bufferDuration*(p_fileLoopStartRel+p_fileLoopLengthRel));
				}
			);

			myInterface.registerParam(
				"File Loop Length",
				"range",
				{
					"min": 0,
					"max": 1,
					"val": p_fileLoopLengthRel
				},
				function (i_val) {
					p_fileLoopLengthRel=i_val;
					m_fileLoopLength =  i_val*bufferDuration;
					m_fileLoopEnd = Math.min(bufferDuration, bufferDuration*(p_fileLoopStartRel+p_fileLoopLengthRel));
				}
			);


			myInterface.registerParam(
				"Sound URL",
				"url",
				{
					"val": config.resourcesPath + "jsaResources/sounds/swing/149087__forward.mp3"
				},
				function (i_val) {
					val = i_val;
					buffLoaded = false;
					myInterface.loadAudioResource(i_val, onLoadAudioResource);
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


			myInterface.onRelease = function (i_ptime) {
				console.log("release triggered");

				continuePlaying = false;
				myInterface.stop(i_ptime); // no ring out time? 
			};

			buffLoaded = false;
			myInterface.loadAudioResource(myInterface.getParam("Sound URL", "val"), onLoadAudioResource);
			return myInterface;
		};
	}
);