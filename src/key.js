/* jshint node: true */
"use strict";

const pressed = {};
const typedCallbacks = {};

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
		window.addEventListener("keydown", e => {if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) e.preventDefault();});
	},
	isDown: function(keyCode){
		return pressed[keyCode];
	},
	typed: function(keyCode, callback){
		typedCallbacks[keyCode] = callback;		
	}
};