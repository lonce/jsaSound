/* ------------------------------------------------------------
name: "test2"
Code generated with Faust 2.0.a52 (http://faust.grame.fr)
------------------------------------------------------------ */
/*
 faust2webaudio
 
 Primarily written by Myles Borins
 During the Spring 2013 offering of Music 420b with Julius Smith
 A bit during the Summer of 2013 with the help of Joshua Kit Clayton
 And finally a sprint during the late fall of 2013 to get everything working
 A Special thanks to Yann Orlarey and Stéphane Letz
 
 faust2webaudio is distributed under the terms the MIT or GPL2 Licenses.
 Choose the license that best suits your project. The text of the MIT and GPL
 licenses are at the root directory.
 
 Additional code : GRAME 2014
 
 */
 
'use strict';

var faust = faust || {};

console.log("test2.js looading module")

function test2Module(global, foreign, buffer) {
	
	'use asm';
	
	var HEAP32 = new global.Int32Array(buffer);
	var HEAPF = new global.Float32Array(buffer);
	
	var imul = global.Math.imul;
	var log = global.Math.log;
	
	function fmodf(x, y) { x = +x; y = +y; return +(x % y); }
	function log10f(a) { a = +a; return +(+log(a) / +log(10.)); }
	
	function getNumInputs(dsp) {
		dsp = dsp | 0;
		return 0;
	}
	
	function getNumOutputs(dsp) {
		dsp = dsp | 0;
		return 1;
	}
	
	function classInit(dsp, samplingFreq) {
		dsp = dsp | 0;
		samplingFreq = samplingFreq | 0;
		
	}
	
	function instanceConstants(dsp, samplingFreq) {
		dsp = dsp | 0;
		samplingFreq = samplingFreq | 0;
		HEAP32[dsp + 0 >> 2] = (samplingFreq | 0);
		
	}
	
	function instanceResetUserInterface(dsp) {
		dsp = dsp | 0;
		HEAPF[dsp + 20 >> 2] = +(0.);
		HEAPF[dsp + 24 >> 2] = +(0.25);
		
	}
	
	function instanceClear(dsp) {
		dsp = dsp | 0;
		var i0 = 0;
		var i1 = 0;
		for (i0 = 0; (((i0 | 0) < 2) | 0); i0 = (((i0 | 0) + 1) | 0)) {
			HEAP32[dsp + 4 + ((i0 | 0) << 2) >> 2] = 0;
			
		}
		for (i1 = 0; (((i1 | 0) < 2) | 0); i1 = (((i1 | 0) + 1) | 0)) {
			HEAPF[dsp + 12 + ((i1 | 0) << 2) >> 2] = 0.;
			
		}
		
	}
	
	function init(dsp, samplingFreq) {
		dsp = dsp | 0;
		samplingFreq = samplingFreq | 0;
		classInit(dsp, samplingFreq);
		instanceInit(dsp, samplingFreq);
	}
	
	function instanceInit(dsp, samplingFreq) {
		dsp = dsp | 0;
		samplingFreq = samplingFreq | 0;
		instanceConstants(dsp, samplingFreq);
		instanceResetUserInterface(dsp);
		instanceClear(dsp);
	}
	
	function getSampleRate(dsp) {
		dsp = dsp | 0;
		return HEAP32[dsp + 0 >> 2] | 0;
	}
	
	function setParamValue(dsp, offset, value) {
		dsp = dsp | 0;
		offset = offset | 0;
		value = +value;
		HEAPF[dsp + offset >> 2] = value;
	}
	
	function getParamValue(dsp, offset) {
		dsp = dsp | 0;
		offset = offset | 0;
		return +HEAPF[dsp + offset >> 2];
	}
	
	function compute(dsp, count, inputs, outputs) {
		dsp = dsp | 0;
		count = count | 0;
		inputs = inputs | 0;
		outputs = outputs | 0;
		var output0 = 0;
		var fSlow0 = 0.;
		var fSlow1 = 0.;
		var i = 0;
		output0 = (HEAP32[outputs + (0 << 2) >> 2] | 0);
		fSlow0 = +(4.65661287e-10 * +(+(HEAPF[dsp + 20 >> 2])));
		fSlow1 = +(0.00100000005 * +(+(HEAPF[dsp + 24 >> 2])));
		for (i = 0; (((i | 0) < (count | 0)) | 0); i = (((i | 0) + 1) | 0)) {
			HEAP32[dsp + 4 + (0 << 2) >> 2] = (((imul(1103515245, (HEAP32[dsp + 4 + (1 << 2) >> 2] | 0)) | 0) + 12345) | 0);
			HEAPF[dsp + 12 + (0 << 2) >> 2] = +(+(fSlow1) + +(0.999000013 * +(HEAPF[dsp + 12 + (1 << 2) >> 2])));
			HEAPF[output0 + ((i | 0) << 2) >> 2] = +(+(+(fSlow0) * +(+((HEAP32[dsp + 4 + (0 << 2) >> 2] | 0)) * +(HEAPF[dsp + 12 + (0 << 2) >> 2]))));
			HEAP32[dsp + 4 + (1 << 2) >> 2] = (HEAP32[dsp + 4 + (0 << 2) >> 2] | 0);
			HEAPF[dsp + 12 + (1 << 2) >> 2] = +(HEAPF[dsp + 12 + (0 << 2) >> 2]);
			
		}
		
	}
	
	return { getNumInputs : getNumInputs, getNumOutputs : getNumOutputs, classInit : classInit, instanceInit : instanceInit, instanceConstants : instanceConstants, instanceResetUserInterface : instanceResetUserInterface, instanceClear : instanceClear, init : init, getSampleRate : getSampleRate, setParamValue : setParamValue, getParamValue : getParamValue, compute : compute };
}

