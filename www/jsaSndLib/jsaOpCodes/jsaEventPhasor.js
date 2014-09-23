
/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/
//================================================
// Phasor - values in [0,1], needs to be initialized with a phase and the current time,
//================================================
/**
* Creates a phasor that can be used to time period events even period is changing 
* @module jsaEvenPhasor.js
* @main jsaEvenPhasor.js
*/
/**
* @class jsaEvenPhasor (Function)
*
*/
define(
	["jsaSound/jsaSndLib/config"],
	function (config) {

   /**
    * Creates a phasor used to periodically trigger events
    * @method (jsaEvenPhasor)
    * @return Interface object for controlling the eventPhasor containing all the other methods in this module.  
    */
		return function () {
			if (!config) {
				console.log("No config passed to jsaEventPhasor");
			}


			var m_freq = 1; // seconds
			var m_currentPhase = 0; //[0,1]
			var m_currentTime=0;

			var myInterface = {};

		    /**
		    * Sets the time
		    * @method setCurrentTime
		    * @param {Number} time (in secs) 
		    */
			myInterface.setCurrentTime = function (i_t) {
				m_currentTime = i_t;
			};

		    /**
		    * Sets the phaser to a specific phase
		    * @method setPhase
		    * @param {Number} phase in [0,1] 
		    */
			myInterface.setPhase = function (i_p) {
				m_currentPhase = i_p;
			};

		    /**
		    * Get the current phse
		    * @method getPhase
		    * @param {Number} phase in [0,1] 
		    */
			myInterface.getPhase = function () {
				return m_currentPhase;
			};

		    /**
		    * Sets the frequency that the phase will move (revolutions per second)
		    * @method {Number} setFreq
		    */
			myInterface.setFreq = function (i_f) {
				m_freq = i_f;
			};

		    /**
		    * Advance the time rotating the phasor accorording to its frequency.
		    * @method advance
		    * @param {Number} interval of time to advance 
		    * @return {Number} current phase
		    */
			myInterface.advance = function (i_t) {
				m_currentPhase = (m_currentPhase + i_t * m_freq) % 1;
				return m_currentPhase;
			};

		    /**
		    * Set the time of the phasor rotating if from its current position as necessary
		    * @method advanceToTime
		    * @param {Number} The time to advance the phasor to. 
		    * @return {Number} current phase
		    */
			myInterface.advanceToTime = function (i_t) {
				var advance = i_t - m_currentTime;
				m_currentPhase = (m_currentPhase + advance * m_freq) % 1;
				m_currentTime = i_t;
				return m_currentPhase;
			};

		    /**
		    * Advances the time to that of next zero phase (which is when it "ticks")
		    * @method advanceToTick
		    */
			myInterface.advanceToTick = function () {
				m_currentTime += (1 - m_currentPhase) / m_freq;
				m_currentPhase = 0.00000000000001;	// Don't want 0 as a nextTickTime
			};

		    /**
		    * Advances the time to that of next zero phase (which is when it "ticks")
		    * @method nextTickTime
		    * @return {Number} time in sseconds
		    */
			myInterface.nextTickTime = function () {
				if (m_freq === 0) {
					return config.bigNum;
				}
				return m_currentTime + (1 - m_currentPhase) / m_freq;
			};

		    /**
		    * Get the time between now and the next tick
		    * @method timeToTick
		    * @return {Number} the amount of time until next tick
		    */
			myInterface.timeToTick = function () {
				if (m_freq === 0) {
					return config.bigNum;
				}
				return (1 - m_currentPhase) / m_freq;
			};

			return myInterface;
		};
	}
);