/* jshint node: true */
"use strict";

const rand = require('./rng')();
const geo = require('./geo');

const BS = {
	n: [400, 70, 150, 10],
	e: [500, 70, 200, 1000]
}
/*
 n: Nautilus
 e: Boss
 */
function Entity(x, y, size, t, l){
	this.x = x;
	this.y = y;
	this.size = size;
	this.dx = 0;
	this.dy = 0;
	this.mx = 0;
	this.my = 0;
    this.flipped = false;
    this.type = t;
    if (t === "n"){
    	this.w = size * 4;
    	this.h = size * 4;
    } else {
    	this.w = size;
    	this.h = size;
    }
    let s = BS[t];
    this.sight = s[0] * (1+l/10);
    this.spda = s[1] * (1+l/10);
    this.spdb = s[2] * (1+l/10);
    this.life = s[3] * (1+l/10);
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
			this.dx = Math.sign(dx) * rand.range(this.spda, this.spdb);
			this.dy = Math.sign(dy) * rand.range(this.spda, this.spdb);
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
			for (var i = 0; i < 10; i++)
				this.world.bubblePuff(this.x+rand.range(-50, 50), this.y+rand.range(-50, 50), 50);	
		}
		this.world.bubblePuff(this.x, this.y, 50);
	}
};

module.exports = Entity;