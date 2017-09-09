/* jshint node: true, loopfunc: true */
"use strict";

const DEBUG = false;

const geo = require('./geo');
const rand = require('./rng')();

var canvas = document.querySelector('#game');
var ctx = canvas.getContext('2d');

const SECTOR_SIZE = 3000;

const camera = {
  x: 20,
  y: 20,
  zoom: 1
};

let w = false; // World
let player = false; // World

const SPIDER = [
	[1.8,1.7,1.25,1,1.75,0],
	[1.8,2,1,1.8],
	[1.8,2.3,1,2.8],
	[1.8,2.9,1.5,3.5,1.8,4],
	[2.2,1.7,2.75,1,2.75,0],
	[2.2,2,3,1.8],
	[2.2,2.3,3,2.8],
	[2.2,2.9,2.5,3.5,2.2,4]
];

module.exports = {
	camera: camera,
	init: function(w_){
		w = w_;
		player = w.player;
	},
	draw: function (){
		if (player.dead){
			ctx.fillStyle = "#000";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.font = "italic 28px serif";
			ctx.fillStyle = "white";
			ctx.textAlign="center"; 
			ctx.fillText("Deep in the sea. You are forever lost.", 400,550);
			return;
		}
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		for (var sector in w.sectors){
			sector = w.sectors[sector];
			if (sector.bg){
				ctx.fillStyle=sector.bg;
				ctx.strokeStyle=sector.bg;
				fillRect(ctx, sector.x, sector.y, SECTOR_SIZE, SECTOR_SIZE);
				strokeRect(ctx, sector.x, sector.y, SECTOR_SIZE, SECTOR_SIZE);
			}

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
		this.drawPlayer(ctx);
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
			if (this.currentTextStyle === "italic")
				ctx.font = "italic 28px serif";
			else
				ctx.font = "24px sans-serif";
			ctx.fillStyle = "white";
			ctx.textAlign="center"; 
			ctx.fillText(this.currentText, 400,550);
		}
		if (DEBUG){
			ctx.textAlign="left"; 
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
			ctx.fillText("entities: "+w.entities.length,10,100);
			ctx.fillText("zoom: "+camera.zoom,10,130);
		}
	},
	drawEntity: function(ctx, e){
		if (geo.mdist(e.x, e.y, player.x, player.y) > 1000){
	      return;
	    }
		ctx.fillStyle = e.takingDamage ? '#444' : '#000';
	    this["drawE"+e.t](ctx, e);
	    if (DEBUG){
			ctx.strokeStyle="#FF0000";
			strokeRect(ctx, e.x, e.y, e.w, e.h);
		}
	},
	drawEi: function(ctx, e){
		// Nautilus
		fillArc(ctx, e.x+2*e.s, e.y+2*e.s, 2*e.s, Math.PI,2*Math.PI, false);
		if (e.flipped){
			fillArc(ctx, e.x+3*e.s, e.y+2*e.s, e.s, 0, 2*Math.PI, false);
			fillCircle(ctx, e.x+3*e.s, e.y+2*e.s, 3*e.s, Math.PI/2, Math.PI, false);
		} else {
			fillArc(ctx, e.x+e.s, e.y+2*e.s, e.s, 0, 2*Math.PI, false);
			fillCircle(ctx, e.x+e.s, e.y+2*e.s, 3*e.s, 0, Math.PI/2, false);
		}
		ctx.fillStyle="#00F"; // TODO: Based on nautilus type
		if (e.flipped){
			fillArc(ctx, e.x+3*e.s, e.y+3*e.s, e.s/2, 0, 2*Math.PI, false);
		} else {
			fillArc(ctx, e.x+e.s, e.y+3*e.s, e.s/2, 0, 2*Math.PI, false);
		}
	},
	drawEa: function(ctx, e){
		fillCircle(ctx, e.x+e.s, e.y+2*e.s, 2*e.s, 0,2*Math.PI);
		fillCircle(ctx, e.x+3*e.s, e.y+2*e.s, 2*e.s, 0,2*Math.PI);
		fillCircle(ctx, e.x+2*e.s, e.y+e.s, 2*e.s, 0,2*Math.PI);
		fillCircle(ctx, e.x+2*e.s, e.y+3*e.s, 2*e.s, 0,2*Math.PI);
	},
	drawEb: function(ctx, e){
		fillCircle(ctx, e.x+2*e.s, e.y+2*e.s, 2*e.s, Math.PI, 2*Math.PI);
		if (e.flipped)
			fillCircle(ctx, e.x+e.s, e.y+2*e.s, e.s, 0,2*Math.PI);
		else
			fillCircle(ctx, e.x+3*e.s, e.y+2*e.s, e.s, 0,2*Math.PI);
	},
	drawEc: function(ctx, e){
		// Nautilus
		fillCircle(ctx, e.x+2*e.s, e.y+2*e.s, 2*e.s, 0, Math.PI*2, false);
		if (e.flipped){
			fillCircle(ctx, e.x+3*e.s, e.y+2*e.s, 3*e.s, Math.PI/4, Math.PI, false);
		} else {
			fillCircle(ctx, e.x+e.s, e.y+2*e.s, 3*e.s, 0, Math.PI*0.75, false);
		}
	},
	drawEd: function(ctx, e){
		if (e.flipped){
			fillCircle(ctx, e.x+2*e.s, e.y+2*e.s, 2*e.s, 0, Math.PI*1.25);
			fillCircle(ctx, e.x+2*e.s, e.y+3*e.s, 2*e.s, Math.PI*1.5, Math.PI*2);
		} else {
			fillCircle(ctx, e.x+2*e.s, e.y+2*e.s, 2*e.s, Math.PI*-0.25, Math.PI);
			fillCircle(ctx, e.x+2*e.s, e.y+3*e.s, 2*e.s, Math.PI, Math.PI*1.5);
		}
		ctx.fillStyle="#00F"; // TODO: Based on nautilus type
		if (e.flipped){
			fillArc(ctx, e.x+3*e.s, e.y+1.75*e.s, e.s/4, 0, 2*Math.PI);
		} else {
			fillArc(ctx, e.x+e.s, e.y+1.75*e.s, e.s/4, 0, 2*Math.PI);
		}
	},
	dls: (ctx, e, ls)=>{
		ctx.beginPath();
		ls.forEach(l=>{
			moveTo(ctx, e.x+e.s*l[0], e.y+e.s*l[1]);
			for (var i = 2; i < l.length; i+=2){
				lineTo(ctx, e.x+e.s*l[i], e.y+e.s*l[i+1]);
			}
			ctx.stroke();	
		})
	},
	drawEe: function(ctx, e){
		// Spider
		fillRect(ctx, e.x + 1.8*e.s, e.y+e.s, e.s*0.4, 2*e.s);
		ctx.strokeStyle="#000";
		this.dls(ctx, e, SPIDER);
	},
	drawEj: function(ctx, e){
		fillCircle(ctx, e.x+e.w/2, e.y+e.h/2, e.s/2, 0, 2*Math.PI, false);
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
		ctx.fillStyle=player.takingDamage ? '#444' : '#000';
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
			let style = 'italic';
			if (t.charAt(0) === "*"){
				style = 'normal';
				t = t.substr(1);	
			}
			this.currentTextStyle = style;
			this.currentText = t;
			// TODO: Wrap text using ctx.measureText
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