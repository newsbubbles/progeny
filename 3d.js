const easeLoc = 0.00008, 
	easeVel = 0.00022, 
	minDist = 10, 
	maxVel = 0.8;
const friction = 0.992;
const accel = 1.1, decel = 0.9;
const minRewardDist = 20, ratioPredator = 0.25;
const numPlayers = 90;
const continuousSpace = true;
const bouncyWalls = true;
var viewFPS = true;
var camHist = [], camHistLength = 90;
var chlr = 1 / camHistLength;
const epsilon_schedule = {
	0: 0.25,
	10000: 0.2,
	20000: 0.1,
	50000: 0.08,
	100000: 0.05
}
var wsize = 600;
var ws2 = wsize / 2;
const limits = {
	x: [-ws2, ws2],
	y: [0, wsize],
	z: [-ws2, ws2]
}

//const deathAudio = new Audio('dead.wav');

function drawLine(x1, y1, x2, y2){
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();
	ctx.closePath();
}

window.selected = 0;
function selectCell(){
	window.world.cells.forEach(function(cell, index){
		if (index == window.selected){
			window.cell = cell;
		}
	});
	showCell(window.cell, window.selected);
}

function stdDev(cell){
	var stats = cell.stats;
	var stot = {}, l = 0;
	var isPred = isPredator(cell);
	window.world.cells.forEach(function(cell, index){
		var isP = isPredator(cell);
		if (isP != isPred) return;
		var cst = cell.stats;
		for (k in cst){
			if (cst.hasOwnProperty(k)){
				v = cst[k];
				if (!stot.hasOwnProperty(k)) stot[k] = 0;
				stot[k] += v;
			}
		}
		l += 1;
	});
	//console.log(stot);
	var mean = {};
	for (k in stot){
		mean[k] = stot[k] / l;
	}
	//console.log(l);
	//console.log(mean);
	var sd = {};
	for (k in mean){
		sd[k] = cell.stats[k] - mean[k];
	}
	//console.log(sd);
	return sd;
}

function showCell(cell, index){
	var e = _.q('#menu');
	var ce = _.q('#cellprev');
	var t = _.q('#cellname');
	var s = _.q('#cellstats');
	var strP = '';
		ce.style.backgroundColor = colormap[index].hex;
	if (isPredator(cell)){
		ce.style.borderColor = '#f00';
		strP = 'predator';
	}else{
		ce.style.borderColor = '#0f0';
		strP = 'prey';
	}
	var cst = '';
	var sd = stdDev(cell);
	//console.log(sd);
	for (k in cell.stats){
		if (cell.stats.hasOwnProperty(k)){
			var sdev = sd[k] > 0 ? '+' + Math.round(sd[k]): Math.round(sd[k]);
			cst += '<div><label>' + k + '</label>: <span>' + cell.stats[k] + '</span> <i>(<span class="sdev">' + sdev + '</span>)</i></div>'
		}
	}
	t.innerHTML = 'Agent ' + index + ' <i>(' + strP + ')</i>';
	s.innerHTML = cst;
}

function isPredator(cell){
	return cell.data[4] < ratioPredator;
}

