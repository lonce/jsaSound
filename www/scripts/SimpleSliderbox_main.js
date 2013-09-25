/*
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
*/

/* "Install" the jsaSound code by putting the 4 jsaSound direcories: jsaCore, jsaModels, jsaOpCodes, and scripts in to your working directory.
	Pass in the jsaModels that you want to play using the Require protocol as shown below.
*/

require.config({
	paths: {
		"jsaSound": "http://animatedsoundworks.com:8001" // for have sound served from animatedsoundworks
	}
});
var modelFileName = document.getElementById("modeldiv").getAttribute("modelname");
require(
	[modelFileName], 

	function (sndFactory) {
		var snd = sndFactory();

		var numParams = snd.getNumParams();
		var h = 100 + 70 * numParams; // more sliders, longer window
		window.moveTo(0,0);
		console.log("before resize, w = " + window.outerWidth + ", and h = " + window.outerHeight);
		window.resizeTo(400,h);
		console.log("after resize, w = " + window.outerWidth + ", and h = " + window.outerHeight);
		console.log("my window is " + window);

		window.document.write("<link href=\"css/sliderBox.css\" rel=\"stylesheet\" type=\"text/css\">");
		if (snd.getAboutText()) {
				window.document.write("<div class=\"tb\" id=\"aboutTextID\"></div>");  //so it can be styled
				window.document.getElementById("aboutTextID").innerHTML =snd.getAboutText();
		}





			function setupRangeParameter(paramName) {
				var controllerID, textID;
				controllerID = paramName.replace(/\s+/g, '') + "_controllerID";
				textID   = paramName.replace(/\s+/g, '') + "_textID";
				//checkID  = paramName.replace(/\s+/g, '') + "_checkID";

				// Fit value into the min-max range
				var val = Math.max(Math.min(snd.getParam(paramName,"max"), snd.getParam(paramName, "val") ), snd.getParam(paramName,"min"));

				// Generate slider GUI code:
				window.document.write(" <div  class = \"paramName\" > " + paramName + "</div> ");

				// Output will look like this: <input id = "foo_controllerID" type = "range" min = "0" max = "1" step = "0.01" value = "0.1" style = "width: 300px; height: 20px;" />
				window.document.write("<input id = \"" + controllerID + "\" type = \"range\" min = " + parseFloat(snd.getParam(paramName,"min")) + " max = " + parseFloat(snd.getParam(paramName,"max")) + " step = \"0.01\" value = " + parseFloat(val) + " style = \"width: 300px; height: 20px;\" />");

				// Output will look like this: <input id = "bar_textID" type = "text"  name = "textfield" size = 4 /> <br />
				window.document.write("<input id = " + textID +   " type = \"text\"  value = " + parseFloat(val) + " name = \"textfield\" size = 2 /> ");

				//window.document.write("<input type=\"checkbox\" id="+ checkID + ">");
				// For each slider/text field pair, set up a callback to change the text field when the slider moves.
				// WARNING: COOL AND PROPERLY - WRITTEN CLOSURE CODE AHEAD ...
				var controllerElement = window.document.getElementById(controllerID);

				//TODO: Check if it might be better to separate this as a factory function
				controllerElement.change = (function (i_textID, pName) {
					var cb = function () {
						var sval = parseFloat(controllerElement.value);
						//Set the parameter in the SM
						snd.setParam(pName, sval);
						//-----------------------------paramFunc(sval); // jsbug - w/o parseFloat, when values are whole numbers, they can get passed as strings!!
						window.document.getElementById(i_textID).value = sval;
					};
					return cb;
				}(textID, paramName));

				controllerElement.addEventListener('change', controllerElement.change);


			}

			function setupUrlParameter(paramName) {
				var controllerID, textID;
				controllerID = paramName.replace(/\s+/g, '') + "_controllerID";
				textID   = paramName.replace(/\s+/g, '') + "_textID";
				//checkID  = paramName.replace(/\s+/g, '') + "_checkID";

				var val = snd.getParam(paramName, "val");
				window.document.write(" <div  class = \"paramName\" > " + paramName + "</div> ");
				window.document.write("<input id = \"" + controllerID + "\" type = \"url\" value = \"" + val + "\" style = \"width: 300px; height: 20px;\" />");
				window.document.write("<input id = \"" + controllerID + "_button\" type = \"button\" value = \"Load\" style = \"width: 50px; height: 20px;\" />");
				//window.document.write("<input type=\"checkbox\" id="+ checkID + ">");

				var controllerElement = window.document.getElementById(controllerID);
				controllerButton = window.document.getElementById(controllerID + "_button");

				//TODO: Check if it might be better to separate this as a factory function
				controllerElement.change = (function (ctlelmt, pName) {
					var cb = function () {
						var sval = ctlelmt.value;
						snd.setParam(pName, sval);
						//---------------------paramfunc(sval);
						//paramfunc(controllerElement.value);
					};
					return cb;
				}(controllerElement, paramName)); // control element is the url text box, not the button. 

				controllerButton.addEventListener('click', controllerElement.change);
				//NOT IMPLEMENTING THAT registerParam thing... yet
			}

			function setupPlayButtonParameter(paramName) {
				var controllerID = paramName.replace(/\s+/g, '') + "_controllerID";
				var buttonID = paramName.replace(/\s+/g, '') + "_buttonID";
				console.log("play button controller id is " + controllerID)
				//var checkID  = paramName.replace(/\s+/g, '') + "_checkID";

				// Fit value into the min-max range
				var val = Math.max(Math.min(snd.getParam(paramName,"max"), snd.getParam(paramName, "val") ), snd.getParam(paramName,"min"));
				window.document.write("<input hidden id=\"" + controllerID + "\" type=\"range\" min=" + parseFloat(snd.getParam(paramName,"min")) + " max=" + parseFloat(snd.getParam(paramName,"max")) + " step=0.01 value=" + parseFloat(val) + " />");
				// Create the Play button
				window.document.write("<input id = \"" + buttonID + "\" type = \"button\" value = \"Play\" /> ");
				//window.document.write("<input type=\"checkbox\" id="+ checkID + ">");

				var controllerElement = window.document.getElementById(controllerID);
				var buttonElement = window.document.getElementById(buttonID);
				controllerElement.change = (function (controllerElement, buttonElement, paramName) {
					var cb = function () {
						var val = parseFloat(controllerElement.value);

						if (val >= 1){
							buttonElement.value = "Play";
							controllerElement.value=0;
						}
						else{
							buttonElement.value = "Release";
							controllerElement.value=1;
						}
						snd.setParam(paramName, controllerElement.value);
					};
					return cb;
				}(controllerElement, buttonElement, paramName)); // control element is the url text box, not the button. 

/*
				function togglePlaying() {
					var val = parseFloat(controllerElement.value);
					if (val >= 1)
						myInterface.setParam("play", 0);
					else
						myInterface.setParam("play", 1);
				}

				buttonElement.addEventListener('click', togglePlaying);
*/
				buttonElement.addEventListener('click', controllerElement.change);

			}

			function setupParameter(paramName) {
				// create IDs to be used for change listener callbacks removing spaces in multi - word names
				//TODO LOW: This 'reduction' of the name can create issues:

				switch (snd.getParam(i,"type")) {
				case "range":
					setupRangeParameter(paramName);
					break;
				case "url":
					setupUrlParameter(paramName);
					break;
				default:
					throw "setupParameter: Parameter type " + snd.getParam(i,"type") + " does not exist";
				}
			}

			// Now set up the parameters
			for (i = 0; i < snd.getNumParams(); i++) {
				if ("play" === snd.getParam(i,"name")){
					setupPlayButtonParameter(snd.getParam(i,"name"));
				} else {
					setupParameter(snd.getParam(i,"name"));
				}
			}
			// end for each parameter loop

			// Turn off sounds if window is closed
			function confirmExit() {
				snd.release();
			}

			window.onbeforeunload = confirmExit;

			window.focus();

			//------------------------------------------------------------------------
			window.document.write(" <hr style=\"height:.1em;\" />");

			// make a button for capturing Javascript code representation of parameter values for cutting and pasting into other programs
			window.document.write(" <input id = \"capturebutton_ID\" type = \"button\" style=\"float:right;\" value = \"Code Capture\" /> ");
			// Play button callback
			window.document.getElementById("capturebutton_ID").addEventListener('mousedown', function () {
				//alert("capture");
				var captureWindow = {};
				captureWindow = window.open('', '', "width = 575,height = " + h/1.25);
				var pstring="";

				pstring+="// To use the sound on a web page with its current parameters (and without the slider box):<br>"

				pstring+="require.config({<br>&#160&#160&#160 paths: {\"jsaSound\": \"http://animatedsoundworks.com:8001\"}<br>});<br>";
				pstring+="require(<br>&#160&#160&#160 [" + modelFileName + "],<br><br>";
				pstring+="function(sndFactory){<br>";
				pstring+="&#160&#160&#160 var snd = sndFactory();<br><br>"


				for (i = 0; i < snd.getNumParams(); i++) {
					pstring += "&#160&#160&#160 snd.setParam(\"" + snd.getParam(i, "name") + "\", " + snd.getParam(i, "val") + ");<br>" 
				}

				pstring+="});<br>"
				pstring+="//-------------------------//<br>"

				captureWindow.document.write(pstring);



				var pstring="// parameters in array form: <br> [";
				for (i = 0; i < snd.getNumParams(); i++) {
					if (i!=0) pstring += ", ";
					pstring +=  snd.getParam(i, "val") ;
				}
				pstring +=  "] <br>" ;
				captureWindow.document.write(pstring);

			});

			//   -------------    RECORDING -------------------------
			var recState=false;
			// make a button for capturing Javascript code representation of parameter values for cutting and pasting into other programs
			window.document.write(" <input id = \"recordbutton_ID\" type = \"button\" style=\"float:right;\" value = \"Start Recording\" /> ");
			// button callback
			window.document.getElementById("recordbutton_ID").addEventListener('mousedown', function () {
				if (recState===false){
					this.value="Stop Recording";
					recState=true;
					snd.startRecording();

				} else{
					this.value="Start Recording";
					recState=false;
					snd.stopRecording();
				}
			});


			window.document.write("<div class=\"aswFooter\" id=\"homeLink\" ></div>");  //so it can be styled
			window.document.getElementById("homeLink").innerHTML = "<a href=\"http://animatedsoundworks.com:8001\">AnimatedSoundWorks</a>";


	}
);