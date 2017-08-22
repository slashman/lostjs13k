const rng = require('./rng');
var rand = rng();

var voronoi = new Voronoi();

const COLORS = [
  "#F4A460", "#DAA520", "#CD853F", "#D2691E", "#8B4513", 
  "#A0522D", "#A52A2A", "#800000"
];

module.exports = {
	generateSegment: function(x,y,w,h, topSeed, bottomSeed, leftSeed, rightSeed){
		var bbox = {xl: x, xr: x+w, yt: y, yb: y+h};
		if (!topSeed){
			topSeed = [];
			for (var i = 0; i < 20; i++){
				topSeed.push({
				    x: rand.range(bbox.xl+50, bbox.xr-50),
				    y: rand.range(bbox.yt, bbox.yt+50)
				})
			}
		}
		if (!bottomSeed){
			bottomSeed = [];
			for (var i = 0; i < 20; i++){
				bottomSeed.push({
				    x: rand.range(bbox.xl+50, bbox.xr-50),
				    y: rand.range(bbox.yb-50, bbox.yb)
				})
			}
		}
		if (!leftSeed){
			leftSeed = [];
			for (var i = 0; i < 20; i++){
				leftSeed.push({
				    x: rand.range(bbox.xl, bbox.xl+50),
				    y: rand.range(bbox.yt+50, bbox.yb-50)
				})
			}
		}
		if (!rightSeed){
			rightSeed = [];
			for (var i = 0; i < 20; i++){
				rightSeed.push({
				    x: rand.range(bbox.xr-50, bbox.xr),
				    y: rand.range(bbox.yt+50, bbox.yb-50)
				})
			}
		}
		var sites = topSeed.concat(bottomSeed).concat(leftSeed).concat(rightSeed);
		for (var i = 0; i < 45; i++){
		  sites.push({
		    x: rand.range(bbox.xl+50, bbox.xr-50),
		    y: rand.range(bbox.yt+50, bbox.yb-50)
		  })
		}
		var diagram = voronoi.compute(sites, bbox);
		const stones = [];
		diagram.cells.forEach(function(cell){
		  if (rand.range(0,100) < 90)
		    return;
		  var vs = [];
		  cell.halfedges.forEach(function (halfedge){
		    vs.push([halfedge.getStartpoint().x, halfedge.getStartpoint().y]);
		  });
		  stones.push({vs: vs});
		});
		sites = [];
		for (var i = 0; i < 145; i++){
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
			bgStones: bgStones,
			topSeed: topSeed,
			bottomSeed: bottomSeed,
			leftSeed: leftSeed,
			rightSeed: rightSeed
		}
	}
}