window.clipcell = function(cell){
	// location clipping
	if (continuousSpace){
		if (cell.data[0] < limits.x[0]) cell.data[0] = limits.x[1];
		if (cell.data[1] < limits.y[0]) cell.data[1] = limits.y[1];
		if (cell.data[0] > limits.x[1]) cell.data[0] = limits.x[0];
		if (cell.data[1] > limits.y[1]) cell.data[1] = limits.y[0];
		if (cell.data[7] < limits.z[0]) cell.data[7] = limits.z[1];
		if (cell.data[7] > limits.z[1]) cell.data[7] = limits.z[0];
	}else{
		var clipped = false, clx = false, cly = false, clz = false;
		if (cell.data[0] < limits.x[0]){ cell.data[0] = limits.x[0]; clipped = true; clx = true;}
		if (cell.data[1] < limits.y[0]){ cell.data[1] = limits.y[0]; clipped = true; cly = true;}
		if (cell.data[7] < limits.z[0]){ cell.data[7] = limits.z[0]; clipped = true; clz = true;}
		if (cell.data[0] > limits.x[1]){ cell.data[0] = limits.x[1]; clipped = true; clx = true;}
		if (cell.data[1] > limits.y[1]){ cell.data[1] = limits.y[1]; clipped = true; cly = true;}
		if (cell.data[7] > limits.z[1]){ cell.data[7] = limits.z[1]; clipped = true; clz = true;}
		// if hit a border, stop velocity or 
		if (clipped){
			if (bouncyWalls){
				if (clx) cell.data[2] = -cell.data[2];
				if (cly) cell.data[3] = -cell.data[3];
				if (clz) cell.data[8] = -cell.data[8];
			}else{
				cell.data[2] = 0;
				cell.data[3] = 0;
				cell.data[8] = 0;
			}
		}
	}
	// velocity clipping
	if (cell.data[2] > maxVel) cell.data[2] = maxVel;
	if (cell.data[2] < -maxVel) cell.data[2] = -maxVel;
	if (cell.data[3] > maxVel) cell.data[3] = maxVel;
	if (cell.data[3] < -maxVel) cell.data[3] = -maxVel;
	if (cell.data[8] > maxVel) cell.data[8] = maxVel;
	if (cell.data[8] < -maxVel) cell.data[8] = -maxVel;
};

function locDiff(v1, v2){
	return [v2[0] - v1[0], v2[1] - v1[1], v2[7] - v1[7]];
}
function dist(v1, v2){
	var d = locDiff(v1, v2);
	return Math.sqrt(Math.abs(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]));
}
function velDiff(v1, v2){
	return [v2[2] - v1[2], v2[3] - v1[3], v2[8] - v1[8]];
}
function vecMult(v, m){
	return [v[0] * m, v[1] * m, v[2] * m];
}
function vecNorm(v, n){
	var m = v[2] > v[1] ? v[2]: v[0] > v[1] ? v[0]: v[1];
	return [v[0] / m, v[1] / m, v[2] / m];
}

function getCamLoc(loc){
	camHist.push(loc);
	if (camHist.length > camHistLength) camHist.shift();
	var t = [0, 0, 0];
	for (var i = 0; i < camHist.length; i++){
		var v = camHist[i];
		t[0] += v[0];
		t[1] += v[1];
		t[2] += v[2];
	}
	return [t[0] * chlr, t[1] * chlr, t[2] * chlr];
}

function getCamRot(loc){
	if (camHist.length >= 1){
		var i = camHist.length - 1;
		return [
			loc[0] - camHist[i][0],
			loc[1] - camHist[i][1],
			loc[2] - camHist[i][2],
		];
	}
	return null;
}

// Load World and visualize it in the Canvas
window.addEventListener('load', function(e){
	//make sure canvas resizes

	/*function resizeCanvas(e){
		var el = canvas;
		el.width = window.innerWidth;
		el.height = window.innerHeight;
	}
	window.addEventListener('resize', resizeCanvas);
	resizeCanvas(null);*/
	window.addEventListener('keydown', function(e){
		var k = e.keyCode;
		if (k == 39 || k == 40) window.selected += 1;
		if (k == 37 || k == 38) window.selected -= 1;
		if (k == 32) window.viewFPS = !window.viewFPS;
		if (window.selected < 0) window.selected = numPlayers - 1;
		if (window.selected >= numPlayers) window.selected = 0;
		selectCell();
	});
	_.q('#cellprev').addEventListener('click', function(e){
		window.selected += 1;
		if (window.selected >= numPlayers) window.selected = 0;
		selectCell();
	});


	selectCell();
	setInterval(function(){showCell(window.cell, window.selected);}, 3000);

});


