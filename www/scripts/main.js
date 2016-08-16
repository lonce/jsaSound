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
	}
});
require(
	["require", "jsaSound/jsaSndLib/sliderBox", "jsaSound/jsaSndLib/utils",  "jquery"],
	function (require, makeSliderBox, utils) {
		var currentSndModel;
		var soundSelectorElem = document.getElementById("soundSelector");

		var soundList;
		var useList=["jsaSoundDemo"];
		// Create the html select box using the hard-coded soundList above
		function makeSoundListSelector() {
			var i;
			var currOptionName;


			//$.getJSON("soundList/TestModelDescriptors", function(data){
			$.getJSON("/soundList/ModelDescriptors", function(data){

				var items = data.jsonItems;
				soundList=[];

				//console.log("Yip! sound list is " + soundList);
				soundSelectorElem.options.length=0;
				soundSelectorElem.add(new Option('Choose Sound'));
				for (i = 0; i < items.length; i += 1) {
					if ((items[i].modelKeys) && (intersectionP(items[i].modelKeys, useList))){
						currOptionName = items[i].displayName || "";
						soundSelectorElem.add(new Option(currOptionName));
						soundList.push(data.jsonItems[i]);
					}
				}
				soundSelectorElem.options[0].selected="true";
			});
		}

		function intersectionP(a1, a2){
			for(var i=0;i<a1.length;i++){
				for(var j=0;j<a2.length;j++){
					if (a1[i]===a2[j]) return true;
				}
			}
			return false;
		}


		// When a sound is selected
		function soundChoice() {
			var sb;
			if (soundSelectorElem.selectedIndex <1) return;  // we added a "blank" to the selector list.
			var pathToLoad = "jsaSound/" + soundList[soundSelectorElem.selectedIndex-1].fileName;
			loadSoundFromPath(pathToLoad);
		}

		function loadSoundFromPath(path, params) {
			require(
				// Get the model
				[path], // -1 since we added a blank first element to the selection options
				// And open the sliderBox
				function (currentSM) {
					if (path.indexOf("jsaSound/") === 0)
						path = path.substr("jsaSound/".length);
					sb = makeSliderBox(currentSM(), path);
					for (var pname in params){
						console.log("param " + pname + "= " + params[pname])
						sb.setParam(pname, params[pname])
					}
				}
			);
		}

		// If model name is assigned in the querystring
		if (utils.getParameterByName("modelname")) {
			var params=utils.QueryStringToJSON();
			delete params["modelname"]
			loadSoundFromPath(utils.getParameterByName("modelname"), params);
			var foo = 3;
		}



		makeSoundListSelector();
		soundSelectorElem.addEventListener("change", soundChoice);
	}
);
