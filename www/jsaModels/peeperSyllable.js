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
Date: May 2013
*/

/*  A creaky door made with a repeating noise burst convolved with a single door creak.
    As the door swings more quickly, the stick-slip pattern rate rises jumping to ever higher
    integer multiples of the swing rate.
*/

define(
        ["jsaSound/jsaSndLib/config", "jsaSound/jsaSndLib/baseSM",  "jsaSound/jsaSndLib/jsaOpCodes/jsaEventPhasor", "jsaSound/jsaModels/chirp1"],
        function (config, baseSM,  jsaEventPhasor, chirpFactory) {
                return function (i_loadedCB) {

                var m_attackTime = 0.1;
                var m_releaseTime = .1;
                var stopTime = 0.0;// will be > audioContext.currentTime if playing


                var k_gain_factor=1; // for sounds that just need a boost
                var m_futureinterval = 0.05;  // the amount of time to compute events ahead of now
                var m_gainLevel = .25;


                var m_eventRate= 20; // per second
                var m_dutyCycle = .75;
                var m_duration;

                //var k_begCFO=3.35;
                //var k_finCFO=3.35;
                var m_cfo=3.35;//k_begCFO - m_position*(k_begCFO-k_finCFO); 


                var playingP=false;
                var child = chirpFactory(); // short burst, created only once
                var m_gainEnvNode = config.audioContext.createGain();
                var m_gainLevelNode = config.audioContext.createGain(); // manipulated by sound user

                // for triggering periodic events
                var m_ephasor = jsaEventPhasor();
                m_ephasor.setFreq(m_eventRate);

                var requestAnimationFrame = window.requestAnimationFrame;

                m_gainEnvNode.connect(m_gainLevelNode); // collect audio from children output nodes into m_gainLevelNode 
                m_gainLevelNode.gain.value = k_gain_factor*m_gainLevel ;
                m_gainEnvNode.gain.value = 0;

                //  requestAnimationFrame callback function
                var animate = function (e) {
                        if (! (playingP=== true)) return;

                        var now = config.audioContext.currentTime;        // this is the time this callback comes in - there could be jitter, etc.        
                        var next_uptotime = now + m_futureinterval;  // comput events that happen up until this time
                        var nextTickTime = m_ephasor.nextTickTime(); // A "tick" is when the phasor wraps around                

                        var ptime;  // the event play time

                        while (next_uptotime > nextTickTime) {
                                ptime = nextTickTime;
                                init();
                                m_duration = (m_eventRate===0) ? config.bigNum : m_dutyCycle/m_eventRate;
                                child.setParam("Duration", m_duration);                                        
                                child.setParam("Frequency Range (octaves)", .26);
                                child.setParam("Center Frequency (octaves)", m_cfo);
                                //console.log("dur= " + m_duration + ", and cf = " + m_cfo);
                                child.play(ptime);
                                child.release(ptime+m_duration); // this would have to change if the SourceBuffer.playRate changes...

                                m_ephasor.advanceToTick();
                                nextTickTime = m_ephasor.nextTickTime();                // so when is the next tick?
                        }
                        m_ephasor.advanceToTime(next_uptotime); // advance phasor to the current computed upto time.
                        requestAnimationFrame(animate);
                };

                var myInterface = baseSM({},[],[m_gainLevelNode]);
                myInterface.setName("peeperSyllable");
                myInterface.setAboutText("Generic event generator")


                // get a new SourceBufferNode for every event (oi.)
                var init = function () {
                                child = chirpFactory();
                                child.connect(m_gainEnvNode);
                };


                myInterface.onPlay = function (i_ptime) {
                        var now = config.audioContext.currentTime;
                        console.log("Chirps onPlay at " + i_ptime + ", or now = " + config.audioContext.currentTime);
                        m_ephasor.setPhase(0.99);        // so that the phaser wraps to generate an event immediately after starting

                        if (i_ptime && (i_ptime > now)){
                            m_ephasor.setCurrentTime(i_ptime);
                            myInterface.schedule(i_ptime, function(){
                                requestAnimationFrame(animate);
                            });
                        } else {
                            console.log("start Chirps w/o waiting")
                            m_ephasor.setCurrentTime(now);
                            requestAnimationFrame(animate);
                        }

                        playingP=true;

                        m_gainEnvNode.gain.cancelScheduledValues(now);

                        stopTime = config.bigNum;

                        m_gainEnvNode.gain.setValueAtTime(0, now);
                        m_gainEnvNode.gain.linearRampToValueAtTime(1, now + m_attackTime); // go to gain level over .1 secs

                        
                };

                myInterface.onRelease = function (i_ptime) {
                        // stops the animation frame callbacks
                        //playingP=false;
                        //myInterface.stop(i_ptime);

                    now = i_ptime || config.audioContext.currentTime;
                    stopTime = now + m_releaseTime;

                    //console.log("now is " + now + ", and stopTime is " + stopTime);


                    m_gainEnvNode.gain.cancelScheduledValues(now);
                    m_gainEnvNode.gain.setValueAtTime(m_gainEnvNode.gain.value, now ); 
                    //console.log("current gain is " + gainEnvNode.gain.value);
                    m_gainEnvNode.gain.linearRampToValueAtTime(0, stopTime);

                    myInterface.schedule(stopTime, function () {
                        playingP=false;
                        myInterface.stop(stopTime);
                    });


                };

                // Exposed soundmodel parameters --------------------

              myInterface.registerParam(
                    "Center Frequency (octaves)",            // the name the user will use to interact with this parameter
                    "range",                // the type of the parameter
                    {
                        "min": child.getParam("Center Frequency (octaves)", "min"),        // minimum value
                        "max": child.getParam("Center Frequency (octaves)", "max"),        // maximum value
                        "val": m_cfo  //a variable used to remember value across start/stops
                    },
                    function (i_arg) {     // function to call when the parameter is changed
                        m_cfo = i_arg;
                    }
                );

              myInterface.registerParam(
                    "Chirp Rate",            // the name the user will use to interact with this parameter
                    "range",                // the type of the parameter
                    {
                        "min": 1,        // minimum value
                        "max": 25,        // maximum value
                        "val": m_eventRate  //a variable used to remember value across start/stops
                    },
                    function (i_arg) {     // function to call when the parameter is changed
                        m_eventRate = i_arg;
                        m_ephasor.setFreq(m_eventRate); 
                    }
                );

              myInterface.registerParam(
                    "Duty Cycle",            // the name the user will use to interact with this parameter
                    "range",                // the type of the parameter
                    {
                        "min": .05,        // minimum value
                        "max": 1,        // maximum value
                        "val": m_dutyCycle  //a variable used to remember value across start/stops
                    },
                    function (i_arg) {     // function to call when the parameter is changed
                         m_dutyCycle = i_arg;
                    }
                );


/*
                        myInterface.registerParam(
                                "Event Rate",
                                "range",
                                {
                                        "min": 0,
                                        "max": 10,
                                        "val": m_eventRate
                                },
                                function (i_val) {
                                        var s;
                                        m_eventRate = parseFloat(i_val);
                                        m_ephasor.setFreq(m_eventRate); //controls how high the frequency goes

                                }
                        );
*/
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
                                        m_gainLevelNode.gain.value = k_gain_factor*m_gainLevel ;
                                }
                        );
                        i_loadedCB && i_loadedCB(myInterface);
                        return myInterface;
                };
        }
);