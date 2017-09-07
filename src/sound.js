/* jshint node: true, elision: true */
/* globals jsfxr */
'use strict';

const rand = require('./rng')();

const SOUNDS = {
	BUBBLE: jsfxr([
		//3,0.1708,0.1078,0.328,0.7694,0.0148,,0.9602,,0.2499,,-0.0549,-0.0738,0.096,0.0641,0.4837,-0.0017,-0.0364,0.254,-0.2507,0.3391,0.575,-0.5669,0.5
		//3,0.5,0.1078,0.328,0.7694,0.0148,,0.9602,,0.2499,,-0.0549,-0.0738,0.096,0.0641,0.4837,-0.0017,-0.0364,0.254,-0.2507,0.3391,0.575,-0.5669,0.47
		3,0.48,0.2,0.68,0.7694,0.0148,,0.9602,,0.2499,,-0.0549,-0.0738,0.096,0.0641,0.4837,0.6,-0.0364,0.254,-0.2507,0.3391,0.575,-0.5669,0.57
	])
};

const AUDIOS = [];

for (var i = 0; i < 10; i++){
	const x = new Audio();
	x.src = SOUNDS.BUBBLE;
	AUDIOS.push(x);
}

let currentAudio = 0;

module.exports = {
	enabled: false,
	play: function(){
		if (!this.enabled || rand.chance(80)){
			return;
		}
		var player = AUDIOS[currentAudio++];
		if (currentAudio == AUDIOS.length){
			currentAudio = 0;
		}
		player.play().catch(()=>{console.log("splunk!");});
	}
};