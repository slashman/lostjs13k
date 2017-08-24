var raf = require('./raf');
var rng = require('./rng');
var key = require('./key');
var gen = require('./gen');

var canvas = document.querySelector('#game');
var ctx = canvas.getContext('2d');

var rand = rng();
key.init(canvas);

var entities = [];

const SECTOR_SIZE = 3000;

const player = {
  x: 20,
  y: -350,
  h: 32,
  w: 16,
  dx: 60,
  dy: 0,
  onGround: false,
  mx: 0,
  my: 0,
  jetpack: false
};

entities.push(player);

key.typed(74, function(){
  player.jetpack = !player.jetpack;
});

const camera = {
  x: 20,
  y: 20,
  zoom: 0.5
}

const debug = true;

const sectors = {};
sectors["0:0"] = gen.generateSegment(0, 0, SECTOR_SIZE, SECTOR_SIZE);
sectors["-1:0"] = gen.generateSegment(-SECTOR_SIZE, 0, SECTOR_SIZE, SECTOR_SIZE);

function update(elapsed){
  entities.forEach(function(e){
    // TODO: Optimize, only do this if moved (or gravity pulled)
    // Gravity
    e.dy += elapsed * 1500;
    if (e.jetpack){
      e.dy -= elapsed * 1550;
    }
    const tx = e.x + e.dx * elapsed;
    var ty = e.y + e.dy * elapsed;
    let vCollision = false;
    let hCollision = false;
    for (sector in sectors){
      sector = sectors[sector];
      if (e.dx != 0){
        hCollision = sector.stones.find(function(s){
          //TODO: Optimize, sort stones by distance to entity
          if (e.dx > 0){
            if (inside([tx+e.w,ty+e.h/2], s.vs)){
              return true;
            }
          } else if (e.dx < 0){
            if (inside([tx,ty+e.h/2], s.vs)){
              return true;
            }
          }
          return false;
        });
      }
      vCollision = sector.stones.find(function(s){
        if (inside([tx+e.w/2,ty+e.h], s.vs)){
          return true;
        }
        if (e.dy > 100){
          //Prevent falling through thin borders at high acc
          if (polygonIntersects({
            a: {x: e.x+e.w/2, y: e.y+e.h},
            b: {x: tx+e.w/2, y: ty+e.h}},
            s.vs
          )){
           return true; 
          }
        }
        return false;
      });
      if (hCollision || vCollision)
        break;
    };
    if (vCollision){
      e.dy = 0;
      // Friction
      if (e.dx != 0){ 
        e.dx -= e.dx > 0 ? 15 : -15; //TODO: Based on stone surface?
      }
      e.onGround = true;
    } else {
      e.y = ty 
      e.onGround = false;
    }
    // TODO: Remove hard collision, fix slopes
    if (!hCollision){
      e.x = tx;
      /*if (e.onGround && e.dx != 0)
        e.dy = -50; // Chibi jump, for slopes!*/
    } else if (e.dy < -50 || e.dy > 30){ // Hard collision
      if (e.dx < 0){
        e.dx = 120;
      } else if (e.dx > 0){
        e.dx = -120;
      }
    }
  });
  // Should we load another fragment?
  checkLoadFragment();
  player.mx = Math.floor(player.x / SECTOR_SIZE);
  player.my = Math.floor(player.y / SECTOR_SIZE);
  camera.x = player.x - canvas.width / 2;
  camera.y = player.y - canvas.height / 2;
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
  sectors[(player.mx+dx)+":"+(player.my+dy)] = gen.generateSegment((player.mx+dx)*SECTOR_SIZE, (player.my+dy)*SECTOR_SIZE, SECTOR_SIZE, SECTOR_SIZE);
}

function transX(x){
  return (x - camera.x) * camera.zoom;
}

function transY(y){
  return (y - camera.y) * camera.zoom;
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

function draw(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Background
  ctx.fillStyle="#000";
  ctx.fillRect(0, 0, 400, 400);
  ctx.fillStyle="#87CEEB";
  ctx.fillRect(0, -500-camera.y, 400, 500);
  for (sector in sectors){
    sector = sectors[sector];
    sector.bgStones.forEach(function(s){
      ctx.fillStyle = s.color;
      ctx.strokeStyle = s.color;
      ctx.beginPath();
      moveTo(ctx, s.vs[0][0], s.vs[0][1])
      for (var i = 1; i < s.vs.length; i++){
        lineTo(ctx, s.vs[i][0], s.vs[i][1]);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
  }
  
  entities.forEach(function(e){
    ctx.fillStyle="#FF0000";
    fillRect(ctx, e.x, e.y, e.w, e.h);
  });
  for (sector in sectors){
    sector = sectors[sector];
    sector.stones.forEach(function(s){
      ctx.fillStyle = '#000';
      ctx.strokeStyle = '#000';
      ctx.beginPath();
      moveTo(ctx, s.vs[0][0], s.vs[0][1])
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
    ctx.fillText(Math.floor(player.y/20)+"mt", 300,20);
  }
  if (player.jetpack){
    ctx.font = "16px sans-serif";
    ctx.fillStyle = "white";
    ctx.fillText("Jetpack", 300,40);
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
  }
}

function keyboard(){
  if (player.onGround){
    if (key.isDown(38)){
      player.dy = -500;
    }
    if (key.isDown(37)){
      if (player.dx > 0){
        player.dx -= 40;
      } else {
        player.dx = -120;
      }
    }
    if (key.isDown(39)){
      if (player.dx < 0){
        player.dx += 40;
      } else {
        player.dx = 120;
      }
    }
  } else if (player.jetpack){
    if (key.isDown(37)){
      player.dx -= 3;
    }
    if (key.isDown(39)){
      player.dx += 3;
    }
  }
}

raf.start(function(elapsed) {
  keyboard();
  //TODO: Framerate limiter?
  update(elapsed);
  draw();
});


function inside(point, vs) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

    var x = point[0], y = point[1];

    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0], yi = vs[i][1];
        var xj = vs[j][0], yj = vs[j][1];

        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
};

function polygonIntersects(line, vs) {
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0], yi = vs[i][1];
        var xj = vs[j][0], yj = vs[j][1];
        if (intersects(line.a.x, line.a.y, line.b.x, line.b.y, xi, yi, xj, yj))
          return true;
    }
    return false;
};

function intersects(a,b,c,d,p,q,r,s) {
  var det, gamma, lambda;
  det = (c - a) * (s - q) - (r - p) * (d - b);
  if (det === 0) {
    return false;
  } else {
    lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
    gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
  }
};