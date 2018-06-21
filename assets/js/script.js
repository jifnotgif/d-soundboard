//NOTE: one change to make: start out with one channel only. add option to add or remove channels


// window.addEventListener('load', init, false);

var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioCtx = new AudioContext();


var busPanIn = document.querySelectorAll(".pan-bus");
var busLeftVolumeIn = document.querySelectorAll(".left-bus-volume");
var busRightVolumeIn = document.querySelectorAll(".right-bus-volume");

var masterVolumeIn = document.querySelector("#master-volume");

var channels = [], sources = [], busses = [], uploadedFiles = [];


busses[0] = createNewBus();
busses[1] = createNewBus();

var masterChannel = audioCtx.createGain();
var maxChannels = 5;
var channelCounter = 0; 
setNonChannelListeners();

var busCounter = 0;
delegateEvent(document, "click", "#addbtn", function(){
	var htmlData = {
		busName: busCounter++
	}
	var chTemplate = document.getElementById("channel-template").innerHTML;
	if (channelCounter === maxChannels - 1) {
		document.getElementById("addbtn").remove();
	}

	var html = Mustache.render(chTemplate, htmlData);
	// breh there has to be a better way...
	// var htmlElement = document.createElement('div');
	// htmlElement.innerHTML = html;
	// also... eventlisteners are destroyed upon creating new nodes
	// document.getElementById("test").appendChild(htmlElement);
	document.getElementById("empty").outerHTML = html;

	addChannel(channelCounter);

	channels[channelCounter].channelHTMLNode.initListeners();
	channelCounter++;	

});

function loadSound(arraybuffer, i) {
	audioCtx.decodeAudioData(arraybuffer, function (buffer) {
		sources[i].buffer = buffer;
		sources[i].loop = true;
		sources[i].connect(channels[i].preAmp);
		channels[i].preAmp.connect(channels[i].hiEQControl);
		channels[i].hiEQControl.connect(channels[i].hi_midEQControl);
		channels[i].hi_midEQControl.connect(channels[i].loEQControl);
		channels[i].loEQControl.connect(channels[i].lo_midEQControl);


		channels[i].lo_midEQControl.connect(channels[i].panNode);
		channels[i].panNode.connect(channels[i].channelFader);

		channels[i].channelFader.connect(masterChannel);
		masterChannel.connect(audioCtx.destination);

		channels[i].channelFader.connect(channels[i].splitter);
		channels[i].splitter.connect(channels[i].clipAnalyser, 0, 0);
		channels[i].splitter.connect(channels[i].clipAnalyser2, 1, 0);
		channels[i].javascriptNode.connect(channels[i].splitter);

	}, function (e) { console.log("Error with decoding audio data" + e.err); });

}