var conf = {
	numCells: numPlayers,
	dataWidth: 9,
	maxNeighbors: 10,
	neighborDistance: 500,
	brainConfig: {
		alpha: 0.01,
		epsilon: 0.1,
		num_hidden_units: 128,
		experience_add_every: 50,
		experience_size: 5000,
	},
	dimTitles: ['x', 'y', 'vx', 'vy', 'type', 'life', 'energy', 'z', 'vz', '', 'g'],
	initDimRange: [limits.x[1], limits.y[1], 0, 0, 1, 1, 1, limits.z[1], 0],
	initValues: [null, null, null, null, null, 1, 1],
	dimTreeIndices: [0, 1, 2, 3],
	stats: {
		'deaths': 0,
		'kills': 0,
		'score': 0,
	},
	init: function(world){
		/*world.cells.forEach(function(cell, index){
			var predator = cell.data[4] < ratioPredator;
			if (predator){
				cell.maxNeighbors = 5;
			}
		});*/
	},
	actions: [	/* This defines the action space the DQN chooses from */
		function(cell, neighbor){
			//Do Nothing...
		},
		function(cell, neighbor){
			//Move toward neighbor
			d = locDiff(cell.data, neighbor);
			e = vecMult(d, easeLoc * cell.data[6]);
			cell.agg(2, e[0]);
			cell.agg(3, e[1]);
			cell.agg(8, e[2]);
		},
		function(cell, neighbor){
			//Move away from neighbor
			d = locDiff(cell.data, neighbor);
			e = vecMult(d, easeLoc * cell.data[6]);
			cell.agg(2, -e[0]);
			cell.agg(3, -e[1]);
			cell.agg(8, -e[2]);
		},
		function(cell, neighbor){
			//Move in same direction as neighbor
			d = velDiff(cell.data, neighbor);
			e = vecMult(d, easeVel);
			cell.agg(2, e[0]);
			cell.agg(3, e[1]);
			cell.agg(8, e[2]);
		},
		function(cell, neighbor){
			//Move in opposite direction
			d = velDiff(cell.data, neighbor);
			e = vecMult(d, easeVel);
			cell.agg(2, -e[0]);
			cell.agg(3, -e[1]);
			cell.agg(8, -e[2]);
		},
		/* Non-relative movement */
		/*function(cell, neighbor){
			//Move up
			d = velDiff(cell.data, [0, 0, 0, -maxVel]);
			e = vecMult(d, easeLoc * cell.data[6]);
			cell.agg(2, e[0]);
			cell.agg(3, e[1]);
			cell.agg(8, e[2]);
		},
		function(cell, neighbor){
			//Move down
			d = velDiff(cell.data, [0, 0, 0, +maxVel]);
			e = vecMult(d, easeLoc * cell.data[6]);
			cell.agg(2, e[0]);
			cell.agg(3, e[1]);
			cell.agg(8, e[2]);
		},
		function(cell, neighbor){
			//Move left
			d = velDiff(cell.data, [0, 0, -maxVel, 0]);
			e = vecMult(d, easeLoc * cell.data[6]);
			cell.agg(2, e[0]);
			cell.agg(3, e[1]);
			cell.agg(8, e[2]);
		},
		function(cell, neighbor){
			//Move right
			d = velDiff(cell.data, [0, 0, +maxVel, 0]);
			e = vecMult(d, easeLoc * cell.data[6]);
			cell.agg(2, e[0]);
			cell.agg(3, e[1]);
			cell.agg(8, e[2]);
		},*/
		/*function(cell){
			//Accelerate
			cell.mult(2, accel);
			cell.mult(3, accel);
		},
		function(cell){
			//Decelerate
			cell.mult(2, decel);
			cell.mult(3, decel);
		},*/
	],
	cellStep: function(cell){
		// This happens after cell walks through neighbors

		// Perform epsilon schedule
		if (cell.world.frame % 1000 == 0){
			if (epsilon_schedule.hasOwnProperty(cell.world.frame)){
				cell.brain.epsilon = epsilon_schedule[cell.world.frame];
			}
		}

		//use the data[2] and data[3] as velocity vector for data[0] and data[1]
		cell.agg(0, cell.data[2]);
		cell.agg(1, cell.data[3]);
		cell.agg(7, cell.data[8]);

		//multiply velocity times global friction coefficient
		cell.mult(2, friction);
		cell.mult(3, friction);
		cell.mult(8, friction);
		//cell.data[3] += 0.1;

		window.clipcell(cell);

		cell.object.position.x = cell.data[0];
		cell.object.position.y = cell.data[1];
		cell.object.position.z = cell.data[7];

		if (cell == window.cell && viewFPS){
			var nx = cell.object.position.x - cell.data[2] * 2,
				ny = cell.object.position.y - cell.data[3] * 5,
				nz = cell.object.position.z - cell.data[8] * 24;
			var cl = getCamLoc([nx, ny, nz]);
			var cr = getCamRot(cl);
			camera.position.x = cl[0];
			camera.position.y = cl[1];
			camera.position.z = cl[2];
			if (cr != null){
				var axis = new THREE.Vector3(0, 0, 1);
				var dv = new THREE.Vector3(cr[0], cr[1], cr[2]);
				camera.quaternion.setFromUnitVectors(axis, dv.clone().normalize());
			}else{
				var axis = new THREE.Vector3(0, 0, -1);
				var dv = new THREE.Vector3(cell.data[2], cell.data[3], cell.data[8]);
				camera.quaternion.setFromUnitVectors(axis, dv.clone().normalize());				
			}
		}
	},
	cellReward: function(cell, neighbor){
		// Find 2D distance from neighbor (first two dimensions)
		d = dist(cell.data, neighbor);
		// Figure out what "team" cell is on and what neighbor is.
		var cp = cell.data[4] < ratioPredator, 
			np = neighbor[4] < ratioPredator;
		var chase = cp && !np, 
			run = !cp && np, 
			team = cp && np || !cp && !np;
		//console.log(d, minDist);
		if (d > 0 && d < minDist){
			// If the cell is "hit"
			//console.log('hit', run, chase, team);
			if (run){
				// If Prey, lose life, or die if life is < 0
				cell.data[5] -= 0.1;
				//console.log('hit');
				if (cell.data[5] <= 0.0){ // DIE FOOL!
					cell.data[0] = Math.random() * limits.x[1];
					cell.data[1] = Math.random() * limits.y[1];
					cell.data[7] = Math.random() * limits.z[1];
					cell.data[2] = 0;
					cell.data[3] = 0;
					cell.data[8] = 0;
					cell.data[5] = 1.0;
					cell.count('deaths');
					cell.count('score', -100);
					return -100.0;
				}
			}
			if (chase){
				// give a big reward if cell is predator and prey is dead (eaten)
				if (neighbor[5] <= 0.1){
					//console.log('KILL!');
					cell.count('kills');
					cell.count('score', 100);
					return 100.0;
				}
			}
			if (team && !cp){
				cell.data[5] += 0.025;
				if (cell.data[5] > 1) cell.data[5] = 1;
			}
			points = chase ? 1.0: run ? -2.0: team && !cp ? 2.0: 0.0;
			cell.count('score', points);
			return points;
		}
		if (team && !cp && d < minRewardDist && d > 0){
			cell.count('score');
			return 1.0;
		}
	},
	interval: 0,
	draw: function(world){
		/*ctx.clearRect(0, 0, canvas.width, canvas.height);
		world.cells.forEach(function(cell, index){
			var predator = cell.data[4] < ratioPredator;
			var x = Math.round(cell.data[0]);
			var y = Math.round(cell.data[1]);
			var r = (predator ? 8: 5);
			var rr = r * 2;
			var ir = r * cell.data[5], irr = rr * cell.data[5];
			if (index == window.selected){
				ctx.strokeStyle = '#999';
				ctx.lineWidth = 0.5;
				drawLine(x, 0, x, canvas.height);
				drawLine(0, y, canvas.width, y);
				ctx.strokeStyle = '#ddd';
				for (var nn = 0; nn < cell.neighbors.length; nn++){
					var nv = cell.neighbors[nn];
					drawLine(x, y, nv[0].x, nv[0].y);
				}
			}
			ctx.fillStyle = window.colormap[index].hex;
			ctx.strokeStyle = predator ? '#f00': '#0f0';
			ctx.fillRect(x - ir, y - ir, irr, irr);
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.rect(x - r, y - r, rr, rr);
			ctx.stroke();
		});*/
	},
};

// Create world from configuration
window.world = new World(conf);

// Create the cells in the world
window.world.generate();
console.log(world.cells.origNode);

// Start the world, to stop use world.stop()
world.start();
