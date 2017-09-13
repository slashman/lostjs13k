/* jshint node: true, loopfunc: true */
//"use strict";

var geo = require('./geo');
var gen = require('./gen');
var ui = require('./ui');
var rand = require('./rng')();
var Entity = require('./Entity.class');
var sound = require('./sound');

var SZ = 3000;

var player = {
  x: 6.5 * SZ,
  y: 0.5 * SZ,
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
  //orbs: {"1": true, "2": true, "4": true},
  orbs: {}
};

var bubbles = [];
var booms = [];
var entities = [];

var sectors = {};

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
    if (geo.d(s.x, s.y, player.x, player.y) < 300){
      this.showStory(s);
      sector.stories.splice(k,1);
    }
  });
  updateEntity(player, elapsed);
  entities.forEach((e, k)=>{
    if (e.dead || geo.d(e.x, e.y, player.x, player.y) > 3000){
      entities.splice(k, 1);
      // This probably causes one entity to miss his turn.
      return;
    }
    updateEntity(e, elapsed);
  });

  // Should we load another fragment?
  checkLoadFragment(this);
  player.mx = Math.floor(player.x / SZ);
  player.my = Math.floor(player.y / SZ);
  ui.camera.x = player.x;
  ui.camera.y = player.y;
}

function createAndDeleteSectorAt(w, cx, cy, dx, dy) {
  if (sectors[(player.mx+cx)+":"+(player.my+cy)]){
    
  } else {
    generateSector(cx, cy);
  }
  if (sectors[(player.mx+dx)+":"+(player.my+dy)]){
    delete sectors[(player.mx+dx)+":"+(player.my+dy)];
  }
}

function checkLoadFragment(w){
  var leftZone = player.x < player.mx * SZ + SZ / 2;
  var rightZone = player.x > player.mx * SZ + SZ / 2;
  var downZone = player.y > player.my * SZ + SZ / 2;
  var upZone = player.y < player.my * SZ + SZ / 2;
  // TODO: Optimize source
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

function generateSector(dx, dy){
  var s = gen.generateSegment(player.mx+dx, player.my+dy, player)
  sectors[(player.mx+dx)+":"+(player.my+dy)] = s;
  if (s.bo && !player.bo){
    player.bo = true;
    let e = new Entity((player.mx+dx+0.5) * SZ, (player.my+dy+0.5) * SZ, 80, 'i', 0);
    e.world = world;
    e.bo = true;
    entities.push(e);
    e.act();
  }
}

function addEnemiesNearby(){
    if (entities.length > 20){
      setTimeout(()=> addEnemiesNearby(), 5000);
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
      var tmx = Math.floor(x / SZ);
      var tmy = Math.floor(y / SZ);
      let sector = sectors[tmx+":"+tmy];
      if (!sector){
        continue;
      }
      let t = rand.pickS(sector.ec);
      let e = new Entity(x, y, size, t, sector.lv);
      
      if (!entityCollides(sector, e.x, e.y, e)){
        e.world = world;
        entities.push(e);
        e.act();
      }
    }
    setTimeout(()=> addEnemiesNearby(), 5000);
  }

function entityCollides(sector,tx,ty,e){
    return sector.stones.find(function(s){
      if (geo.d(tx, ty, s.x, s.y) > 300)
        return false;
      // TODO: Optimize source code
      if (
        geo.p({
          a: {x: tx, y: ty},
          b: {x: tx+e.w, y: ty}},
          s.vs
        ) || 
        geo.p({
          a: {x: tx, y: ty},
          b: {x: tx, y: ty+e.h}},
          s.vs
        ) || 
        geo.p({
          a: {x: tx+e.w, y: ty},
          b: {x: tx+e.w, y: ty+e.h}},
          s.vs
        ) || 
        geo.p({
          a: {x: tx, y: ty+e.h},
          b: {x: tx+e.w, y: ty+e.h}},
          s.vs
        ) || 
        geo.p({
          a: {x: e.x+e.w/2, y: e.y+e.h},
          b: {x: tx+e.w/2, y: ty+e.h}},
          s.vs
        )

        ){
         return true; 
        }
      });
  };

function updateEntity(e, elapsed){
    var tx = e.x + e.dx * elapsed;
    var ty = e.y + e.dy * elapsed;
    let tmx;
    if (e.dx > 0){
      tmx = Math.floor((tx+e.w) / SZ);
    } else {
      tmx = Math.floor(tx / SZ);
    }
    var tmy = Math.floor((ty+e.h) / SZ);
    let collision = false;
    let sector = sectors[tmx+":"+tmy];
    if (sector){
      collision = entityCollides(sector,tx,ty,e)
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
      if (sector.orb && geo.d(sector.orb.x, sector.orb.y, player.x, player.y) < 10){
        player.orbs[sector.orb.type] = true;
        sector.orb = false;
      }
    } else {
      if (!player.invul && geo.d(e.x, e.y, player.x, player.y) < e.w){
        player.takingDamage = true;
        setTimeout(()=>player.takingDamage = false, 50);
        sound.play(2);
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
        if (geo.d(e.x, e.y, b.x, b.y) < e.w){
          e.takeDamage();
          e.dx = b.dx * 2;
          sound.play(2);
          booms.splice(k, 1);
        }
      });
    }
  };

var world = {
  update: update,
  player: player,
  sectors: sectors,
  bubbles: bubbles,
  booms: booms,
  start: function(){
    generateSector(0,0,player);
    addEnemiesNearby();
  },
  sonicBoom: function(dx, q){
    if (q === undefined)
      q = 5;
    if (q === 0){
      return;
    }
    booms.push({
      x: player.x+8,
      y: rand.range(player.y+3, player.y+13),
      dx: rand.range(250, 280) * dx,
      dy: rand.range(-10, 10),
      s: player.orbs[2] ? 5: 1,
      life: player.orbs[2] ? rand.range(80, 100) : 8,
    });
    setTimeout(()=> this.sonicBoom(dx, q-1), 100);
  },
  bubblePuff: function(x,y,size){
    for (var i = 0; i < size; i++){
      bubbles.push({
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
      s.t.forEach(s=>ui.showText(s));
    }
  },
  entities: entities,
  
  won: ()=>{
    setTimeout(()=>{
      player.won = true;
      ui.won();
    }, 3000);
  }
};

module.exports = world;