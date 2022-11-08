/*
	HIDE (Holonic IDE)

	Holds any IDE helper functions plus some stats stuff and canvas utils
	Helps with navigating and displaying statistical information stored in holarchies
	Made for use with Progeny.js
*/

const canvas = document.querySelector('#world');
const ctx = canvas.getContext('2d');

const HIDE = {
	world: null,
	initalized: false,
	trunks: [],
	worlds: [],
	trace: false,
	reset: function(){
		HIDE.world = null;
		HIDE.trunks = [];
		HIDE.worlds = [];
	},
	select: function(world){
		if (!world.hasOwnProperty('_hide')){
			world._hide = {
				selected: 0,
				cell: null,
			};
		}
		HIDE.world = world;
	},
	push: function(world){
		world.inlineDrawing = false;
		HIDE.trunks.push(world);
		if (HIDE.world == null){
			HIDE.select(world);
			window.world = HIDE.world;
		}
	},
	next: function(){
		var cell = HIDE.world._hide.cell;
		if (cell != null){
			if (cell.hasBody()){
				HIDE.select(cell.body);
			}
		}
	},
	prev: function(){
		var world = HIDE.world;
		if (world != null){
			if (world.hasHead()){
				HIDE.select(world.head.world);
			}
		}
	},
	boot: function(world){
		HIDE.push(world);
		HIDE.world.generate();
		HIDE.world.start();
		HIDE.init();
	},
	init: function(){
		if (!HIDE.initalized){
			HIDE.initDrawThread();
			HIDE.initalized = true;
		}
	},
	colormap: colormap,
	autoResizeCanvas: true,
	q: function(selector){
		return document.querySelector(selector);
	},
	clearCanvas: function(){
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	},
	draw: function(){
		if (!HIDE.trace) HIDE.clearCanvas();
		for (var i = 0; i < HIDE.trunks.length; i++){
			HIDE.trunks[i].drawAll();
		}
	},
	initDrawThread: function(){
		HIDE._draw = setInterval(HIDE.draw, 10);
	},
	selectCell: function(){
		HIDE.world.cells.forEach(function(cell, index){
			if (index == HIDE.world._hide.selected){
				HIDE.world._hide.cell = cell;
			}
		});
		HIDE.showCell(HIDE.world._hide.cell, HIDE.world._hide.selected);
	},
	showCell: function(cell, index){
		var e = HIDE.q('#menu');
		var ce = HIDE.q('#cellprev');
		var t = HIDE.q('#cellname');
		var s = HIDE.q('#cellstats');
		ce.style.backgroundColor = HIDE.colormap[index].hex;
		var cst = '';
		var sd = HIDE.stats.stdDev(cell);
		//console.log(sd);
		for (k in cell.stats){
			if (cell.stats.hasOwnProperty(k)){
				var sdev = sd[k] > 0 ? '+' + Math.round(sd[k]): Math.round(sd[k]);
				cst += '<div><label>' + k + '</label>: <span>' + cell.stats[k] + '</span> <i>(<span class="sdev">' + sdev + '</span>)</i></div>'
			}
		}
		t.innerHTML = 'Agent ' + index + ' ';
		s.innerHTML = cst;
	},
	util: {
		drawLine: function(x1, y1, x2, y2){
			ctx.beginPath();
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			ctx.stroke();
			ctx.closePath();
		},
		keyMap: {
			39: function(){
				HIDE.world._hide.selected += 1;
				if (HIDE.world._hide.selected >= HIDE.world.cells.count) HIDE.world._hide.selected = 0;
			},
			37: function(){
				HIDE.world._hide.selected -= 1;
				if (HIDE.world._hide.selected < 0) HIDE.world._hide.selected = HIDE.world.cells.count - 1;
			},
			add: function(keyCode, f){
				var m = HIDE.util.keyMap[keyCode];
				if (m == null){
					HIDE.util.keyMap[keyCode] = [];
				}else{
					if (typeof m === 'function')
						HIDE.util.keyMap[keyCode] = [m];
				}
				HIDE.util.keyMap[keyCode].push(f);
			},
		},
		hasKeyMap: function(k){
			return HIDE.util.keyMap.hasOwnProperty(k);
		},
	},
	render: {
		filter: {
			level: 0,
		},
		opt: {

		},
	},
	screen: {
		set: function(width, height){
			HIDE.screen.width = width;
			HIDE.screen.height = height;
			HIDE.screen.centerX = width / 2;
			HIDE.screen.centerY = height / 2;
		},
		width: window.innerWidth,
		height: window.innerHeight,
		centerX: window.innerWidth / 2,
		centerY: window.innerHeight / 2,
	},
	stats: {
		stdDev: function(cell){
			var stats = cell.stats;
			var stot = {}, l = 0;
			cell.world.cells.forEach(function(cell, index){
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
			var mean = {};
			for (k in stot){
				mean[k] = stot[k] / l;
			}
			var sd = {};
			for (k in mean){
				sd[k] = cell.stats[k] - mean[k];
			}
			return sd;
		}
	},
};

window.HIDE = HIDE;
window.world = HIDE.world;

function resizeCanvas(e){
	var el = canvas;
	el.width = window.innerWidth;
	el.height = window.innerHeight;
	HIDE.screen.set(el.width, el.height);
}
resizeCanvas(null);

window.addEventListener('load', function(e){
	//make sure canvas resizes

	
	if (HIDE.autoResizeCanvas){
		window.addEventListener('resize', resizeCanvas);
	}
	resizeCanvas(null);

	window.addEventListener('keydown', function(e){
		var k = e.keyCode;
		if (HIDE.util.hasKeyMap(k)){
			m = HIDE.util.keyMap[k];
			// Assumes that m is a function or an array of functions
			if (typeof m === 'function'){
				m();
			}else{
				for (var i = 0; i < m.length; i++){
					m[i]();
				}
			}
		}
		HIDE.selectCell();
	});
	HIDE.q('#cellprev').addEventListener('click', function(e){
		HIDE.util.keyMap[39]();
		HIDE.selectCell();
	});


	HIDE.selectCell();
	setInterval(function(){HIDE.showCell(HIDE.world._hide.cell, HIDE.world._hide.selected);}, 3000);


});