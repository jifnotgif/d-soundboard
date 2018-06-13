
// window.addEventListener('load', init, false);

var audio = new Audio();
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioCtx = new AudioContext();
var audioSource = document.getElementsByClassName("audio-in")[0];
var panInput = document.querySelector(".pan");
var muteInput = document.querySelector(".mute");
var channelVolumeInput = document.querySelector(".channel-volume");
var initGainInput = document.querySelector(".gain");
var hiEQ = document.querySelector(".high-gain");
var loEQ = document.querySelector(".low-gain"); 
var hi_midFreq = document.querySelector(".hm-freq-gain");
var hi_midBoost = document.querySelector(".hm-boost-gain");
var lo_midFreq = document.querySelector(".lm-freq-gain");
var lo_midBoost = document.querySelector(".lm-boost-gain");
var panNode = audioCtx.createStereoPanner();
var preAmp = audioCtx.createGain();
var channelFader = audioCtx.createGain();
var clipAnalyser = audioCtx.createAnalyser();
clipAnalyser.fftSize = 1024;
var clipAnalyser2 = audioCtx.createAnalyser();
clipAnalyser2.fftSize = 1024;

var sourceNode,
	splitter = audioCtx.createChannelSplitter();

var loEQControl = audioCtx.createBiquadFilter();
loEQControl.type = "lowshelf";
loEQControl.frequency.value = 80;
var hiEQControl = audioCtx.createBiquadFilter();
hiEQControl.type = "highshelf";
hiEQControl.frequency.value = 12000;

var hi_midEQControl = audioCtx.createBiquadFilter();
hi_midEQControl.type = "peaking";
var lo_midEQControl = audioCtx.createBiquadFilter();
lo_midEQControl.type = "peaking";

var src;
var testArray = new Float32Array(clipAnalyser.frequencyBinCount);
var meter;
var canvasContext = document.getElementById( "meter" ).getContext("2d");

var canvas = document.getElementById("meter").getContext("2d");

var gradient = canvas.createLinearGradient(0, 0, 0, 130);
	gradient.addColorStop(1, '#00ff00');
	gradient.addColorStop(0.4, '#ffff00');
	gradient.addColorStop(0.05, '#ff0000');

var javascriptNode = audioCtx.createScriptProcessor(2048, 1, 1);
var array, array2;
audioSource.addEventListener("change", function(){

		audio.src = audioSource.options[audioSource.selectedIndex].value;

		src = audioCtx.createMediaElementSource(audio);

  		src.connect(preAmp);
  		preAmp.connect(hiEQControl);
  		hiEQControl.connect(hi_midEQControl);
  		hi_midEQControl.connect(loEQControl);
		loEQControl.connect(lo_midEQControl);
		

  		lo_midEQControl.connect(panNode);
		panNode.connect(channelFader);

		channelFader.connect(audioCtx.destination);	
		channelFader.connect(splitter);
		splitter.connect(clipAnalyser, 0, 0);
		splitter.connect(clipAnalyser2, 1, 0);
		javascriptNode.connect(splitter);  

		audio.play();

	
});


panInput.addEventListener("input", function(){
	panNode.pan.setValueAtTime( panInput.value ,audioCtx.currentTime);
	// audio.play();
});

muteInput.addEventListener("click", function(){
	if(muteInput.id ==""){
		channelFader.gain.setValueAtTime(0, audioCtx.currentTime);
    	muteInput.id = "active";
	}
	else{
		channelFader.gain.setValueAtTime(1, audioCtx.currentTime);
    	muteInput.id = "";
	}
});

channelVolumeInput.addEventListener("input", function(){
	channelFader.gain.value = dBFSToGain(channelVolumeInput.value);
});

initGainInput.addEventListener("input", function(){
	preAmp.gain.value = dBFSToGain(initGainInput.value);
});
		
hiEQ.addEventListener("input", function(){
	hiEQControl.gain.value = hiEQ.value;
})

