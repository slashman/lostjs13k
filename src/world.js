/* jshint node: true, loopfunc: true */
"use strict";

const geo = require('./geo');
const gen = require('./gen');
const ui = require('./ui');
const rand = require('./rng')();
const Entity = require('./Entity.class');

const SECTOR_SIZE = 3000;

const player = {
  x: 6.5 * SECTOR_SIZE,
  y: 0.5 * SECTOR_SIZE,
  h: 16,
  w: 16,
  dx: 0,
  dy: 0,
  mx: 6,
  my: 0,
  flipped: false,
  invul: false,
  sonic: true, // Powerup
  hull: 100,
  orbs: {"1": true, "2": true, "4": true},
  //orbs: {}
};

const bubbles = [];
const booms = [];
const entities = [];

const sectors = {};

let world = false;

function update(elapsed){
  if (player.dead || player.won){
    return;
  }
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
  if (!sector){
    return;
  }
  sector.stories.forEach((s, k)=>{
    if (geo.mdist(s.x, s.y, player.x, player.y) < 300){
      this.showStory(s);
      sector.stories.splice(k,1);
    }
  });
  this.updateEntity(player, elapsed);
  entities.forEach((e, k)=>{
    if (e.dead || geo.mdist(e.x, e.y, player.x, player.y) > 3000){
      entities.splice(k, 1);
      // This probably causes one entity to miss his turn.
      return;
    }
    this.updateEntity(e, elapsed);
  });

  // Should we load another fragment?
  checkLoadFragment(this);
  player.mx = Math.floor(player.x / SECTOR_SIZE);
  player.my = Math.floor(player.y / SECTOR_SIZE);
  ui.camera.x = player.x;
  ui.camera.y = player.y;
}

function createAndDeleteSectorAt(w, cx, cy, dx, dy) {
  if (sectors[(player.mx+cx)+":"+(player.my+cy)]){
    
  } else {
    generateSector(w, cx, cy);
  }
  if (sectors[(player.mx+dx)+":"+(player.my+dy)]){
    delete sectors[(player.mx+dx)+":"+(player.my+dy)];
  }
}

function checkLoadFragment(w){
  const leftZone = player.x < player.mx * SECTOR_SIZE + SECTOR_SIZE / 2;
  const rightZone = player.x > player.mx * SECTOR_SIZE + SECTOR_SIZE / 2;
  const downZone = player.y > player.my * SECTOR_SIZE + SECTOR_SIZE / 2;
  const upZone = player.y < player.my * SECTOR_SIZE + SECTOR_SIZE / 2;
  if (rightZone){
    createAndDeleteSectorAt(w, 1, 0, -1, 0);
    createAndDeleteSectorAt(w, 0, 0, -1, 1);
    createAndDeleteSectorAt(w, 0, 0, -1, -1);
    if (upZone){
      createAndDeleteSectorAt(w, 1, -1, -1, -1);
    }
    if (downZone){
      createAndDeleteSectorAt(w, 1, 1, -1, 1);
      
    }
  } else if (leftZone){
    createAndDeleteSectorAt(w, -1, 0, 1, 0);
    createAndDeleteSectorAt(w, 0, 0,  1, -1);
    createAndDeleteSectorAt(w, 0, 0,  1, 1);
    if (upZone){
      createAndDeleteSectorAt(w, -1, -1, 1, -1);
    }
    if (downZone){
      createAndDeleteSectorAt(w, -1, 1, 1, 1);
    }
  } 
  if (upZone){
    createAndDeleteSectorAt(w, 0, -1, 0, 1);
    createAndDeleteSectorAt(w, 0, 0,  1, 1);
    createAndDeleteSectorAt(w, 0, 0, -1, 1);
  } else if (downZone){
    createAndDeleteSectorAt(w, 0, 1, 0, -1);
    createAndDeleteSectorAt(w, 0, 0, 1, -1);
    createAndDeleteSectorAt(w, 0, 0, -1, -1);
  }
}

function generateSector(w, dx, dy){
  var s = gen.generateSegment(player.mx+dx, player.my+dy, player)
  sectors[(player.mx+dx)+":"+(player.my+dy)] = s;
  if (s.bo && !player.bo){
    player.bo = true;
    let e = new Entity((player.mx+dx+0.5) * SECTOR_SIZE, (player.my+dy+0.5) * SECTOR_SIZE, 80, 'i', 0);
    e.world = w;
    e.bo = true;
    entities.push(e);
    e.act();
  }
}

module.exports = {
  update: update,
  player: player,
  sectors: sectors,
  bubbles: bubbles,
  booms: booms,
  start: function(){
    generateSector(this, 0,0,player);
    this.addEnemiesNearby();
  },
  addEnemiesNearby: function(){
    if (entities.length > 20){
      setTimeout(()=> this.addEnemiesNearby(), 5000);
      return;
    }
    for (var i = 0; i < 5; i++){ //TODO: quantity based on depth
      //TODO: Different kind of enemies
      var size = rand.range(3, 12);
      // TODO: Source code optimize
      if (player.dx !== 0){
        var x = player.x+rand.range(1000, 1200)*Math.sign(player.dx);
        var y = player.y+rand.range(100, 200)*rand.sign();  
      } else if (player.dy !== 0){
        var x = player.x+rand.range(100, 200)*rand.sign();
        var y = player.y+rand.range(1000, 1200)*Math.sign(player.dy)  ;
      } else {
        var x = player.x+rand.range(1000, 1200)*rand.sign();
        var y = player.y+rand.range(1000, 1200)*rand.sign();  
      }
      const tmx = Math.floor(x / SECTOR_SIZE);
      const tmy = Math.floor(y / SECTOR_SIZE);
      let sector = sectors[tmx+":"+tmy];
      if (!sector){
        continue;
      }
      let t = rand.pickS(sector.ec);
      let e = new Entity(x, y, size, t, sector.lv);
      
      if (!this.entityCollides(sector, e.x, e.y, e)){
        e.world = this;
        entities.push(e);
        e.act();
      }
    }
    setTimeout(()=> this.addEnemiesNearby(), 5000);
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
  },
  updateEntity: function(e, elapsed){
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
      collision = this.entityCollides(sector,tx,ty,e)
    } else {
      collision = true;
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
      if (sector.bu && !player.orbs[3]){
        player.hull--;
        e.dy = -400;
      }
      if (sector.cu && !player.orbs[4]){
        e.dx = 400;
      }
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
        if (player.hull <= 0){
          player.dead = true;
        }
        setTimeout(()=>player.invul = false, 500);
      }
      booms.forEach(function (b, k){
        if (geo.mdist(e.x, e.y, b.x, b.y) < e.w){
          e.takeDamage();
          booms.splice(k, 1);
        }
      });
    }
  },
  entities: entities,
  entityCollides: function(sector,tx,ty,e){
    return sector.stones.find(function(s){
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
  },
  won: ()=>{
    setTimeout(()=>{
      player.won = true;
      ui.won();
    }, 3000);
  }
};