/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/
//========================================================================================

define(
	["jsaSound/jsaCore/config", "jsaSound/jsaCore/utils"],
	function (config, utils) {
		return function () {
			var k_bufferSizeSeconds=2;

			var bufferSize = k_bufferSizeSeconds * config.audioContext.sampleRate,
			    noiseBuffer = config.audioContext.createBuffer(1, bufferSize, config.audioContext.sampleRate),
			    output = noiseBuffer.getChannelData(0);
			for (var i = 0; i < bufferSize; i++) {
			    output[i] = Math.random() * 2 - 1;
			}

			var whiteNoise = config.audioContext.createBufferSource();
			whiteNoise.buffer = noiseBuffer;
			whiteNoise.loop = true;
			whiteNoise.start(0); 
			return whiteNoise;

		};
	}
);