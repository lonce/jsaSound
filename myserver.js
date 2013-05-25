var express = require("express")
, app = express()
, server = require('http').createServer(app)
, WebSocketServer = require('ws').Server
, wss = new WebSocketServer({server: server})
, fs = require('fs');

var k_portnum = 8082;

console.log("hey myserver is starting with command line arguments:");
process.argv.forEach(function (val, index, array) {
  console.log(index + ': ' + val);
});
if (process.argv.length < 3){
    console.log("usage: node myserver portnum");
    process.exit(1);
}
k_portnum=process.argv[2];


//****************************************************************************
var m_useRoot="/www";
//app.use(m_useRoot, express.static(__dirname + m_useRoot));
app.use(express.static(__dirname + m_useRoot));


server.listen(process.argv[2] || k_portnum);
console.log("Connected and listening on port " + k_portnum);

wss.on('connection', function (ws) {
    ws.id = id++;
    console.log("got a connection, assigning ID = " + ws.id);

    ws.on('close', function() {        
        console.log(ws.id + " is gone..." );
    });
});





//++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// Match a request for data from the client and return requested json data
app.get("/soundList",function(req, res){
  var jsonObj;
  var jsonList=[];
    // get list of file names
    getFileList("./www/ModelDescriptors", function (z, flist){ // TODO: The 1st arg should obviously be passed in as data from the client!
        for(i=0;i<flist.length;i++){
          // clean list so paths are relative to client directory
          flist[i]=flist[i].replace(m_useRoot, "");
          //console.log("results are" + flist);

          jsonObj= JSON.parse(fs.readFileSync("./" + m_useRoot + "/" + flist[i], 'utf8'));
          console.log("jsonObj.file name is " + jsonObj.fileName);
          jsonList.push(jsonObj);
        }
        res.send({"jsonItems": jsonList});
    });
})



// Generic function that recursivley searches a directory for files
// return: list of full pathnames
var getFileList = function(dir, done) {
  console.log("walking the walk");
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = dir + '/' + file;
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
};





exports.server = server;

