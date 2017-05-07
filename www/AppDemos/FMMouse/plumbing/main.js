require.config({
        paths: {
                "jsaSound": "https://animatedsoundworks.com"}
});
require(
	["jsaSound/jsaModels/jsaFMnative2"], 

	function (sndFactory) {
		// First create the sound model from the factory.
		var snd = sndFactory();

		// Get a bunch of info about the sound and print it to the console (optional)
		console.log("The sound has " + snd.getNumParams() + " parameters :");
		for(var i=0;i<snd.getNumParams();i++){
			console.log("snd param[" + i + "] is " + snd.getParam(i,"name") + " of type " + snd.getParam(i,"type")
				+ " with min " + snd.getParam(i,"min") + ", and max " + snd.getParam(i,"max"));
		}
		//=====================================================================================================
		/* The play(), release(), stop(), and parameter setting with setParamNorm() can be tied to
			any event or object in your javascript code. Here we use simple mouse events and motion.
		*/

		// play the sound
		window.onmousedown=function(e){
			snd.play();
		};

		// release the sound sending it into its decay segment (use stop() if you want to stop the sound abruptly)
		window.onmouseup=function(e){
			snd.release();
		};

		// Setting sound parameters, in this case using normalized values (in [0,1]).
		window.onmousemove=function(e){			
			snd.setParamNorm(1, e.clientX/window.innerWidth);  // setting by parameter index
			snd.setParamNorm("Modulation Index", e.clientY/window.innerHeight); // setting by parameter name
		};
	}
);