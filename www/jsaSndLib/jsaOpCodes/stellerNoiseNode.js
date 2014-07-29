


define(
    ["jsaSound/jsaSdLib/config"],
    function (config) {

        var AC=config.audioContext;

        var noiseBuffer = AC.createBuffer(1, 5 * AC.sampleRate, AC.sampleRate);
        var data = noiseBuffer.getChannelData(0);
        var i, N;
        for (i = 0, N = data.length; i < N; ++i) {
            data[i] = 2 * Math.random() - 1;
        }


        N = 1024;
        var dcBuffer = AC.createBuffer(1, N, AC.sampleRate);
        data = dcBuffer.getChannelData(0);
        for (i = 0; i < N; ++i) {
            data[i] = 1.0;
        }


        dc_node = function (value) {
            var dc = AC.createBufferSource();
            dc.buffer = dcBuffer;
            dc.loop = true;
            dc.start(0);

            var gain = AC.createGain();
            gain.gain.value = value;
            dc.connect(gain);

            var model = org.anclab.steller.SoundModel({}, [], [gain]);
            model.level = org.anclab.steller.Param({min: -1.0, max: 1.0, audioParam: gain.gain});

            return model;
        };


        return function () {
            var source = AC.createBufferSource();
            source.buffer = noiseBuffer;
            source.loop = true;
            source.gain.value = 1.0;

            var gain = AC.createGain();
            gain.gain.value = 1.0;

            source.connect(gain);
            source.start(0);

            var dc = dc_node(0);
            dc.connect(gain);

            var model = org.anclab.steller.SoundModel({}, [], [gain]);
            model.spread = org.anclab.steller.Param({min: 0.01, max: 10.0, audioParam: source.gain});
            model.mean = dc.level;

            return model;
        };
    }
);