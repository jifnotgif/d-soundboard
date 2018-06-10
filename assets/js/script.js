
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
var panNode = audioCtx.createStereoPanner();;
var preAmp = audioCtx.createGain();
var channelFader = audioCtx.createGain();
var clipAnalyser = audioCtx.createAnalyser();
clipAnalyser.minDecibels = -100;
clipAnalyser.maxDecibels = -30;


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
var WIDTH=500;
var HEIGHT=50;
var rafID = null;
audioSource.addEventListener("change", function(){

// var volume = audioCtx.createGain();
if(audioSource.options[audioSource.selectedIndex].value === "assets/sounds/drum.mp3"){
		audio.src = "assets/sounds/drum.mp3";

		src = audioCtx.createMediaElementSource(audio);
  	// 	gainNode.gain.value =0.1;

  		src.connect(preAmp);
  		preAmp.connect(hiEQControl);
  		hiEQControl.connect(hi_midEQControl);
  		hi_midEQControl.connect(loEQControl);
  		loEQControl.connect(lo_midEQControl);
  		lo_midEQControl.connect(panNode);
  		panNode.connect(channelFader);
  		channelFader.connect(audioCtx.destination);	
		// src.connect(channelFader)
		//  meter = createAudioMeter(audioCtx);
		// src.connect(meter);

		//     // kick off the visual updating
		// drawLoop();


 	//  	channelFader.connect(audioCtx.destination);	
		audio.play();

  		// var meter = audioCtx.createScriptProcessor(0, 1, 1);
		// meter.onaudioprocess = function(e) { 
 	// 		clipAnalyser.getFloatFrequencyData(testArray);
  // 			processAudio(testArray);
  // 		};
  // 		meter.connect(channelFader);
	}	
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

function drawLoop( time ) {
    // clear the background
    canvasContext.clearRect(0,0,WIDTH,HEIGHT);

    // check if we're currently clipping
    if (meter.checkClipping())
        canvasContext.fillStyle = "red";
    else
        canvasContext.fillStyle = "green";

    // draw a bar based on the current volume
    canvasContext.fillRect(0, 0, meter.volume*WIDTH*1.4, HEIGHT);

    // set up the next visual callback
    rafID = window.requestAnimationFrame( drawLoop );
}