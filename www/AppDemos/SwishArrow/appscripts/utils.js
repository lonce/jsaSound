define(
    [],
        function(){
            var utils = {};
    		// utilities
		    // Until requestAnimationFrame comes standard in all browsers, test
            // for the prefixed names as well.

            utils.getRequestAnimationFrameFunc = function() {
                try {
                    return (window.requestAnimationFrame ||
                            window.webkitRequestAnimationFrame ||
                            window.mozRequestAnimationFrame ||
                            window.msRequestAnimationFrame ||
                            (function (cb) {
                                setTimeout(cb, 1000/60);
                            }));
                } catch (e) {
                    return undefined;
                }
            };


            utils.getCanvasMousePosition = function (canvas, evt) {
                var rect = canvas.getBoundingClientRect();
                //context.scale(1, 0.5);
                var bbox = canvas.getBoundingClientRect();
                return {
                x: (evt.clientX - rect.left)*(canvas.width/bbox.width),
                y: (evt.clientY - rect.top)*(canvas.height/bbox.height)
                };
            }

            return utils;
});
