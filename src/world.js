/* jshint node: true, loopfunc: true */
"use strict";

const geo = require('./geo');
const gen = require('./gen');
const ui = require('./ui');

const SECTOR_SIZE = 3000;

var entities = [];

const player = {
  x: 5.5 * SECTOR_SIZE,
  y: 0.5 * SECTOR_SIZE,
  h: 16,
  w: 16,
  dx: 200,
  dy: 0,
  mx: 0,
  my: 0,
  flipped: false,
  //orbs: {"1": true, "2": true, "4": true},
  orbs: {}
};

entities.push(player);

const bubbles = [];

const sectors = {};

sectors["5:0"] = gen.generateSegment(5, 0, player);

function update(elapsed){
  bubbles.forEach(function (b, k){
    b.life--;
    b.x += b.dx * elapsed;
    b.y += b.dy * elapsed;
    if (b.life <= 0){
      bubbles.splice(k, 1);
    }

  });
  entities.forEach(function(e){
    // TODO: Optimize, only do this if moved (or gravity pulled)
    const tx = e.x + e.dx * elapsed;
    var ty = e.y + e.dy * elapsed;
    let tmx;
    if (e.dx > 0){
      tmx = Math.floor((tx+e.w) / SECTOR_SIZE);
    } else {
      tmx = Math.floor(tx / SECTOR_SIZE);
    }
    const tmy = Math.floor((ty+e.h) / SECTOR_SIZE);
    let collision = false;
    let sector = sectors[tmx+":"+tmy];
    if (sector){
      //TODO: Optimize only check for nearby stones!
      collision = sector.stones.find(function(s){
        if (geo.mdist(tx, ty, s.x, s.y) > 300)
          return false;
        if (
        geo.polygonIntersects({
          a: {x: tx, y: ty},
          b: {x: tx+e.w, y: ty}},
          s.vs
        ) || 
        geo.polygonIntersects({
          a: {x: tx, y: ty},
          b: {x: tx, y: ty+e.h}},
          s.vs
        ) || 
        geo.polygonIntersects({
          a: {x: tx+e.w, y: ty},
          b: {x: tx+e.w, y: ty+e.h}},
          s.vs
        ) || 
        geo.polygonIntersects({
          a: {x: tx, y: ty+e.h},
          b: {x: tx+e.w, y: ty+e.h}},
          s.vs
        ) || 
        geo.polygonIntersects({
          a: {x: e.x+e.w/2, y: e.y+e.h},
          b: {x: tx+e.w/2, y: ty+e.h}},
          s.vs
        )

        ){
         return true; 
        }
      });
    }
    if (collision){
      e.dx = 0;
      e.dy = 0;
    } else {
      e.x = tx;
      e.y = ty;
      // Friction
      e.dx += (e.dx > 0 ? -1 : e.dx < 0 ? 1 : 0) * 3;
      e.dy += (e.dy > 0 ? -1 : e.dy < 0 ? 1 : 0) * 3;
    }
    // Gravity
    e.dy += elapsed * 200;
    if (sector.orb && geo.mdist(sector.orb.x, sector.orb.y, player.x, player.y) < 10){
      player.orbs[sector.orb.type] = true;
      sector.orb = false;
    }
    if (sector.gate && geo.mdist(sector.gate.x, sector.gate.y, player.x, player.y) < 20){
      if (player.orbs[4] && player.orbs[1] && player.orbs[2] && player.orbs[3]){
        alert("You win!");
        //TODO: Win sequence
        player.orbs = {};
      }
    }
  });
  // Should we load another fragment?
  checkLoadFragment();
  player.mx = Math.floor(player.x / SECTOR_SIZE);
  player.my = Math.floor(player.y / SECTOR_SIZE);
  ui.camera.x = player.x;
  ui.camera.y = player.y;
}

function createAndDeleteSectorAt(cx, cy, dx, dy) {
  if (sectors[(player.mx+cx)+":"+(player.my+cy)]){
    
  } else {
    generateSector(cx, cy);
  }
  if (sectors[(player.mx+dx)+":"+(player.my+dy)]){
    delete sectors[(player.mx+dx)+":"+(player.my+dy)];
  }
}

function checkLoadFragment(){
  const leftZone = player.x < player.mx * SECTOR_SIZE + SECTOR_SIZE / 2;
  const rightZone = player.x > player.mx * SECTOR_SIZE + SECTOR_SIZE / 2;
  const downZone = player.y > player.my * SECTOR_SIZE + SECTOR_SIZE / 2;
  const upZone = player.y < player.my * SECTOR_SIZE + SECTOR_SIZE / 2;
  if (rightZone){
    createAndDeleteSectorAt(1, 0, -1, 0);
    createAndDeleteSectorAt(0, 0, -1, 1);
    createAndDeleteSectorAt(0, 0, -1, -1);
    if (upZone){
      createAndDeleteSectorAt(1, -1, -1, -1);
    }
    if (downZone){
      createAndDeleteSectorAt(1, 1, -1, 1);
      
    }
  } else if (leftZone){
    createAndDeleteSectorAt(-1, 0, 1, 0);
    createAndDeleteSectorAt(0, 0,  1, -1);
    createAndDeleteSectorAt(0, 0,  1, 1);
    if (upZone){
      createAndDeleteSectorAt(-1, -1, 1, -1);
    }
    if (downZone){
      createAndDeleteSectorAt(-1, 1, 1, 1);
    }
  } 
  if (upZone){
    createAndDeleteSectorAt(0, -1, 0, 1);
    createAndDeleteSectorAt(0, 0,  1, 1);
    createAndDeleteSectorAt(0, 0, -1, 1);
  } else if (downZone){
    createAndDeleteSectorAt(0, 1, 0, -1);
    createAndDeleteSectorAt(0, 0, 1, -1);
    createAndDeleteSectorAt(0, 0, -1, -1);
  }
}

function generateSector(dx, dy){
  if (player.my+dy < 0)
    return;
  sectors[(player.mx+dx)+":"+(player.my+dy)] = gen.generateSegment(player.mx+dx, player.my+dy, player);
}

module.exports = {
  update: update,
  player: player,
  sectors: sectors,
  bubbles: bubbles,
  entities: entities
};