function addChannel(index) {
	var newChannel = new Object();
	setChannelProperties(newChannel, index);
	channels[index] = newChannel;

	newChannel.channelHTMLNode = new Object();
	newChannel.channelHTMLNode.audioSource = document.querySelectorAll(".audio-in")[index];


	newChannel.channelHTMLNode.initGainInput = document.querySelectorAll(".gain")[index];

	newChannel.channelHTMLNode.hiEQ = document.querySelectorAll(".high-gain")[index];
	newChannel.channelHTMLNode.loEQ = document.querySelectorAll(".low-gain")[index];
	newChannel.channelHTMLNode.hi_midFreq = document.querySelectorAll(".hm-freq-gain")[index];
	newChannel.channelHTMLNode.hi_midBoost = document.querySelectorAll(".hm-boost-gain")[index];
	newChannel.channelHTMLNode.lo_midFreq = document.querySelectorAll(".lm-freq-gain")[index];
	newChannel.channelHTMLNode.lo_midBoost = document.querySelectorAll(".lm-boost-gain")[index];


	newChannel.channelHTMLNode.panInput = document.querySelectorAll(".pan")[index];
	newChannel.channelHTMLNode.muteInput = document.querySelectorAll(".mute")[index];
	newChannel.channelHTMLNode.soloInput = document.querySelectorAll(".solo")[index];

	newChannel.channelHTMLNode.channelVolumeInput = document.querySelectorAll(".channel-volume")[index];

	newChannel.channelHTMLNode.busGroups = document.querySelectorAll("fieldset")[index];
	newChannel.channelHTMLNode.fileUploadOption = document.querySelectorAll(".filein")[index];
	newChannel.channelHTMLNode.removeBtn = document.querySelectorAll(".fa-minus-square")[index];
	
	newChannel.channelHTMLNode.requestPresetAudio = function (i) {

		sources[i] = audioCtx.createBufferSource();

		var request = new XMLHttpRequest();
		request.open('GET', this.audioSource.options[this.audioSource.selectedIndex].value, true);

		request.responseType = 'arraybuffer';


		request.onload = function () {
			var audioData = request.response;
			loadSound(audioData, i);
			newChannel.channelHTMLNode.resetChannelInputSettings();
		}

		request.send();
		sources[i].start(audioCtx.currentTime);

	};

	newChannel.channelHTMLNode.initListeners = function() {
		this.removeBtn.addEventListener("click",function(){
			if (sources.length > 0) {
				sources[index].stop();
				delete sources[index];
			}
			channels.splice(index, 1);
			closestByClass(this, "channel").remove();
			channelCounter--;
			// if DOM can't locate add button (max channels reached and removed)
			if (channelCounter === maxChannels - 1 && document.getElementById("addbtn") === null) {
				document.getElementById("add").innerHTML = "<i id=\"addbtn\" class=\"fas fa-plus\"></i>";
			}
		});
		this.audioSource.addEventListener("change", function(){
			if(sources[index]) sources[index].stop();
			if (this.value === "new_file") {
				newChannel.channelHTMLNode.fileUploadOption.click();
				this.value = "none";
			}
			else {
				newChannel.channelHTMLNode.requestPresetAudio(index);
			}
		});

		this.fileUploadOption.addEventListener("change",function(){
				var file = this.files[0];
				var r = new FileReader();
				r.readAsArrayBuffer(file);
				r.onload = function (e) {
					sources[index] = audioCtx.createBufferSource();
					loadSound(e.target.result, index);
					newChannel.channelHTMLNode.resetChannelInputSettings(index);
					sources[index].start(audioCtx.currentTime);
				};
		});

		this.panInput.addEventListener("input", function(){
			newChannel.panNode.pan.setValueAtTime(this.value, audioCtx.currentTime);
		});

		this.muteInput.addEventListener("click", function(){
			if (this.classList.contains("active-mute")) {
				newChannel.channelFader.gain.setValueAtTime(dBFSToGain(newChannel.channelHTMLNode.channelVolumeInput.value), audioCtx.currentTime);
				newChannel.mute = false;
				this.classList.remove("active-mute");
			}
			else {
				newChannel.channelFader.gain.setValueAtTime(0, audioCtx.currentTime);
				newChannel.mute = true;
				this.classList.add("active-mute");
			}
		});

		this.soloInput.addEventListener("click", function(){
			if (this.classList.contains("active-solo")) {
				for (var j = 0; j < channelCounter; j++) {
					if(channels[j].channelHTMLNode.muteInput.classList.contains("active-mute")){
						channels[j].channelFader.gain.setValueAtTime(0, audioCtx.currentTime);
						channels[j].mute = true;
					}
					else{
						channels[j].channelFader.gain.setValueAtTime(dBFSToGain(newChannel.channelHTMLNode.channelVolumeInput.value), audioCtx.currentTime);
						channels[j].mute = false;
					}
				}
				this.classList.remove("active-solo");
			}
			else {
				for (var j = 0; j < channelCounter; j++) {
					channels[j].channelFader.gain.setValueAtTime(0, audioCtx.currentTime);
					channels[j].mute = true;
					channels[j].channelHTMLNode.soloInput.classList.remove("active-solo");
				}
				newChannel.channelFader.gain.setValueAtTime(dBFSToGain(newChannel.channelHTMLNode.channelVolumeInput.value), audioCtx.currentTime);
				newChannel.mute = false;
				this.classList.add("active-solo");
				newChannel.channelHTMLNode.muteInput.classList.remove("active-mute");
			}
		});

		this.channelVolumeInput.addEventListener("input", function(){
			if (newChannel.mute === false) newChannel.channelFader.gain.setValueAtTime(dBFSToGain(newChannel.channelHTMLNode.channelVolumeInput.value), audioCtx.currentTime);
		});

		this.initGainInput.addEventListener("input",function(){
			newChannel.preAmp.gain.setValueAtTime(dBFSToGain(this.value),audioCtx.currentTime);
		});

		this.hiEQ.addEventListener("input",function(){
			newChannel.hiEQControl.gain.setValueAtTime(this.value, audioCtx.currentTime);
		});
		this.loEQ.addEventListener("input", function () {
			newChannel.loEQControl.gain.setValueAtTime(this.value, audioCtx.currentTime);
		});
		this.hi_midFreq.addEventListener("input",function(){
			newChannel.hi_midEQControl.frequency.value = this.value;
		});
		this.hi_midBoost.addEventListener("input",function(){
			newChannel.hi_midEQControl.gain.setValueAtTime(this.value, audioCtx.currentTime);
		});
		this.lo_midFreq.addEventListener("input", function () {
			newChannel.lo_midEQControl.frequency.value = this.value;
		});
		this.lo_midBoost.addEventListener("input", function () {
			newChannel.lo_midEQControl.gain.setValueAtTime(this.value, audioCtx.currentTime);
		});
		// for each button in channel send
		for(var k =0; k< newChannel.channelHTMLNode.busGroups.elements.length; k++){
			this.busGroups.elements[k].addEventListener("click", function(){
				resetChanneltoBusConnection(index);
				if (this.value === "1-2 send") {
					// busses[1].merger.disconnect();

					newChannel.splitter.connect(busses[0].leftGain, 0, 0);
					newChannel.splitter.connect(busses[0].rightGain, 1, 0);
					setBusToMain(0);
				}
				else if (this.value === "3-4 send") {
					// busses[0].merger.disconnect();

					newChannel.splitter.connect(busses[1].leftGain, 0, 0);
					newChannel.splitter.connect(busses[1].rightGain, 1, 0);

					setBusToMain(1);
				}
				else {
					newChannel.channelFader.connect(masterChannel);
				}
			});
		}
	};

	newChannel.channelHTMLNode.resetChannelInputSettings = function(){
		this.channelVolumeInput.value = -50;
		newChannel.channelFader.gain.setValueAtTime(0, audioCtx.currentTime);


		this.initGainInput.value = 0;
		newChannel.preAmp.gain.setValueAtTime(dBFSToGain(this.initGainInput.value), audioCtx.currentTime);

		this.hiEQ.value = 0;
		newChannel.hiEQControl.gain.setValueAtTime(this.hiEQ.value, audioCtx.currentTime);
		this.loEQ.value = 0;
		newChannel.loEQControl.gain.setValueAtTime(this.loEQ.value, audioCtx.currentTime);

		this.hi_midFreq.value = 6775;
		newChannel.hi_midEQControl.frequency.value = this.hi_midFreq.value;
		this.hi_midBoost.value = 0;
		newChannel.hi_midEQControl.gain.setValueAtTime(this.hi_midBoost.value, audioCtx.currentTime);
		this.lo_midFreq.value = 1070;
		newChannel.lo_midEQControl.frequency.value = this.lo_midFreq.value;
		this.lo_midBoost.value = 0;
		newChannel.lo_midEQControl.gain.setValueAtTime(this.lo_midBoost.value, audioCtx.currentTime);

		this.panInput.value = 0;
		newChannel.panNode.pan.value = this.panInput.value;

		if (this.muteInput.classList.contains("active")) {
			newChannel.mute = false;
			this.muteInput.classList.remove("active");
		}
	};

}

