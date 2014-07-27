define(
    ["jsaSound/jsaCore/config"],
    function GraphNodeAPI(config){

        // A globally referenced hash storing references to preserved nodes.
        var allPreservedNodes = (function () {
            var globalNamespace = this; // Quirk: "this" here refers to the global namespace.
            var hashKey = '#jsaSound.jsaCore.GraphNode.allPreservedNodes';
            var hash = globalNamespace[hashKey];
            if (!hash) {
                hash = {};
                Object.defineProperty(globalNamespace, hashKey, {
                    value: hash,
                    writable: false,
                    configurable: false,
                    enumerable: false
                });
            }
            return hash;
        }());


        function GraphNode(node, inputs, outputs) {
            node.inputs             = inputs || [];
            node.outputs            = outputs || [];

            node.numberOfInputs     = node.inputs.length;
            node.numberOfOutputs    = node.outputs.length;

            if (node.numberOfOutputs > 0) {  // leave it undefined if no outputs were provided
                node.numOutConnections=0; // total number of connections made from node.outputs
            }
           
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

                if (! outPin) {  // node.outputs === []
                    alert("The model you are trying to connect has not provided any ouptut nodes for connections");
                    throw("The model you are trying to use has not provided any ouptut nodes for connections"); // if nobody catches this, the message isn't delivered anywhere
                    return node;
                }

                /* The "receiving pin" could be a simple AudioNode
                * instead of a wrapped one. */
                inPin = target.inputs ? target.inputs[inIx] : target;

                if (inPin.constructor.name === 'AudioParam' || inPin.constructor.name === 'AudioGain') {
                    // a-rate connection.
                    outPin.connect(inPin);
                    node.numOutConnections+=1;
                } else if (inPin.numberOfInputs === outPin.numberOfOutputs) {
                    for (i = 0, N = inPin.numberOfInputs; i < N; ++i) {
                        outPin.connect(inPin, i, i);
                        node.numOutConnections+=1;
                    }
                } else {
                    outPin.connect(inPin);
                    node.numOutConnections+=1;
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
                        node.numOutConnections-=1;
                    });
                } else {
                    /* Disconnect all output pins. This is also the 
                    * behaviour of AudioNode.disconnect() */
                    node.outputs.forEach(function (n) { n.disconnect(); });
                    node.numOutConnections=0;
                }

                return node;
            };

            // Getters
            node.numOutputs = function (){
                return node.numberOfOutputs;
            };

            node.numInputs = function (){
                return node.numberOfInputs;
            };

            node.hasOutputs = function () {
                if (node.numberOfOutputs > 0) return true; else return false;
            };

            node.getNumOutConnections = function(){

               if (!(node.numOutConnections >= 0)) {  // node.outputs === []
                    console.log("The model you are asking about has not provided any ouptut nodes for connections");
                    //throw("The model you are trying to use has not provided any ouptut nodes for connections"); // if nobody catches this, the message isn't delivered anywhere
                    return 0;
                }
                return node.numOutConnections;
            };

            // ### keep and drop
            //
            // Javascript audio nodes need to be kept around in order to prevent them
            // from being garbage collected. This is a bug in the current system and
            // `keep` and `drop` are a temporary solution to this problem. However,
            // you can also use them to keep around other nodes. 
            //
            // CAUTION: keep/drop requires explicit management of node references.
            // So if you (GraphNode user) want some nodes to be given up on disconnect,
            // you have to arrange for that yourself.


            var preservedNodes = {};
            var thisNodeID = getOrAssignNodeID(node);

            // Preserves the given child node by keeping a reference
            // to it that is reachable from the global namespace.
            node.keep = function (childNode) {
                var theNode = childNode || node;
                var id = getOrAssignNodeID(theNode);
                preservedNodes[id] = theNode;
                return theNode;
            };

            // If drop() is called without a node argument,
            // then all nodes preserved through this graph node
            // will be dropped.
            node.drop = function (childNode) {
                if (childNode) {
                    var id = getOrAssignNodeID(childNode);
                    delete preservedNodes[id];
                } else {
                    preservedNodes = {};
                    delete allPreservedNodes[thisNodeID];
                }
            };

            allPreservedNodes[thisNodeID] = preservedNodes;

            return node;
        }


        // A simple scheme for assigning unique node IDs to nodes.
        // Node ids are generated in sequence and stored in the
        // key given by nodeIDKey.
        GraphNodeAPI.nextNodeID = GraphNodeAPI.nextNodeID || 1;
        var nodeIDKey = '#jsaSound.jsaCore.GraphNode.globalid';

        function getOrAssignNodeID(node) {
            var id = node[nodeIDKey];
            if (!id) {
                id = GraphNodeAPI.nextNodeID;
                GraphNodeAPI.nextNodeID += 1;
                Object.defineProperty(node, nodeIDKey, {
                    value: id,
                    writable: false,
                    enumerable: false,
                    configurable: false
                });
            }
            return id;
        }

        return GraphNode;
    }
);
