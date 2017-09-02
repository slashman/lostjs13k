/* jshint node: true, loopfunc: true */
"use strict";

var raf = require('./raf');
var key = require('./key');
var gen = require('./gen');
var geo = require('./geo');

const rand = require('./rng')();

var canvas = document.querySelector('#game');
var ctx = canvas.getContext('2d');

key.init(canvas);

var entities = [];

const SECTOR_SIZE = 3000;

const player = {
  x: 5.5 * SECTOR_SIZE,
  y: 0.5 * SECTOR_SIZE,
  h: 16,
  w: 16,
  dx: 60,
  dy: 0,
  mx: 0,
  my: 0,
  flipped: false,
  draw: function(ctx){
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    if (this.flipped){
      moveTo(ctx, this.x, this.y - 3);
      lineTo(ctx, this.x - 500, this.y - 200);
      lineTo(ctx, this.x - 500, this.y + 200);
    } else {
      moveTo(ctx, this.x + 15, this.y - 3);
      lineTo(ctx, this.x + 500, this.y - 200);
      lineTo(ctx, this.x + 500, this.y + 200);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle="#000";
    fillArc(ctx, this.x+this.w/2, this.y+this.w/2, this.w, 0, 2*Math.PI, false);
    if (this.flipped){
      fillRect(ctx, this.x - 8, this.y-7, 14, 16);
    } else {
      fillRect(ctx, this.x + 8, this.y-7, 14, 16);
    }
    fillArc(ctx, this.x-3, this.y+16+3, 8, 0, 2*Math.PI, false);
    fillArc(ctx, this.x+16+3, this.y+16+3, 8, 0, 2*Math.PI, false);
    // Hitbox
    if (debug){
      ctx.strokeStyle="#FF0000";
      strokeRect(ctx, this.x, this.y, this.w, this.h);
    }
  }
};

entities.push(player);

const bubbles = [];

const camera = {
  x: 20,
  y: 20,
  zoom: 1
};

key.typed(90, function(){
  if (camera.zoom >= 1)
    camera.zoom = 0.3;
  else
    camera.zoom += 0.1;
});

key.typed(122, function(){
  if (camera.zoom >= 1)
    camera.zoom = 0.3;
  else
    camera.zoom += 0.1;
});

const debug = false;

const sectors = {};
sectors["5:0"] = gen.generateSegment(5, 0);

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
 
  });
  // Should we load another fragment?
  checkLoadFragment();
  player.mx = Math.floor(player.x / SECTOR_SIZE);
  player.my = Math.floor(player.y / SECTOR_SIZE);
  camera.x = player.x;
  camera.y = player.y;
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
  sectors[(player.mx+dx)+":"+(player.my+dy)] = gen.generateSegment(player.mx+dx, player.my+dy);
}

function transX(x){
  return (x - camera.x) * camera.zoom + canvas.width / 2 ;
}

function transY(y){
  return (y - camera.y) * camera.zoom + canvas.height / 2;
}

function transW(w){
  return w * camera.zoom;
}

function transH(h){
  return h * camera.zoom;
}

function moveTo(ctx, x, y){
  ctx.moveTo(transX(x), transY(y));
}

function lineTo(ctx, x, y){
  ctx.lineTo(transX(x), transY(y));
}

function fillRect(ctx, x, y, w, h){
  ctx.fillRect(transX(x), transY(y), transW(w), transH(h));  
}

function strokeRect(ctx, x, y, w, h){
  ctx.strokeRect(transX(x), transY(y), transW(w), transH(h));  
}

function fillArc(ctx, x, y, r, a, b, c){
  ctx.beginPath();
  ctx.arc(transX(x), transY(y), transW(r), a, b, c);  
  ctx.fill();
}

function strokeArc(ctx, x, y, r, a, b, c){
  ctx.beginPath();
  ctx.arc(transX(x), transY(y), transW(r), a, b, c);  
  ctx.stroke();
}

