/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/

/* --------------------------------------------------------------
	This drone model was inspired by a Matt Diamond post to the public-audio@w3.org list.
	
	The idea here is to have one sound model control a bunch of others (Thus the "meta" in the name).
	Architecture:
		MetaDrone2 has an array of other soundmodles that it starts, stops, and controls through paramters.
		It grabs output from the "children" models and routs it through its own gainLevel node before passing it on. 
******************************************************************************************************
*/

define(
	["jsaSound/jsaSndLib/config", "jsaSound/jsaSndLib/baseSM", "jsaSound/jsaSndLib/utils", "jsaSound/jsaModels/FilteredNoiseBand"],
	function (config, baseSM, utils, FilteredNoiseBandFactory) {
		return function (i_loadedCB) {
			var	childModel = [];
			var k_maxNumChildren = 10;

			var m_currentNumChildrenActive = 6;
			var m_baseNote = 69;
			var m_detune = 0;
			var m_firstNoteNum = 5; // index in to scale array
			var m_childGain = .9;

			var stopTime = 0.0;        // will be > audioContext.currentTime if playing
			var now = 0.0;

			// These numbers are semitones to be used relative to a "base note" 
			var scale = [0.0, 2.0, 4.0, 6.0, 7.0, 9.0, 11.0, 12.0, 14.0];

			var m_gainLevel = 1;
			var gainLevelNode = config.audioContext.createGain();  // will collect output the children

			// get a frequency as a random function of the base_note
			var note2Freq = function (i_note) {
				//var degree = Math.floor(Math.random() * scale.length);
				var freq = utils.mtof(i_note +m_detune);
				return freq;
			};


			

			// Init runs once when the sound model is constructed only

			var init = (function () {
				var i;
				for (i = 0; i < k_maxNumChildren; i += 1) {
					childModel[i] = FilteredNoiseBandFactory();  

					childModel[i].setParam("Filter Q", 40);
					if (i===0) {
						childModel[i].setParam("Gain", m_childGain);
					} else {
						childModel[i].setParam("Gain", .6*m_childGain);
					}
					childModel[i].notenum=m_baseNote+scale[Math.floor(Math.random() * scale.length)];
					childModel[i].setParam("Center Frequency", note2Freq(childModel[i].notenum));

					if (childModel[i].hasOutputs()){
						childModel[i].connect(gainLevelNode); // collect audio from children output nodes into gainLevelNode 
					}
				}
			}());

			// define the PUBLIC INTERFACE for the model	
			var myInterface = baseSM({},[],[gainLevelNode]); // make gainLevelNode available for connections
			myInterface.setName("jsaDistributedDrone");
			myInterface.setAboutText("This model wraps a bunch of jsaNoiseBand models to deonstrate the composability of sound models using GraphNode. This drone  was inspired by a Matt Diamond post to the public-audio@w3.org list.");

			// ----------------------------------------
			myInterface.onPlay = function (i_ptime) {
				var i;
				now = config.audioContext.currentTime;
				stopTime = config.bigNum;


				gainLevelNode.gain.value = m_gainLevel;  // collector turn back up

				//m_baseNote = m_baseNote;
				//console.log("will send play to " + m_currentNumChildrenActive + " currently active children");

				/* the first child's note is fixed */
				childModel[0].notenum=m_baseNote + scale[m_firstNoteNum];
				childModel[0].setParam("Center Frequency", note2Freq(childModel[0].notenum));
				childModel[0].play(i_ptime);

				/* the rest are random */
				for (i = 1; i < m_currentNumChildrenActive; i += 1) {
					childModel[i].notenum=m_baseNote + scale[Math.floor(Math.random() * scale.length)];
					childModel[i].setParam("Center Frequency", note2Freq(childModel[i].notenum));
					childModel[i].play(i_ptime);
				}


			};

			myInterface.onRelease = function (i_ptime) {
				var i;
				now = config.audioContext.currentTime;
				stopTime = now;
				//console.log("RELEASE! time = " + now + ", and stopTime = " + stopTime);
				//console.log("will send release to " + m_currentNumChildrenActive + " currently active children");
				for (i = 0; i < m_currentNumChildrenActive; i += 1) {
					childModel[i].release();
				}
				//myInterface.stop();

				//console.log("------------[released]");
			};

			// ----------------------------------------
			//	Parameters 
			// ----------------------------------------
			myInterface.registerParam(
				"Base Note",
				"range",
				{
					"min": 40,
					"max": 100,
					"val": m_baseNote
				},
				function (i_bn) {
					var i;
					var in_bn = parseInt(i_bn, 10);
					if (in_bn === m_baseNote) {
						return; // args come in as floats, so we test if the parseInt is the same as baseNote
					}

					var bndif = in_bn - m_baseNote;
					
					//console.log("will send new base note to " + m_currentNumChildrenActive + " currently active children");
					for (i = 0; i < m_currentNumChildrenActive; i += 1) {
						childModel[i].notenum +=bndif; 
						//childModel[i].setCenterFreq(note2Freq(m_baseNote));  // reassign freqs
						//////////childModel[i].setParam("Center Frequency", childModel[i].getFreq() * Math.pow(2, (bndif+m_detune) / 12));  // glide freqs
						childModel[i].setParam("Center Frequency", note2Freq(childModel[i].notenum));  // glide freqs
					}
					m_baseNote = in_bn;
				}
			);

			myInterface.registerParam(
				"Detune",
				"range",
				{
					"min": -1,
					"max": 1,
					"val": m_detune
				},
				function (i_val) {
					m_detune=i_val;
					childModel[0].setParam("Center Frequency", note2Freq(childModel[0].notenum));
					/*
					for (i = 0; i < m_currentNumChildrenActive; i += 1) {
						//childModel[i].setCenterFreq(note2Freq(m_baseNote));  // reassign freqs
						childModel[i].setParam("Center Frequency", note2Freq(childModel[i].notenum));  // glide freqs
					}
					*/
				}
			);

			myInterface.registerParam(
				"First Note Number",
				"range",
				{
					"min": 0,
					"max": scale.length-.00001,
					"val": m_firstNoteNum
				},

				function (i_val) {
					m_firstNoteNum = Math.floor(i_val);
				}

			);

			// add or remove children from actively playing
			myInterface.registerParam(
				"Number of Generators",
				"range",
				{
					"min": 1,
					"max": k_maxNumChildren,
					"val": m_currentNumChildrenActive
				},
				function (i_gens) {
					//console.log("will set num generators to " + i_gens);
					var i;
					var in_gens = parseInt(i_gens, 10);
					if (in_gens === m_currentNumChildrenActive) {
						return;
					}

					if (in_gens > m_currentNumChildrenActive) {
						for (i = m_currentNumChildrenActive; i < in_gens; i += 1) {
							//console.log("setNumGenerators: will add child to playing list # " + i);
							childModel[i].notenum=m_baseNote+scale[Math.floor(Math.random() * scale.length)];;
							//var f = note2Freq(m_baseNote);

							if (i===0) {
								childModel[i].setParam("Gain", m_childGain);
							} else {
								childModel[i].setParam("Gain", .6*m_childGain);
							}




							if (stopTime > config.audioContext.currentTime){ // if playingP
								childModel[i].setParam("Center Frequency", note2Freq(childModel[i].notenum));
								childModel[i].play();
							}
						}
					} else { // in_gens < m_currentNumChildrenActive
						for (i = in_gens; i < m_currentNumChildrenActive; i += 1) {
							//console.log("setNumGenerators: will remove child from playing list # " + i);
							childModel[i].release();
						}
					}
					m_currentNumChildrenActive = in_gens;
					//console.log("setNumGenerators: EXITING  after setting m_currentNumChildrenActive (" + m_currentNumChildrenActive + ") to in_gens (" + in_gens + ")");
				}
			);

			// ----------------------------------------		
			myInterface.registerParam(
				"Gain",
				"range",
				{
					"min": 0,
					"max": 2,
					"val": m_gainLevel
				},
				/*  //The "old way" 
				function (i_val) {
					var i;
					m_childGain = i_val;
					for (i = 0; i < m_currentNumChildrenActive; i += 1) {
						childModel[i].setParam("Gain", m_childGain);
					}
				}
				*/
				function (i_val) {
					gainLevelNode.gain.value = m_gainLevel = i_val;
				}

			);

			//console.log("paramlist = " + myInterface.getParamList().prettyString());	
			console.log("jsaDistributedDrone: soundReady");		
			i_loadedCB && i_loadedCB(myInterface);
			return myInterface;
		};
	}
);