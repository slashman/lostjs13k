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
	[ "FdrcF3", "Fdl",  "Cdr", "ClcE1",  "CdCr",   "GlBcOr", "ClPcA" ],
	[ "Fur",    "Fuld", "Cur", "Odlr",   "OudlQ",  "TdcD2" ],
	[ "",       "RuJr", "Rlr", "OudKlHr","OulrI",  "TudQl" ],
	[ "CcMr5",  "SlcLr","ClNr","Dul",   "",          "Vud" ],
	[ "",       "",     "",    "",    "",          "VucG4" ]
];

const CLUES = {
	// Intro
	A: [
		"*You wake up to find yourself in an underwater cavern", 
		"*How long has it been? The onscreen navigation controls are not working",
		"*You are lost in the depths of the sea, but you can still move around",
		"*You'll need to find an exit.",
		"*(Press the arrow keys to move around).",
	],
	P: [
		"*You hear a sweet voice in your head.", 
		"Hello. I know you can hear me.", 
		"I have been waiting for you for a long, long time",
		"I am the princess Melkaia."
	],

	O: [
		"This is the gate of Atlantis, the only passage connecting this world with Earth.",
		"The only way to open it is to find the four orbs, scattered around the city."
	],
	B: [
		"You must want to go back to your home world. I can help you find the orbs!",
		"But I need your help too... I'm trapped in these cold depths.",
		"I want to return home too."
	],
	C: [
		"The areas beyond are full of dangerous beasts.",
		"Finding the orbs will grant you special powers to survive.",
		"There are two orbs nearby: one is at the Temple of Poseidon.",
		"To find it dive deeper and travel east.",
	],
	Q: [
		"If you continue west you'll find the entrance to a cave",
		"Another orb was hidden there."
	],
	
	// Artifacts
	D: [
		"The orb of Verra Kera will let you emit deadly sonic booms",
		"which will crush any creature underwater",
		"*(Press Z to shoot a sonic beam)"
	],
	E: [
		"The orb of Hortencia will cover your vessel,",
		"protecting it from harm.",
		"The shell will regenerate when contacting certain plants",
	],
	F: "The orb of Cosiaca will allow you to withstand extreme temperatures",
	G: [
		"The orb of Athena will strengten you, allowing to move quicker",
		"and against strong currents"
	],
		
	// Places
	H: [
		"Behold, the ruins of our great underwater city.",
		"This area used to be dry, but the forces that contained the water",
		"are long gone.",
	],
	I: [
		"Our great temple to Poseidon, the lord of the seas.",
		"Herein we studied his ancient wisdom, which gave us",
		"the domain of the forces of the water.",
	],
	J: [
		"These used to be the very fertile farmlands,",
		"our people fed only with plants.",
		"We despised animal suffering.",
	],
	K: [
		"The darkness abyss, this area was cursed with eternal darkness.",
		"I was unjustly imprisoned in the area below, but you'll need",
		"the power of Athena to make it through.",
		"Please don't give up!",
	],
	Q: [
		"Below is the volcanic rift, a place full of geothermal energy.",
		"Only the power of the Orb of Cosiaca will let you go in safely!"
	],

	// Ending
	N: [
		"A strong current blocks the entrance here...",
		"You will need the Orb of Athena to make it through!"
	],
	L: [
		"I can feel you are close... I'm so eager to meet you!",
		"I need to tell you something... my appearance... ",
		"may not be what you expect.",
	],
	M: [
		"Thank you for saving me! I hold the last orb.",
		"Let me join you to the Atlantis gate, and bid you",
		"farewell!"
	],
	

	// N: "The Atlanteans, they were so fool... with the power of Poseidon, all our enemies would have perished, drowned in the sea",
};

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
			};
		}
		const stories = [];
		if (metadata.stories){
			if (metadata.stories.u){
				stories.push({
					x: x+w/2,
					y: y,
					t: metadata.stories.u
				});
			} 
			if (metadata.stories.d){
				stories.push({
					x: x+w/2,
					y: y+h,
					t: metadata.stories.d
				});
			} 
			if (metadata.stories.l){
				stories.push({
					x: x,
					y: y+h/2,
					t: metadata.stories.l
				});
			} 
			if (metadata.stories.r){
				stories.push({
					x: x+w,
					y: y+h/2,
					t: metadata.stories.r
				});
			} 
			if (metadata.stories.c){
				stories.push({
					x: x+w/2,
					y: y+h/2,
					t: metadata.stories.c
				});
			}
		}
		return {
			gate: metadata.gate ? {x: x+w/2, y: y+h/2} : false,
			orb: orb,
			stones: stones,
			bgStones: bgStones,
			stories: stories
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
	let stories = {
		u: sectorInfo.indexOf("u"),
		d: sectorInfo.indexOf("d"),
		l: sectorInfo.indexOf("l"),
		r: sectorInfo.indexOf("r"),
		c: sectorInfo.indexOf("c"),
	};
	for (let d in stories){
		stories[d] = stories[d] == -1 ? false : CLUES[sectorInfo.charAt(stories[d]+1)];
	}
	return Object.assign({}, baseData, 
		{ stories: stories, u: sectorInfo.indexOf("u") != -1, d: sectorInfo.indexOf("d") != -1,
		  l: sectorInfo.indexOf("l") != -1, r: sectorInfo.indexOf("r") != -1,
		  gem: /([0-9])/g.exec(sectorInfo)?/([0-9])/g.exec(sectorInfo)[0]:false
		});
}