
var k_portnum = 8082;

console.log("hey myserver is starting with command line arguments:");
process.argv.forEach(function (val, index, array) {
  console.log(index + ': ' + val);
});
if (process.argv.length < 4){
    console.log("usage: node myserver portnum mode (production or dev)");
    process.exit(1);
}

var k_portnum=process.argv[2];
var mode=process.argv[3];
//****************************************************************************



if (mode=="production") {
    var express = require("express")
    , app = express()
    , server = require('http').createServer(app)
    , WebSocketServer = require('ws').Server
    , wss = new WebSocketServer({server: server})
    , fs = require('fs');
} else {
    console.log('using development mode')
    var express = require("express");
    var app = express();
    var https = require('https');
    var fs = require('fs');

    var WebSocketServer = require('ws').Server

    var options = {
    //key: fs.readFileSync('/etc/letsencrypt/live/animatedsoundworks.com/cert.key'),
    //cert: fs.readFileSync('/etc/letsencrypt/live/animatedsoundworks.comlocalssl/cert.pem')
    key: fs.readFileSync('localssl/cert.key'),
    cert: fs.readFileSync('localssl/cert.pem')
    };

    console.log('options are ' + options)

    server = https.createServer(options, app);
    wss = new WebSocketServer({server: server})
}
/*
var express = require("express")
, app = express()
, server = require('http').createServer(app)
, WebSocketServer = require('ws').Server
, wss = new WebSocketServer({server: server})
, fs = require('fs');
*/

/*
const mode = "production"

const express = require("express");
const app = express();
const https = require('https');
const fs = require('fs');


var WebSocketServer = require('ws').Server

var options={};
if (mode=="production"){
  options = {
    key: fs.readFileSync('localssl/cert.key'),
    cert: fs.readFileSync('localssl/cert.pem')
  }
} else {
  options = {
    key: fs.readFileSync('/etc/letsencrypt/live/animatedsoundworks.com/cert.key'),
    cert: fs.readFileSync('/etc/letsencrypt/live/animatedsoundworks.comlocalssl/cert.pem')
  };  
}

server = https.createServer(options, app);
wss = new WebSocketServer({server: server})
*/
console.log('so far so good !!!!!!!!!!!!!!!!');

//-------------------------------------------------------------


var m_useRoot="/www";

// For serving individual sounds with query strings -----------
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
//-------------------------------------------------------------


// Way cool: Allow access to sounds that aren't specifically required by require.js in apps on other domains
app.use(function (req, res, next) {
  console.log("cross domain coolness for " + req.url);
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

app.use(express.static(__dirname + m_useRoot));
app.use(express.static("/Demo", __dirname ));

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
app.get(["/soundList", "/soundList/ModelDescriptors"],function(req, res){
  var jsonObj;
  var jsonList=[];
  console.log("fetching from ModelDescriptors");
    // get list of file names
    getFileList("./www/ModelDescriptors", function (z, flist){ // TODO: The 1st arg should obviously be passed in as data from the client!
        for(i=0;i<flist.length;i++){
          // clean list so paths are relative to client directory
          flist[i]=flist[i].replace(m_useRoot, "");
          //console.log("results are" + flist);

          console.log("readFileSync with path " + "./" + m_useRoot + "/" + flist[i]);
          jsonObj= JSON.parse(fs.readFileSync("./" + m_useRoot + "/" + flist[i], 'utf8'));

          //jsonObj= JSON.parse(fs.readFileSync("./" + m_useRoot + "/" + flist[i], 'utf8'));

          console.log("done with readFile Sync");
          console.log("jsonObj is " + jsonObj); 

          console.log("jsonObj.file name is " + jsonObj.fileName);
          // could test for existence here before sending the info back to the client...
          jsonList.push(jsonObj);
        }
        res.send({"jsonItems": jsonList});
    });
});

// Match a request for data from the client and return requested json data
app.get(["/soundList/TestModelDescriptors"],function(req, res){
  var jsonObj;
  var jsonList=[];
  console.log("fetching from TestModelDescriptors");
    // get list of file names
    getFileList("./www/TestModelDescriptors", function (z, flist){ // TODO: The 1st arg should obviously be passed in as data from the client!
        for(i=0;i<flist.length;i++){
          // clean list so paths are relative to client directory
          flist[i]=flist[i].replace(m_useRoot, "");
          //console.log("results are" + flist);

          jsonObj= JSON.parse(fs.readFileSync("./" + m_useRoot + "/" + flist[i], 'utf8'));
          console.log("jsonObj.file name is " + jsonObj.fileName);
          // could test for existence here before sending the info back to the client...
          jsonList.push(jsonObj);
        }
        res.send({"jsonItems": jsonList});
    });
})



// Generic function that recursivley searches a directory for files
// return: list of full pathnames
var getFileList = function(dir, done) {
  //console.log("walking the walk");
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = dir + '/' + file;
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          getFileList(file, function(err, res) {
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

