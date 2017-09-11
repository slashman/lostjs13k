/* jshint node: true */
/* globals Voronoi */
'use strict';

const geo = require('./geo');
const rng = require('./rng');
const ca = require('./ca');

var rand = rng();

var voronoi = new Voronoi();

const SECTOR_SIZE = 3000;
const W = SECTOR_SIZE / 24;
const H = SECTOR_SIZE / 18;


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

const MAPS = [
"FFFFFF03F8E101C0C001D8C001D8C0031CC07FFFC041FFE151C3FF5380FFDF8383D90F80DB83830B80DFE3C3DFF9FFDFFF0FC0FFEFFF",
"FFEFFF398FC1018781011C800185C1458DEFFFFDEFFF8187FFE184000084000080FF0184FF0184FF01ECFF03EEFFFF87FF0780FF87FF",
"FFFFFFE1FF8FE1FF8FE11F8061308C7B708F40518DC05BFD00000000000040E7FB40C3C177C3C121E6C121C2EFE1C3C1E1E7C1FFFFFF",
"FFC1FFFFE383E1F783E1F783E1F783F9F7EBE1F701E18001030000030000E18001E1F701E1FFABFBFF81E1FAAB01C0FF63F5FFFFFFFF"
];

const STANDARD_COLORS = ["#001c33", "#002a4d", "#0e3f66"];

const SECTOR_INFO = [
	[ "FdrcF3", "Fdl",  "Cdr", "ClcE1",  "CdCr",   "GlBcOr", "ClPcA" ],
	[ "Fur",    "Fuld", "Cur", "Odlr",   "OudlR",  "Td" ],
	[ "",       "PuJr", "Rlr", "OudKlHr","OulrI",  "QudQl" ],
	[ "CcMr*",  "SlcLr","ClNr","Dul",    "VrcG4",  "Vul" ]
];

const LV = [
	"4422000",
	"442112",
	"033112",
	"666055"
]

const CLUES = {
	// Intro
	A: [
		"*You wake up to find yourself in an underwater cavern", 
		"*Where the heck are you? You need to find a way out.", 
		"*The uplink is broken, but the exploration light works",
		"*the engines and the drill are working as well.",
		"*(Press the arrow keys and Z to drill).",
	],
	P: [
		"*You hear a sweet voice in your head.", 
		"Hello. I know you can hear me!", 
		"I am the princess Melkaia of Asterion.",
		"Don't despair, I can help you return to your world.",
	],

	O: [
		"This is the gate of Atlantis, the only passage to the surface.",
		"It can be opened by using the four ancient orbs."
	],
	B: [
		"I can help you find the orbs, but I need your help too...",
		"I'm trapped in these cold depths... I want to return home too."
	],
	C: [
		"The areas beyond are full of dangerous beasts.",
		"Finding the orbs will grant you special powers to survive.",
		"There are two orbs nearby: one is at the Temple of Poseidon.",
		"To find it dive deeper and travel east.",
	],
	R: [
		"If you continue west you'll find the entrance to a cave",
		"Another orb was hidden there."
	],
	
	// Artifacts
	D: [
		"The orb of Verra Kera will let you emit deadly sonic booms",
		"they will crush any creature underwater",
		"*(Press Z to shoot a sonic beam)"
	],
	E: [
		"The orb of Gabrielle will repair your vessel,",
		"absorbing oxygen from dead lifeforms."
	],
	F: "The orb of Cosiaca will let you withstand extreme temperatures",
	G: [
		"The orb of Athena will strengten you, allowing to move",
		"against strong currents."
	],
		
	// Places
	H: [
		"The ruins of our great underwater city.",
		"The forces that contained the water are long gone.",
	],
	I: "Our great temple to Poseidon, the lord of the seas.",
	J: [
		"These used to be the very fertile farmlands,",
		"our people fed only with plants."
	],
	K: [
		"The darkness abyss, this area was cursed with eternal darkness.",
		"I am trapped in the area below, but you'll need",
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
		"You will need the Orb of Athena to make it through,"
	],
	L: "I can feel you are close... I'm so eager to meet you!",
	M: [
		"Thank you for bringing the orbs... you fool!",
		"I shall use them to drown your world in darkness!"
	],
};

