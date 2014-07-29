/**
* Creates a convolver node
* @module jsaConvolverNode.js
* @main jsaConvolverNode.js
*/
/**
* @class jsaConvolverNode (Anonymous)
*
*/

define(
    ["jsaSound/jsaSoundLib/utils", "jsaSound/jsaSoundLib/config"],
    function (utils, config) {

    /**
    * Creates convolver node based on the audio resource from a URL
    * @method (anonymous function named on module load)
    * @param {String} soundUrl
    * returns Web Audio API convolver node  
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