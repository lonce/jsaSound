/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/
//========================================================================================
// Javascript Node for gaussian noise
//
//PARA: config
//		-audioContext
//		-k_bufferLength
define(
	["jsaSound/jsaCore/config", "jsaSound/jsaCore/utils"],
	function (config, utils) {
		return function () {
			var karplusNode = config.audioContext.createJavaScriptNode(config.k_bufferLength, 1, 1);
			var m_frequency = 440; // for gaussian noise, this is the standard deviation, for white, this is the max absolute value
			var m_impulse = 0.001 * config.audioContext.sampleRate;

			var N=Math.round(config.audioContext.sampleRate / m_frequency);
			var m_y = new Float32Array(N);
			var n = 0;

			var playingP=false;

			karplusNode.onaudioprocess = function (e) {
				var xn;
				var outBuffer = e.outputBuffer.getChannelData(0);
				for (var i = 0; i < e.outputBuffer.length; ++i) {
					if (playingP) {
						xn = (--m_impulse >= 0) ? Math.random()-0.5 : 0;
						outBuffer[i] = m_y[n] = xn + (m_y[n] + m_y[(n + 1) % N]) / 2;
						if (++n >= N) n = 0;
					} else {
						outBuffer[i]=0;
					}
				}
			};

			karplusNode.noteOn = function(i_time){
				m_impulse = 0.001 * config.audioContext.sampleRate;
				n = 0;
				playingP=true;
			}

			karplusNode.noteOff = function(i_time){
				playingP=false;
			}

			karplusNode.setFrequency = function (i_frequency) {
				m_frequency = i_frequency;
				N=Math.round(config.audioContext.sampleRate / m_frequency);
				m_y = new Float32Array(N);
			};

			return karplusNode;
		};
	}
);