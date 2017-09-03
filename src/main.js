/* jshint node: true, loopfunc: true */
"use strict";

const raf = require('./raf');
const ui = require('./ui');
const world = require('./world');
const input = require('./input');

ui.init(world);
input.init(world);
world.addEntity();

raf.start(function(elapsed) {
  input.keyboard();
  //TODO: Framerate limiter?
  world.update(elapsed);
  ui.draw();
});
