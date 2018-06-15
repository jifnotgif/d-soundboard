
// window.addEventListener('load', init, false);

var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioCtx = new AudioContext();
var audioSources = document.querySelectorAll(".audio-in");

var panInput = document.querySelectorAll(".pan");
var muteInput = document.querySelectorAll(".mute");
var channelVolumeInput = document.querySelectorAll(".channel-volume");
var initGainInput = document.querySelectorAll(".gain");
var hiEQ = document.querySelectorAll(".high-gain");
var loEQ = document.querySelectorAll(".low-gain");
var hi_midFreq = document.querySelectorAll(".hm-freq-gain");
var hi_midBoost = document.querySelectorAll(".hm-boost-gain");
var lo_midFreq = document.querySelectorAll(".lm-freq-gain");
var lo_midBoost = document.querySelectorAll(".lm-boost-gain");

var channels = [], sources = [];

// // var panNode = audioCtx.createStereoPanner();
// var preAmp = audioCtx.createGain();
// var channelFader = audioCtx.createGain();
// var clipAnalyser = audioCtx.createAnalyser();
// clipAnalyser.fftSize = 1024;
// var clipAnalyser2 = audioCtx.createAnalyser();
// clipAnalyser2.fftSize = 1024;

// var splitter = audioCtx.createChannelSplitter();

// var loEQControl = audioCtx.createBiquadFilter();
// loEQControl.type = "lowshelf";
// loEQControl.frequency.value = 80;
// var hiEQControl = audioCtx.createBiquadFilter();
// hiEQControl.type = "highshelf";
// hiEQControl.frequency.value = 12000;

// var hi_midEQControl = audioCtx.createBiquadFilter();
// hi_midEQControl.type = "peaking";
// var lo_midEQControl = audioCtx.createBiquadFilter();
// lo_midEQControl.type = "peaking";

// var meter;
// var canvasContext = document.getElementById("meter").getContext("2d");

// var canvas = document.getElementById("meter").getContext("2d");

// var gradient = canvas.createLinearGradient(0, 0, 0, 130);
// gradient.addColorStop(1, '#00ff00');
// gradient.addColorStop(0.4, '#ffff00');
// gradient.addColorStop(0.05, '#ff0000');

// var javascriptNode = audioCtx.createScriptProcessor(2048, 1, 1);
// var array, array2;

audioSources.forEach(function (element, index) {
	element.addEventListener("change", function () {
		// add new channel object to list
		addChannel(index);

		initializeAudio(index);
	});
});

function addChannel(index){
	var newChannel = new Object();
	setChannelProperties(newChannel, index);
	channels.push(newChannel);
}
function setChannelProperties(channel, i){
	channel.panNode = audioCtx.createStereoPanner();
	channel.preAmp = audioCtx.createGain();
	channel.channelFader = audioCtx.createGain();
	channel.clipAnalyser = audioCtx.createAnalyser();
	channel.clipAnalyser.fftSize = 1024;
	channel.clipAnalyser2 = audioCtx.createAnalyser();
	channel.clipAnalyser2.fftSize = 1024;

	channel.splitter = audioCtx.createChannelSplitter();

	channel.loEQControl = audioCtx.createBiquadFilter();
	channel.loEQControl.type = "lowshelf";
	channel.loEQControl.frequency.value = 80;
	channel.hiEQControl = audioCtx.createBiquadFilter();
	channel.hiEQControl.type = "highshelf";
	channel.hiEQControl.frequency.value = 12000;

	channel.hi_midEQControl = audioCtx.createBiquadFilter();
	channel.hi_midEQControl.type = "peaking";
	channel.lo_midEQControl = audioCtx.createBiquadFilter();
	channel.lo_midEQControl.type = "peaking";

	channel.meter;
	channel.canvasContext = document.querySelectorAll(".meter")[i].getContext("2d");

	channel.canvas = document.querySelectorAll(".meter")[i].getContext("2d");

	channel.gradient = channel.canvas.createLinearGradient(0, 0, 0, 130);
	channel.gradient.addColorStop(1, '#00ff00');
	channel.gradient.addColorStop(0.4, '#ffff00');
	channel.gradient.addColorStop(0.05, '#ff0000');

	channel.javascriptNode = audioCtx.createScriptProcessor(2048, 1, 1);
	channel.javascriptNode.onaudioprocess = function () {
		// get the average for the first channel
		channel.array = new Uint8Array(channel.clipAnalyser.frequencyBinCount);
		channel.clipAnalyser.getByteFrequencyData(channel.array);
		var average = channel.getAverageVolume(channel.array);

		// get the average for the second channel
		channel.array2 = new Uint8Array(channel.clipAnalyser2.frequencyBinCount);
		channel.clipAnalyser2.getByteFrequencyData(channel.array2);
		var average2 = channel.getAverageVolume(channel.array2);

		//here's the volume
		// clear the current state
		channel.canvas.clearRect(0, 0, 60, 130);

		// set the fill style
		channel.canvas.fillStyle = channel.gradient;

		// create the meters
		if (average < 130) {
			channel.canvas.fillRect(0, 130 - average, 25, 130);
		}
		else {
			channel.canvas.fillRect(0, 0, 25, 130);
		}
		if (average2 < 130) {
			channel.canvas.fillRect(30, 130 - average2, 25, 130);
		}
		else {
			channel.canvas.fillRect(30, 0, 25, 130);
		}
	}
	channel.getAverageVolume = getAverageVolume;

	
	channel.array;
	channel.array2;
}