loEQ.addEventListener("input", function(){
	loEQControl.gain.value = loEQ.value;
})

hi_midFreq.addEventListener("input", function(){
	hi_midEQControl.frequency.value = hi_midFreq.value;
})

hi_midBoost.addEventListener("input", function(){
	hi_midEQControl.gain.value = hi_midBoost.value;
})

lo_midFreq.addEventListener("input", function(){
	lo_midEQControl.frequency.value = lo_midFreq.value;
})

lo_midBoost.addEventListener("input", function(){
	lo_midEQControl.gain.value = lo_midBoost.value;
})

function dBFSToGain(dbfs) {
  return Math.pow(10, dbfs / 20);
}

function processAudio(arr){
	checkClipping(arr);
}


javascriptNode.onaudioprocess = function () {

	// get the average for the first channel
	array = new Uint8Array(clipAnalyser.frequencyBinCount);
	clipAnalyser.getByteFrequencyData(array);
	var average = getAverageVolume(array);

	// get the average for the second channel
	array2 = new Uint8Array(clipAnalyser2.frequencyBinCount);
	clipAnalyser2.getByteFrequencyData(array2);
	var average2 = getAverageVolume(array2);

	//here's the volume
	// clear the current state
	canvas.clearRect(0, 0, 60, 130);

	// set the fill style
	canvas.fillStyle = gradient;

	// create the meters
	if (average < 130) {
		canvas.fillRect(0, 130 - average, 25, 130);
	}
	else {
		canvas.fillRect(0, 0, 25, 130);
	}
	if (average2 < 130) {
		canvas.fillRect(30, 130 - average2, 25, 130);
	}
	else {
		canvas.fillRect(30, 0, 25, 130);
	}
}

function getAverageVolume(array) {
	var values = 0;
	var average;

	var length = array.length;

	// get all the frequency amplitudes
	for (var i = 0; i < length; i++) {
		values += Math.abs(array[i]);
	}

	average = values / length;
	return average;
}

// function setupAudioNodes() {




// 	// create a buffer source node
// 	// don't create new buffer source, reuse created audio elemnt
//     sourceNode = audioCtx.createBufferSource();
// 	splitter = audioCtx.createChannelSplitter(2);

// 	// connect the source to the analyser and the splitter
// 	sourceNode.connect(splitter);

// 	// connect one of the outputs from the splitter to
// 	// the analyser
// 	splitter.connect(clipAnalyser, 0, 0);
// 	splitter.connect(clipAnalyser2, 1, 0);

// 	// connect the splitter to the javascriptnode
// 	// we use the javascript node to draw at a
// 	// specific interval.
// 	clipAnalyser.connect(javascriptNode);

// 	//        splitter.connect(context.destination,0,0);
// 	//        splitter.connect(context.destination,0,1);

// 	// and connect to destination
// 	sourceNode.connect(audioCtx.destination);

	
	
// }
// function checkClipping(buffer) {
//   var isClipping = false;
//   // Iterate through buffer to check if any of the |values| exceeds 1.
//   for (var i = 0; i < buffer.length; i++) {
//     var absValue = Math.abs(buffer[i] - clipAnalyser.minDecibels);
//     if (absValue >= 1.0) {
//       isClipping = true;
//       x++;
//       break;
//     }
//   }
//   this.isClipping = isClipping;
//   if (isClipping) {
//     lastClipTime = new Date();
//   }
// }

// function drawLoop( time ) {
//     // clear the background
//     canvasContext.clearRect(0,0,WIDTH,HEIGHT);

//     // check if we're currently clipping
//     if (meter.checkClipping())
//         canvasContext.fillStyle = "red";
//     else
//         canvasContext.fillStyle = "green";

//     // draw a bar based on the current volume
//     canvasContext.fillRect(0, 0, meter.volume*WIDTH*1.4, HEIGHT);

//     // set up the next visual callback
//     rafID = window.requestAnimationFrame( drawLoop );
// }