function draw(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Background
  ctx.fillStyle="#F00";
  ctx.fillRect(0, 0, 800, 600);
  ctx.fillStyle="#87CEEB";
  ctx.fillRect(0, transY(-500), canvas.width, transH(500));
  for (var sector in sectors){
    sector = sectors[sector];
    sector.bgStones.forEach(function(s){
      if (geo.mdist(s.x, s.y, player.x, player.y) > 1000)
        return;
      ctx.fillStyle = s.color;
      ctx.strokeStyle = s.color;
      ctx.beginPath();
      moveTo(ctx, s.vs[0][0], s.vs[0][1]);
      for (var i = 1; i < s.vs.length; i++){
        lineTo(ctx, s.vs[i][0], s.vs[i][1]);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
  }
  bubbles.forEach(function (b){
    ctx.strokeStyle = '#ccc';
    strokeArc(ctx, b.x, b.y, 2, 0, 2*Math.PI, false);
  });
  entities.forEach(function(e){
    e.draw(ctx);
  });
  
  for (sector in sectors){
    sector = sectors[sector];
    sector.stones.forEach(function(s){
      if (geo.mdist(s.x, s.y, player.x, player.y) > 1000)
        return;
      ctx.fillStyle = '#000';
      ctx.strokeStyle = '#000';
      ctx.beginPath();
      moveTo(ctx, s.vs[0][0], s.vs[0][1]);
      for (var i = 1; i < s.vs.length; i++){
        lineTo(ctx, s.vs[i][0], s.vs[i][1]);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
  }
  if (player.y > 0){
    ctx.font = "16px sans-serif";
    ctx.fillStyle = "white";
    ctx.fillText(Math.floor(player.y/20)+"mt", 720,20);
  }
  if (debug){
    // TODO: Remove from final dist, may be
    ctx.font = "10px Arial";
    ctx.fillStyle = "white";
    ctx.fillText("Player",10,10);
    ctx.fillText("x: "+player.x,10,20);
    ctx.fillText("y: "+player.y,10,30);
    ctx.fillText("dx: "+player.dx,10,40);
    ctx.fillText("dy: "+player.dy,10,50);
    ctx.fillText("mx: "+player.mx,10,60);
    ctx.fillText("my: "+player.my,10,70);
    ctx.fillText("sectors: "+Object.keys(sectors),10,80);
    const leftZone = player.x < player.mx * SECTOR_SIZE + SECTOR_SIZE / 2;
    const rightZone = player.x > player.mx * SECTOR_SIZE + SECTOR_SIZE / 2;
    const downZone = player.y > player.my * SECTOR_SIZE + SECTOR_SIZE / 2;
    const upZone = player.y < player.my * SECTOR_SIZE + SECTOR_SIZE / 2;
    ctx.fillText("leftZone: "+leftZone,10,90);
    ctx.fillText("rightZone: "+rightZone,10,100);
    ctx.fillText("downZone: "+downZone,10,110);
    ctx.fillText("upZone: "+upZone,10,120);
    ctx.fillText("zoom: "+camera.zoom,10,130);
  }
}

function keyboard(){
  if (key.isDown(38)){ // Rise
    player.dy -= 10;
    if (player.dy < -120){
      player.dy = -120;
    }
    addBubbles("left");
    addBubbles("right");
  } else if (key.isDown(40)){ // Sink
    if (player.dy < 60){
      player.dy += 10;
    }
    addBubbles("top");
  } 
  if (key.isDown(37)){
    player.flipped = true;
    if (player.dx > -120){
      player.dx -= 15;
    }
    addBubbles("right");
  } else if (key.isDown(39)){
    player.flipped = false;
    if (player.dx < 120){
      player.dx += 15;
    }
    addBubbles("left");
  }
}

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
      y: player.y+8
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
    bubbles.push({
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

raf.start(function(elapsed) {
  keyboard();
  //TODO: Framerate limiter?
  update(elapsed);
  draw();
});
