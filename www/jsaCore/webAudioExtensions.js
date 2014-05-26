define(
	function () {		
		return function(ctx){
			//config.audioContext.createOscillator().__proto__.setType=function(num){

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
			}
		}
});