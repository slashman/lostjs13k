/* jshint node: true */
/* globals Voronoi */
'use strict';

const geo = require('./geo');
const rng = require('./rng');
const ca = require('./ca');

var rand = rng();

var voronoi = new Voronoi();

const RULES = {
	TIGHT_CAVE: [
		{ type: 0, op: '>', q: 1, sType: 1, nType: 1, chance: 60},
		{ type: 1, op: '<', q: 1, sType: 1, nType: 0, chance: 90},
	],
	OPEN_CAVE: [
		{ type: 0, op: '>', q: 1, sType: 1, nType: 1, chance: 30},
		{ type: 1, op: '<', q: 2, sType: 1, nType: 0, chance: 90},
	]
};

const STANDARD_COLORS = ["#001c33", "#002a4d", "#0e3f66"];

const SECTOR_INFO = [
	[ "Fdr", "Fdl", "Cdr", "Cdl1", "Cdr", "Gl" ],
	[ "Fur", "Fuld", "Cur", "Odlr", "Oudl", "Td2" ],
	[ "", "Rur", "Rlr", "Oudlr", "Oulr", "Tudl" ],
	[ "", "", "", "Dud", "", "Vud" ],
	[ "", "", "", "Su3", "", "Vu4" ]
];

const SECTOR_DATA = {
	F: {c:["#3B5323", "#526F35", "#636F57"], open: 20, ca: 0, rules: []},
	C: {open: 50, ca: 1, rules: RULES.TIGHT_CAVE},
	G: {open: 30, ca: 2, rules: RULES.OPEN_CAVE, gate: true},
	O: {open: 20, ca: 2, rules: []},
	T: {open: 80, ca: 0, rules: []},
	R: {open: 80, ca: 0, rules: []},
	D: {c: ["#000"], open: 70, ca: 1, rules: RULES.OPEN_CAVE},
	S: {open: 80, ca: 1, rules: RULES.TIGHT_CAVE},
	V: {open: 70, ca: 1, rules: RULES.OPEN_CAVE},
};


function checkAndAddSite(site, toSite){
	if (site === null || site.voronoiId === toSite.voronoiId)
		return;
	if (!toSite.surroundingCells.find(function(cell){
		return cell.voronoiId === site.voronoiId;
	})){
		toSite.surroundingCells.push(site);
	}
}

/**
 * Adds the following to each site object:
 * - vs: Array of vertices forming the polygon for the site
 * - surroundingCells: Array of adjacent cells
 */
function completeDiagram(diagram, includeSurrounding){
	diagram.cells.forEach(function(cell){
		const site = cell.site;
		site.vs = [];
		if (includeSurrounding){
	  		site.surroundingCells = [];
	  	}
		cell.halfedges.forEach(function (halfedge){
	    	site.vs.push([halfedge.getStartpoint().x, halfedge.getStartpoint().y]);
	    	if (includeSurrounding){
		    	checkAndAddSite(halfedge.edge.lSite, site);
		    	checkAndAddSite(halfedge.edge.rSite, site);
		    }
	    });
	});
}

const SECTOR_SIZE = 3000;

module.exports = {
	generateSegment: function(mx,my,player){
		let w = SECTOR_SIZE;
		let h = SECTOR_SIZE;
		let x = mx * w;
		let y = my * h;
		const bbox = {xl: x, xr: x+w, yt: y, yb: y+h};
		const metadata = getMetadata(mx, my);
		const colors = metadata.c || STANDARD_COLORS;
		const sites = [];
		for (let i = 0; i < 1000; i++){
		  sites.push({
		    x: rand.range(bbox.xl+20, bbox.xr-20),
		    y: rand.range(bbox.yt+20, bbox.yb-20)
		  });
		}
		let diagram = voronoi.compute(sites, bbox);
		completeDiagram(diagram, true);
		let stones = [];
		diagram.cells.forEach(c => stones.push(c.site));
		stones.forEach(s => {
			// Initial seeding
			if (rand.range(0,100) < metadata.open){
				s.type = 1; // Rock
			} else {
				s.type = 0; // Emptiness
			}
			// Borders
			if (Math.abs(s.x - x) < 100 ||
				Math.abs(s.x - (x+w)) < 100 ||
				Math.abs(s.y - y) < 100 ||
				Math.abs(s.y - (y+h)) < 100){
				s.type = 4; // Indestructible rock
			}
			// Bore hole in the middle
			if (geo.mdist(s.x, s.y, x+w/2, y+h/2) < 300){
				s.type = 3; // Irreplaceable emptiness
			}
			if (metadata.u){
				if (s.y < y+h/2 && Math.abs(s.x - (x+w/2)) < 150){
					s.type = 3;
				}
			}
			if (metadata.d){
				if (s.y > y+h/2 && Math.abs(s.x - (x+w/2)) < 150){
					s.type = 3;
				}
			}
			if (metadata.l){
				if (s.x < x+w/2 && Math.abs(s.y - (y+h/2)) < 150){
					s.type = 3;
				}
			}
			if (metadata.r){
				if (s.x > x+w/2 && Math.abs(s.y - (y+h/2)) < 150){
					s.type = 3;
				}
			}
		});
		ca.run(metadata.rules, metadata.ca+1, stones, rand);
		stones = stones.filter(s => s.type === 1 || s.type === 4);
		const bgSites = [];
		for (var i = 0; i < 1450; i++){
		  bgSites.push({
		    x: rand.range(bbox.xl, bbox.xr),
		    y: rand.range(bbox.yt, bbox.yb)
		  });
		}
		diagram = voronoi.compute(bgSites, bbox);
		completeDiagram(diagram, false);
		const bgStones = [];
		diagram.cells.forEach(cell => {
			const site = cell.site;
		    site.type = rand.range(0,colors.length);
		    bgStones.push(cell.site);
		});
		//ca.run(rules, 1, bgStones, rand);
		bgStones.forEach(stone => stone.color = colors[stone.type]);
		let orb = false;
		if (metadata.gem && !player.orbs[metadata.gem]){
			orb = {
				type: metadata.gem,
				x: x+w/2,
				y: y+h/2
			}
		}
		return {
			gate: metadata.gate ? {x: x+w/2, y: y+h/2} : false,
			orb: orb,
			stones: stones,
			bgStones: bgStones
		};
	}
};


function getMetadata(mx, my){
	let sectorInfo = SECTOR_INFO[my] ? SECTOR_INFO[my][mx] : false;
	let baseData; 
	if (!sectorInfo){
		baseData = SECTOR_DATA.C;
		sectorInfo = ""; // TODO: Random uldr
	} else {
		baseData = SECTOR_DATA[sectorInfo.charAt(0)];
	}
	return Object.assign({}, baseData, 
		{ u: sectorInfo.indexOf("u") != -1, d: sectorInfo.indexOf("d") != -1,
		  l: sectorInfo.indexOf("l") != -1, r: sectorInfo.indexOf("r") != -1,
		  gem: /([0-9])/g.exec(sectorInfo)?/([0-9])/g.exec(sectorInfo)[0]:false
		});
}