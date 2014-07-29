/**
* Provides the base class for all sound models
* @module baseSM.js
* @main baseSM.js
* @uses jsaCore/config, jsaCore/utils, scripts/recorderjs/recorder, jsaCore/GraphNode, jsaCore/audioResourceManager, jsaCore/eQueue
*/
/**
* Base factory for sound models
* @class baseSM (Anonymous)
*
*/
/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/

//==============================================================================
// The sound model base class that all models use as a prototype
//==============================================================================


define(
	["jsaSound/jsaCore/config","jsaSound/jsaCore/utils", "jsaSound/scripts/recorderjs/recorder",  "jsaSound/jsaCore/GraphNode", "jsaSound/jsaCore/audioResourceManager", "jsaSound/jsaCore/eQueue", "jsaSound/jsaCore/webAudioExtensions"],
	function (config, utils, r, GraphNode, resourceManager, queueFactory) { // dont actually use this "steller" variable, but rather the global name space setup in jsasteller.

	/**
	* Wraps an audio node graph in to a new "GraphNode" that can be connected in an audio graph just like a Web Audio API audioNode ().
	* The GraphNode returned also provides the generic interface (play, stop, setParam) for control.
	* Also provides methods the sound modeler uses to, for example, register parameters to expose to users. 
	* 
	* @method (baseSM object named when file is loaded)
	* @param i_node  should be empty literal object {}
	* @param i_inputs an array of audio nodes that can be use to connect to this GraphNode
	* @param i_outputs an array of audio nodes that will be used to connect this GraphNode  to other audio nodes or the audio destinations
	* @return The GraphNode function object used to create the sound model (a graph of audioNodes with some identified as input and output nodes for the new GraphNode), as well as to provide the interface for control of the model.
	*/
	return function (i_node, i_inputs, i_outputs) {

			var that=this;
			var aboutText = "";
			var params = {};
			var paramname = []; // array of parameter names

			var pSets=[];
			var pSet={};

			var fs; // file system for saving and loading psets
			var queueManager = queueFactory();


			if (! i_outputs) {
				console.log("Consider providing an output node so model can be composed with other models");
			};

			var bsmInterface =  GraphNode(i_node || {}, i_inputs || [], i_outputs || []);

			bsmInterface.nodeType="GraphNode";
			bsmInterface.isPlaying=false;

			/**
			* @method setAboutText
			* @param {String} i_text text descritption of model, hints, etc
			*/
			bsmInterface.setAboutText = function (i_text){
				aboutText=i_text;
			};

			/**
			* @method getAboutText
			* @return {String} text descritption of model, hints, created with setAboutText 
			*/
			bsmInterface.getAboutText = function () { return aboutText;};

			// Parameters are not over-writable
			/** 
			* Creates a parameter that will be used to control the model and provide information 
			* @method registerParam
			* @param {String} i_name name to expose to the world for this param
			* @param {String} i_type type ["range", "URL"]
			* @param {String} i_val  initial value
			* @param {String} i_f function to execute when setParam(name, val) is called. 
			*/
			bsmInterface.registerParam = function (i_name, i_type, i_val, i_f) {
				if (params.hasOwnProperty(i_name)) {
					console.log("Can not register 2 parameters with the same name");
					return;
				}
				var paramObject = {
					"type": i_type,
					"value": i_val,
					"f": i_f
				};
				params[i_name] = paramObject;
				paramname.push(i_name);
				//i_f(i_val); // can't do this because objects and noted used in the functions may not have been defined yet. 
			};

			/** 
			* Grabs a parameter from a child model, registers it on this model, and just reflects all calls to the child
			* @method registerChildParam
			* @param {SoundModel} childModel 
			* @param {String} childPname name of the child parameter to expose 
			* @param {String} [parentPname=childPname] name to use for the parameter 
			*/
			bsmInterface.registerChildParam = function (childModel, childPname, parentPname){
				var parentPname=parentPname || childPname;
				params[parentPname] = childModel.system.getRawParamObject(childPname);
				paramname.push(parentPname);
			};

			/** 
			* @method getNumParams
			* @return the number of paramters the model exposes
			*/
			bsmInterface.getNumParams = function(){
				return paramname.length;
			};

			/** 
			* @method getParamNames
			* @return array of model parameter names
			*/
			bsmInterface.getParamNames = function(){
				return paramname;
			};

			/** 
			* @method getParamNames
			* @param index index of the parameter whose name you want
			* @return the name of the parameter with the secified index
			*/
			bsmInterface.getParamName = function (index) {
				if (index < paramname.length){
					return paramname[index];
				} else {
					return "";
				}
			};


			/** 
			* Get specified information about a parameter
			* @method getParam
			* @param {String} i_name the name of the param you want info about 
			* @param {String} i_prop on of ["name", "type", "val", "normval", "min" or "max"]
			* @return the value of the property you requested
			*/
			bsmInterface.getParam = function(i_name, i_prop){
				i_name=testPName(i_name);
				if (! i_name) return null;

				var p = params[i_name];

				switch (i_prop){
					case "name":
						return i_name;
					case "type":
						return p.type;
					case "val":
						return p.value.val;
					case "normval":
						return (p.value.val - p.value.min)/(p.value.max - p.value.min);
					case "min":
						return p.value.min;
					case "max":
						return p.value.max;
					default:
						return null;
				}
			}

			/** 
			* Set the parameter using values in [0,1]
			* @method setParamNorm   
			* @param {String} i_name the name of the param you want to set 
			* @param {Number} i_val the value to set the parameter
			*/
			bsmInterface.setParamNorm = function (i_name, i_val) {
				i_name=testPName(i_name);
				if (! i_name) return null;
				var p = params[i_name];
				p.value.val=p.value.min + i_val * (p.value.max - p.value.min);
				/*
				if (p.type==="discrete range") {
					p.value.val=parseInt(p.value.val);
				}
				*/
				p.f(p.value.val);
			};

			/** 
			* set the parameter using values using its own units in [min,max] 
			* @method setParam 
			* @param {String} i_name the name of the param you want to set 
			* @param {Number} i_val the value to set the parameter
			*/
			bsmInterface.setParam = function (i_name) {
				i_name=testPName(i_name);
				if (! i_name) return null;

				var args = [], i;
				for (i = 1; i < arguments.length; i += 1) {
					args.push(arguments[i]);
				}
				params[i_name].value.val=arguments[1];
				/*
				if (p.type==="discrete range") {
					p.value.val=arguments[1]=parseInt(p.value.val);
				}
				*/

				params[i_name].f.apply(this, args);
			};

			/** 
			* @method play 
			* @param {Number} i_time what time to play (recommended use: 0 or no argument; use schedule(t,func) to scheudle play in the future)
			*/
			bsmInterface.play = function (i_time) {
				if (i_time === undefined) i_time=0;
				bsmInterface.isPlaying=true;
				bsmInterface.qClear(i_time);

				bsmInterface.onPlay(i_time);

				// if not connected in a graph or to a recorder, connect ouput to desination to be heard
				if ((bsmInterface.getNumOutConnections() === 0) || (isRecording && (bsmInterface.getNumOutConnections() === 1))){
					bsmInterface.connect(config.defaultDesintation);
				}


				bsmInterface.fire({"type": "play", "ptime": i_time, "snd": this});
			};

			/** 
			* Override this in your sound model
			* @method onPlay    
			* @param {Number} i_time time to play (can be fed to Web Audio API nodes in your override)
			*/
			bsmInterface.onPlay = function(i_time){
				console.log("override onPlay");
			}

			/** 
			* @method release   
			* @param {Number} i_time time to release  (recommended use: 0 or no argument; use schedule(t,func) to scheudle releases in the future)
			*/
			bsmInterface.release = function (i_time) {
				//console.log("at: " + bsmInterface.getAboutText() + " isReleasing");
				if (bsmInterface.isPlaying) {
					bsmInterface.onRelease(i_time);
					if (i_time === undefined) i_time=0;
					bsmInterface.fire({"type": "release", "ptime": i_time, "snd": this});
				}
			};

			/** 
			* Override this in your sound model  to send the model in to its release phase
			* @method onRelease
			* @param {Number} i_time time to release (can be fed to Web Audio API nodes in your override)
			*/
			bsmInterface.onRelease = function (i_time) {
				console.log("override onRelease");
				bsmInterface.stop(i_time);
			};

			/** 
			* Stop the model from playing, disconnects it from output so it won't waste system resources anymore. Your onRelease() method should schedule or call stop when it is done
			* @method stop 
			* @param {Number} i_time time to stop  (recommended use: 0 or no argument; use schedule(t,func) to scheudle stops in the future)
			*/
			bsmInterface.stop = function (i_time) {
				bsmInterface.onStop(i_time);
				bsmInterface.fire({"type": "stop", "ptime": i_time, "snd": this});				
				bsmInterface.isPlaying=false;
				if ((bsmInterface.getNumOutConnections() != 0) && (! isRecording)){
                    console.log("disconnecting output on stop");
                    bsmInterface.disconnect();
                }		
			};

			/** 
			* override this in your sound model  (optional)
			* @method onStop  
			* @param {Number} i_time time to stop (can be fed to Web Audio API nodes)
			*/
			bsmInterface.onStop = function (i_time) {
				//console.log("override onStop");
			};

			bsmInterface.destroy = function () {
				//console.log("baseSM.destroy() should probably be overridden ");
			};

			bsmInterface.qrelease = function (ms) {
				if ((!ms) || ms === 0){
					bsmInterface.release();
				} else {
					bsmInterface.schedule(config.audioContext.currentTime+ms*.001, bsmInterface.release)
				//setTimeout(bsmInterface.release,ms);
				}
			};


			/** 
			* test a parameter number for existence
			* @method testPName 
			* @param {Number} i_ind index of parameter
			* @return  either the parmaeter name (if it exists) or undefined
			*/
			var testPName = function (i_ind){

				if (utils.isInteger(i_ind)) {  // "overload" function to accept integer indexes in to parameter list, too.
					i_ind=bsmInterface.getParamNames()[i_ind];
				} 

				if (!params[i_ind]) {
					//throw "set: Parameter " + i_ind + " does not exist";
					console.log("set: Parameter " + i_ind + " does not exist");
					i_ind=undefined;
				}
				return i_ind;  // it has passed the existence test and been converted to the proper string name.
			}


			bsmInterface.storeCurrentPSet = function(){
				var pSet={};
				for(var i=0;i<bsmInterface.getNumParams();i++){
					pSet[bsmInterface.getParam(i,"name")] = bsmInterface.getParam(i,"val");
				}
				pSets.push(pSet);
			}


			bsmInterface.savePSets = function(){utils.saveToFile(pSets);};



			/** 
			* schedule a function to run in the future (uses a queue and a single timer)
			* @method schedule 
			* @param {Number} t  time to execute
			* @param {Function function to execute at time t
			*/
			bsmInterface.schedule = function(t, f){queueManager.schedule(t, f);};

			/** 
			* Clear the queue of all future events for this model. 
			* @method qClear 
			*/
			bsmInterface.qClear = function(){queueManager.qClear();};

			// vvvvvvvvvvvvvvvvvvvvvvvvvvvv   // intended for use only by jsaSound system
			bsmInterface.system={};
			bsmInterface.system.getRawParamObject=function(name){
				return params[name];
			}
			// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

			bsmInterface.registerParam(
				"play",
				//"discrete range",
				"range",
				{
					"min": 0,
					"max": 1.9999,
					"val": 0
				},
				function (i_val) {
					if (i_val>=1){
						bsmInterface.play();
					}
					else{
						bsmInterface.release();
					}
				}
			);

			// -----------------  loading samples --------------
			bsmInterface.loadAudioResource = resourceManager;

			//------------------  RECORDING  -------------------
			var isRecording=false;
			var audioRecorder=null;
			var recIndex=00;

			/** 
			* Start recording audio output from the model 
			* @method startRecording 
			*/
			bsmInterface.startRecording = function (){
				if (audioRecorder===null){
					console.log("create new recorder with graph node interface");
					audioRecorder = new Recorder( bsmInterface );
				}
				audioRecorder.clear();
				audioRecorder.record();
				isRecording=true;
				console.log("OK, recording!");
			}

			/** 
			* Stop recording audio output from the model 
			* @method stopRecording 
			*/
			bsmInterface.stopRecording = function(){
				isRecording=false;
				audioRecorder.stop();
				audioRecorder.exportWAV( doneEncoding );
				console.log("Done recording!");
			}

			function doneEncoding( blob ) {
    			Recorder.forceDownload( blob, "myRecording" + ((recIndex<10)?"0":"") + recIndex + ".wav" );
    			recIndex++;
			}


			// Let this guy be an event generator (adding 'fire' and 'on' functionality)
			utils.eventuality(bsmInterface);

			return bsmInterface;
		};
	}
);