function initializeAudio(i) {
	var source = audioCtx.createBufferSource();
	sources.push(source);

	var request = new XMLHttpRequest();
	request.open('GET', audioSources[i].options[audioSources[i].selectedIndex].value, true);

	request.responseType = 'arraybuffer';


	request.onload = function () {
		var audioData = request.response;

		audioCtx.decodeAudioData(audioData, function (buffer) {
			sources.forEach(function(s, index){
				s.buffer = buffer;
				s.connect(channels[index].preAmp);
				channels[index].preAmp.connect(channels[index].hiEQControl);
				channels[index].hiEQControl.connect(channels[index].hi_midEQControl);
				channels[index].hi_midEQControl.connect(channels[index].loEQControl);
				channels[index].loEQControl.connect(channels[index].lo_midEQControl);


				channels[index].lo_midEQControl.connect(channels[index].panNode);
				channels[index].panNode.connect(channels[index].channelFader);

				channels[index].channelFader.connect(audioCtx.destination);

				channels[index].channelFader.connect(channels[index].splitter);
				channels[index].splitter.connect(channels[index].clipAnalyser, 0, 0);
				channels[index].splitter.connect(channels[index].clipAnalyser2, 1, 0);
				channels[index].javascriptNode.connect(channels[index].splitter);
				s.loop = true;
			});
		},

			function (e) { console.log("Error with decoding audio data" + e.err); });

	}

	request.send();
	source.start(0);
}


panInput.addEventListener("input", function () {
	panNode.pan.setValueAtTime(panInput.value, audioCtx.currentTime);
	// audio.play();
});

muteInput.addEventListener("click", function () {
	if (muteInput.id == "") {
		channelFader.gain.setValueAtTime(0, audioCtx.currentTime);
		muteInput.id = "active";
	}
	else {
		channelFader.gain.setValueAtTime(1, audioCtx.currentTime);
		muteInput.id = "";
	}
});

channelVolumeInput.addEventListener("input", function () {
	channelFader.gain.value = dBFSToGain(channelVolumeInput.value);
});

initGainInput.addEventListener("input", function () {
	preAmp.gain.value = dBFSToGain(initGainInput.value);
});

hiEQ.addEventListener("input", function () {
	hiEQControl.gain.value = hiEQ.value;
})

loEQ.addEventListener("input", function () {
	loEQControl.gain.value = loEQ.value;
})

hi_midFreq.addEventListener("input", function () {
	hi_midEQControl.frequency.value = hi_midFreq.value;
})

hi_midBoost.addEventListener("input", function () {
	hi_midEQControl.gain.value = hi_midBoost.value;
})

lo_midFreq.addEventListener("input", function () {
	lo_midEQControl.frequency.value = lo_midFreq.value;
})

lo_midBoost.addEventListener("input", function () {
	lo_midEQControl.gain.value = lo_midBoost.value;
})

function dBFSToGain(dbfs) {
	return Math.pow(10, dbfs / 20);
}

function processAudio(arr) {
	checkClipping(arr);
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
