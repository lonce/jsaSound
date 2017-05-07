/*
 * This jsaSound Code is distributed under LGPL 3
 * Copyright (C) 2012 National University of Singapore
 * Inquiries: director@anclab.org
 * 
 * This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
 * This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
 * You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
*/
//---------------------------------------------------------------------------------------------------

require.config({
 	paths: {"jsaSound": "https://animatedsoundworks.com/"}});
require(
	["require", "utils", "jsaSound/jsaModels/son/swish"],

	function (require, utils, sndFactory) {

		var snd = sndFactory();

		snd.setParam("play", 0);   
		snd.setParam("Position", 0);    
		snd.setParam("Attack Time", 0.5);    
		snd.setParam("Release Time", 1);    
		snd.setParam("Gain", 1);    

		var flightRate=1; // seconds
		var relScreenPos;
		var rafID; // for canceling request animation frame...
		var myrequestAnimationFrame = utils.getRequestAnimationFrameFunc();

		var initArrowX=0;
		var initArrowY=50;
		var arrowPosX=initArrowX;
		var arrowLength=120;

		var myCanvas = document.getElementById("myCanvas");
		var context= myCanvas.getContext('2d');

		context.canvas.width  = window.innerWidth;
  		context.canvas.height = window.innerHeight;

		var img = new Image();
		img.src = "Resources/arrow_with_bg_clipped_rev_1.png";
		img.width=arrowLength;
		img.height=25;
		img.onload = function(){drawArrow(initArrowX, initArrowY)};

	    //-------------------------------------------------------------------------
		// 's' key to reset arrow
		window.addEventListener("keydown", keyDown, true);
		function keyDown(e){
         		var keyCode = e.keyCode;
         		switch(keyCode){
         			case 83: // 's' key
         				arrowPosX = initArrowX;
         				drawArrow(arrowPosX, initArrowY);
         				window.cancelAnimationFrame(rafID);

         				snd.setParam("play", 0);
				}
		}

	    //-------------------------------------------------------------------------
		// Mousedown to "shoot"
		window.onmousedown=function(e){
			flightRate = 25*e.clientX/window.innerWidth;
			mvArrow();

			snd.setParam("play", 1);

		}

	    //-------------------------------------------------------------------------
		// draw the arrow at the new position
	    var drawArrow = function (posx, posy){
		    context.clearRect(0, 0, myCanvas.width, myCanvas.height);
		    context.drawImage(img,posx,posy, arrowLength, 25);
	    }

	    //-------------------------------------------------------------------------
	    // Compute new arrow position based on position and flightRate
	    var mvArrow = function(){
	    	if (arrowPosX<myCanvas.width-arrowLength){
	    	   	arrowPosX+=flightRate;

	    		relScreenPos=arrowPosX/(myCanvas.width-arrowLength);
	    		
	    		//  ----  Drive the sound with the graphics --------//
	    		snd.setParamNorm("Position", relScreenPos);

	    		drawArrow(arrowPosX,initArrowY); 
	    		rafID = myrequestAnimationFrame(mvArrow);
	    	} 
	    }
	}
);