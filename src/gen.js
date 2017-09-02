/* jshint node: true */
/* globals Voronoi */
'use strict';

const rng = require('./rng');
const ca = require('./ca');

var rand = rng();

var voronoi = new Voronoi();

var rules = [
	{ type: 1, op: '>', q: 1, sType: 2, nType: 2, chance: 80}
];

var terrainRules = [
	{ type: 0, op: '>', q: 1, sType: 1, nType: 1, chance: 80}
];

const TYPE_COLORS = [
  //"#F4A460", "#DAA520", "#CD853F", "#D2691E", "#8B4513", 
  //"#A0522D", "#A52A2A", "#800000"
"#001c33",
"#002a4d",
"#0e3f66"
];



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

module.exports = {
	
	generateSegment: function(x,y,w,h){
		const bbox = {xl: x, xr: x+w, yt: y, yb: y+h};
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
		diagram.cells.forEach(function(cell){
		  if (rand.range(0,100) < 20){
		  	cell.site.type = 1;
		  } else {
		  	cell.site.type = 0;
		  }
		  stones.push(cell.site);
		});
		ca.run(terrainRules, 1, stones, rand);
		stones = stones.filter(function(stone){
			return stone.type === 1;
		});
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
		diagram.cells.forEach(function(cell){
			const site = cell.site;
		    site.type = rand.range(0,3);
		    bgStones.push(cell.site);
		});
		//ca.run(rules, 1, bgStones, rand);
		bgStones.forEach(function(stone){
			stone.color = TYPE_COLORS[stone.type];
		});
		return {
			stones: stones,
			bgStones: bgStones
		};
	}
};