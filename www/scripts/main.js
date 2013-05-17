/*
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
*/
require.config({
	paths: {
		// "core": "../jsaCore",
		// "baseSM": "../jsaCore/baseSM",
		// "models": "../jsaModels",
		// "utils": "../jsaCore/utils",
		// "opCodes": "../jsaOpCodes",
		// "config": "../jsaCore/config",
		"jsaSound": "..",
		"jquery": "http://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.min"
	}
});
require(
	["require", "jsaSound/jsaCore/sliderBox", "jsaSound/jsaCore/utils", "jquery"],
	function (require, makeSliderBox, utils) {
		var currentSndModel;
		var soundSelectorElem = document.getElementById("soundSelector");

		var soundList;

		// Create the html select box using the hard-coded soundList above
		function makeSoundListSelector() {
			var i;
			var currOptionName;


			$.getJSON("soundList", function(data){
			soundList =  utils.filesToObjectList(data.surfaces);
			//console.log("Yip! sound list is " + soundList);
			soundSelectorElem.options.length=0;
			soundSelectorElem.add(new Option(''));
			for (i = 0; i < soundList.length; i += 1) {
				currOptionName = soundList[i].fileName || "";
					//Add option to end of list
					soundSelectorElem.add(new Option(currOptionName));
				}
				soundSelectorElem.options[0].selected="true";
			});
		}

		// When a sound is selected
		function soundChoice() {
			var sb;
			require(
				// Get the model
				["jsaSound/jsaModels/" + soundList[soundSelectorElem.selectedIndex].fileName],
				// And open the sliderBox
				function (currentSM) {
					sb = makeSliderBox(currentSM());
				}
			);
		}


		makeSoundListSelector();
		soundSelectorElem.addEventListener("change", soundChoice);

	}
);
