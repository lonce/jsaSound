define(
    ["jsaSound/jsaCore/config"],
    function GraphNode(config){
        return  function GraphNode(node, inputs, outputs) {
            node.inputs             = inputs || [];
            node.outputs            = outputs || [];

            node.numberOfInputs     = node.inputs.length;
            node.numberOfOutputs    = node.outputs.length;
           
            // Get the audio context this graph is a part of.
            node.context = config.audioContext;
            console.assert(node.context);

            // ### connect
            //
            // Same function signature as with the Web Audio API's [AudioNode].
            //
            // [AudioNode]: https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html#AudioNode-section
            node.connect = function (target, outIx, inIx) {
                var i, N, inPin, outPin;

                /* If the target is not specified, then it defaults to the destination node. */
                target = target || node.context.destination;

                /* Set default output pin indices to 0. */
                outIx = outIx || 0;
                inIx = inIx || 0;
                outPin = node.outputs[outIx];

                /* The "receiving pin" could be a simple AudioNode
                * instead of a wrapped one. */
                inPin = target.inputs ? target.inputs[inIx] : target;

                if (inPin.constructor.name === 'AudioParam' || inPin.constructor.name === 'AudioGain') {
                    // a-rate connection.
                    outPin.connect(inPin);
                } else if (inPin.numberOfInputs === outPin.numberOfOutputs) {
                    for (i = 0, N = inPin.numberOfInputs; i < N; ++i) {
                        outPin.connect(inPin, i, i);
                    }
                } else {
                    outPin.connect(inPin);
                }

                return node;
            };

            // ### disconnect
            //
            // Same function signature as with the Web Audio API's [AudioNode].
            // ... but we also support providing the pin numbers to disconnect
            // as arguments.
            //
            // [AudioNode]: https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html#AudioNode-section
            node.disconnect = function () {
                if (arguments.length > 0) {
                    /* Disconnect only the output pin numbers identified in
                    * the arguments list. */
                    Array.prototype.forEach.call(arguments, function (n) {
                        node.outputs[n].disconnect();
                    });
                } else {
                    /* Disconnect all output pins. This is also the 
                    * behaviour of AudioNode.disconnect() */
                    node.outputs.forEach(function (n) { n.disconnect(); });
                }

                return node;
            };

            // ### keep and drop
            //
            // Javascript audio nodes need to be kept around in order to prevent them
            // from being garbage collected. This is a bug in the current system and
            // `keep` and `drop` are a temporary solution to this problem. However,
            // you can also use them to keep around other nodes.

            var preservedNodes = [];

            node.keep = function (node) {
                preservedNodes.push(node);
                return node;
            };

            node.drop = function (node) {
                preservedNodes = preservedNodes.filter(function (n) { return n !== node; });
            };

            return node;
        }
    }
);