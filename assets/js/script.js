
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioCtx = new AudioContext();

var recordBtn = document.getElementById("record").parentNode;
var stopBtn = document.getElementById("stop").parentNode;
var recorder;
var recording;
var masterChannel = audioCtx.createGain();
var masterBufferNode = audioCtx.createScriptProcessor(2048,1,1);
var maxChannels = 5;
var channelCounter = 0, fullBoard = false;
var busCounter = 0;
var channels = [], busses = [];
var isSolo = false;

busses[0] = createNewBus();
busses[1] = createNewBus();
setNonChannelListeners();

for (var i = 0; i < busses.length; i++) {
	busses[i].busHTMLNode= {
		'busPanIn' : $(".bus-pan"),
		'busLeftVolumeIn' : $(".left-bus"),
		'busRightVolumeIn' : $(".right-bus")
	}


	noUiSlider.create(busses[i].busHTMLNode.busLeftVolumeIn[i], {
		start: [-100],
		connect: [true, true],
		orientation: "vertical",
		direction: "rtl",
		range: {
			'min': -100,
			'5%': -60,
			'10%': -50,
			'15%': -40,
			'25%': -30,
			'35%': -20,
			'55%': -10,
			'75%': 0,
			'90%': 5,
			'max': 10,
		}
	});
	noUiSlider.create(busses[i].busHTMLNode.busRightVolumeIn[i], {
		start: [-100],
		connect: [true, true],
		orientation: "vertical",
		direction: "rtl",
		range: {
			'min': -100,
			'5%': -60,
			'10%': -50,
			'15%': -40,
			'25%': -30,
			'35%': -20,
			'55%': -10,
			'75%': 0,
			'90%': 5,
			'max': 10,
		}
	});
}

// code breaks if abstracted to loop. make unique event listeners for each bus.
busListenerFunctions(0);
busListenerFunctions(1);

delegateEvent(document, "click", "#filler", function(){
	var htmlData = {
		busName: busCounter++
	}
	var chTemplate = document.getElementById("channel-template").innerHTML;
	if (channelCounter === maxChannels - 1) {
		document.getElementById("filler").style.visibility = 'hidden';
		fullBoard = !fullBoard;
	}

	var html = Mustache.render(chTemplate, htmlData);
	// breh there has to be a better way...
	// var htmlElement = document.createElement('div');
	// htmlElement.innerHTML = html;
	// also... eventlisteners are destroyed upon creating new nodes
	// document.getElementById("test").appendChild(htmlElement);
	document.getElementById("empty").outerHTML = html;
	addChannel(channelCounter);

	// $(".dial").knob();

	channels[channelCounter].channelHTMLNode.initListeners();
	channelCounter++;


});

function loadSound(arraybuffer, channel) {
	audioCtx.decodeAudioData(arraybuffer, function (buffer) {
		channel.source.buffer = buffer;
		channel.source.loop = true;
		channel.source.connect(channel.preAmp);
		channel.preAmp.connect(channel.hiEQControl);
		channel.hiEQControl.connect(channel.hi_midEQControl);
		channel.hi_midEQControl.connect(channel.loEQControl);
		channel.loEQControl.connect(channel.lo_midEQControl);


		channel.lo_midEQControl.connect(channel.panNode);
		channel.panNode.connect(channel.channelFader);

		channel.channelFader.connect(masterChannel);
		masterChannel.connect(masterBufferNode);
		masterChannel.connect(audioCtx.destination);

		channel.channelFader.connect(channel.splitter);
		channel.splitter.connect(channel.clipAnalyser, 0, 0);
		channel.splitter.connect(channel.clipAnalyser2, 1, 0);
		channel.javascriptNode.connect(channel.splitter);

	}, function (e) { console.log("Error with decoding audio data" + e.err); });

}

