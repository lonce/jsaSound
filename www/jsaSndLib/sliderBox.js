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
Date: July 2012
 */
/* 
This code generates a bank of sliders dynamically given a list of sound model parameter data.
(or any object that returns a list of elements in response to a getParams() call that look like this:
    {type, value{min, max, val}, function}
It creates a new window for a "player" GUI with sliders and text boxes to show values.
   To do that, it has to create the HTML code including element ID's used for setting up callbacks for slider changes.
   This code works with multi - word parameter names, too.
 */

// Create the GUI for sound model interaction and the callbacks for taking action
define(
	["jsaSound/jsaSndLib/baseSM", "jsaSound/jsaSndLib/utils", "jsaSound/jsaSndLib/config", "require"],
	function (baseSM, utils, config, require ) {

		return function (i_sm, sm_string_name) {  // argument is a sound model, and a name for the slider box title bar
			var i;
			var val;

			var controllerButton;

			// This is the interface that will be returned by this factory method
			var myInterface = baseSM({},[],[]);
			// yep, this GUI has the same interface as a base sound model : play, release, and registerParam!

			var numParams = i_sm.getNumParams();

			var h = 100 + 70 * numParams; // more sliders, longer window

			// Do it all in a new window
			// close the old and create a new window each time this method is called.
			var myWindow = {};
			myWindow = window.open('', '', "width = 400,height = " + h);
			myWindow.document.write("<link href=\"css/sliderBox.css\" rel=\"stylesheet\" type=\"text/css\">");
			if (sm_string_name) myWindow.document.title = sm_string_name.replace("jsaModels/","") || "jsaSound Parameter Slider Box";

			if (i_sm.getAboutText()) {
				myWindow.document.write("<div class=\"tb\" id=\"aboutTextID\"></div>");  //so it can be styled
				myWindow.document.getElementById("aboutTextID").innerHTML =i_sm.getAboutText();
			}

			myInterface.close = function(){
				confirmExit();
				myWindow.close();
			};


			function setupRangeParameter(paramName) {
				var controllerID, textID, checkID;
				controllerID = paramName.replace(/\s+/g, '') + "_controllerID";
				textID   = paramName.replace(/\s+/g, '') + "_textID";
				checkID  = paramName.replace(/\s+/g, '') + "_checkID";

				// Fit value into the min-max range
				var val = Math.max(Math.min(i_sm.getParam(paramName,"max"), i_sm.getParam(paramName, "val") ), i_sm.getParam(paramName,"min"));

				// Generate slider GUI code:
				myWindow.document.write(" <div  class = \"paramName\" > " + paramName + "</div> ");

				// Output will look like this: <input id = "foo_controllerID" type = "range" min = "0" max = "1" step = "0.01" value = "0.1" style = "width: 300px; height: 20px;" />
				myWindow.document.write("<input id = \"" + controllerID + "\" type = \"range\" min = " + parseFloat(i_sm.getParam(paramName,"min")) + " max = " + parseFloat(i_sm.getParam(paramName,"max")) + " step = \"0.01\" value = " + parseFloat(val) + " style = \"width: 300px; height: 20px;\" />");

				// Output will look like this: <input id = "bar_textID" type = "text"  name = "textfield" size = 4 /> <br />
				myWindow.document.write("<input id = " + textID +   " type = \"text\"  value = " + parseFloat(val) + " name = \"textfield\" size = 5 /> ");

				myWindow.document.write("<input type=\"checkbox\" id="+ checkID + ">");
				// For each slider/text field pair, set up a callback to change the text field when the slider moves.
				// WARNING: COOL AND PROPERLY - WRITTEN CLOSURE CODE AHEAD ...
				var controllerElement = myWindow.document.getElementById(controllerID);

				//TODO: Check if it might be better to separate this as a factory function
				controllerElement.update = (function (i_textID, pName) {
					var cb = function () {
						var sval = parseFloat(controllerElement.value);
						//Set the parameter in the SM
						i_sm.setParam(pName, sval);
						//console.log("calling set param with value " + sval);
						//-----------------------------paramFunc(sval); // jsbug - w/o parseFloat, when values are whole numbers, they can get passed as strings!!
						myWindow.document.getElementById(i_textID).value = sval;
					};
					return cb;
				}(textID, paramName));

				controllerElement.addEventListener('input', controllerElement.update);

				// Store the min and max value of the parameters so that we can properly set the sliders from normalized control message values
				// We dont need the default value or store a function to call - thus the two nulls
				//console.log("in sliderbox, registering interface param " + controllerElement);
				myInterface.registerParam(
					controllerID, //controllerElement,
					"range",
					{
						"min": i_sm.getParam(paramName,"min"),
						"max": i_sm.getParam(paramName,"max"),
						"val": null
					},
					null
				);
				//console.log("in sliderbox, interface now has  " + utils.objLength(myInterface.getParams()) + " registered elements" );

			}

			function setupUrlParameter(paramName) {
				var controllerID, textID;
				controllerID = paramName.replace(/\s+/g, '') + "_controllerID";
				textID   = paramName.replace(/\s+/g, '') + "_textID";
				checkID  = paramName.replace(/\s+/g, '') + "_checkID";

				var val = i_sm.getParam(paramName, "val");
				myWindow.document.write(" <div  class = \"paramName\" > " + paramName + "</div> ");
				myWindow.document.write("<input id = \"" + controllerID + "\" type = \"url\" value = \"" + val + "\" style = \"width: 300px; height: 20px;\" />");
				myWindow.document.write("<input id = \"" + controllerID + "_button\" type = \"button\" value = \"Load\" style = \"width: 50px; height: 20px;\" />");
				myWindow.document.write("<input type=\"checkbox\" id="+ checkID + ">");

				var controllerElement = myWindow.document.getElementById(controllerID);
				controllerButton = myWindow.document.getElementById(controllerID + "_button");

				//TODO: Check if it might be better to separate this as a factory function
				controllerElement.update = (function (ctlelmt, pName) {
					var cb = function () {
						var sval = ctlelmt.value;
						i_sm.setParam(pName, sval);
						//---------------------paramfunc(sval);
						//paramfunc(controllerElement.value);
					};
					return cb;
				}(controllerElement, paramName)); // control element is the url text box, not the button. 

				controllerButton.addEventListener('click', controllerElement.update);
				//NOT IMPLEMENTING THAT registerParam thing... yet
			}

			function setupPlayButtonParameter(paramName) {
				var controllerID = paramName.replace(/\s+/g, '') + "_controllerID";
				var buttonID = paramName.replace(/\s+/g, '') + "_buttonID";
				//console.log("play button controller id is " + controllerID)
				var checkID  = paramName.replace(/\s+/g, '') + "_checkID";

				// Fit value into the min-max range
				var val = Math.max(Math.min(i_sm.getParam(paramName,"max"), i_sm.getParam(paramName, "val") ), i_sm.getParam(paramName,"min"));
				myWindow.document.write("<input hidden id=\"" + controllerID + "\" type=\"range\" min=" + parseFloat(i_sm.getParam(paramName,"min")) + " max=" + parseFloat(i_sm.getParam(paramName,"max")) + " step=0.01 value=" + parseFloat(val) + " />");
				// Create the Play button
				myWindow.document.write("<input id = \"" + buttonID + "\" type = \"button\" value = \"Play\" /> ");
				myWindow.document.write("<input type=\"checkbox\" id="+ checkID + ">");

				var controllerElement = myWindow.document.getElementById(controllerID);
				var buttonElement = myWindow.document.getElementById(buttonID);
				controllerElement.update = (function (controllerElement, buttonElement, paramName) {
					var cb = function () {
						var val = parseFloat(controllerElement.value);
						i_sm.setParam(paramName, val);
						if (val >= 1)
							buttonElement.value = "Release";
						else
							buttonElement.value = "Play";
					};
					return cb;
				}(controllerElement, buttonElement, paramName)); // control element is the url text box, not the button. 

				function togglePlaying() {
					var val = parseFloat(controllerElement.value);
					if (val >= 1){
						//myInterface.release();
						//i_sm.release();
						myInterface.setParam("play", 0);
					}
					else{
						//myInterface.play();
						//i_sm.play();

						myInterface.setParam("play", 1);
					}
				}

				buttonElement.addEventListener('click', togglePlaying);

				// so play() and setParam("play", 1) have the same effect	
				myInterface.onPlay = function (i_ptime) {
					//myInterface.setParam("play", 1);
					//i_sm.play();
				};

				// so release() and setParam("play", 0) have the same effect
				myInterface.onRelease = function (i_ptime) {
					//myInterface.setParam("play", 0);
					//i_sm.release();
				};

			}

			function setupParameter(paramName) {
				// create IDs to be used for change listener callbacks removing spaces in multi - word names
				//TODO LOW: This 'reduction' of the name can create issues:

				switch (i_sm.getParam(i,"type")) {
				case "range":
					setupRangeParameter(paramName);
					break;
				case "url":
					setupUrlParameter(paramName);
					break;
				default:
					throw "setupParameter: Parameter type " + i_sm.getParam(i,"type") + " does not exist";
				}
			}

			// Now set up the parameters
			for (i = 0; i < i_sm.getNumParams(); i++) {
				if ("play" === i_sm.getParam(i,"name")){
					setupPlayButtonParameter(i_sm.getParam(i,"name"));
				} else {
					setupParameter(i_sm.getParam(i,"name"));
				}
			}
			// end for each parameter loop

			// Turn off sounds if window is closed
			function confirmExit() {
				i_sm.release();
				i_sm.destroy();
			}

			myWindow.onbeforeunload = confirmExit;

			myWindow.focus();
			//console.log("moved focus");

			//-------------------------------------------------------------------------------------------------------------- 
			// Now overide the methods of the sound model interface to move the sliders on this GUI
			//    We do this so that programatic changes will be reflected in the gui as well as (through the gui) change the sound.
			//    To the caller, this API looks just like a sound model - except that they have to use setParamNorm rather than sound model specific parameter setting functions.

			// override the baseSM interface method to set params by moving sliders on the slider box 
			myInterface.setParamNorm = function (i_name, i_val) {
				var paramName, paramList, paramObject;
				if (utils.isInteger(i_name)) {
					paramName = myInterface.getParamName(i_name);
				} else {
					paramName = decodeURIComponent(i_name); 
				}

				var controllerElement = myWindow.document.getElementById(paramName.replace(/\s+/g, '') + "_controllerID");
				// console.log("!!!!PARAM NORM IS BEING SET!!!");
				controllerElement.value = i_sm.getParam(paramName,"min") + i_val * (i_sm.getParam(paramName,"max") - i_sm.getParam(paramName,"min"));   // pfunc(pmin + i_Val * (pmax - pmin))
				// console.log("i_val is " + i_val);
				// console.log("controllerElement is:");
				// console.log(controllerElement);
				// console.log("!!!VALUE IS " + controllerElement.value);
				controllerElement.update();
			};

			myInterface.setParam = function (i_name, i_val) {
				var paramName, paramList, paramObject;
				if (utils.isInteger(i_name)) {
					paramName = myinterface.getParamName(i_name);
				} else {
					paramName = decodeURIComponent(i_name);
				}

				var controllerElement = myWindow.document.getElementById(paramName.replace(/\s+/g, '') + "_controllerID");
				controllerElement.value = i_val;
				controllerElement.update();
			};

			function isParamChecked(paramName) {
				var id = paramName.replace(/\s+/g, '') + "_checkID";  // this is how we constructed checkbox IDs from paramnames
				//console.log("isParamChecked " + paramName + " = " + myWindow.document.getElementById(id).checked);
				if (myWindow.document.getElementById(id).checked)
					return true;
				return false;
			}

			function getParamState(paramName) {
				return {
					name: paramName,
					type: i_sm.getParam(paramName, "type"),
					value: i_sm.getParam(paramName, "val")
				};
			}

			//------------------------------------------------------------------------------------------------------
			// This function returns an array of triplets, one for each "selected" parameter, consisting of: 
			// [paramName, type, value]
			// The play/stop button is special since it has no type. If it is checked, the triplet returned isL
			// [play/stop, nState, play] or [play/stop, nState, release]  (depending on whether the sound is currently playing). 
			myInterface.getSelected = function () {
				var retval=[];
				var id;
				var paramNames = i_sm.getParamNames();
				var currParamName;
				var i;

				for (i = 0; i < paramNames.length; i++) {
					currParamName = paramNames[i];

					if (isParamChecked(currParamName)){
						retval.push(getParamState(currParamName));
					}
				}

				//console.log("getSelected returning " + retval);//retval.prettyString());
				return retval;
			};

			function uncheckParam(paramName) {
				var id = paramName.replace(/\s+/g, '') + "_checkID";
				var elem = myWindow.document.getElementById(id);
				if (elem.checked)
					elem.click();
			}

			function checkParam(paramName) {
				var id = paramName.replace(/\s+/g, '') + "_checkID";
				var elem = myWindow.document.getElementById(id);
				if (!elem.checked)
					elem.click();
			}

			function uncheckAll() {
				var paramNames = i_sm.getParamNames();
				var i;
				for (i = 0; i < paramNames.length; i++) {
					uncheckParam(paramNames[i]);
				}
			}

			function checkAllFromList(paramList) {
				var i;
				for (i = 0; i < paramList.length; i++)
					checkParam(paramList[i]);
			}

			function setParamValues(state) {
				var i;
				for (i = 0; i < state.length; i++)
					myInterface.setParam(state[i].name, state[i].value);
			}

			myInterface.setState = function (state) {
				//console.log("setState called with state: " + JSON.stringify(state));
				uncheckAll();

				var stateElems = state.map(function (param) {
					return param.name;
				});

				checkAllFromList(stateElems);

				setParamValues(state);
			};


			myWindow.document.write(" <hr style=\"height:.1em;\" />");




			//   -------------    RECORDING -------------------------
			var recState=false;
			// make a button for capturing Javascript code representation of parameter values for cutting and pasting into other programs
			//myWindow.document.write(" <div  class = \"captureButtons\" > ");
			myWindow.document.write(" <input id = \"recordbutton_ID\" type = \"button\"  value = \"Record Audio\" /> ");
			//myWindow.document.write("Record audio and save to file. <br>");
			//myWindow.document.write(" </div> ");
			// Play button callback
			myWindow.document.getElementById("recordbutton_ID").addEventListener('mousedown', function () {
				if (recState===false){
					this.value="Stop/Save Audio";
					recState=true;
					i_sm.startRecording();

				} else{
					this.value="Record Audio";
					recState=false;
					i_sm.stopRecording();
				}
			});

			// ------------------- Query String Capture
			//myWindow.document.write(" <div  class = \"captureButtons\" > ");
			myWindow.document.write(" <input id = \"quesryStringbutton_ID\" type = \"button\"  value = \"URL String\" /> ");
			//myWindow.document.write("Generate url for this sound model<br>");
			//myWindow.document.write(" </div> ");

			// Play button callback
			myWindow.document.getElementById("quesryStringbutton_ID").addEventListener('mousedown', function () {
			var urlWindow = {};
			urlWindow = window.open('', '', "width = 625,height = " + 40);
			var pstring="";
			
			pstring+=config.resourcesPath; //"http://animatedsoundworks.com:8001/";
			pstring+="?modelname=jsaSound/" + sm_string_name;


			for (i = 0; i < i_sm.getNumParams(); i++) {
				if (i!=0) {
					//pstring += "&" + "\"" + i_sm.getParam(i, "name") +  "\"" + "=";
					pstring += "&" +  i_sm.getParam(i, "name") +  "=";
					pstring +=  i_sm.getParam(i, "val") ;
				}
			}
			urlWindow.document.write(pstring);

			});

			// ----------------------    Code Capture  ----------------------//
			// make a button for capturing Javascript code representation of parameter values for cutting and pasting into other programs
			// make a button for capturing Javascript code representation of parameter values for cutting and pasting into other programs
			//myWindow.document.write(" <div  class = \"captureButtons\" > ");
			myWindow.document.write(" <input id = \"capturebutton_ID\" type = \"button\"  value = \"Code Capture\" /> ");
			//myWindow.document.write("Generate js code with current paramaters<br>");
			//myWindow.document.write(" </div> ");

			// Play button callback
			myWindow.document.getElementById("capturebutton_ID").addEventListener('mousedown', function () {
				//alert("capture");
				var userSndName = prompt("enter a name for this sound in your code.");
				var userSndName = userSndName || "snd";
				
				var captureWindow = {};
				captureWindow = window.open('', '', "width = 625,height = " + h/1.25);
				var pstring="";

				pstring+="// To use the sound on a web page with its current parameters (and without the slider box):<br>"

				pstring+="require.config({<br>&#160&#160&#160 paths: {\"jsaSound\": \"http://animatedsoundworks.com:8001\"}<br>});<br>";
				pstring+="require(<br>&#160&#160&#160 [\"jsaSound/" + sm_string_name + "\"],<br><br>";
				pstring+="function(" + userSndName + "Factory){<br>";
				pstring+="&#160&#160&#160 var " + userSndName + " = " + userSndName + "Factory();<br><br>"


				for (i = 0; i < i_sm.getNumParams(); i++) {

					if ("url" === i_sm.getParam(i,"type")){
						
						pstring += "<br>";
						pstring += "&#160&#160&#160 //URL params can take some time to load - when done, they trigger the \"resourceLoaded\" event. <br>"
						pstring += "&#160&#160&#160 " + userSndName + ".on(\"resourceLoaded\", function(){<br>";
						pstring += "&#160&#160&#160&#160&#160&#160 console.log(\"----- sound loaded, so Play!\");<br>";
						pstring += "&#160&#160&#160&#160&#160&#160 // " + userSndName + ".setParam(\"play\", 1);<br>";
						pstring += "&#160&#160&#160 });<br>"
						pstring += "&#160&#160&#160 " + userSndName + ".setParam(\"" + i_sm.getParam(i, "name") + "\", \"" + i_sm.getParam(i, "val") + "\");";

						pstring += "<br><br>";
						
					} else { 
						pstring += "&#160&#160&#160 " + userSndName + ".setParam(\"" + i_sm.getParam(i, "name") + "\", " + i_sm.getParam(i, "val") + ");";
						if ((typeof i_sm.getParam(i, "val")) === "number"){
							pstring += "&#160&#160&#160 //or// " + userSndName + ".setParamNorm(\"" + i_sm.getParam(i, "name") + "\", " + i_sm.getParam(i, "normval").toFixed(3) + ");";
						}
						pstring += "<br>";
					}
				}

				pstring+="});<br>";
				pstring+="//-------------------------//<br>";

				captureWindow.document.write(pstring);

				var pstring="// Parameters in array form: <br> [";
				for (i = 0; i < i_sm.getNumParams(); i++) {
					if (i!=0) pstring += ", ";
					pstring +=  i_sm.getParam(i, "val") ;
				}

				pstring +=  "] <br>";
				captureWindow.document.write(pstring);
			});

			//   -------------              -------------------------


			myWindow.document.write(" <input id = \"saveModel_ID\" type = \"button\"  value = \"Save Model\" /> ");
			myWindow.document.getElementById("saveModel_ID").addEventListener('mousedown', 
				function () {
					console.log("saving a model file");
				  	require( // for some reason, loading Filesaver at the top of this module was causing jsaSound system to call methods before they were defined .....
				  		["jsaSound/jsaSndLib/FileSaver.req"],
				  		function(fileSaver) {

				  			var waitForResourceLoading = false ; // if sound has wave files to load, then we will wait until the loadedresources callback is called before setting retval

				  			console.log("the filesaver file module has been loaded as " + fileSaver);
							var userSndName = "snd";
							var pstring="";

							//console.log("now write config stuff")
							pstring +="require.config({\n";
							pstring += "    paths: {\"jsaSound\": \"http://animatedsoundworks.com:8001\"}\n";
							pstring += "});\n"
							//console.log("pstring is now " + pstring);
							//console.log("proceed");


							pstring += "// Set path to models served from animatedsoundworks \n"
							

							pstring+="// To use the sound on a web page with its current parameters (and without the slider box):\n"

							pstring+="define(\n [\"jsaSound/" + sm_string_name + "\"],\n\n";
							pstring+="function(" + userSndName + "Factory){\n";
							pstring+= "  return function(cb){\n"
							//pstring+= "    var retval=\"waiting\";\n";


							pstring+= "    " + userSndName + "Factory(function(" + userSndName  + "){\n\n"


							for (i = 0; i < i_sm.getNumParams(); i++) {

								if ("url" === i_sm.getParam(i,"type")){
									
									pstring += "\n";
									pstring += "  //URL params can take some time to load - when done, they trigger the \"resourceLoaded\" event. \n"
									pstring += "        "+ userSndName + ".on(\"resourceLoaded\", function(){\n";
									pstring += "          console.log(\"----- sound loaded, so Play!\");\n";


									//pstring += "          retval = " + userSndName + ";\n";
									waitForResourceLoading = true;
									pstring += "          cb && cb(" + userSndName + ");\n";

									pstring += "  // " + userSndName + ".setParam(\"play\", 1);\n";
									pstring += "        });\n"
									pstring += "        " + userSndName + ".setParam(\"" + i_sm.getParam(i, "name") + "\", \"" + i_sm.getParam(i, "val") + "\");";

									pstring += "\n\n";

									waitForResourceLoading = true;
									
								} else { 
									pstring += "        " + userSndName + ".setParam(\"" + i_sm.getParam(i, "name") + "\", " + i_sm.getParam(i, "val") + ");";
									pstring += "\n";
								}
							}


							if (! waitForResourceLoading ) { // if sound doesn't load resources, then set retval for returning sound
								pstring += "        cb && cb(" + userSndName + ");\n"
							}

							
							pstring+="    });\n";

							/*
							pstring += "    if (!cb){ // BLOCK and return snd synchronously\n";
							pstring += "        while(retval===\"waiting\"){\n";
							pstring += "           var foo = 3; // something to hang a breakpoint on \n"
							pstring += "        };\n";
							pstring += "        return retval;\n"
							pstring +="    }\n";
							*/

							//pstring += "return(snd);\n"
							pstring += "  }\n";
							pstring+="});\n";




						  var blob = new Blob([pstring]);
						  console.log("now save blob");
						  var foo = new fileSaver(blob);
						});

			});








			return myInterface;
		};
	}
);
