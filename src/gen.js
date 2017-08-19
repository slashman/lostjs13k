const rng = require('./rng');
var rand = rng();

var voronoi = new Voronoi();

const COLORS = [
  "#F4A460", "#DAA520", "#CD853F", "#D2691E", "#8B4513", 
  "#A0522D", "#A52A2A", "#800000"
];

module.exports = {
	generateSegment: function(x,y,w,h, seedA, seedB, seedC, seedD){
		var bbox = {xl: x, xr: x+w, yt: y, yb: y+h};
		var sites = [];
		for (var i = 0; i < 450; i++){
		  sites.push({
		    x: rand.range(bbox.xl, bbox.xr),
		    y: rand.range(bbox.yt, bbox.yb)
		  })
		}
		var diagram = voronoi.compute(sites, bbox);
		const stones = [];
		diagram.cells.forEach(function(cell){
		  if (rand.bool())
		    return;
		  var vs = [];
		  cell.halfedges.forEach(function (halfedge){
		    vs.push([halfedge.getStartpoint().x, halfedge.getStartpoint().y]);
		  });
		  stones.push({vs: vs});
		});
		bbox = {xl: -300, xr: 1450, yt: 0, yb: 3550};
		sites = [];
		for (var i = 0; i < 1450; i++){
		  sites.push({
		    x: rand.range(bbox.xl, bbox.xr),
		    y: rand.range(bbox.yt, bbox.yb)
		  })
		}
		diagram = voronoi.compute(sites, bbox);
		const bgStones = [];
		diagram.cells.forEach(function(cell){
		  var vs = [];
		  cell.halfedges.forEach(function (halfedge){
		    vs.push([halfedge.getStartpoint().x, halfedge.getStartpoint().y]);
		  });
		  bgStones.push({
		    vs: vs,
		    color: rand.pick(COLORS)
		  });
		});
		return {
			stones: stones,
			bgStones: bgStones
		}
	}
}