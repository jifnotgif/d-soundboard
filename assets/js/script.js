
// window.addEventListener('load', init, false);

var audio;
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioCtx = new AudioContext();
var audioSource = document.getElementsByClassName("audio-in")[0];
// var audio = document.querySelector('audio');
audioSource.addEventListener("change", function(){

// var volume = audioCtx.createGain();
	if(audioSource.options[audioSource.selectedIndex].value === "assets/sounds/drum.mp3"){
		audio = new Audio(document.querySelector('audio').src);
		var src = audioCtx.createMediaElementSource(audio);
 		var gainNode = audioCtx.createGain();
  		gainNode.gain.value =0.1;
		src.connect(gainNode)
 	 	gainNode.connect(audioCtx.destination);	

		audio.play();
	}
});