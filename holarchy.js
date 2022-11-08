// A Demo of using a holarchy to draw shapes dynamically

// Configure World
const ease = 0.1;
const radialEase = 0.2;

var runIndex = 0;

function addVertex(){
	var world = HIDE.world;
	var f = world.cells.origNode.d.data;
	var l = world.cells.lastNode.next.d.data;
	var a = _.avg(f, l);
	world.add(a);
}

function newRun(){
	var drawCol = HIDE.colormap[runIndex].hex;
	var conf = {
		interval: 0,
		numCells: 8,
		dataWidth: 2,
		dimTitles: ['x', 'y'],
		initDimRange: [5, 5],
		maxAge: 0,
		stochasticUpdates: false,
		dynamicNeighborhood: false,
		duplicateLevels: 2,
		data: {
			radius: 120,
			rotate: 0,
		},
		stats: {

		},
		init: function(world){
			// lay out in a circle
			//console.log('init', world.config['duplicateLevels']);
			var r = world.data.radius * 1.0;
			var pi2 = Math.PI * 2;
			var R = world.cells.count;
			var s = pi2 / R;
			var lx = Math.sin(-1) * r, ly = Math.cos(-1) * r;
			world.cells.forEach(function(cell, index){
				var i = index * s;
				var x = Math.sin(i) * r;
				var y = Math.cos(i) * r;
				cell.data[0] = x;
				cell.data[1] = -y;

				cell._lastDist = _.dist([x, y], [lx, ly], 2);

				lx = x;
				ly = y;
			});
			HIDE.worlds.push(world);
		},
		link: function(world){
			// form a 1D loop of world cells
			//console.log('link', world.config['duplicateLevels']);
			var m = [];
			var t = null;
			world.cells.forEach(function(cell, index){
				m.push(cell);
				if (t != null) cell.link(t);
				t = cell;
			});
			m[0].link(m[m.length - 1]);
		},
		cellAdd: function(world, cell){

		},
		actions: [	/* This defines the action space the DQN chooses from OR some vector function */
			function(cell, neighbor, index){
				// Get difference vector from neighbor
				var diff = _.diff(cell.data, neighbor.data);

				//If the world is rotating, move toward the proper neighbor
				if (cell.world.data.rotate > 0 && index == 0 || cell.world.data.rotate < 0 && index == 1){
					var m = _.mult(diff, -Math.abs(cell.world.data.rotate));
					cell.agg(m); 
				}

				// Try to make the same distance as other/last neighbor
				var d = _.vectDist(diff, 2);
				var r = 1 - (cell._lastDist / d);
				if (cell._lastDist != 0){
					var m = _.mult(diff, r * ease);
					cell.agg(m);
				}
				cell._lastDist = d;

			},
		],
		cellBeforeStep: function(cell){
			// stay away from parent within radius
			var r = cell.world.data.radius;
			var df = _.diff(cell.data, [0, 0]); // cell.world.head != null ? cell.world.head.data: [0, 0]);
			var d = _.vectDist(df, 2);
			var dd = (d == 0 ? 1: r / d) - 0;
			var u = _.mult(df, dd);
			var ud = _.diff(u, df);
			//console.log(r, df, d, dd, u, ud);
			//var v = _.mult(df, dd);
			var n = _.mult(ud, radialEase);
			cell.velocities = n;
		},
		draw: function(world){
			var center = [HIDE.screen.centerX, HIDE.screen.centerY];
			var parent = world.head;
			while (parent != null){
				center = _.add(center, parent.data);
				parent = parent.world.head;
			}

			ctx.strokeStyle = drawCol;
			var t = world.cells.lastNode.next.d;
			var irr = 10, ir = 5;
			world.cells.forEach(function(cell, index){
				if (t != null){
					// Radial lines
					ctx.strokeStyle = '#666';
					//if (!HIDE.trace) HIDE.util.drawLine(center[0], center[1], center[0] + cell.data[0], center[1] + cell.data[1]);
					
					// Circumference lines
					ctx.strokeStyle = HIDE.colormap[index].hex;
					HIDE.util.drawLine(
						center[0] + t.data[0],
						center[1] + t.data[1],
						center[0] + cell.data[0],
						center[1] + cell.data[1]
					);
					if (HIDE.world == world){
					if (HIDE.world._hide.selected == index && !HIDE.trace){
							ctx.beginPath();
							ctx.rect(center[0] + cell.data[0] - ir - 1, center[1] + cell.data[1] - ir - 1, irr + 2, irr + 2);
							ctx.stroke();
						}
					}
				}
				t = cell;			
			});
			
			// Red squared on body centers
			ctx.fillStyle = 'red';
			//ctx.fillRect(center[0] - ir, center[1] - ir, irr, irr);
		},
		//stop: newRun,
	};

	// Set as the HIDE world and start it
	HIDE.boot(new World(conf));

	runIndex++;
}

