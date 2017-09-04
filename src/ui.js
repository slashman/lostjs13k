/* jshint node: true, loopfunc: true */
"use strict";

const DEBUG = false;

const geo = require('./geo');
const rand = require('./rng')();

var canvas = document.querySelector('#game');
var ctx = canvas.getContext('2d');

const camera = {
  x: 20,
  y: 20,
  zoom: 1
};

let w = false; // World
let player = false; // World

module.exports = {
	camera: camera,
	init: function(w_){
		w = w_;
		player = w.player;
	},
	draw: function (){
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		// Background
		ctx.fillStyle="#F00";
		ctx.fillRect(0, 0, 800, 600);
		ctx.fillStyle="#87CEEB";
		ctx.fillRect(0, transY(-500), canvas.width, transH(500));
		for (var sector in w.sectors){
			sector = w.sectors[sector];
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
			if (sector.orb){
				ctx.fillStyle="rgba("+ORB_COLORS[sector.orb.type-1]+",0.5)";
				fillArc(ctx, sector.orb.x+10, sector.orb.y+10, 40, 0, 2*Math.PI, false);
				ctx.fillStyle="rgb("+ORB_COLORS[sector.orb.type-1]+")";
				fillArc(ctx, sector.orb.x+10, sector.orb.y+10, 5, 0, 2*Math.PI, false);
			}
			if (sector.gate){
				ctx.fillStyle="#000";
				fillArc(ctx, sector.gate.x, sector.gate.y, 50, 0, 2*Math.PI, false);
				fillRect(ctx, sector.gate.x - 70, sector.gate.y-15, 140, 30);
				fillRect(ctx, sector.gate.x - 15, sector.gate.y-70, 30, 140);
				ctx.fillStyle="rgb(100,100,0)";
				fillArc(ctx, sector.gate.x+55, sector.gate.y, 5, 0, 2*Math.PI, false);
				ctx.fillStyle="rgb(100,0,0)";
				fillArc(ctx, sector.gate.x-55, sector.gate.y, 5, 0, 2*Math.PI, false);
				ctx.fillStyle="rgb(0,100,0)";
				fillArc(ctx, sector.gate.x, sector.gate.y+55, 5, 0, 2*Math.PI, false);
				ctx.fillStyle="rgb(0,0,100)";
				fillArc(ctx, sector.gate.x, sector.gate.y-55, 5, 0, 2*Math.PI, false);
			}
		}
		w.bubbles.forEach(function (b){
			ctx.strokeStyle = '#ccc';
			strokeArc(ctx, b.x, b.y, 2, 0, 2*Math.PI, false);
		});
		w.booms.forEach(function (b){
			ctx.strokeStyle = '#fcc';
			strokeArc(ctx, b.x, b.y, 5+rand.range(0,5), 0, 2*Math.PI, false);
		});
		w.entities.forEach(e => this.drawEntity(ctx, e));
		for (sector in w.sectors){
			sector = w.sectors[sector];
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
		ctx.font = "bold 20px sans-serif";
		ctx.fillStyle = "white";
		//ctx.fillText(Math.floor(player.y/20)+"mt", 720,20);
		ctx.fillText(player.hull+"%", 700,40);
		for (let i in player.orbs){
			if (player.orbs[i]){
				ctx.fillStyle="rgb("+ORB_COLORS[i-1]+")";
				ctx.beginPath();
				ctx.arc(i*30, 40, 10, 0, 2*Math.PI, false);  
				ctx.fill();
			}
		}
		if (this.currentText){
			ctx.font = "italic 24px serif";
			ctx.fillStyle = "white";
			ctx.textAlign="center"; 
			ctx.fillText(this.currentText, 400,550);
		}
		if (DEBUG){
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
			ctx.fillText("sectors: "+Object.keys(w.sectors),10,80);
			ctx.fillText("orbs: "+Object.keys(player.orbs),10,90);
			ctx.fillText("zoom: "+camera.zoom,10,130);
		}
	},
	drawEntity: function(ctx, e){
		if (e === player){
			this.drawPlayer(ctx);
			return;
		}
		const baseFill = e.takingDamage ? '#444' : '#000';
		ctx.fillStyle = baseFill;
		fillArc(ctx, e.x+2*e.size, e.y+2*e.size, 2*e.size, Math.PI,2*Math.PI, false);
		if (e.flipped){
			fillArc(ctx, e.x+3*e.size, e.y+2*e.size, e.size, 0, 2*Math.PI, false);
			fillCircle(ctx, e.x+3*e.size, e.y+2*e.size, 3*e.size, Math.PI/2, Math.PI, false);
		} else {
			fillArc(ctx, e.x+e.size, e.y+2*e.size, e.size, 0, 2*Math.PI, false);
			fillCircle(ctx, e.x+e.size, e.y+2*e.size, 3*e.size, 0, Math.PI/2, false);
		}
		ctx.fillStyle="#00F"; // TODO: Based on nautilus type
		if (e.flipped){
			fillArc(ctx, e.x+3*e.size, e.y+3*e.size, e.size/2, 0, 2*Math.PI, false);
		} else {
			fillArc(ctx, e.x+e.size, e.y+3*e.size, e.size/2, 0, 2*Math.PI, false);
		}
		if (DEBUG){
			ctx.strokeStyle="#FF0000";
			strokeRect(ctx, e.x, e.y, e.w, e.h);
		}
	},
	drawPlayer: function(ctx){
		ctx.fillStyle = 'rgba(255,255,255,0.5)';
		ctx.beginPath();
		if (player.flipped){
			moveTo(ctx, player.x, player.y - 3);
			lineTo(ctx, player.x - 500, player.y - 200);
			lineTo(ctx, player.x - 500, player.y + 200);
		} else {
			moveTo(ctx, player.x + 15, player.y - 3);
			lineTo(ctx, player.x + 500, player.y - 200);
			lineTo(ctx, player.x + 500, player.y + 200);
		}
		ctx.closePath();
		ctx.fill();
		const baseFill = player.takingDamage ? '#444' : '#000';
		ctx.fillStyle=baseFill;
		fillArc(ctx, player.x+player.w/2, player.y+player.w/2, player.w, 0, 2*Math.PI, false);
		if (player.flipped){
			fillRect(ctx, player.x - 8, player.y-7, 14, 16);
		} else {
			fillRect(ctx, player.x + 8, player.y-7, 14, 16);
		}
		fillArc(ctx, player.x-3, player.y+16+3, 8, 0, 2*Math.PI, false);
		fillArc(ctx, player.x+16+3, player.y+16+3, 8, 0, 2*Math.PI, false);
		// Hitbox
		if (DEBUG){
			ctx.strokeStyle="#FF0000";
			strokeRect(ctx, player.x, player.y, player.w, player.h);
		}
	},
	showText: function(t, when){
		when = when || 0;
		setTimeout(()=>{
			this.currentText = t;
			setTimeout(()=>this.currentText=false, 4500);
		}, when);
	}
};

const ORB_COLORS = [
  "255,255,0",
  "255,0,0",
  "0,255,0",
  "0,0,255",
];

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

function fillCircle(ctx, x, y, r, a, b, c){
  ctx.save();
  ctx.beginPath();
  moveTo(ctx, x, y);
  ctx.arc(transX(x), transY(y), transW(r), a, b, c);  
  ctx.closePath();
  ctx.fill();
  ctx.restore();
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