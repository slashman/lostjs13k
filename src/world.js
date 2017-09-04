/* jshint node: true, loopfunc: true */
"use strict";

const geo = require('./geo');
const gen = require('./gen');
const ui = require('./ui');
const rand = require('./rng')();
const Entity = require('./Entity.class');

const SECTOR_SIZE = 3000;

var entities = [];
const player = {
  x: 6.5 * SECTOR_SIZE,
  y: 0.5 * SECTOR_SIZE,
  h: 16,
  w: 16,
  dx: 0,
  dy: 0,
  mx: 0,
  my: 0,
  flipped: false,
  invul: false,
  sonic: true, // Powerup
  hull: 100,
  //orbs: {"1": true, "2": true, "4": true},
  orbs: {}
};

entities.push(player);

const bubbles = [];
const booms = [];

const sectors = {};

sectors["6:0"] = gen.generateSegment(6, 0, player);

function update(elapsed){
  bubbles.forEach(function (b, k){
    b.life--;
    b.x += b.dx * elapsed;
    b.y += b.dy * elapsed;
    if (b.life <= 0){
      bubbles.splice(k, 1);
    }

  });
  booms.forEach(function (b, k){
    b.life--;
    b.x += b.dx * elapsed;
    b.y += b.dy * elapsed;
    if (b.life <= 0){
      booms.splice(k, 1);
    }
  });
  let sector = sectors[player.mx+":"+player.my];
  if (sector){
    sector.stories.forEach((s, k)=>{
      if (geo.mdist(s.x, s.y, player.x, player.y) < 300){
        this.showStory(s);
        sector.stories.splice(k,1);
      }
    });
  }
  entities.forEach(function(e, k){
    if (e.dead){
      entities.splice(k, 1);
      return;
    }
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
    if (e === player){
      if (sector.orb && geo.mdist(sector.orb.x, sector.orb.y, player.x, player.y) < 10){
        player.orbs[sector.orb.type] = true;
        sector.orb = false;
      }
      if (sector.gate && geo.mdist(sector.gate.x, sector.gate.y, player.x, player.y) < 20){
        if (player.orbs[4] && player.orbs[1] && player.orbs[2] && player.orbs[3]){
          //TODO: Win sequence
          player.orbs = {};
        }
      }
    } else {
      if (!player.invul && geo.mdist(e.x, e.y, player.x, player.y) < e.w){
        player.takingDamage = true;
        setTimeout(()=>player.takingDamage = false, 50);
        player.hull--; // TODO: Use enemy attack
        player.dx = e.dx * 2;
        player.dy = e.dy * 2;
        player.invul = true;
        setTimeout(()=>player.invul = false, 500);
      }
      booms.forEach(function (b, k){
        if (geo.mdist(e.x, e.y, b.x, b.y) < e.w){
          e.takeDamage();
          booms.splice(k, 1);
        }
      });
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
  booms: booms,
  entities: entities,
  addEntity: function(){
    entities.push(new Entity(this, 5.5 * SECTOR_SIZE, 0.5 * SECTOR_SIZE, 8, 32, 32, 'n'));
    entities.push(new Entity(this, 5.5 * SECTOR_SIZE, 0.5 * SECTOR_SIZE, 4, 16, 16, 'n'));
    entities.push(new Entity(this, 5.5 * SECTOR_SIZE, 0.5 * SECTOR_SIZE, 3, 12, 12, 'n'));
    entities.push(new Entity(this, 5.5 * SECTOR_SIZE, 0.5 * SECTOR_SIZE, 3, 12, 12, 'n'));
    entities.push(new Entity(this, 5.5 * SECTOR_SIZE, 0.5 * SECTOR_SIZE, 3, 12, 12, 'n'));
    entities.push(new Entity(this, 5.5 * SECTOR_SIZE, 0.5 * SECTOR_SIZE, 12, 48, 48, 'n'));
  },
  sonicBoom: function(dx, q){
    if (q === undefined)
      q = 5;
    if (q === 0){
      return;
    }
    this.booms.push({
      x: rand.range(player.x-5, player.x+5),
      y: rand.range(player.y-5, player.y+5),
      dx: rand.range(250, 280) * dx,
      dy: rand.range(-10, 10),
      life:  rand.range(80, 100),
    });
    setTimeout(()=> this.sonicBoom(dx, q-1), 100);
  },
  bubblePuff: function(x,y,size){
    for (var i = 0; i < size; i++){
      this.bubbles.push({
        x: rand.range(x-5, x+5),
        y: rand.range(y-5, y+5),
        dx: rand.range(-40, 40),
        dy: rand.range(-200, 0),
        life:  rand.range(15, 100),
      });
    }
  },
  showStory: function(s){
    if (typeof s.t === "string"){
      ui.showText(s.t);
    } else {
      s.t.forEach((s,k)=>ui.showText(s, k*5000));
    }
  }
};