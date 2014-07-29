define(
	["jsaSound/jsaSoundLib/config", "jsaSound/jsaSoundLib/GraphNode"],
	function (config, GraphNode) {
		return function (microphone, connect_to) {
			//var microphone = i_microphone;
			//var connect_to = i_connect_to;

			function gotAudio(stream) {
				

				console.log("in gotAudio, stream is " + stream);
				console.log("in gotAudio, audioContext is " + config.audioContext);
				if (! config.microphone) {
					config.microphone = config.audioContext.createMediaStreamSource(stream);
					console.log("in gotAudio,  microphone is "  + microphone + ", and we are connecting to " + connect_to);
				} else {
					console.log("already have mic, use the same one.");
				}
				microphone=config.microphone;

				/* no need for this, and it doesn't solve am-noise problem
    			var splitter = config.audioContext.createChannelSplitter(2);
    			var merger = config.audioContext.createChannelMerger(2);

    			microphone.connect( splitter );
    			splitter.connect( merger, 0, 0 );
    			splitter.connect( merger, 0, 1 );
    			merger.connect(connect_to);
				*/

				/*
				// do this GraphNode Wrapping just in case the node we are connecting to is a GraphNode
				var micWrapper=microphone;
				if (connect_to.nodeType==="GraphNode"){
					micWrapper=GraphNode({}, [], [microphone]);
				}
				micWrapper.connect(connect_to);
				*/

				microphone.connect(connect_to);


			}

			function error() {
				alert('Stream generation failed. Must a) run this sound in the sound-input enabled browser such as Chrome, b) run on a proper server,  c) explicity allow the browser to use sound by pushing the button on the main page.');
			}


			/*
			try{
					//mediaGetter({audio:true}, gotAudio, error);
				navigator.webkitGetUserMedia({audio:true}, gotAudio, error);
			} catch(e){
				alert('webkitGetUserMedia threw exception :' + e);
			}
			*/

			if (!navigator.getUserMedia)
				navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

			if (!navigator.getUserMedia)
				return(alert("Error: getUserMedia not supported!"));

		    navigator.getUserMedia({audio:true}, gotAudio, function(e) {
		            alert('Error in getUserMedia');
		            console.log(e);
		        });


		};
	}
);