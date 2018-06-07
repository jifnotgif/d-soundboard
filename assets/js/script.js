
// window.addEventListener('load', init, false);

var audio;
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioCtx = new AudioContext();
var audioSource = document.getElementsByClassName("audio-in")[0];
var panInput = document.querySelector(".pan");
// var audio = document.querySelector('audio');
var panNode;
var src;
audioSource.addEventListener("change", function(){

// var volume = audioCtx.createGain();
if(audioSource.options[audioSource.selectedIndex].value === "assets/sounds/drum.mp3"){
		audio = new Audio(document.querySelector('audio').src);
		src = audioCtx.createMediaElementSource(audio);
 		// var gainNode = audioCtx.createGain();
  	// 	gainNode.gain.value =0.1;
		// src.connect(gainNode)
 	//  	gainNode.connect(audioCtx.destination);	
 		src.connect(audioCtx.destination);
		audio.play();
	}
});


panInput.addEventListener("input", function(){
	src.disconnect();
	panNode = audioCtx.createStereoPanner();
	panNode.pan.setValueAtTime( panInput.value ,audioCtx.currentTime);
	// panNode.pan.value = panInput.value;
	src.connect(panNode);
	panNode.connect(audioCtx.destination);
	audio.play();
});

