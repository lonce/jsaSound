

require(
	["require", "http://animatedsoundworks.com/soundServer/jsaModels/jsaFM"],
	//["require", "jsaSound/jsaModels/jsaFM"], // This loads a model from a local directory
	function (require, sndFactory) {

		// First create the sound model from the factory.
		var snd = sndFactory();

		// Parameter names or indexes are used for setting values and getting info.
		// You can also see the parameter names in the sliderBox browser app that comes with jsaSound for playing sounds.
		console.log("The sound has " + snd.getNumParams() + " parameters :");
		for(var i=0;i<snd.getNumParams();i++){
			console.log("snd param[" + i + "] is " + snd.getParam(i,"name") + " of type " + snd.getParam(i,"type") +
				" with min " + snd.getParam(i,"min") + ", and max " + snd.getParam(i,"max"));
		}
		//=====================================================================================================
		/* The play(), release(), stop(), and parameter setting with setParamNorm() can be tied to
			any event or object in your javascript code. Here we use simple mouse events and motion.
		*/
		// play the sound
		window.onmousedown=function(){
			snd.play();
		};

		// release the sound sending it into its decay segmen (use stop() if you want to stop the sound abruptly)
		window.onmouseup=function(){
			snd.release();
		};

		// Setting sound parameters, in this case using normalized values (in [0,1]).
		window.onmousemove=function(e){
			var normX = e.clientX/window.innerWidth;
			var normY = e.clientY/window.innerHeight;
			
			snd.setParamNorm(0, normX );  // setting by parameter index
			snd.setParamNorm("Modulation Index", normY); // setting by parameter name
		};
	}
);