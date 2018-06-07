
// window.addEventListener('load', init, false);

var audio;
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioCtx = new AudioContext();
var audioSource = document.getElementsByClassName("audio-in")[0];
var panInput = document.querySelector(".pan");
var muteInput = document.querySelector(".mute");

// var audio = document.querySelector('audio');
var panNode;
var gainNode = audioCtx.createGain();
var src;
audioSource.addEventListener("change", function(){

// var volume = audioCtx.createGain();
if(audioSource.options[audioSource.selectedIndex].value === "assets/sounds/drum.mp3"){
		audio = new Audio(document.querySelector('audio').src);
		src = audioCtx.createMediaElementSource(audio);
 		
  	// 	gainNode.gain.value =0.1;
		src.connect(gainNode)
 	 	gainNode.connect(audioCtx.destination);	
		audio.play();
	}
});


panInput.addEventListener("input", function(){
	src.disconnect();
	panNode = audioCtx.createStereoPanner();
	panNode.pan.setValueAtTime( panInput.value ,audioCtx.currentTime);
	src.connect(panNode);
	panNode.connect(gainNode);
	gainNode.connect(audioCtx.destination);	
	// audio.play();
});

muteInput.addEventListener("click", function(){
	if(muteInput.id ==""){
		gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    	muteInput.id = "active";
	}
	else{
		gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
    	muteInput.id = "";
	}
})