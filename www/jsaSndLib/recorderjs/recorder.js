// This lovely recording code is from Matt Diamond:
// https://github.com/mattdiamond/Recorderjs
//
define(["jsaSound/jsaSndLib/recorderjs/recorderWorker"],
function(workerF){

  // The reason for this little piece of work is that paths to worker code are usually specificed 
  //   as a file, but we get cross-domain errors when we point to the file. Instead we "require" a function
  //   containing the worker code, blob it up, create a URL, and use that to pass to the worker constructor. Oi.
  function getUrlForWorker(workerFunction) {
        var mainString = workerFunction.toString();
        var bodyString     = mainString.substring( mainString.indexOf("{")+1, mainString.lastIndexOf("}") );
        var blob = new Blob([bodyString]);
        // Obtain a blob URL reference to our worker 'file'.
        return window.URL.createObjectURL(blob);
  }


  var WORKER_PATH = getUrlForWorker(workerF);

  // This is a CONSTRUCTOR called with "new".
  // all the this.XXX properties live on the constructed object
  var Recorder = function(source, cfg){
    var config = cfg || {};
    var bufferLen = config.bufferLen || 4096;
    this.context = source.context;
    this.node = this.context.createScriptProcessor(bufferLen, 2, 2);
    try {
      var worker = new Worker(WORKER_PATH);
    } catch (err){
      console.log("error constructing worker");
    }
    worker.postMessage({
      command: 'init',
      config: {
        sampleRate: this.context.sampleRate
      }
    });
    var recording = false,
      currCallback;

    this.node.onaudioprocess = function(e){
      if (!recording) return;
      worker.postMessage({
        command: 'record',
        buffer: [
          e.inputBuffer.getChannelData(0),
          e.inputBuffer.getChannelData(1)
        ]
      });
    }

    this.configure = function(cfg){
      for (var prop in cfg){
        if (cfg.hasOwnProperty(prop)){
          config[prop] = cfg[prop];
        }
      }
    }

    this.record = function(){
      recording = true;
    }

    this.stop = function(bufferCB){
      recording = false;
      if (bufferCB){
        this.getBuffer(bufferCB);
      }
    }

    this.clear = function(){
      worker.postMessage({ command: 'clear' });
    }

    this.getBuffer = function(cb) {
      currCallback = cb || config.callback;
      worker.postMessage({ command: 'getBuffer' })
    }

    this.exportWAV = function(cb, info){
      currCallback = cb || config.callback;
      var info = info  || {};
      console.log("in worker.exportWav with info = " + info);
      info.type = info.type || config.type || 'audio/wav';
      info.sampleLength = info.sampleLength || null;
      if (!currCallback) throw new Error('Callback not set');
      worker.postMessage({
        command: 'exportWAV',
        type: info.type,
        len: info.sampleLength
      });
    }

    worker.onmessage = function(e){
      var blob = e.data;
      currCallback(blob);
    }

    source.connect(this.node);
    this.node.connect(this.context.destination);    //this should not be necessary (don't get callbacks to this recording node without it!)
  };

  // This weird thing is a property on the constructor function. Oi.
  Recorder.forceDownload = function(blob, filename){
    var url = (window.URL || window.webkitURL).createObjectURL(blob);
    var link = window.document.createElement('a');
    link.href = url;
    link.download = filename || 'output.wav';
    // Needs the click to "download" 
    var click = document.createEvent("Event");
    click.initEvent("click", true, true);
    link.dispatchEvent(click);
  }

  // WTF...
  window.Recorder = Recorder;

}

);
