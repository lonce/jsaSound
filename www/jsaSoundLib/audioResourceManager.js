
/**
* Provides the base class for all sound models
* @module AudioResourceManager.js
* @main AudioResourceManager.js
* @uses jsaSoundLib/config, jsaSoundLib/utils
*/
/**
* @class AudioResourceManager (Anonymous)
*
*/
define(
    ["jsaSound/jsaSoundLib/config", "jsaSound/jsaSoundLib/utils"],
    function AudioResourceManager(config, utils){

    	var resourceManager =  {
			"m_loadedResources" : {}, // stores file names (as property names) and ArrayBuffers (as property values) so audio file resources don't have to be retrieved for than once (for example if multiple instances of a resource-using sound model are loaded). 
			"m_waitingForResource": {}, // queue of callbacks waiting for a buffer already being loaded by another caller

			/**
			* Manages audio resource loading so that only resources are only loaded once, and are stored in buffers that multiple sounds (or polyphonic sounds) can then reference.
			* @method loadAudioResource
			* @param {String} i_url The url of the audio resource to be loaded
			* @param {function} i_onload function to be called when loaded. Will be passed the buffer that the audio resource has been loaded in to. 
			*/
			"loadAudioResource": function(i_url, i_onload){

					var xhr = new XMLHttpRequest();

					xhr.onerror = function (e) {
						console.log("utils.getAudioResource xhr.onload error for " + i_url + ".")
						console.error(e);
					};

					var onDecode=function(b){
						resourceManager.m_loadedResources[i_url]=b;
						i_onload(b);
						// and same for those waiting for this resource
						while (resourceManager.m_waitingForResource[i_url].length > 0){
							//console.log("OK, got the resource I was waiting for!");
							resourceManager.m_waitingForResource[i_url].shift()(b);						
						}

					}

					xhr.onload = function () {
						console.log("Sound(s) loaded");
						config.audioContext.decodeAudioData(xhr.response, onDecode, xhr.onerror);
					};


					if (resourceManager.m_loadedResources.hasOwnProperty(i_url)){
						if (resourceManager.m_loadedResources[i_url]==="loading"){
							// queue up call back
							//console.log("Somebody else is loading this resource, wait for it....!")
							resourceManager.m_waitingForResource[i_url].push(i_onload);
							return;
						} // else return the buffer previously loaded to the caller. 
						console.log("The url, " + i_url + "was previously loaded. UReturning loaded buffer to caller");
						onDecode(resourceManager.m_loadedResources[i_url]);
						return;
					} else {
						resourceManager.m_loadedResources[i_url]="loading";
						resourceManager.m_waitingForResource[i_url]=[];

						xhr.open('GET', utils.freesoundfix(i_url), true);
						xhr.responseType = 'arraybuffer';
						xhr.send();	
					}
			}
		}

		return resourceManager.loadAudioResource;
    }
);
