//NOTE: one change to make: start out with one channel only. add option to add or remove channels


// window.addEventListener('load', init, false);

var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioCtx = new AudioContext();
var audioSources = document.querySelectorAll(".audio-in");


var initGainInput = document.querySelectorAll(".gain");

var hiEQ = document.querySelectorAll(".high-gain");
var loEQ = document.querySelectorAll(".low-gain");
var hi_midFreq = document.querySelectorAll(".hm-freq-gain");
var hi_midBoost = document.querySelectorAll(".hm-boost-gain");
var lo_midFreq = document.querySelectorAll(".lm-freq-gain");
var lo_midBoost = document.querySelectorAll(".lm-boost-gain");


var panInput = document.querySelectorAll(".pan");
var muteInput = document.querySelectorAll(".mute");

var busGroups = document.querySelectorAll("fieldset");

var busPanIn = document.querySelectorAll(".pan-bus");
var busLeftVolumeIn = document.querySelectorAll(".left-bus-volume");
var busRightVolumeIn = document.querySelectorAll(".right-bus-volume");

var channelVolumeInput = document.querySelectorAll(".channel-volume");

var masterVolumeIn = document.querySelector("#master-volume");
var channels = [], sources = []; busses = [];

var bus = new Object();
bus.panner = audioCtx.createStereoPanner();
bus.leftGain = audioCtx.createGain();
bus.rightGain = audioCtx.createGain();
bus.merger = audioCtx.createChannelMerger(2);

busses[0] = bus;
var bus = new Object();
bus.panner = audioCtx.createStereoPanner();
bus.leftGain = audioCtx.createGain();
bus.rightGain = audioCtx.createGain();
bus.merger = audioCtx.createChannelMerger(2);

busses[1] = bus;
// var bus2PanNode = audioCtx.createPanner();
// var bus2LeftGainNode = audioCtx.createGain();
// var bus2RightGainNode = audioCtx.createGain();
// var bus2Merger = audioCtx.createChannelMerger(2);

var masterChannel = audioCtx.createGain();


audioSources.forEach(function (element, index) {
	element.addEventListener("change", function () {
		//initialize audio sources array, number of possible sources = num channels
		for (var i = 0; i < index; i++) {
			sources[i] = null;
		}
		// add new channel object to list
		addChannel(index);

		
		initializeAudio(index);
	});
});

setKnobControlListeners();

function addChannel(index){
	if (channels[index] == null) {
		var newChannel = new Object();
		setChannelProperties(newChannel, index);
		channels[index] = newChannel;
	}
}

function setChannelProperties(channel, i){
	channel.panNode = audioCtx.createStereoPanner();
	channel.preAmp = audioCtx.createGain();
	channel.channelFader = audioCtx.createGain();
	channel.mute = false;
	channel.channelFader.gain.value = 0;
	channel.clipAnalyser = audioCtx.createAnalyser();
	channel.clipAnalyser.fftSize = 1024;
	channel.clipAnalyser2 = audioCtx.createAnalyser();
	channel.clipAnalyser2.fftSize = 1024;

	channel.splitter = audioCtx.createChannelSplitter(2);

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
	if(	sources[i]){
		sources[i].stop();
		sources.splice(sources.indexOf(sources[i]), 1);
	}
	var source = audioCtx.createBufferSource();
	sources[i] = source; 	

	var request = new XMLHttpRequest();
	request.open('GET', audioSources[i].options[audioSources[i].selectedIndex].value, true);

	request.responseType = 'arraybuffer';


	request.onload = function () {
		var audioData = request.response;

		audioCtx.decodeAudioData(audioData, function (buffer) {
				sources[i].buffer = buffer;
				sources[i].connect(channels[i].preAmp);
				channels[i].preAmp.connect(channels[i].hiEQControl);
				channels[i].hiEQControl.connect(channels[i].hi_midEQControl);
				channels[i].hi_midEQControl.connect(channels[i].loEQControl);
				channels[i].loEQControl.connect(channels[i].lo_midEQControl);


				channels[i].lo_midEQControl.connect(channels[i].panNode);
				channels[i].panNode.connect(channels[i].channelFader);

				channels[i].channelFader.connect(masterChannel);

				channels[i].channelFader.connect(channels[i].splitter);
				channels[i].splitter.connect(channels[i].clipAnalyser, 0, 0);
				channels[i].splitter.connect(channels[i].clipAnalyser2, 1, 0);
				channels[i].javascriptNode.connect(channels[i].splitter);
				sources[i].loop = true;
		},
		function (e) { console.log("Error with decoding audio data" + e.err); });

	}

	request.send();
	masterChannel.connect(audioCtx.destination);
	source.start(0);


}



