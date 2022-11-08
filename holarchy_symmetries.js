// A Demo of using a holarchy to draw shapes dynamically

// Configure World
const ease = 0.2;
const radialEase = 0.05;

var runIndex = 0;

function newRun(){
	var drawCol = HIDE.colormap[runIndex].hex;
	var conf = {
		interval: 0,
		numCells: 12,
		dataWidth: 2,
		dimTitles: ['x', 'y'],
		initDimRange: [5, 5],
		dimTreeIndices: [0, 1, 2, 3],
		levelRange: 3,
		maxAge: 0,
		stochasticUpdates: false,
		dynamicNeighborhood: false,
		data: {
			radius: 180,
		},
		stats: {

		},
		init: function(world){
			// lay out in a circle
			var r = world.data.radius;
			var pi2 = Math.PI * 2;
			var R = world.cells.count;
			var s = pi2 / R;
			world.cells.forEach(function(cell, index){
				var i = index * s;
				var x = Math.sin(i) * r;
				var y = Math.cos(i) * r;
				cell.data[0] = x;
				cell.data[1] = y;
			});
		},
		link: function(world){
			// form a 1D loop of world cells
			var m = [];
			var t = null;
			world.cells.forEach(function(cell, index){
				m.push(cell);
				if (t != null) cell.link(t);
				t = cell;
			});
			m[0].link(m[m.length - 1]);
		},
		actions: [	/* This defines the action space the DQN chooses from OR some vector function */
			function(cell, neighbor){
				// stay away from neighbor
				//console.log(cell, neighbor);
				/*var diff = _.diff(cell.data, neighbor.data);
				var d = 1 / _.vectDist(diff, 2);
				var v = _.mult(diff, 0.5 * d);
				var n = _.norm(v, ease);
				cell.agg(n);*/
			},
		],
		cellStep: function(cell){
			// stay away from parent within radius
			var r = cell.world.data.radius;
			//console.log(r);
			//console.log(cell, cell.world.head);
			//var center = [HIDE.screen.centerX, HIDE.screen.centerY];
			var df = _.diff(cell.data, cell.world.head != null ? cell.world.head.data: [0, 0]);
			var d = _.vectDist(df, 2);
			var dd = r / d;
			//console.log(r, df, d, dd);
			var v = _.mult(df, dd);
			var n = _.norm(v, radialEase);
			cell.agg(n);
		},
		draw: function(world){
			var center = [HIDE.screen.centerX, HIDE.screen.centerY];
			var parent = world.head;
			if (parent) 
				center = parent.data;
			else 
				ctx.clearRect(0, 0, canvas.width, canvas.height);

			ctx.strokeStyle = drawCol;
			var t = world.cells.lastNode.next.d;
			var irr = 10, ir = 5;
			ctx.fillStyle = 'red';
			//ctx.fillRect(center[0] - ir, center[1] - ir, irr, irr);
			world.cells.forEach(function(cell, index){
				ctx.strokeStyle = HIDE.colormap[index].hex;
				if (t != null){
					HIDE.util.drawLine(
						center[0] + t.data[0],
						center[1] + t.data[1],
						center[0] + cell.data[0],
						center[1] + cell.data[1]
					);
				}
				t = cell;			
			});
		},
		stop: newRun,
	};

	// Set as the HIDE world and start it
	HIDE.world = new World(conf);
	HIDE.world.generate();
	HIDE.world.start();

	runIndex++;
}

newRun();