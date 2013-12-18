

define(
    ["jsaSound/jsaCore/config"],
    function (config) {

        var AC=config.audioContext;

        return function (soundUrl) {

            var loadedfile="";

            // Can this be reused? This code is only run the first time any sound uses jsaConvolveNode
            var xhr = new XMLHttpRequest();
            var convolver;// = config.audioContext.createConvolver();
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
            

    /*
                xhr.onload = function() {
                    config.audioContext.decodeAudioData( xhr.response, 
                        function(buffer) { 
                            convolver.buffer = buffer; 
                        } );
                    loadedfile=soundUrl;
                };
                */

                xhr.send();     
            }


        convolver = config.audioContext.createConvolver();
        loadfile(soundUrl);
        return convolver;
    };



}
);