function getSizetest2() {
	return 28;
}

function getPathTabletest2() {
	var pathTable = [];
	pathTable["/0x00/gate"] = 20;
	pathTable["/0x00/gain"] = 24;
	return pathTable;
}

function getJSONtest2() {
	return "{  \"name\": \"test2\",  \"inputs\": \"0\",  \"outputs\": \"1\",  \"meta\": [    { \"compilation_options\": \"-single -scal\" },   { \"library_path\": \"test2\" },   { \"name\": \"test2\" },   { \"noises_lib_name\": \"Faust Noise Generator Library\" },   { \"noises_lib_version\": \"0.0\" },   { \"signals_lib_name\": \"Faust Signal Routing Library\" },   { \"signals_lib_version\": \"0.0\" }  ],  \"ui\": [    {    \"type\": \"vgroup\",    \"label\": \"0x00\",    \"items\": [      {      \"type\": \"hslider\",      \"label\": \"gain\",      \"address\": \"/0x00/gain\",      \"init\": \"0.25\",      \"min\": \"0\",      \"max\": \"1\",      \"step\": \"0.01\"     },     {      \"type\": \"checkbox\",      \"label\": \"gate\",      \"address\": \"/0x00/gate\"     }    ]   }  ] } ";
}

function metadatatest2(m) {
	m.declare("compilation_options", "-single -scal");
	m.declare("library_path", "test2");
	m.declare("name", "test2");
	m.declare("noises_lib_name", "Faust Noise Generator Library");
	m.declare("noises_lib_version", "0.0");
	m.declare("signals_lib_name", "Faust Signal Routing Library");
	m.declare("signals_lib_version", "0.0");
}


// Standard Faust DSP

