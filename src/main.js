/* jshint node: true, loopfunc: true */
"use strict";

const raf = require('./raf');
const ui = require('./ui');
const world = require('./world');
const input = require('./input');

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