const SECTOR_DATA = {
	// Farmland   Blob, Big Fish, Jelly 1, Jelly 2
	F: {cv: true, c:["#3B5323", "#526F35", "#636F57"], open: 20, ca: 0, rules: [],
	ec: "adfg"},
	// Cavern   Spider, Nautilus, Glider
	C: {cv: true, open: 50, ca: 1, rules: RULES.TIGHT_CAVE, ec: "bce"},
	// Gate     Nautilus, Glider, Big Fish
	G: {cv: true, open: 30, ca: 2, rules: RULES.OPEN_CAVE, gate: true, ec: "bcd"},
	// Open Caverns    Nautilus, Ball, Big Fish
	O: {cv: true, open: 20, ca: 2, rules: [], ec: "cdj"},
	// Temple (T and Q)    Jelly 1, Big Fish, Glider
	T: {s: 0, bg: "#1c0030", orb: {type: 2, x: 5*SECTOR_SIZE+20*W, y:SECTOR_SIZE+6*H, s: 'D'},
		ec: "bdf"},
	Q: {s: 1, bg: "#1c0030", ec: "bdf"},
	// City Ruins (R and P)    Jelly 2, Ball, Nautilus
	R: {s: 2, bg: "#001c33", ec: "cgj"},
	P: {s: 3, bg: "#001c33", ec: "cgj"},
	// Darkness abyss      Ball, Deep Fish, Blob, Spider
	D: {cv: true, c: ["#000"], open: 70, ca: 1, rules: RULES.OPEN_CAVE, ec: "aehj"},
	// Abyss of souls     Deep fish, Glider, Spider
	S: {cv: true, open: 80, ca: 1, rules: RULES.TIGHT_CAVE, cu: true, ec: "beh"},
	// Volcanic Rift      Glider, Jelly1, Nautilus
	V: {cv: true, c:["#fdcf58", "#f27d0c", "#800909", "#f07f13"], open: 70, ca: 1, rules: RULES.OPEN_CAVE, bu: true,
	ec:"bcf"},
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
			if (metadata.cv){ // Cave
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
			} else {
				s.type = 0; // Emptiness
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
		const bgStones = [];
		if (metadata.cv){
			const bgSites = [];
			for (var i = 0; i < 1450; i++){
			  bgSites.push({
			    x: rand.range(bbox.xl, bbox.xr),
			    y: rand.range(bbox.yt, bbox.yb)
			  });
			}
			diagram = voronoi.compute(bgSites, bbox);
			completeDiagram(diagram, false);
			diagram.cells.forEach(cell => {
				const site = cell.site;
			    site.type = rand.range(0,colors.length);
			    bgStones.push(cell.site);
			});
			//ca.run(rules, 1, bgStones, rand);
			bgStones.forEach(stone => stone.color = colors[stone.type]);
		}
		if (metadata.s != undefined){
			this.fillBlocks(metadata.s, stones, mx, my);
		}
		let orb = false;
		const stories = [];
		if (metadata.orb && !player.orbs[metadata.orb.type]){
			orb = {
				type: metadata.orb.type,
				x: metadata.orb.x,
				y: metadata.orb.y
			};
			if (metadata.orb.s){
				stories.push({
					x: orb.x,
					y: orb.y,
					t: CLUES[metadata.orb.s]
				});
			}
		}
		if (metadata.stories){ // TODO: Check if player already readed so they are not dupped
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
		return { //TODO: Object.assign metadata
			x:x,y:y,
			gate: metadata.gate ? {x: x+w/2, y: y+h/2} : false,
			orb: orb,
			stones: stones,
			bgStones: bgStones,
			stories: stories,
			bg: metadata.bg,
			bu: metadata.bu,
			cu: metadata.cu,
			bo: metadata.bo,
			lv: LV[my]?LV[my].charAt(mx)!=""?parseInt(LV[my].charAt(mx)):0:0,
			ec: metadata.ec
		};
	},
	fillBlocks: function(n,s,bx,by){
		bx *= SECTOR_SIZE;
		by *= SECTOR_SIZE;
		const map = MAPS[n];
		let index = 0;
		let chunk = map.substr(index, 2);
		const mask = [];
		while (chunk != ""){
			const n = parseInt(chunk , 16)
			mask.push([n&1,n&2,n&4,n&8,n&16,n&32,n&64,n&128]);
			index++;
			chunk = map.substr(index*2, 2);
		}
		mask.forEach((a,k)=>this.fillBlock(a,k,s,bx,by));
	},
	fillBlock: function(a,k,s,bx,by){
		let x = ((k % 3) * 8)*W;
		let y = Math.floor(k/3) * H;
		a.forEach((v,k)=>{
			if (!v)
				return;
			s.push({
				x: bx+x+k*W,
				y: by+y,
				vs: [
					[bx+x+k*W,by+y],
					[bx+x+(k+1)*W,by+y],
					[bx+x+(k+1)*W,by+y+H],
					[bx+x+k*W,by+y+H]
				]
			});
		});
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
		// TEst
		/*
		stories[d] = [];
		for (var k in CLUES){
			if (typeof CLUES[k] === 'string'){
				stories[d].push(CLUES[k]);
			} else {
				stories[d] = stories[d].concat(CLUES[k])
			}
		}*/
	}
	let orb = baseData.orb ? baseData.orb : /([0-9])/g.exec(sectorInfo)?{
		type: /([0-9])/g.exec(sectorInfo)[0],
		x: (mx + 0.5) * SECTOR_SIZE,
		y: (my + 0.5) * SECTOR_SIZE
	}:false;
	return Object.assign({}, baseData, 
		{ stories: stories, u: sectorInfo.indexOf("u") != -1, d: sectorInfo.indexOf("d") != -1,
		  l: sectorInfo.indexOf("l") != -1, r: sectorInfo.indexOf("r") != -1,
		  orb: orb,
		  bo: sectorInfo.indexOf("*") != -1
		});
}

//TODO: Unit test for all ecosystems
