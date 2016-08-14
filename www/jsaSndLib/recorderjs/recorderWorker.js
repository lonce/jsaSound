// This lovely recording code is from Matt Diamond:
// https://github.com/mattdiamond/Recorderjs
//

define([],
function(){
  return function(){

    var recLength = 0,
      recBuffersL = [],
      recBuffersR = [],
      sampleRate;

    this.onmessage = function(e){
      //console.log("recordWorker.onmessag call with command = " + e.data.command);
      switch(e.data.command){
        case 'init':
          init(e.data.config);
          break;
        case 'record':
          record(e.data.buffer);
          break;
        case 'exportWAV':
          exportWAV(e.data.type, e.data.len);
          break;
        case 'getBuffer':
          getBuffer();
          break;
        case 'clear':
          clear();
          break;
      }
    };

    function init(config){
      sampleRate = config.sampleRate;
    }

    function record(inputBuffer){
       //console.log("recordWorker.record")
      recBuffersL.push(inputBuffer[0]);
      recBuffersR.push(inputBuffer[1]);
      recLength += inputBuffer[0].length;
    }

    function exportWAV(type, len){
      //console.log("recordWorker.exportWAV with type = " + type);
      console.log("--------------in exportWav, requested len is " + len + ", and recLenth is " + recLength + ", will set to min val = " );

      if (len) {
        len = Math.min(len, recLength);
      } else{
        len = recLength;
      }

      console.log("--------------so, in exportWav, setting  len to " + len );

      var bufferL = mergeBuffers(recBuffersL, recLength, len);
      var bufferR = mergeBuffers(recBuffersR, recLength, len);
      var interleaved = interleave(bufferL, bufferR);
      var dataview = encodeWAV(interleaved);

      //console.log("recordWorker about to make a new Blob");
      var audioBlob = new Blob([dataview], { type: type });

      //console.log("recordWorker done making Blob, now post message .....");
      this.postMessage(audioBlob);
    }

    function getBuffer() {
      var buffers = [];
      buffers.push( mergeBuffers(recBuffersL, recLength) );
      buffers.push( mergeBuffers(recBuffersR, recLength) );
      this.postMessage(buffers);
    }

    function clear(){
      recLength = 0;
      recBuffersL = [];
      recBuffersR = [];
    }

    // reclength is the total length of all the buffers.
    // Requestlength chops to something shorter if that is what you want
    function mergeBuffers(recBuffers, recLength, requestLength){
      var result = new Float32Array(recLength);
      var offset = 0;
      for (var i = 0; i < recBuffers.length; i++){
        result.set(recBuffers[i], offset);  // puts the buffers end to end in result
        offset += recBuffers[i].length;
      }
      return result.slice(0, requestLength || recLength);
    }

    function interleave(inputL, inputR){
      var length = inputL.length + inputR.length;
      var result = new Float32Array(length);

      var index = 0,
        inputIndex = 0;

      while (index < length){
        result[index++] = inputL[inputIndex];
        result[index++] = inputR[inputIndex];
        inputIndex++;
      }
      return result;
    }

    function floatTo16BitPCM(output, offset, input){
      for (var i = 0; i < input.length; i++, offset+=2){
        var s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      }
    }

    function writeString(view, offset, string){
      for (var i = 0; i < string.length; i++){
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    }

    function encodeWAV(samples){
      var buffer = new ArrayBuffer(44 + samples.length * 2);
      var view = new DataView(buffer);

      /* RIFF identifier */
      writeString(view, 0, 'RIFF');
      /* file length */
      view.setUint32(4, 32 + samples.length * 2, true);
      /* RIFF type */
      writeString(view, 8, 'WAVE');
      /* format chunk identifier */
      writeString(view, 12, 'fmt ');
      /* format chunk length */
      view.setUint32(16, 16, true);
      /* sample format (raw) */
      view.setUint16(20, 1, true);
      /* channel count */
      view.setUint16(22, 2, true);
      /* sample rate */
      view.setUint32(24, sampleRate, true);
      /* byte rate (sample rate * block align) */
      view.setUint32(28, sampleRate * 4, true);
      /* block align (channel count * bytes per sample) */
      view.setUint16(32, 4, true);
      /* bits per sample */
      view.setUint16(34, 16, true);
      /* data chunk identifier */
      writeString(view, 36, 'data');
      /* data chunk length */
      view.setUint32(40, samples.length * 2, true);

      floatTo16BitPCM(view, 44, samples);

      return view;
    }

}
}
);

