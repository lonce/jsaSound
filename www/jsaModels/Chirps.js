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
        ["jsaSound/jsaSndLib/config", "jsaSound/jsaSndLib/baseSM",  "jsaSound/jsaSndLib/jsaOpCodes/jsaEventPhasor", "jsaSound/jsaModels/chirp"],
        function (config, baseSM,  jsaEventPhasor, chirpFactory) {
                return function () {

                        var m_eventDuration=1;
                        var k_gain_factor=1; // for sounds that just need a boost
                        var m_futureinterval = 0.05;  // the amount of time to compute events ahead of now
                        var m_gainLevel = .6;

                        var m_position=0; // within th [0-1] syllable

                        var k_minRate=1; // per second
                        var k_maxRate=10; // per second
                        var m_eventRate= k_maxRate - m_position*(k_maxRate-k_minRate); // per second

                        var k_maxChirpDuration=.5;
                        var k_minChirpDuration=.05; 
                        var m_duration = k_minChirpDuration + m_position*(k_maxChirpDuration-k_minChirpDuration);

                        var k_maxCFO=3.6;
                        var k_minCFO=2;
                        var m_cfo=k_maxCFO - m_position*(k_maxCFO-k_minCFO); 


                        var playingP=false;
                        var child = chirpFactory(); // short burst, created only once
                        var m_gainLevelNode = config.audioContext.createGain(); // manipulated by sound user

                        // for triggering periodic events
                        var m_ephasor = jsaEventPhasor();
                        m_ephasor.setFreq(m_eventRate);

                        var requestAnimationFrame = window.requestAnimationFrame;

                        m_gainLevelNode.gain.value = k_gain_factor*m_gainLevel ;

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
                                        child.setParam("Duration", m_duration);
                                        child.setParam("Center Frequency (octaves)", m_cfo);
                                        child.play(ptime);
                                        child.release(ptime+m_eventDuration); // this would have to change if the SourceBuffer.playRate changes...

                                        m_ephasor.advanceToTick();
                                        nextTickTime = m_ephasor.nextTickTime();                // so when is the next tick?
                                }
                                m_ephasor.advanceToTime(next_uptotime); // advance phasor to the current computed upto time.
                                requestAnimationFrame(animate);
                        };

                        var myInterface = baseSM({},[],[m_gainLevelNode]);
                        myInterface.setAboutText("Generic event generator")


                        // get a new SourceBufferNode for every event (oi.)
                        var init = function () {
                                        child = chirpFactory();
                                        child.connect(m_gainLevelNode); // collect audio from children output nodes into m_gainLevelNode 
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

                                m_eventRate= k_maxRate - m_position*(k_maxRate-k_minRate); 

                                playingP=true;
                                
                        };

                        myInterface.onRelease = function (i_ptime) {
                                // stops the animation frame callbacks
                                playingP=false;
                                myInterface.stop(i_ptime);
                        };

                        // Exposed soundmodel parameters --------------------

                        myInterface.registerParam(
                                "Syllable Position",
                                "range",
                                {
                                        "min": 0,
                                        "max": 1,
                                        "val": m_position
                                },
                                function (i_arg) {
                                        m_position = i_arg;
                                        m_eventRate= k_maxRate - m_position*(k_maxRate-k_minRate); 
                                        m_ephasor.setFreq(m_eventRate); //controls how high the frequency goes
                                        m_duration = k_minChirpDuration + m_position*(k_maxChirpDuration-k_minChirpDuration);
                                        m_cfo=k_maxCFO - m_position*(k_maxCFO-k_minCFO);
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

                        return myInterface;
                };
        }
);