/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/

define(
	["jsaSound/jsaSndLib/config", "jsaSound/jsaSndLib/baseSM", "jsaSound/jsaSndLib/jsaOpCodes/googleJungle", "jsaSound/jsaSndLib/jsaOpCodes/jsaMicInputNode"],
	function (config, baseSM, jungleNodeFactory, micInputNode) {
		return function (i_loadedCB) {


			// defined outside "aswNoisyFMInterface" so that they can't be seen be the user of the sound models.
			// They are created here (before they are used) so that methods that set their parameters can be called without referencing undefined objects
			var	m_jungleNode // = new Jungle( config.audioContext ),
				, gainEnvNode
				, gainLevelNode // = config.audioContext.createGain();
				, lpNode
				, echoNode; // simple delay line to make monster an "echo"


			var microphone;

			// these are both defaults for setting up initial values (and displays) but also a way of remembring across the tragic short lifetime of Nodes.
			var m_gainLevel = .75, // the point to (or from) which gainEnvNode ramps glide
				stopTime = 0.0,	// will be > audioContext.currentTime if playing
				now = 0.0;

			var maxEchoTime=1.0;
			var m_attackTime = 0.2;
			var m_releaseTime = .1;


			// Create the nodes and thier connections. Runs once on load.
			var buildModelArchitecture = (function () {

				gainEnvNode = config.audioContext.createGain();
				gainEnvNode.gain.value = 0;

				m_jungleNode = new Jungle( config.audioContext );

				lpNode =config.audioContext.createBiquadFilter();
				lpNode.setType("lowpass");
				lpNode.frequency.value = 1500;



				gainLevelNode = config.audioContext.createGain();
				gainLevelNode.gain.value = 0;

				echoNode=config.audioContext.createDelay(maxEchoTime)

				micInputNode(microphone, gainEnvNode);
				gainEnvNode.connect(m_jungleNode.input); //micInputNode(microphone, m_jungleNode.input);
				m_jungleNode.output.connect(lpNode);
				lpNode.connect(echoNode)
				echoNode.connect(gainLevelNode);
			}());


			var tearDownArchitecture=function(){

						
						//m_jungleNode.disconnect();
						//gainEnvNode.disconnect();
						gainLevelNode.disconnect();
						lpNode.disconnect();
						echoNode.disconnect();
						
			}
			
			var rebuildArchitecture=function(){
				buildModelArchitecture();
			}



			var myInterface = baseSM({},[],[gainLevelNode]);
			myInterface.setAboutText("NOTE:  Press ALLOW on Main Browser Window before playing.  Uses Chris Wilson's Jungle code (http://webaudiodemos.appspot.com)")


			myInterface.onPlay = function (i_ptime) {

				if(myInterface.isPlaying) {
					consol.log('already playing, return');
					return;
				}

				//rebuildArchitecture();

				now = config.audioContext.currentTime
				stopTime = config.bigNum;


				gainEnvNode.gain.value = 0;
				gainEnvNode.gain.cancelScheduledValues(now);
				gainEnvNode.gain.setValueAtTime(0, now);
				gainEnvNode.gain.setValueAtTime(0, now+myInterface.getParam("Delay Time","val"));
				gainEnvNode.gain.linearRampToValueAtTime(1, now + myInterface.getParam("Delay Time","val") + m_attackTime); // go to gain level over .1 secs

				gainLevelNode.gain.value = m_gainLevel;

				echoNode.delayTime.value=myInterface.getParam("Echo Time","val");
				console.log('echo delay time is ' + echoNode.delayTime.value)
				m_jungleNode.setDelay(myInterface.getParam("Delay Time","val"));


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
					now = config.audioContext.currentTime;
					if (stopTime > now)  { // if playing
						gainLevelNode.gain.value = m_gainLevel = i_val;
					}
				}
			);


			myInterface.onRelease = function (i_ptime) {

				var rtime = i_ptime || now; 

					gainLevelNode.gain.value = 0;

				myInterface.schedule(rtime, function (){
					var now = config.audioContext.currentTime;
	
					// ramp gain down to zero over the duration of m_releaseTime
					gainEnvNode.gain.cancelScheduledValues(now);
					gainEnvNode.gain.setValueAtTime(gainEnvNode.gain.value, now ); 
					gainEnvNode.gain.linearRampToValueAtTime(0, now + m_releaseTime);

					// when release is finished, stop everything 
					myInterface.schedule(now + m_releaseTime,  function () {
						
						myInterface.stop();
						//tearDownArchitecture();


					});
				});

			};




			myInterface.registerParam(
				"Delay Time",
				"range",
				{
					"min": 0.05,
					"max": 0.1,
					"val": .06
				},
				function (i_val) {
					m_jungleNode.setDelay(i_val);
				}
			);

			
			myInterface.registerParam(
				"Echo Time",
				"range",
				{
					"min": 0,
					"max": maxEchoTime,
					"val": maxEchoTime
				},

				function (i_val) {
					console.log("setting delay time to " + i_val)
					echoNode.delayTime.value=i_val;
				}
			);



			i_loadedCB && i_loadedCB(myInterface);
			return myInterface;
		};
	}
);