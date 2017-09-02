/* jshint node: true */
"use strict";

const pressed = {};
const typedCallbacks = {};

function keyPress(e){
	if (typedCallbacks[e.keyCode]){
		typedCallbacks[e.keyCode]();
	}
}

module.exports = {
	init: function(){
		window.onkeydown = e => pressed[e.keyCode] = true;
		window.onkeyup = e => pressed[e.keyCode] = false;
		window.addEventListener("keypress", keyPress);
	},
	isDown: function(keyCode){
		return pressed[keyCode];
	},
	typed: function(keyCode, callback){
		typedCallbacks[keyCode] = callback;		
	}
};