/* jshint node: true */
"use strict";

const rand = require('./rng')();
const geo = require('./geo');

function Entity(world, x, y, size, w, h, type){
	this.world = world;
	this.x = x;
	this.y = y;
	this.size = size;
	this.w = w;
	this.h = h;
	this.dx = 0;
	this.dy = 0;
	this.mx = 0;
	this.my = 0;
    this.flipped = false;
    this.type = type;
    this.sight = 400; //TODO: Param
    this.spda = 70; //TODO: Param
    this.spdb = 150; //TODO: Param
    this.act();
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
		if (geo.mdist(this.world.player.x, this.world.player.y, this.x, this.y) > this.sight)
			return false;
		else
			return this.world.player;
	}
};

module.exports = Entity;