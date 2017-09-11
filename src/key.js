/* jshint node: true */
"use strict";

var pressed = {};
var typedCallbacks = {};

function keyPress(e){
	if (typedCallbacks[e.which]){
		typedCallbacks[e.which]();
	}
}

module.exports = {
	init: function(){
		window.onkeydown = e => pressed[e.which] = true;
		window.onkeyup = e => pressed[e.which] = false;
		window.addEventListener("keypress", keyPress);
	},
	isDown: function(keyCode){
		return pressed[keyCode];
	},
	typed: function(keyCode, callback){
		typedCallbacks[keyCode] = callback;		
	}
};