function dBFSToGain(dbfs) {
	return Math.pow(10, dbfs / 20);
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

function setKnobControlListeners(){

	panInput.forEach(function (input, i) {
		input.addEventListener("input", function () {
			channels[i].panNode.pan.setValueAtTime(input.value, audioCtx.currentTime);
		});
	});

	muteInput.forEach(function (input, i) {
		input.addEventListener("click", function () {
			if (input.classList.contains("active")) {
				channels[i].channelFader.gain.setValueAtTime(dBFSToGain(channelVolumeInput[i].value), audioCtx.currentTime);
				channels[i].mute = false;
				input.classList.remove("active");
			}
			else {
				channels[i].channelFader.gain.setValueAtTime(0, audioCtx.currentTime);
				channels[i].mute = true;
				input.classList.add("active");
			}
		});
	});

	channelVolumeInput.forEach(function (input, i) {
		input.addEventListener("input", function () {
			if(channels[i].mute === false) channels[i].channelFader.gain.setValueAtTime(dBFSToGain(channelVolumeInput[i].value), audioCtx.currentTime);
		});
	});

	initGainInput.forEach(function (input, i) {
		input.addEventListener("input", function () {
			channels[i].preAmp.gain.value = dBFSToGain(initGainInput[i].value);
		})
	});

	hiEQ.forEach(function (input, i) {
		input.addEventListener("input", function () {
			channels[i].hiEQControl.gain.value = hiEQ[i].value;
		})
	});

	loEQ.forEach(function (input, i) {
		input.addEventListener("input", function () {
			channels[i].loEQControl.gain.value = loEQ[i].value;
		})
	});

	hi_midFreq.forEach(function (input, i) {
		input.addEventListener("input", function () {
			channels[i].hi_midEQControl.frequency.value = hi_midFreq[i].value;
		})
	});

	hi_midBoost.forEach(function (input, i) {
		input.addEventListener("input", function () {
			channels[i].hi_midEQControl.gain.value = hi_midBoost[i].value;
		})
	});

	lo_midFreq.forEach(function (input, i) {
		input.addEventListener("input", function () {
			channels[i].lo_midEQControl.frequency.value = lo_midFreq[i].value;
		})
	});

	lo_midBoost.forEach(function (input, i) {
		input.addEventListener("input", function () {
			channels[i].lo_midEQControl.gain.value = lo_midBoost[i].value;
		})
	});

	masterVolumeIn.addEventListener("input", function(){
		masterChannel.gain.value = dBFSToGain(masterVolumeIn.value);
	});

	busGroups.forEach(function (input, index) {
		for(var i =0; i< input.elements.length; i++){
			input.elements[i].addEventListener("click", function(){
					if(this.value === "1-2"){
						resetChannelFlow(index);
						busses[1].merger.disconnect();

						channels[index].splitter.connect(busses[0].leftGain, 0, 0);
						channels[index].splitter.connect(busses[0].rightGain, 1, 0);
						busses[0].leftGain.connect(busses[0].merger, 0, 0);
						busses[0].rightGain.connect(busses[0].merger, 0, 1);
						busses[0].merger.connect(busses[0].panner);
						busses[0].panner.connect(masterChannel);



						// bus2Merger.disconnect();


						// channels[index].splitter.connect(bus1LeftGainNode, 0, 0);
						// channels[index].splitter.connect(bus1RightGainNode, 1, 0);
						// bus1LeftGainNode.connect(bus1Merger, 0,0);
						// bus1RightGainNode.connect(bus1Merger, 0,1);
						// bus1Merger.connect(masterChannel);
					}
					if (this.value === "3-4") {
						resetChannelFlow(index);
						busses[0].merger.disconnect();

						channels[index].splitter.connect(busses[1].leftGain, 0, 0);
						channels[index].splitter.connect(busses[1].rightGain, 1, 0);
						busses[1].leftGain.connect(busses[1].merger, 0, 0);
						busses[1].rightGain.connect(busses[1].merger, 0, 1);
						busses[1].merger.connect(busses[1].panner);
						busses[1].panner.connect(masterChannel);
						// bus1Merger.disconnect();


						// channels[index].splitter.connect(bus2LeftGainNode, 0, 0);
						// channels[index].splitter.connect(bus2RightGainNode, 1, 0);
						// bus2LeftGainNode.connect(bus2Merger, 0, 0);
						// bus2RightGainNode.connect(bus2Merger, 0, 1);
						// bus2Merger.connect(masterChannel);
					}
					else{	
						resetChannelFlow(index);
						channels[index].channelFader.connect(masterChannel);
					}
			});
		}
	});

	busPanIn.forEach(function(input, i){
		input.addEventListener("input", function () {
			busses[i].panner.pan.setValueAtTime(input.value, audioCtx.currentTime);
		});
	});

	busLeftVolumeIn.forEach(function(input, i){
		input.addEventListener("input", function () {
			busses[i].leftGain.gain.value = dBFSToGain(busLeftVolumeIn[i].value);
		});
	});
	busRightVolumeIn.forEach(function (input, i) {
		input.addEventListener("input", function () {
			busses[i].rightGain.gain.value = dBFSToGain(busRightVolumeIn[i].value);
		});
	});
}
function resetChannelFlow(i) {
	channels[i].channelFader.disconnect();
	channels[i].splitter.disconnect();
	channels[i].channelFader.connect(channels[i].splitter);
	channels[i].splitter.connect(channels[i].clipAnalyser, 0, 0);
	channels[i].splitter.connect(channels[i].clipAnalyser2, 1, 0);
}