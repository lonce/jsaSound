/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3 
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/
//
//
// You must provide the name of the host and port you are serving from here. 
define(
	function () {
		var server="http://localhost:8001/";
		//var server="http://animatedsoundworks.com:8001/";
		console.log("Where do I live: Your sounds will be served and looking form resources from " + server);
		console.log("If you are serving from elsewhere, change jsaCore/wheredoilive.js ");
		return server;
	}
);