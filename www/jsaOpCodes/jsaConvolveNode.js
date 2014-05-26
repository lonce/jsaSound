

define(
    ["jsaSound/jsaCore/utils", "jsaSound/jsaCore/config"],
    function (utils, config) {

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