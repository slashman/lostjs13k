/* jshint node: true */
"use strict";


const key = require('./key');
const ui = require('./ui');
const rand = require('./rng')();
const sound = require('./sound');

key.init();

let player = false;
let world = false;
let active = true;

/*key.typed(90, function(){
  if (ui.camera.zoom >= 1)
    ui.camera.zoom = 0.3;
  else
    ui.camera.zoom += 0.1;
});

key.typed(122, function(){
  if (ui.camera.zoom >= 1)
    ui.camera.zoom = 0.3;
  else
    ui.camera.zoom += 0.1;
});*/

key.typed(122, function(){
  sound.play(3);
  world.sonicBoom(player.flipped ? - 1 : 1);
});

key.typed(13, ()=>{
  if (ui.title){
    ui.title = false;
    setTimeout(()=>player.lt = true, 10000);
    setTimeout(()=>active = true, 15000);
  } 
});

const baseVar = {
  left: function(){
    return {
      x: player.x-11,
      y: player.y+16+8,
      dx: -3
    };
  },
  right: function(){
    return {
      x: player.x+24+3,
      y: player.y+16+8,
      dx: 3
    };
  },
  top: function(){
    return {
      x: player.x+8,
      y: player.y+8,
      dx: 0
    };
  },
};

function addBubbles(place, q){
  if (q === undefined){
    q = 5;
  }
  if (q === 0){
    return;
  }
  const basePosition = baseVar[place]();
  for (var i = 0; i < 1; i++){
    world.bubbles.push({
      x: rand.range(basePosition.x-5, basePosition.x+5),
      y: rand.range(basePosition.y-5, basePosition.y+5),
      dx: rand.range(basePosition.dx-5, basePosition.dx+5),
      dy: rand.range(-200, 0),
      life:  rand.range(15, 100),
    });
  }
  setTimeout(function(){
    addBubbles(place, q-1);
  },
  100);
}

module.exports = {
  init: function(w){
    world = w;
    player = w.player;
  },
  keyboard: function (){
    if (!active) return;
    if (key.isDown(38)){ // Rise
      sound.play(0);
      player.dy -= 10;
      if (player.dy < -120){
        player.dy = -120;
      }
      addBubbles("left");
      addBubbles("right");
    } else if (key.isDown(40)){ // Sink
      sound.play(0);
      if (player.dy < 60){
        player.dy += 10;
      }
      addBubbles("top");
    } 
    if (key.isDown(37)){
      sound.play(0);
      player.flipped = true;
      if (player.dx > -120){
        player.dx -= 15;
      }
      // Generate some lift
      player.dy -= 5;
      addBubbles("right");
    } else if (key.isDown(39)){
      sound.play(0);
      player.flipped = false;
      if (player.dx < 120){
        player.dx += 15;
      }
      player.dy -= 5;
      addBubbles("left");
    }
  }
};

function beep(){
  if (active) sound.play(1);
  setTimeout(beep, 10000);
}
beep();