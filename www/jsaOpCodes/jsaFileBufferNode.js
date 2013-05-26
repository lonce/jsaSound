

define(
    ["jsaSound/jsaCore/config"],
    function (config) {

        var AC=config.audioContext;
        var loadedfile="";

        var xhr = new XMLHttpRequest();
        var source;
        var sBuffer = AC.createBuffer(2, 2, AC.sampleRate);

         function loadfile(soundUrl, onLoad) {
         if (loadedfile===soundUrl) { // buffer already created and file data already loaded from earlier call
            onLoad();
            return;
            }
            xhr.open('GET', soundUrl, true);
            xhr.responseType = 'arraybuffer';
            xhr.onerror = function (e) {
                console.error(e);
            };
            xhr.onload = function () {
                sBuffer = config.audioContext.createBuffer(xhr.response, false);
                loadedfile=soundUrl;

                onLoad();
            };
            xhr.send();     
        }

        // assign file data buffer to new source
        function initBufferSource(){
            source.buffer = sBuffer;
            source.loop = false;
            source.gain.value = 1.0;

        }

        return function (soundUrl) {
           source = AC.createBufferSource();  // this factory function gets called for every start() stop() call pair
           loadfile(soundUrl, initBufferSource);
           return source;
        };



    }
);