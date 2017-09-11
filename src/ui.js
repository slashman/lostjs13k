/* jshint node: true, loopfunc: true */
"use strict";

//const DEBUG = false;

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
let player = false;

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

const JELLY1 = [ // Circles
	[2, 2, 2],
	[2, 4, 2, 1, 2]
];

const FB = [[1,2,2],[3,2,2],[2,1,2][2,3,2]];

const GLn = [
	[2,2,2,1],
	[3,2,1]
]

const GLf = [
	[2,2,2,1],
	[1,2,1]
]

var NAf = [[2,2,2],[3,2,3,0.25,1]];
var NAn = [[2,2,2],[1,2,3,0,0.75]];
var BFf = [[2,2,2,0,1.25],[2,3,2,1.5]];
var BFn = [[2,2,2,-0.25,1],[2,3,2,1,1.5]];

// TODO: Last one is meant to be fillCircle, not fillArc, check how it looks with arc
var BOf = [[2,2,2,1],[3,2,1],[3,2,3,0.5,1]];
var BOn = [[2,2,2,1],[1,2,1],[1,2,3,0,0.5]];

const JELLY2 = [ // Lines
	[1,4,1,6],
	[2,4,2,7],
	[3,4,3,6]
];

const JELLY3 = [ // Circles
	[2, 2, 2, 0.75, 2.25]
];

const JELLY4 = [ // Lines
	[1,2,1,5],
	[2,2,2,7],
	[3,2,3,5]
];

const FISH = [
	[2,2,2,0.7,1.9]
]

const FISH2 = [
	[4.5,-0.5,1]
]

const FISH3 = [
	[4.5,-0.5,0.5]
]

const FISH4 = [
	[3,1,0.3]
]

const JAW1 = [ // Shape
	[1,3.5,4,3.5,4,2.2,3.6,3,1,3],
	[3.8,1,3.8,2.5,2.5,1],
	[1,1.5,-1,1.5,0,2,-1,2.5,1,2.5],
];

var BA = [[2,2,2]];

const TEXT=[];

module.exports = {
	camera: camera,
	init: function(w_){
		w = w_;
		player = w.player;
		this.title = true;
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
		if (player.won){
			ctx.fillStyle = "#FFF";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = "#000";
			this.showTexts();
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
				ctx.fillStyle="rgba("+OC[sector.orb.type-1]+",0.5)";
				fillArc(ctx, sector.orb.x+10, sector.orb.y+10, 40);
				ctx.fillStyle="rgb("+OC[sector.orb.type-1]+")";
				fillArc(ctx, sector.orb.x+10, sector.orb.y+10, 5);
			}
			if (sector.gate){
				ctx.fillStyle="#000";
				fillArc(ctx, sector.gate.x, sector.gate.y, 50);
				fillRect(ctx, sector.gate.x - 70, sector.gate.y-15, 140, 30);
				fillRect(ctx, sector.gate.x - 15, sector.gate.y-70, 30, 140);
			}
		}
		ctx.strokeStyle = '#ccc';
		w.bubbles.forEach(function (b){
			strokeArc(ctx, b.x, b.y, 2);
		});
		ctx.strokeStyle = '#fcc';
		w.booms.forEach(function (b){
			strokeArc(ctx, b.x, b.y, b.s+rand.range(0,5));
		});
		this.drawPlayer(ctx);
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
		if (!this.title){
			ctx.font = "bold 20px sans-serif";
			ctx.fillStyle = "white";
			ctx.fillText(player.hull+"%", 700,40);
			for (let i in player.orbs){
				if (player.orbs[i]){
					ctx.fillStyle="rgb("+OC[i-1]+")";
					ctx.beginPath();
					ctx.arc(i*30, 40, 10, 0, 2*Math.PI);
					ctx.fill();
				}
			}
		}
		ctx.fillStyle = "white";
		if (this.title){
			ctx.font = "italic 36px serif";
			ctx.textAlign="center"; 
			ctx.fillText("Lost in Asterion", 400,100);
			ctx.font = "italic 24px serif";
			ctx.fillText("A js13k game by Santiago Zapata", 400,150);
			ctx.fillText("Press Enter", 400,450);
		} else {
			this.showTexts();
		}
		/*
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
		}*/
	},
	showTexts: function(){
		if (this.currentText){
			if (this.ita)
				ctx.font = "italic 28px serif";
			else
				ctx.font = "24px sans-serif";
			ctx.textAlign="center"; 
			if (player.won)
				ctx.fillText(this.currentText, 400,250);
			else
				ctx.fillText(this.currentText, 400,550);
		} else if (TEXT.length > 0){
			let t = TEXT.shift();
			this.ita = t.charAt(0) !== "*";
			this.currentText =this.ita ? t : t.substr(1);
			setTimeout(()=>this.currentText = false, player.won ? 8000 : 5000);
		}
	},
	drawEntity: function(ctx, e){
		if (geo.mdist(e.x, e.y, player.x, player.y) > 1000){
	      return;
	    }
		ctx.fillStyle = e.takingDamage ? '#444' : '#000';
	    ctx.strokeStyle = ctx.fillStyle;
	    this["drawE"+e.t](ctx, e);
	    /*if (DEBUG){
			ctx.strokeStyle="#FF0000";
			strokeRect(ctx, e.x, e.y, e.w, e.h);
		}*/
	},
	drawEi: function(ctx, e){
		// Big Nautilus
		dcs(ctx,e, e.flipped?BOf:BOn);
		ctx.fillStyle="#00F";
		fillArc(ctx, e.x+(e.flipped?1:3)*e.s, e.y+3*e.s, e.s/2);
	},
	drawEa: function(ctx, e){
		// Four blobs
		dcs(ctx, e, FB)
	},
	drawEb: function(ctx, e){
		// Glider
		dcs(ctx,e, e.flipped?GLf:GLn);
	},
	drawEc: function(ctx, e){
		// Nautilus
		dcs(ctx,e, e.flipped?NAf:NAn);
	},
	drawEd: function(ctx, e){
		// Big Fish
		dcs(ctx,e, e.flipped?BFf:BFn);
	},
	drawEe: function(ctx, e){
		// Spider
		fillRect(ctx, e.x + 1.8*e.s, e.y+e.s, e.s*0.4, 2*e.s);
		dls(ctx, e, SPIDER);
	},
	drawEf: function(ctx, e){
		// Jelly 1
		dcs(ctx, e, JELLY1);
		dls(ctx, e, JELLY2);
	},
	drawEg: function(ctx, e){
		// Jelly 2
		dcs(ctx, e, JELLY3);
		dls(ctx, e, JELLY4);
	},
	drawEh: function(ctx, e){
		// Deep fish
		ctx.fillStyle = 'rgba(255,255,255,0.5)';
		dcs(ctx, e, FISH2);
		ctx.fillStyle = '#000';
		dcs(ctx, e, FISH);
		dsh(ctx, e, JAW1);
		strokeArc(ctx, e.x+e.s*3.5, e.y, e.s*1.5, 1*Math.PI, 1.75*Math.PI);
		dcs(ctx, e, FISH3);
		ctx.fillStyle = '#F00';
		dcs(ctx, e, FISH4);
	},
	drawEj: function(ctx, e){
		// Ball
		dcs(ctx, e, BA);
	},
	drawPlayer: function(ctx){
		if (player.lt){
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
		}
		ctx.fillStyle=player.takingDamage ? '#444' : '#000';
		fillArc(ctx, player.x+player.w/2, player.y+player.w/2, player.w);
		if (player.flipped){
			fillRect(ctx, player.x - 8, player.y-7, 14, 16);
		} else {
			fillRect(ctx, player.x + 8, player.y-7, 14, 16);
		}
		// Hitbox
		/*if (DEBUG){
			ctx.strokeStyle="#FF0000";
			strokeRect(ctx, player.x, player.y, player.w, player.h);
		}*/
	},
	showText: function(t){
		TEXT.push(t);
	},
  	won: function(){
  		this.currentText = false;
  		TEXT.length = 0;
  		// TODO: Fade to White
  		WM.forEach(m=>TEXT.push(m));
  	}
};

