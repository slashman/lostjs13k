/* jshint node: true, loopfunc: true */
"use strict";

var raf = require('./raf');
var ui = require('./ui');
var world = require('./world');
var input = require('./input');

ui.init(world);
input.init(world);
world.start();

raf.start(function(elapsed) {
	// Safety toogle
	if (elapsed > 1){
		return;
	}
	input.keyboard();
	//TODO: Framerate limiter?
	world.update(elapsed);
	ui.draw();
});