function setChannelProperties(channel, i) {
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

function setNonChannelListeners() {

	masterVolumeIn.addEventListener("input", function () {
		masterChannel.gain.setValueAtTime(dBFSToGain(masterVolumeIn.value),audioCtx.currentTime);
	});

	// busGroups.forEach(function (input, index) {
	// 	for (var i = 0; i < input.elements.length; i++) {

	// 		delegateEvent(document, "click", ".busOption", function () {
	// 			resetChanneltoBusConnection(index);
	// 			if (this.value === "1-2 send") {
	// 				busses[1].merger.disconnect();

	// 				channels[index].splitter.connect(busses[0].leftGain, 0, 0);
	// 				channels[index].splitter.connect(busses[0].rightGain, 1, 0);
	// 				setBusToMain(0);
	// 			}
	// 			else if (this.value === "3-4 send") {
	// 				busses[0].merger.disconnect();

	// 				channels[index].splitter.connect(busses[1].leftGain, 0, 0);
	// 				channels[index].splitter.connect(busses[1].rightGain, 1, 0);

	// 				setBusToMain(1);
	// 			}
	// 			else {
	// 				channels[index].channelFader.connect(masterChannel);
	// 			}
	// 		});

			// input.elements[i].addEventListener("click", function () {
			// 	resetChanneltoBusConnection(index);
			// 	if (this.value === "1-2 send") {
			// 		busses[1].merger.disconnect();

			// 		channels[index].splitter.connect(busses[0].leftGain, 0, 0);
			// 		channels[index].splitter.connect(busses[0].rightGain, 1, 0);
			// 		setBusToMain(0);
			// 	}
			// 	else if (this.value === "3-4 send") {
			// 		busses[0].merger.disconnect();

			// 		channels[index].splitter.connect(busses[1].leftGain, 0, 0);
			// 		channels[index].splitter.connect(busses[1].rightGain, 1, 0);

			// 		setBusToMain(1);
			// 	}
			// 	else {
			// 		channels[index].channelFader.connect(masterChannel);
			// 	}
			// });
	// 	}
	// });

	// if busses are dynamically added/removed, add event listeners through delegateEvent()
	busPanIn.forEach(function (input, i) {
		input.addEventListener("input", function () {
			busses[i].busPan.pan.setValueAtTime(input.value, audioCtx.currentTime);
		});
	});

	busLeftVolumeIn.forEach(function (input, i) {
		input.addEventListener("input", function () {
			busses[i].leftGain.gain.setValueAtTime(dBFSToGain(busLeftVolumeIn[i].value),audioCtx.currentTime);
		});
	});
	busRightVolumeIn.forEach(function (input, i) {
		input.addEventListener("input", function () {
			busses[i].rightGain.gain.setValueAtTime(dBFSToGain(busRightVolumeIn[i].value), audioCtx.currentTime);
		});
	});
}

/*
*	Helper functions
*
*/
function resetChanneltoBusConnection(i) {
	channels[i].channelFader.disconnect();
	channels[i].splitter.disconnect();
	channels[i].channelFader.connect(channels[i].splitter);
	channels[i].splitter.connect(channels[i].clipAnalyser, 0, 0);
	channels[i].splitter.connect(channels[i].clipAnalyser2, 1, 0);

}
function setBusToMain(i) {
	busses[i].leftGain.connect(busses[i].merger, 0, 0);
	busses[i].rightGain.connect(busses[i].merger, 0, 1);
	busses[i].merger.connect(busses[i].busPan);
	busses[i].busPan.connect(masterChannel);
}

function createNewBus() {
	var bus = new Object();
	bus.busPan = audioCtx.createStereoPanner();
	bus.leftGain = audioCtx.createGain();
	bus.rightGain = audioCtx.createGain();
	bus.merger = audioCtx.createChannelMerger(2);
	return bus;
}

/**
 * Get the closest element of a given element by class
 *
 * Take an element (the first param), and traverse the DOM upward from it
 * until it hits the element with a given class name (second parameter).
 * This mimics jQuery's `.closest()`.
 *
 * @param  {element} el    The element to start from
 * @param  {string}  clazz The class name
 * @return {element}       The closest element
 */
function closestByClass(el, clazz) {
	// Traverse the DOM up with a while loop
	while (el.className != clazz) {
		// Increment the loop to the parent node
		el = el.parentNode;
		if (!el) {
			return null;
		}
	}
	// At this point, the while loop has stopped and `el` represents the element that has
	// the class you specified in the second parameter of the function `clazz`

	// Then return the matched element
	return el;
}

function delegateEvent(el, evt, sel, handler) {
	el.addEventListener(evt, function (event) {
		var t = event.target;
		while (t && t !== this) {
			if (t.matches(sel)) {
				handler.call(t, event);
			}
			t = t.parentNode;
		}
	});
}