newRun();

// Some extra sloppy key mapping to be moved...

HIDE.util.keyMap.add(38, function(){
  HIDE.world._hide.cell.data[0] += 0;
  HIDE.world._hide.cell.data[1] += -20;
});

var _rrad = [80, 180, 180];
var _rrot = [0.025, 0.025, 0.025];

function getRands(){
	var rad = [];
	var rot = [];
	for (var i = 0; i < _rrad.length; i++){
		rad.push(Math.random() * _rrad[i]);
		rot.push((Math.random() * _rrot[i] * 2.0) - _rrot[i]);
	}
	return [rad, rot];
}

function beat(){
	HIDE.clearCanvas();
	var r = getRands();
	var rad = r[0], rot = r[1];
	world.data.radius = rad[0];
	world.data.rotate = rot[0];
	world.cells.forEach(function(cell, index){ 
		if (cell.hasBody()){
			cell.body.data.radius = rad[1];
			cell.body.data.rotate = rot[1];
			cell.body.cells.forEach(function(cell, index){
				if (cell.hasBody()){
					cell.body.data.radius = rad[2];
					cell.body.data.rotate = rot[2];
				}
			});
		}
	});
}

// Idea DanceMandala.  this fail case would do it, can be updated to fixed version with same effect
// controls: Tap, manual beat tapper as well, trace toggle, params: (radius, rotation), dance button (randomizes or given pattern on tempo)
//	speed up, slow down, pause
// MIDI mapping capability for MIDI controllers of all controls
function dance(tempo){
	if (typeof tempo === 'undefined') tempo = 130;
	var ms = Math.floor(60000 / tempo);
	//console.log(ms);
	clearInterval(window.dancer);
	window.dancer = setInterval(beat, ms);
	beat();
}

/*
	okay now whatch what happens when I turn up the level duplication

	at first when I was looking I was like wtf?

	becausee there is no ... difference from only 1 level, and you should see like way wider 
	of a shape and more complex... but there was this error I saw by running dance.

	what you see here is a fuckup...

	... had to do with the way I was drawing it!!! fixed the actual problem with holarchy
	... just now something with drawing things in the proper place is fucked up.
	... also going to make a drip-down function that bubbles down through the layers and hase a level span number
	... now that I figured out this problem, it was again having to do with pointers... 
				javascript had conf by reference, which is good, cause functions in conf
				but specifically the level count and duplicateLevels count was shared, so that caused the fuckup
				duplicateLevels now on Cell.generateBody() only decreases configs count based on the level from each cell as it is being generated
				this is an inline solution pretty much, and probably a local minima, but we shall see.

TODO: FIX DRAW TO RIGHT CENTERING!!!!
*/

// Custom inspect function that adds any sort of information from a world to the data argument
// This returns the output from HIDE.world.inspect() function
function _inspect(){
	return HIDE.world.inspect(function(world, data){
		var dt = 0;
		world.cells.forEach(function(cell, index){
			var dist = _.dist(cell.data, [0, 0]);
			dt += dist;
			console.log(dt, dist, cell.data);
		});
		data.avgDist = dt == 0 ? 0: dt / world.cells.count;
	});
}