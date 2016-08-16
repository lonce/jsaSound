/**
* Creates a convolver node
* @module jsaConvolverNode.js
* @main jsaConvolverNode.js
*/
/**
* @class jsaConvolverNode (Function)
*
*/

define(
    ["jsaSound/jsaSndLib/utils", "jsaSound/jsaSndLib/config"],
    function (utils, config) {

    /**
    * Creates convolver node based on the audio resource from a URL
    * @method (jsaConvolverNode)
    * @param {String} soundUrl name of audio resource to use as convolution kernel 
    * @return Web Audio API convolver node  
    */
        return function (soundUrl) {

            var convolver;

            function onLoadAudioResource(b){
                convolver.buffer = b;
            }
            
            convolver = config.audioContext.createConvolver();
            utils.loadAudioResource(soundUrl, config, onLoadAudioResource);
            return convolver;
        };
});