faust.test2 = function (context, buffer_size) {

    var handler = null;
    var ins, outs;
    var scriptProcessor;
    
    var dspInChannnels = [];
    var dspOutChannnels = [];
   
    // Keep JSON parsed object
    var jon_object = JSON.parse(getJSONtest2());
    
    function getNumInputsAux () 
    {
        return (jon_object.inputs !== undefined) ? parseInt(jon_object.inputs) : 0;
    }
    
    function getNumOutputsAux () 
    {
        return (jon_object.outputs !== undefined) ? parseInt(jon_object.outputs) : 0;
    }
    
    var numIn = getNumInputsAux();
    var numOut = getNumOutputsAux();
     
    // Memory allocator
    var ptr_size = 4; 
    var sample_size = 4;
    
    function pow2limit (x)
    {
        var n = 2;
        while (n < x) { n = 2 * n; }
        return (n < 65536) ? 65536 : n; // Minimum = 64 kB
    }
     
    var memory_size = pow2limit(getSizetest2() + (numIn + numOut) * (ptr_size + (buffer_size * sample_size)));
   
    var HEAP = new ArrayBuffer(memory_size);
    var HEAP32 = new Int32Array(HEAP);
    var HEAPF32 = new Float32Array(HEAP);
     
    console.log(HEAP);
    console.log(HEAP32);
    console.log(HEAPF32);
 
    // bargraph
    var ouputs_timer = 5;
    var ouputs_items = [];
     
    // input items
    var inputs_items = [];
     
    // Start of HEAP index
    var audio_heap_ptr = 0;
     
    // Setup pointers offset
    var audio_heap_ptr_inputs = audio_heap_ptr; 
    var audio_heap_ptr_outputs = audio_heap_ptr_inputs + (numIn * ptr_size);
     
    // Setup buffer offset
    var audio_heap_inputs = audio_heap_ptr_outputs + (numOut * ptr_size);
    var audio_heap_outputs = audio_heap_inputs + (numIn * buffer_size * sample_size);
    
    // Setup DSP offset
    var dsp_start = audio_heap_outputs + (numOut * buffer_size * sample_size);
     
    // Start of DSP memory
    var dsp = dsp_start;
 
    // ASM module
    var factory = test2Module(window, null, HEAP);
    console.log(factory);
 
    var pathTable = getPathTabletest2();
    
    // Allocate table for 'setParamValue'
    var value_table = [];
        
    function update_outputs () 
    {
        if (ouputs_items.length > 0 && handler && ouputs_timer-- === 0) {
            ouputs_timer = 5;
            for (var i = 0; i < ouputs_items.length; i++) {
                handler(ouputs_items[i], factory.getParamValue(dsp, pathTable[ouputs_items[i]]));
            }
        }
    }
    
    function compute (e) 
    {
        var i, j;
        
        // Read inputs
        for (i = 0; i < numIn; i++) {
            var input = e.inputBuffer.getChannelData(i);
            var dspInput = dspInChannnels[i];
            for (j = 0; j < input.length; j++) {
                dspInput[j] = input[j];
            }
        }
        
        // Update control state
        for (i = 0; i < inputs_items.length; i++) {
            var path = inputs_items[i];
            var values = value_table[path];
            factory.setParamValue(dsp, pathTable[path], values[0]);
            values[0] = values[1];
        }
        
        // Compute
        factory.compute(dsp, buffer_size, ins, outs);
       
        // Update bargraph
        update_outputs();
        
        // Write outputs
        for (i = 0; i < numOut; i++) {
            var output = e.outputBuffer.getChannelData(i);
            var dspOutput = dspOutChannnels[i];
            for (j = 0; j < output.length; j++) {
                output[j] = dspOutput[j];
            }
        }
    };
         
    // JSON parsing
    function parse_ui (ui) 
    {
        for (var i = 0; i < ui.length; i++) {
            parse_group(ui[i]);
        }
    }
    
    function parse_group (group) 
    {
        if (group.items) {
            parse_items(group.items);
        }
    }
    
    function parse_items (items) 
    {
        var i;
        for (i = 0; i < items.length; i++) {
            parse_item(items[i]);
        }
    }
    
    function parse_item (item) 
    {
        if (item.type === "vgroup" || item.type === "hgroup" || item.type === "tgroup") {
            parse_items(item.items);
        } else if (item.type === "hbargraph" || item.type === "vbargraph") {
            // Keep bargraph adresses
            ouputs_items.push(item.address);
        } else if (item.type === "vslider" || item.type === "hslider" || item.type === "button" || item.type === "checkbox" || item.type === "nentry") {
            // Keep inputs adresses
            inputs_items.push(item.address);
        }
    }
      
    function init ()
    {
        var i;
         
        // Setup web audio context
        console.log("buffer_size %d", buffer_size);
        scriptProcessor = context.createScriptProcessor(buffer_size, numIn, numOut);
        scriptProcessor.onaudioprocess = compute;
        
        if (numIn > 0) {
            ins = audio_heap_ptr_inputs; 
            for (i = 0; i < numIn; i++) { 
                HEAP32[(ins >> 2) + i] = audio_heap_inputs + ((buffer_size * sample_size) * i);
            }
     
            // Prepare Ins buffer tables
            var dspInChans = HEAP32.subarray(ins >> 2, (ins + numIn * ptr_size) >> 2);
            for (i = 0; i < numIn; i++) {
                dspInChannnels[i] = HEAPF32.subarray(dspInChans[i] >> 2, (dspInChans[i] + buffer_size * sample_size) >> 2);
            }
        }
        
        if (numOut > 0) {
            outs = audio_heap_ptr_outputs; 
            for (i = 0; i < numOut; i++) { 
                HEAP32[(outs >> 2) + i] = audio_heap_outputs + ((buffer_size * sample_size) * i);
            }
          
            // Prepare Out buffer tables
            var dspOutChans = HEAP32.subarray(outs >> 2, (outs + numOut * ptr_size) >> 2);
            for (i = 0; i < numOut; i++) {
                dspOutChannnels[i] = HEAPF32.subarray(dspOutChans[i] >> 2, (dspOutChans[i] + buffer_size * sample_size) >> 2);
            }
        }
                                
        // bargraph
        parse_ui(jon_object.ui);
        
        // Init DSP
        factory.init(dsp, context.sampleRate);
        
        // Init 'value' table
        for (i = 0; i < inputs_items.length; i++) {
            var path = inputs_items[i];
            var values = new Float32Array(2);
            values[0] = values[1] = factory.getParamValue(dsp, pathTable[path]);
            value_table[path] = values;
        }
    }
    
    init();
    
    // External API
    return {
    
        getNumInputs : function () 
        {
            return getNumInputsAux();
        },
        
        getNumOutputs : function () 
        {
            return getNumOutputsAux();
        },
    
        destroy : function ()
        {
            // Nothing to do
        },
        
        // Connect/disconnect to another node
        connect : function (node) 
        {
            console.log("test2 : connecting")
            if (node.getProcessor !== undefined) {
                scriptProcessor.connect(node.getProcessor());
            } else {
                scriptProcessor.connect(node);
            }
        },

        disconnect : function (node) 
        {
            console.log("test2 : DISconnecting")
            if (node) {
                if (node.getProcessor !== undefined) {
                    scriptProcessor.disconnect(node.getProcessor());
                } else {
                    scriptProcessor.disconnect(node);
                }
            }
            else {
                scriptProcessor.disconnect(node);
            }
        },
        
        setHandler : function (hd)
        {
            handler = hd;
        },
        
        start : function () 
        {
            scriptProcessor.connect(context.destination);
        },

        stop : function () 
        {
            scriptProcessor.disconnect(context.destination);
        },

        setParamValue : function (path, val) 
        {
            var values = value_table[path];
            if (values) {
                if (factory.getParamValue(dsp, pathTable[path]) === values[0]) {
                    values[0] = val;
                } 
                values[1] = val;
            }
        },

        getParamValue : function (path) 
        {
            return factory.getParamValue(dsp, pathTable[path]);
        },
        
        controls : function()
        {
            return inputs_items;
        },
        
        json : function ()
        {
            return getJSONtest2();
        },
        
        getProcessor : function ()
        {
            return scriptProcessor;
        }
    };
};

