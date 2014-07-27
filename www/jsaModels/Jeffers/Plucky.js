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
	["jsaSound/jsaCore/config", "jsaSound/jsaCore/baseSM", "jsaSound/jsaModels/jsaPluck", "jsaSound/jsaOpCodes/jsaConvolveNode", "jsaSound/jsaOpCodes/jsaEventPhasor", "jsaSound/jsaCore/audioUtils"],
	function (config, baseSM, childNodeFactory, jsaConvolverFactory, jsaEventPhasor, audioUtils) {
		return function () {

			var notes=[];
			notes[0] = ["C4", "D4", "E4", "G4", "A4", "C5", "D5", "E5", "G5", "A5"];  // C major pentatonic
			notes[1] = ["C4", "D4", "F4", "G4", "A4", "C5", "D5", "F5", "G5", "A5"];  // F major pentatonic
			notes[2] = ["C4", "D4", "F4", "G4", "Bb4", "C5", "D5", "F5", "G5", "Bb5"];  // Bb major pentatonic
			notes[3] = ["C4", "Eb5", "F4", "G4", "Bb4", "C5", "Eb5", "F5", "G5", "Bb5"];  // Eb major pentatonic
			notes[4] = ["C4", "Eb4", "F4", "Ab4", "Bb4", "C5", "Eb5", "F5", "Ab5", "Bb5"];  // Ab major pentatonic

			var scaleNum=0;
			var numScales=5;
			var numNotes = notes[0].length;
			scaleRoot=["C4", "F4", "Bb4", "Eb4", "Ab4"];


			var k_impulseDuration=.5;
			var k_gain_factor=100; // for sounds that just need a boost
			var m_futureinterval = 0.05;  // the amount of time to compute events ahead of now
			var m_gainLevel = .9;

			var m_frequency=5;
			// for triggering periodic events
			var m_ephasor = jsaEventPhasor();
			m_ephasor.setFreq(m_frequency);

			animationcount=0;



			var playingP=false;
			var child = childNodeFactory(k_impulseDuration); // short burst, created only once
			//var m_conv = jsaConvolverFactory(config.resourcesPath + "jsaResources/sounds/GlottalPulse.wav");
			var m_conv = jsaConvolverFactory(config.resourcesPath + "jsaResources/sounds/knock.wav");
			var m_roomConv = jsaConvolverFactory(config.resourcesPath + "jsaResources/impulse-response/diffusor3.wav");
			//console.log("loading impulse response from file: " + config.resourcesPath + "jsaResources/impulse-response/diffusor2.wav");
			var	gainLevelNode = config.audioContext.createGain(); // manipulated by sound user


			var requestAnimationFrame = window.requestAnimationFrame;
			

			//var m_lastInterval=0;
			var m_lastNoteNum=5;
			var k_maxInterval=3;
			var getNextNoteNum=function(){

				var interval, notenum;
				do {
					interval = (-1+2*Math.random())*k_maxInterval;	
					notenum = Math.round(m_lastNoteNum+interval);
				} while((notenum < 0) || (notenum >= numNotes));
				m_lastNoteNum=notenum;
				return notenum;
			}




			// paramterize and connect graph nodes
			child.connect(m_conv);

			m_conv.connect(m_roomConv);
			m_roomConv.connect(gainLevelNode);

			gainLevelNode.gain.value = k_gain_factor*m_gainLevel ;


			var ticksToNote=0;
			var tickCount=0;

			//  requestAnimationFrame callback function
			var animate = function (e) {
				animationcount++;
				//if ((animationcount%100)===0) console.log("plucky animation count  = " + animationcount);


				if (! (playingP=== true)) return;

				var now = config.audioContext.currentTime;	// this is the time this callback comes in - there could be jitter, etc.	

				var next_uptotime = now + m_futureinterval;  // comput events that happen up until this time
				var nextTickTime = m_ephasor.nextTickTime(); // A "tick" is when the phasor wraps around		

				var ptime;  // the event play time

				var rtemp;

				while (next_uptotime > nextTickTime) {
					ptime = nextTickTime;

					//child.qplay(ptime);
					//child.stop();
					//child.start(ptime);
					//child.stop(ptime+k_impulseDuration); // this would have to change if the SourceBuffer.playRate changes...
					//child.stop();
					
					if ((tickCount%32)===24){  // phrase is 32 peats lonk
						ticksToNote=0;
					}
					if ((tickCount%8)===0){    
						ticksToNote=0;
					}

					if (ticksToNote===0){

						child.play();

						if ((tickCount%64)===24){   // end on "tonic" once every two phrases
							child.setParam("Frequency", audioUtils.note2Freq(scaleRoot[scaleNum]));
							// and change key
							//scaleNum=(scaleNum+1)%numScales;
						//child.stop(ptime+k_impulseDuration); // this would have to change if the SourceBuffer.playRate changes...
						} else {
							child.setParam("Frequency", audioUtils.note2Freq(notes[scaleNum][getNextNoteNum()]))
						}



						if ((tickCount%32)===24){   // take a breather at the end of every phrase
							ticksToNote=8;
						} else if ((tickCount%2)===0){ // allow interval picking only on "downbeats" to preserve a rhythmic rather than random feel
								rtemp=Math.random();
								if (rtemp<.25) {
									ticksToNote=3;
								} else if (rtemp<.5) {
									ticksToNote=2;
								} else {
									ticksToNote=1;
								}
							}
							else {
								ticksToNote=1;
							}
					}
					ticksToNote=ticksToNote-1;
					tickCount=tickCount+1;

					m_ephasor.advanceToTick();
					nextTickTime = m_ephasor.nextTickTime();		// so when is the next tick?
				}
				m_ephasor.advanceToTime(next_uptotime); // advance phasor to the current computed upto time.


				requestAnimationFrame(animate);
			};

			var myInterface = baseSM({},[],[gainLevelNode]);
			myInterface.setAboutText("Glottal pulse meant to be used within other sounds (like voies)")



			myInterface.onPlay = function (i_ptime) {
				var now = config.audioContext.currentTime;
				//myInterface.stop();

				m_ephasor.setPhase(0.999999999);	// so that the phaser wraps to generate an event immediately after starting
				m_ephasor.setCurrentTime(now);

				if (! playingP){
					playingP=true;
					requestAnimationFrame(animate);
				}


				ticksToNote=0;
			};

			myInterface.onRelease = function (i_ptime) {
				// stops the animation frame callbacks
				playingP=false;
				myInterface.stop(i_ptime);
				child.release(i_ptime);
			};

			myInterface.onStop = function (i_ptime) {

			};


			myInterface.destroy = function () {
				child && child.disconnect();
				m_conv && m_conv.disconnect();
				m_roomConv && m_roomConv.disconnect();
			}

			// Exposed soundmodel parameters --------------------

			myInterface.registerParam(
				"Frequency",
				"range",
				{
					"min": 0,
					"max": 10,
					"val": m_frequency
				},
				function (i_val) {
					m_frequency=i_val;
					m_ephasor.setFreq(m_frequency); //controls how high the frequency goes

				}
			);

			myInterface.registerChildParam(child, "Release Time");

			myInterface.registerParam(
				"Key",
				"range",
				{
					"min": 0,
					"max": 4.99,
					"val": scaleNum
				},
				function (i_val) {
					scaleNum=Math.floor(i_val);

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