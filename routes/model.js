
/*
 * GET users listing.
 */
var url = require('url');


exports.foo = function(req, res){

	console.log("req.params is " + JSON.stringify(url.parse(req.url, true).query, null, 4));
	console.log("bar is " + url.parse(req.url, true).query.bar);

	var name = url.parse(req.url, true).query.modelname;
	console.log("modelname is " + url.parse(req.url, true).query.modelname);
  //res.send("respond with a darned resource");

  //"jsaSound/jsaModels/jsaFM"}
  res.render('sm', { title: "Your model is " + name, modelname: name });
  
};