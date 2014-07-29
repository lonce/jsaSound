define(
	["jsaSound/jsaSoundLib/config", "jsaSound/jsaSoundLib/GraphNode"],
	function (config, GraphNode) {	 //(GraphNode) {		
		
			var wtypes=["sine","square","sawtooth","triangle","custom"];
			Object.getPrototypeOf(config.audioContext.createOscillator()).setType=function(ot){
				if (typeof ot === "string"){
					this.type=ot;
					return;
				} 
				if (typeof ot === "number"){
					if (ot < wtypes.length){
						this.type=wtypes[ot];
						return;
					} else{
						this.type=wtypes[0]; // default to sine for out-of-range number
						return;
					}					
				}
				console.log("oscillator.setType: trying to set illegal oscillator type " + ot);
			};


			var ftypes=["lowpass","highpass","bandpass","lowshelf","highshelf","peaking","notch","allpass"];
			Object.getPrototypeOf(config.audioContext.createBiquadFilter()).setType=function(ft){
				if (typeof ft === "string"){
					this.type=ft;
					return;
				} 
				if (typeof ft === "number"){
					if (ft < ftypes.length){
						this.type=ftypes[num];
						return;
					} 					
				}
				console.log("filter.setType: trying to set illegal filter type " + ft);
			};

			
			AudioNode.prototype.WAPIconnect = AudioNode.prototype.connect;
			AudioNode.prototype.connect = function(to_node){
				var wrapper;
				if (to_node.nodeType==="GraphNode"){
					GraphNode({}, [], [this]).connect(to_node);
				} else{
					this.WAPIconnect(to_node);
				}
			}	

});