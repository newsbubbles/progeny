var limits = null;
var rows = 5, cols = 4;
var msgSize = 8;
var numPlayers = rows * cols;
var cellWidth = 0, cellHeight = 0;
setWorldSize(255);

const epsilon_schedule = {
	0: 0.25,
	10000: 0.2,
	20000: 0.1,
	50000: 0.08,
	100000: 0.05
}

function setWorldSize(size){
	limits = {
		r: [0, size],
		g: [0, size],
		b: [0, size]
	};
}

function drawLine(x1, y1, x2, y2){
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();
	ctx.closePath();
}

window.selected = 0;
function selectCell(){
	HIDE.world.cells.forEach(function(cell, index){
		if (index == window.selected){
			window.cell = cell;
		}
	});
	showCell(window.cell, window.selected);
}

function stdDev(cell){
	var stats = cell.stats;
	var stot = {}, l = 0;
	window.world.cells.forEach(function(cell, index){
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
	var cst = '';
	var sd = stdDev(cell);
	//console.log(sd);
	for (k in cell.stats){
		if (cell.stats.hasOwnProperty(k)){
			var sdev = sd[k] > 0 ? '+' + Math.round(sd[k]): Math.round(sd[k]);
			cst += '<div><label>' + k + '</label>: <span>' + cell.stats[k] + '</span> <i>(<span class="sdev">' + sdev + '</span>)</i></div>'
		}
	}
	t.innerHTML = 'Agent ' + index;
	s.innerHTML = cst;
}

window.clipcell = function(cell){
	if (cell.data[0] > limits.r[1]) cell.data[0] = limits.r[1];
	if (cell.data[0] < limits.r[0]) cell.data[0] = limits.r[0];
	if (cell.data[1] > limits.g[1]) cell.data[1] = limits.g[1];
	if (cell.data[1] < limits.g[0]) cell.data[1] = limits.g[0];
	if (cell.data[2] > limits.b[1]) cell.data[2] = limits.b[1];
	if (cell.data[2] < limits.b[0]) cell.data[2] = limits.b[0];
};

function colDiff(v1, v2){
	return [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
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


// Load World and visualize it in the Canvas
window.addEventListener('load', function(e){
	//make sure canvas resizes

	function resizeCanvas(e){
		var el = canvas;
		el.width = window.innerWidth;
		el.height = window.innerHeight;
		cellWidth = el.width / cols;
		cellHeight = el.height / rows;
	}
	window.addEventListener('resize', resizeCanvas);
	resizeCanvas(null);
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
	dataWidth: 5,
	rows: rows,
	cols: cols,
	dynamicNeighborhood: false,
	brainConfig: {
		alpha: 0.01,
		epsilon: 0.1,
		num_hidden_units: 100,
		experience_add_every: 25,
		experience_size: 1000,
	},
	dimTitles: ['r', 'g', 'b', 'listen', 'talk'],
	initDimRange: [limits.r[1] / 3, limits.g[1] / 3, limits.b[1] / 2, 1, 1],
	stats: {
		'sent': 0,
		'received': 0,
		'spent': 0,
	},
	dynamicNeighborhood: false,
	link: function(world){
		// von neumann neighborhood
		var m = [];
		world.cells.forEach(function(cell){
			m.push(cell);
		});
		var cols = world.config['cols'];
		var rows = m.length / cols;
		console.log(world.cells.count, cols, rows);
		for (var i = 0; i < m.length; i++){
			var cell = m[i];
			var r = i % cols, rr = i + cols - 1, row = i / cols;
			var ln = r > 0 ? m[i - 1]: m[rr];
			var tov = i + (rows * (cols - 1));
			console.log(r, i - 1, rr, i - cols, tov);
			//console.log(ln);
			cell.link(ln);
			var tn = row > 1 ? m[i - cols]: m[tov];
			//console.log(tn);
			cell.link(tn);
		}
	},
	init: function(world){
		// Add message sending functions to cells
		world.cells.forEach(function(cell, index){
			cell.canTalk = function(){
				return this.data[4] > 0.5;
			};
			cell.canSend = function(key, amt){
				return this.data[key] + this.velocities[key] - amt >= 0;
			};
			cell.send = function(neighbor, message){
				//console.log(neighbor);
				if (this.canTalk())
					neighbor.receive(message, this);
			};
			cell.isListening = function(){
				return this.data[3] > 0.5;
			};
			cell.canReceive = function(key, amt){
				return this.data[key] + this.velocities[key] + amt <= 255;
			};
			cell.receive = function(message, cell){
				// add to the buffer data if listening is true
				if (this.isListening()){
					var receivable = false, sendable = false;
					if (message.hasOwnProperty('r')){
						receivable = this.canReceive(0, message.r);
						sendable = cell.canSend(0, message.r);
						if (receivable && sendable){
							this.buffer(0, message.r);
							cell.buffer(0, -message.r);
						}
					}
					if (message.hasOwnProperty('g')){ 
						receivable = this.canReceive(1, message.g);
						sendable = cell.canSend(1, message.g);
						if (receivable && sendable){
							this.buffer(1, message.g); 
							cell.buffer(1, -message.g);
						}
					}
					if (message.hasOwnProperty('b')){ 
						receivable = this.canReceive(2, message.b);
						sendable = cell.canSend(2, message.b);
						if (receivable && sendable){
							this.buffer(2, message.b); 
							cell.buffer(2, -message.b);
						}
					}
					if (receivable){
						cell.stats.sent += 1;
						this.stats.received += 1;
					}
				}
			};
		});
	},
	actions: [	/* This defines the action space the DQN chooses from */
		function(cell, neighbor){
			// Do nothing
		},
		function(cell, neighbor){
			// send a message to the neighbor with a little bit of 0th element if possible
			cell.send(neighbor, {r: msgSize});
		},
		function(cell, neighbor){
			// send a message to the neighbor with a little bit of 1th element if possible
			cell.send(neighbor, {g: msgSize});
		},
		function(cell, neighbor){
			// send a message to the neighbor with a little bit of 2th element if possible
			cell.send(neighbor, {b: msgSize});
		},
		function(cell, neighbor){
			// toggle listen mode true/false
			cell.data[3] = cell.data[3] < 1.0 ? 1.0: 0.0;
		},
		function(cell, neighbor){
			// toggle talk mode true/false
			cell.data[4] = cell.data[4] < 1.0 ? 1.0: 0.0;
		},
	],
	cellStep: function(cell){
		// This happens after cell walks through neighbors

		window.clipcell(cell);

	},
	cellReward: function(cell, neighbor){
		// only use with DQNAgent = true
		//var d = _.dist(cell.data, neighbor.data, 3);
		//return d < 5 ? -1: d >= 5 && d < 128 ? 1: 0;
		var d = colDiff(cell.data, neighbor.data);
		var g = d[1];
		var r = -cell.data[0];
		return (g + r) * 0.25;
	},
	interval: 0,
	draw: function(world){
		/*ctx.clearRect(0, 0, canvas.width, canvas.height);*/
		world.cells.forEach(function(cell, index){
			var r = index % cols, row = Math.floor(index / cols);
			var x = r * cellWidth;
			var y = row * cellHeight;
			if (index == window.selected){

			}
			ctx.fillStyle = 'rgb(' + 
				Math.floor(cell.data[0]) + ', ' +
				Math.floor(cell.data[1]) + ', ' +
				Math.floor(cell.data[2]) + ')';
			//window.colormap[index].hex;
			ctx.fillRect(x, y, cellWidth, cellHeight);
			//ctx.lineWidth = 1;
			//ctx.beginPath();
			//ctx.rect(x - r, y - r, rr, rr);
			//ctx.stroke();
		});
	},
};

// Create world from configuration
HIDE.boot(new World(conf));