function addChannel(index) {
	var newChannel = new Object();
	setChannelProperties(newChannel, index);
	channels[index] = newChannel;

	newChannel.channelHTMLNode = new Object();
	newChannel.channelHTMLNode.audioSource = document.querySelectorAll(".audio-in")[index];


	newChannel.channelHTMLNode.initGainInput = $(".gain").eq(index).knob(
		{
			'change': function (value) {
				newChannel.preAmp.gain.setValueAtTime(dBFSToGain(value), audioCtx.currentTime);
			}
		});



	newChannel.channelHTMLNode.hiEQ = $(".high-gain").eq(index).knob(
		{
			'change': function (value) {
				newChannel.hiEQControl.gain.setValueAtTime(value, audioCtx.currentTime);
			}
		});
	newChannel.channelHTMLNode.loEQ = $(".low-gain").eq(index).knob(
		{
			'change': function (value) {
				newChannel.loEQControl.gain.setValueAtTime(value, audioCtx.currentTime);
			}
		});

	newChannel.channelHTMLNode.hi_midFreq = $(".hm-freq-gain").eq(index).knob(
		{
			'change': function (value) {
				newChannel.hi_midEQControl.frequency.value = value;
			}
		});
	newChannel.channelHTMLNode.hi_midBoost = $(".hm-boost-gain").eq(index).knob(
		{
			'change': function (value) {
				newChannel.hi_midEQControl.gain.setValueAtTime(value, audioCtx.currentTime);
			}
		});
	newChannel.channelHTMLNode.lo_midFreq = $(".lm-freq-gain").eq(index).knob(
		{
			'change': function (value) {
				newChannel.lo_midEQControl.frequency.value = value;
			}
		});

	newChannel.channelHTMLNode.lo_midBoost = $(".lm-boost-gain").eq(index).knob(
		{
			'change': function (value) {
				newChannel.lo_midEQControl.gain.setValueAtTime(value, audioCtx.currentTime);
			}
		});


	// newChannel.channelHTMLNode.panInput = document.querySelectorAll(".pan")[index];
	newChannel.channelHTMLNode.panInput = $(".channel-pan").eq(index).knob(
		{
			'change':function(value){
				newChannel.panNode.pan.setValueAtTime(value, audioCtx.currentTime);
			}
		});
	newChannel.channelHTMLNode.muteInput = document.querySelectorAll(".mute")[index];
	newChannel.channelHTMLNode.soloInput = document.querySelectorAll(".solo")[index];

	var slider = document.getElementsByClassName("sliders")[channelCounter];
	newChannel.channelHTMLNode.channelVolumeInput = slider;

	noUiSlider.create(slider, {
		start: [-100],
		connect: [true, true],
		orientation: "vertical",
		direction: "rtl",
		range: {
			'min': -100,
			'5%': -60,
			'10%': -50,
			'15%': -40,
			'25%': -30,
			'35%': -20,
			'55%': -10,
			'75%': 0,
			'90%': 5,
			'max': 10,
		}
	});

	newChannel.channelHTMLNode.busGroups = document.querySelectorAll("fieldset")[index];
	newChannel.channelHTMLNode.fileUploadOption = document.querySelectorAll(".filein")[index];
	newChannel.channelHTMLNode.removeBtn = document.querySelectorAll(".fa-minus-square")[index];

	newChannel.channelHTMLNode.requestPresetAudio = function () {

		var request = new XMLHttpRequest();
		request.open('GET', this.audioSource.options[this.audioSource.selectedIndex].value, true);

		request.responseType = 'arraybuffer';


		request.onload = function () {
			newChannel.source = audioCtx.createBufferSource();
			var audioData = request.response;
			loadSound(audioData, newChannel);
			newChannel.channelHTMLNode.resetChannelInputSettings();
			newChannel.source.start(audioCtx.currentTime);
		}

		request.send();

	};

	newChannel.channelHTMLNode.initListeners = function() {
		this.removeBtn.addEventListener("click",function(){
			if (newChannel.source.buffer) newChannel.source.stop();
			channels.splice(index, 1);
			closestByClass(this, "channel").remove();
			channelCounter--;
			// if DOM can't locate add button (max channels reached and removed)
			if (channelCounter === maxChannels - 1 && fullBoard) {
				document.getElementById("filler").style.visibility = 'visible';
				fullBoard = !fullBoard;
			}
		});
		this.audioSource.addEventListener("change", function(){
			if(newChannel.source.buffer !== null) newChannel.source.stop();
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
					newChannel.source = audioCtx.createBufferSource();
					loadSound(e.target.result, newChannel);
					newChannel.channelHTMLNode.resetChannelInputSettings(index);
					newChannel.source.start(audioCtx.currentTime);
				};
		});

		this.muteInput.addEventListener("click", function () {

			if(newChannel.mute === false){
				newChannel.channelFader.gain.setValueAtTime(0, audioCtx.currentTime);
				newChannel.mute = true;

				this.classList.add("active-mute");
			}
			else if (isSolo && newChannel.solo === false){

				this.classList.toggle("active-mute");
				return;
			}
			else{
				newChannel.channelFader.gain.setValueAtTime(dBFSToGain(newChannel.channelHTMLNode.channelVolumeInput.noUiSlider.get()), audioCtx.currentTime);
				newChannel.mute = false;

				this.classList.remove("active-mute");
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
						channels[j].channelFader.gain.setValueAtTime(dBFSToGain(channels[j].channelHTMLNode.channelVolumeInput.noUiSlider.get()), audioCtx.currentTime);
						channels[j].mute = false;
					}
				}
				this.classList.remove("active-solo");
				newChannel.solo = false;
			}
			else {
				for (var j = 0; j < channelCounter; j++) {
					channels[j].channelFader.gain.setValueAtTime(0, audioCtx.currentTime);
					channels[j].mute = true;
					channels[j].channelHTMLNode.soloInput.classList.remove("active-solo");
				}
				newChannel.channelFader.gain.setValueAtTime(dBFSToGain(newChannel.channelHTMLNode.channelVolumeInput.noUiSlider.get()), audioCtx.currentTime);
				newChannel.mute = false;
				newChannel.solo = true;
				this.classList.add("active-solo");
				newChannel.channelHTMLNode.muteInput.classList.remove("active-mute");
			}
			isSolo = !isSolo;

		});

		newChannel.channelHTMLNode.channelVolumeInput.noUiSlider.on('update', function (value) {
			if(newChannel.mute === false) newChannel.channelFader.gain.setValueAtTime(dBFSToGain(value[0]), audioCtx.currentTime);
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
		newChannel.channelHTMLNode.channelVolumeInput.noUiSlider.reset();
		newChannel.channelFader.gain.setValueAtTime(0, audioCtx.currentTime);

		this.initGainInput.value = 0;
		$(".gain").eq(index).val("0");
		$(".gain").eq(index).trigger("change");
		newChannel.preAmp.gain.setValueAtTime(dBFSToGain(0), audioCtx.currentTime);

		this.hiEQ.value = 0;

		$(".high-gain").eq(index).val("0");
		$(".high-gain").eq(index).trigger("change");
		newChannel.hiEQControl.gain.setValueAtTime(0, audioCtx.currentTime);
		this.loEQ.value = 0;

		$(".low-gain").eq(index).val("0");
		$(".low-gain").eq(index).trigger("change");
		newChannel.loEQControl.gain.setValueAtTime(0, audioCtx.currentTime);

		this.hi_midFreq.value = 6775;

		$(".hm-freq-gain").eq(index).val("6775");
		$(".hm-freq-gain").eq(index).trigger("change");
		newChannel.hi_midEQControl.frequency.value = 6775;

		this.hi_midBoost.value = 0;

		$(".hm-boost-gain").eq(index).val("0");
		$(".hm-boost-gain").eq(index).trigger("change");
		newChannel.hi_midEQControl.gain.setValueAtTime(0, audioCtx.currentTime);

		this.lo_midFreq.value = 990;

		$(".lm-freq-gain").eq(index).val("990");
		$(".lm-freq-gain").eq(index).trigger("change");
		newChannel.lo_midEQControl.frequency.value = 990;


		this.lo_midBoost.value = 0;

		$(".lm-boost-gain").eq(index).val("0");
		$(".lm-boost-gain").eq(index).trigger("change");
		newChannel.lo_midEQControl.gain.setValueAtTime(0, audioCtx.currentTime);

		// this.panInput[0].children[1].setAttribute("data-value","0");

		$(".channel-pan").eq(index).val("0");
		$(".channel-pan").eq(index).trigger("change");
		newChannel.panNode.pan.setValueAtTime(0, audioCtx.currentTime);

		if (this.muteInput.classList.contains("active")) {
			newChannel.mute = false;
			this.muteInput.classList.remove("active");
		}
	};

}

