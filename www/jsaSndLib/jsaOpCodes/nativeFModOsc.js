/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/
//========================================================================================
// Javascript Node 1-input oscilator for a-rate frequency modulation
//========================================================================================
//PARA: config
//		-audioContext
//		-k_bufferLength
define(
	["jsaSound/jsaSndLib/config", "jsaSound/jsaSndLib/baseSM"],
	function (config, baseSM) {
		return function () {

			var m_modIndex=0;
			var m_carFreq=440;
            var m_carType=0;

            var modIndexNode = config.audioContext.createGain();   //mod index

            var m_CarrierNode = config.audioContext.createOscillator();
            m_CarrierNode.setType(m_carType); 
            m_CarrierNode.frequency.value = m_carFreq;
            m_CarrierNode.start(0);

            modIndexNode.gain.value = m_modIndex;
            modIndexNode.connect(m_CarrierNode.frequency);  //modIndex node is the frequency input to the carrier


			var myInterface = baseSM({},[modIndexNode],[m_CarrierNode]);

		    myInterface.registerParam(
                "carrierFrequency",
                "range",
                {
                    "min": 0,
                    "max": 2000,
                    "val": m_carFreq
                },
                function (i_val) {
                	if (m_CarrierNode != undefined) {
                    	m_CarrierNode.frequency.value =  m_carFreq = i_val;
                    }
                }
            );

		    myInterface.registerParam(
                "modIndex",
                "range",
                {
                    "min": 0,
                    "max": 400,
                    "val": m_modIndex
                },
                function (i_val) {
                	if (modIndexNode != undefined) {
                    	modIndexNode.gain.value =  m_modIndex = i_val;
                    }
                }
            );

            myInterface.registerParam(
                "Type",
                "range",
                {
                    "min": 0,
                    "max": 4,
                    "val": m_carType
                },
                function (i_val) {
                    if (m_CarrierNode != undefined) {
                        m_CarrierNode.setType(i_val);
                    }
                }
            );


            myInterface.setParam("modIndex", m_modIndex);
            myInterface.setParam("carrierFrequency", m_carFreq);
            myInterface.setParam("Type", m_carType);

			return myInterface;
		};
	}
);