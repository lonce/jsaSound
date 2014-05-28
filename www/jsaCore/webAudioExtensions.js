define(
	function () {		
		return function(ctx){

			Object.getPrototypeOf(ctx.createOscillator()).setType=function(num){
				switch(num){
					case 0:
						this.type="sine";
						break;
					case 1:
						this.type="square";
						break;
					case 2:
						this.type="sawtooth";
						break;
					case 3:
						this.type="triangle";
						break;
					case 4:
						this.type="custom";
						break;
					default:
						this.type="sine";
				}
			};

			var ftypes=["lowpass","highpass","bandpass","lowshelf","highshelf","peaking","notch","allpass"];
			Object.getPrototypeOf(ctx.createBiquadFilter()).setType=function(ft){
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
		}
});