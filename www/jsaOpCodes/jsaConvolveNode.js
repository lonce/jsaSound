

define(
    ["jsaSound/jsaCore/config"],
    function (config) {

        var AC=config.audioContext;
        var loadedfile="";

        var xhr = new XMLHttpRequest();
        var convolver = config.audioContext.createConvolver();
        var sBuffer=0;


         function loadfile(soundUrl) {
         if (loadedfile===soundUrl) return;              
            xhr.open('GET', soundUrl, true);
            xhr.responseType = 'arraybuffer';
            xhr.onerror = function (e) {
                console.error(e);
            };
            
            xhr.onload = function () {
                sBuffer = config.audioContext.createBuffer(xhr.response, false);
                loadedfile=soundUrl;
                convolver.buffer = sBuffer;
            };
            xhr.send();     
        }


        return function (soundUrl) {
            loadfile(soundUrl);
             return convolver;
        };



    }
);