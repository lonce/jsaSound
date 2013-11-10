/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/
// args:
define(
	function () {
		var audioUtils = {};

		//--------------------------------------------------------------------------------
		var calculateNoteFreqs = function(){
			var baseClassNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
			var baseClassInterval = [-9,-7,-5,-4,-2,0,2];
			var accidentalNames = ['b','','#'];
			var accidentalInterval=[-1,0,1];

			var noteFreqs={};
			var semitonesFromA4;

			for (var octNum=0; octNum<=9; octNum++){
				for(var noteNum=0;noteNum<=6;noteNum++){
					for (var accNum=0;accNum<=2;accNum++){
						semitonesFromA4 = 12*(octNum-4) + baseClassInterval[noteNum]+accidentalInterval[accNum];
						//console.log("semitones from a4 is " + semitonesFromA4);
						noteFreqs[baseClassNames[noteNum]+accidentalNames[accNum]+octNum]=440*Math.pow(2,semitonesFromA4/12);
					}
				}
			}
			return noteFreqs;
		}

		// creates an object that looks like this: {..., "Ab4": 415, "A4": 440, "A#4": 466, ...} 
		// with octave from [0,9], accidentals in ['b', '', '#']
		var noteFreqs=calculateNoteFreqs();

		audioUtils.note2Freq = function(noteName){
			return noteFreqs[noteName];
		}
		//--------------------------------------------------------------------------------

		// 0 dB yields 1, -6 dB yeileds .5
		audioUtils.dB2Ratio = function (i_dB ){
			return Math.pow(10.0, i_dB/20.0);
		}


		return audioUtils;
	}
);