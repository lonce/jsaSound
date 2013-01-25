

define(
    ["jsaSound/jsaCore/config"],
    function (config) {

        var AC=config.audioContext;

        var noiseBuffer = AC.createBuffer(1, 5 * AC.sampleRate, AC.sampleRate);
        var data = noiseBuffer.getChannelData(0);
        var i, N;
        for (i = 0, N = data.length; i < N; ++i) {
            data[i] = 2 * Math.random() - 1;
        }

        return function () {
            var source = AC.createBufferSource();
            source.buffer = noiseBuffer;
            source.loop = true;
            source.gain.value = 1.0;
            source.noteOn(0);

            return source;
        };
    }
);