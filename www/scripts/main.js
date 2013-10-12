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
		"jsaSound": "..",
		"jquery": "http://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.min"
		//LOCAL "jquery": "http://localhost:8001/scripts/jquery.min"
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


			//$.getJSON("soundList/TestModelDescriptors", function(data){
			$.getJSON("/soundList/ModelDescriptors", function(data){

			soundList =  data.jsonItems;
			//console.log("Yip! sound list is " + soundList);
			soundSelectorElem.options.length=0;
			soundSelectorElem.add(new Option(''));
			for (i = 0; i < soundList.length; i += 1) {
				currOptionName = soundList[i].displayName || "";
					//Add option to end of list
					soundSelectorElem.add(new Option(currOptionName));
				}
				soundSelectorElem.options[0].selected="true";
			});
		}

		// When a sound is selected
		function soundChoice() {
			var sb;
			if (soundSelectorElem.selectedIndex <1) return;  // we added a "blank" to the selector list.
			var pathToLoad = "jsaSound/" + soundList[soundSelectorElem.selectedIndex-1].fileName;
			loadSoundFromPath(pathToLoad);
		}

		function loadSoundFromPath(path) {
			require(
				// Get the model
				[path], // -1 since we added a blank first element to the selection options
				// And open the sliderBox
				function (currentSM) {
					if (path.indexOf("jsaSound/") === 0)
						path = path.substr("jsaSound/".length);
					sb = makeSliderBox(currentSM(), path);
				}
			);
		}

		if (utils.getParameterByName("modelname")) {
			loadSoundFromPath(utils.getParameterByName("modelname"));
		}

		makeSoundListSelector();
		soundSelectorElem.addEventListener("change", soundChoice);
	}
);
