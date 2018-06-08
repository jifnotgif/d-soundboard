
// window.addEventListener('load', init, false);

var audio = new Audio();
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioCtx = new AudioContext();
var audioSource = document.getElementsByClassName("audio-in")[0];
var panInput = document.querySelector(".pan");
var muteInput = document.querySelector(".mute");
var channelVolumeInput = document.querySelector(".channel-volume");
var initGainInput = document.querySelector(".gain");
// var audio = document.querySelector('audio');
var panNode;
var preAmp = audioCtx.createGain();
var channelFader = audioCtx.createGain();
var clipAnalyser = audioCtx.createAnalyser();
var src;
var testArray = new Float32Array(clipAnalyser.frequencyBinCount);
audioSource.addEventListener("change", function(){

// var volume = audioCtx.createGain();
if(audioSource.options[audioSource.selectedIndex].value === "assets/sounds/drum.mp3"){
		audio.src = "assets/sounds/drum.mp3";

		src = audioCtx.createMediaElementSource(audio);
  	// 	gainNode.gain.value =0.1;

  		src.connect(preAmp);
  		preAmp.connect(clipAnalyser);
  		clipAnalyser.connect(audioCtx.destination);



		// src.connect(channelFader)



 	//  	channelFader.connect(audioCtx.destination);	
		audio.play();
	}
});


panInput.addEventListener("input", function(){
	src.disconnect();
	panNode = audioCtx.createStereoPanner();
	panNode.pan.setValueAtTime( panInput.value ,audioCtx.currentTime);
	src.connect(panNode);
	panNode.connect(channelFader);
	channelFader.connect(audioCtx.destination);	
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
	channelFader.gain.setValueAtTime( dBFSToGain(channelVolumeInput.value) , audioCtx.currentTime);
});

initGainInput.addEventListener("input", function(){
	preAmp.gain.setValueAtTime( dBFSToGain(initGainInput.value) , audioCtx.currentTime);
});
		

		audio.addEventListener("playing", function(){
 			clipAnalyser.getFloatFrequencyData(testArray);
 			console.log(testArray);
 		});

function dBFSToGain(dbfs) {
  return Math.pow(10, dbfs / 20);
}