function setChannelProperties(channel, i) {
	channel.source = audioCtx.createBufferSource();
	channel.panNode = audioCtx.createStereoPanner();
	channel.preAmp = audioCtx.createGain();
	channel.channelFader = audioCtx.createGain();
	channel.mute = false;
	channel.solo = false;
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

	channel.gradient = channel.canvas.createLinearGradient(0, 0, 0, 80);
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
		channel.canvas.clearRect(0, 0, 60, 80);

		// set the fill style
		channel.canvas.fillStyle = channel.gradient;

		// create the meters
		if (average < 80) {
			channel.canvas.fillRect(0, 80 - average, 25, 80);
		}
		else {
			channel.canvas.fillRect(0, 0, 25, 130);
		}
		if (average2 < 80) {
			channel.canvas.fillRect(30, 80 - average2, 25, 80);
		}
		else {
			channel.canvas.fillRect(30, 0, 25, 80);
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


function busListenerFunctions(i){

	busses[i].busHTMLNode.busPanIn.eq(i).knob({
		'change': function (value) {
			busses[i].busPan.pan.setValueAtTime(value, audioCtx.currentTime);
		}
	});


	busses[i].busHTMLNode.busLeftVolumeIn[i].noUiSlider.on('update', function (value) {
		busses[i].leftGain.gain.setValueAtTime(dBFSToGain(value[0]), audioCtx.currentTime);
	});
	busses[i].busHTMLNode.busRightVolumeIn[i].noUiSlider.on('update', function (value) {
		busses[i].rightGain.gain.setValueAtTime(dBFSToGain(value[0]), audioCtx.currentTime);
	});
}
function setNonChannelListeners() {

	var masterVolumeIn = $("#master-volume")[0];
		noUiSlider.create(masterVolumeIn, {
			start: [-100],
			connect: [true, true],
			orientation: "vertical",
			direction: "rtl",
			range: {
				'min': -100,
				'5%': -60,
				'10%': -50,
				'15%': -40,
				'25%': -30,
				'35%': -20,
				'55%': -10,
				'75%': 0,
				'90%': 5,
				'max': 10,
			}
		});
	masterVolumeIn.noUiSlider.on('update', function (value) {
		masterChannel.gain.setValueAtTime(dBFSToGain(value[0]), audioCtx.currentTime);
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

recordBtn.onclick = function(){
	this.classList.toggle("hide-btn");
	stopBtn.classList.toggle("hide-btn");

	recorder = new Recorder(masterChannel,{
		'leaveStreamOpen':true,
	});
	recorder.record();
}

stopBtn.onclick = function(){
	this.classList.toggle("hide-btn");
	recordBtn.classList.toggle("hide-btn");

	recorder.stop();
	recorder.exportWAV(function (blob) {
		var url = URL.createObjectURL(blob);
		var anchor = document.getElementById("recording-link");
		anchor.href = url;
		anchor.download = 'mix_' + new Date().toISOString() + '.wav';
		anchor.click();
	});

	recorder.clear();

}