// Winning messages
const WM = [
"You make the journey back to the Gate of Atlantis,", 
"as Melkaia indicated, the orbs open it.",
"A tremendous whirlpool covers all the cavern, ",
"hurling your ship all around. You pass out.",
"You wake up floating in the middle of the Ocean,",
"The SOS beacon is activated, you'll be rescued soon.",
"Noone will believe your tale of an underwater lost empire...",
"but you'll never forget the time when you were almost Lost.",
];

// ORB_COLORS
const OC = [
  "255,255,0",
  "255,0,0",
  "0,255,0",
  "0,0,255",
];

function tx(x){
  return (x - camera.x) * camera.zoom + canvas.width / 2 ;
}

function ty(y){
  return (y - camera.y) * camera.zoom + canvas.height / 2;
}

function ts(w){
  return w * camera.zoom;
}

function moveTo(c, x, y){
  c.moveTo(tx(x), ty(y));
}

function lineTo(c, x, y){
  c.lineTo(tx(x), ty(y));
}

function fillRect(c, x, y, w, h){
  c.fillRect(tx(x), ty(y), ts(w), ts(h));  
}

function strokeRect(c, x, y, w, h){
  c.strokeRect(tx(x), ty(y), ts(w), ts(h));  
}

// TODO: Remove this? Only used by big boss
/*function fillCircle(c, x, y, r, a, b){
  c.save();
  c.beginPath();
  moveTo(ctx, x, y);
  c.arc(tx(x), ty(y), ts(r), a, b);  
  c.closePath();
  c.fill();
  c.restore();
}*/

function fillArc(c, x, y, r, a, b){
  a = a || 0;
  b = b || 2*Math.PI;
  c.beginPath();
  c.arc(tx(x), ty(y), ts(r), a, b);
  c.fill();
}

function strokeArc(c, x, y, r, a, b){
  a = a || 0;
  b = b || 2*Math.PI;
  c.beginPath();
  c.arc(tx(x), ty(y), ts(r), a, b);
  c.stroke();
}

// Draw circles
function dcs(t, e, cs) {
	cs.forEach(c=>{
		fillArc(t, e.x+c[0]*e.s, 
			e.y+c[1]*e.s, 
			e.s*c[2],
			Math.PI * (c[3] || 0),
			Math.PI * (c[4] || 2)
		);	
	})
};

// Draw lines
function dls(t, e, ls){
	t.beginPath();
	ls.forEach(l=>{
		moveTo(t, e.x+e.s*l[0], e.y+e.s*l[1]);
		for (var i = 2; i < l.length; i+=2){
			lineTo(t, e.x+e.s*l[i], e.y+e.s*l[i+1]);
		}
		t.stroke();	
	})
};

// Draw shapes
function dsh(t, e, sh){
	sh.forEach(p=>{
		t.beginPath();
		moveTo(t, e.x+e.s*p[0], e.y+e.s*p[1]);
		for (var i = 2; i < p.length; i+=2){
			lineTo(t, e.x+e.s*p[i], e.y+e.s*p[i+1]);
		}	
		t.closePath();
		t.fill();
	})
};