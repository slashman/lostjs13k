// 48922

var raf = require('./raf');
var rng = require('./rng');
var key = require('./key');

var canvas = document.querySelector('#game');
var ctx = canvas.getContext('2d');

var rand = rng();
key.init(canvas);

var entities = [];

const player = {
  x: canvas.width / 2,
  y: 0,
  h: 32,
  w: 16,
  dx: 60,
  dy: 0,
  onGround: false
};

const camera = {
  x: 20,
  y: 20
}

const stones = [];
stones.push(
  {vs: [[20, 230], [300, 240], [280, 220]]}
);
stones.push(
  {vs: [[280, 220], [320, 40], [320, 220], [300,240]]}
);


entities.push(player);

function update(elapsed){
  entities.forEach(function(e){
    // TODO: Optimize, only do this if moved (or gravity pulled)
    // Gravity
    e.dy += elapsed * 1500;
    const tx = e.x + e.dx * elapsed;
    let ty = e.y + e.dy * elapsed;
    let vCollision = false;
    let hCollision = false;
    stones.forEach(function(s){
      //TODO: Optimize to not use forEach, split checks for vCollision and hCollision in order to break
      //TODO: Optimize, sort stones by distance to entity
      if (e.dx != 0){ 
        if (e.dx > 0){
          if (inside([tx+e.w,ty+e.h/2], s.vs)){
            hCollision = true;
          }
        } else if (e.dx < 0){
          if (inside([tx,ty+e.h/2], s.vs)){
            hCollision = true;
          }
        }
      }
      if (inside([tx+e.w/2,ty+e.h], s.vs)){
        vCollision = true;
      }
      if (e.dy > 100){
        //Prevent falling through thin borders at high acc
        if (polygonIntersects({
          a: {x: e.x+e.w/2, y: e.y+e.h},
          b: {x: tx+e.w/2, y: ty+e.h}},
          s.vs
        )){
         vCollision = true; 
        }
      }
    });
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
    if (!hCollision){
      e.x = tx;
      if (e.onGround && e.dx != 0)
        e.dy = -50; // Chibi jump, for slopes!
    } else if (e.dy < -50 || e.dy > 30){ // Hard collision
      if (e.dx < 0){
        e.dx = 120;
      } else if (e.dx > 0){
        e.dx = -120;
      }
    }
  });
  camera.x = player.x - canvas.width / 2;
  camera.y = player.y - canvas.height / 2;
}

function draw(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "10px Arial";
  ctx.fillStyle = "red";
  ctx.fillText("Player",10,10);
  ctx.fillText("x: "+player.x,10,20);
  ctx.fillText("y: "+player.y,10,30);
  ctx.fillText("dx: "+player.dx,10,40);
  ctx.fillText("dy: "+player.dy,10,50);
  entities.forEach(function(e){
    ctx.fillStyle="#FF0000";
    ctx.fillRect(e.x-camera.x, e.y-camera.y, e.w, e.h);
  });
  stones.forEach(function(s){
    ctx.fillStyle = '#00f';
    ctx.beginPath();
    ctx.moveTo(s.vs[0][0]-camera.x, s.vs[0][1]-camera.y);
    for (let i = 1; i < s.vs.length; i++){
      ctx.lineTo(s.vs[i][0]-camera.x, s.vs[i][1]-camera.y);
    }
    ctx.closePath();
    ctx.fill();
  });
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
  }
}

raf.start(function(elapsed) {
  keyboard();
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