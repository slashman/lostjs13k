/* jshint node: true */
//"use strict";

const rand = require('./rng')();
const geo = require('./geo');

// Base stats
const BS = {
	a: [400, 100, 100, 10], // Blobs
	b: [400, 150, 70, 10], // Glider
	c: [600, 70, 150, 20], // Nautilus
	d: [400, 100, 100, 40], // Big Fish
	e: [400, 150, 150, 10], // Spider
	f: [600, 50, 200, 15], // Jelly 1
	g: [800, 50, 150, 15], // Jelly 2
	h: [900, 150, 150, 30], // Deep Fish
	i: [900, 100, 200, 1000], // Big Nautilus
	j: [400, 50, 50, 10], // Ball
}

function Entity(x, y, s, t, l){
	this.x = x;
	this.y = y;
	this.s = s;
	this.dx = 0;
	this.dy = 0;
	this.mx = 0;
	this.my = 0;
    this.flipped = false;
    this.t = t;
    if (t === "i"){
    	this.w = s;
    	this.h = s;
    } else {
    	this.w = s * 4;
    	this.h = s * 4;
    }
    let d = BS[t];
    this.sight = d[0] * (1+l/10);
    this.spda = d[1] * (1+l/10);
    this.spdb = d[2] * (1+l/10);
    this.life = d[3] * (1+l/10);
}

Entity.prototype = {
	act: function(){
		let target = this.getTarget();
		if (!target){
			this.dy -= rand.range(50, 120);
			setTimeout(this.act.bind(this), rand.range(1000, 4000));
		} else {
			let dx = target.x - this.x;
			let dy = target.y - this.y;
			this.dx = Math.sign(dx) * rand.range(this.spda-20, this.spda+20);
			this.dy = Math.sign(dy) * rand.range(this.spdb-20, this.spdb+20);
			this.flipped = dx < 0;
			setTimeout(this.act.bind(this), rand.range(100, 500));
		}
	},
	getTarget: function(){
		if (!this.world.player || geo.mdist(this.world.player.x, this.world.player.y, this.x, this.y) > this.sight)
			return false;
		else
			return this.world.player;
	},
	takeDamage: function(d){
		if (d === undefined){
			d = 1;
		}
		this.life -= d;
		if (this.life <= 0){
			this.die();
		}
		this.takingDamage = true;
		setTimeout(()=>this.takingDamage = false, 50);
	},
	die: function(){
		this.dead = true;
		if (this.bo){
			for (var i = 0; i < 40; i++)
				this.world.bubblePuff(this.x+rand.range(-150, 150), this.y+rand.range(-150, 150), 50);
			this.world.won();
		}
		let p = this.world.player;
		if (p.orbs[1]){
			if (p.hull < 100){
				p.hull++;
			}
		}
		this.world.bubblePuff(this.x, this.y, 50);
	}
};

module.exports = Entity;