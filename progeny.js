// progeny.js an n-dimensional cellular automata communication network

/*
	Progeny is about testing communicative theories in populations
	of cells which follow simple heterogenous/homogenous rule systems
	and are either grid-linked, nearest-n linked or both.
	the cells can also include DQNAgents which 

	This project is inspired by the idea of modular cell communication
	where instead of specifying the substances that cells communicate
	we have an infinite number of things that cells could communicate
	and we let the rule systems the cells follow generate an emergent
	behavior out of that.

	RNN version:
		Goal, reach a balance, given the resources available...
			to where each cell can survive the longest
		reward = age
		inputs: nearest n neighbors shared()
			shared(): the output of what the neighbor would share
				ie: location in each dimension shared
				fixed num of possible shared dimensions
				say 3 dims shared, but each one can be indexed [0, 1, 2]
				each dim has 
		outputs: for each n ([vector](_n))
			sharing policy

	Notes:
		Environment can have infinite possible frequencies or set pallette
			on infinite frequencies, new frequencies can be made
			through the conversion function
				additive
				subtractive
				divisive
		Global conversion functions for balancing the environment
			some function that defines how reactions in-cell
			between two different frequencies 
			with different concentrations of value
			turn into 
		In the end the functions in each cell should converge on
		Cells can be a static population, or have division rules
			usually on grid-linked it would be a static population
		Cells follow communicative rules
			1) send and receive message packets to neighbors
			2) infinite number of possible linear dimensions/frequencies (-Inf. <-> +Inf.)
			3) messages include certain signals on certain dimensions
			4) rule resolution focuses attention only on specific frequencies in the messages
			5) rules are functions that take (dims, values) and output a transform over this vectors
				the this vector transform only affects a given set of frequencies
			6) global energy within a system is finite
				when a message is sent, the amount of said energy is spent
			7) rules can be simple mathematical functions or pipes
				adding values of two frequencies of input together creating some value of a new frequency
				using a frequency to 
			8) each input frequency maps to some function chain
				if two inputs match to the same function chain
					both inputs are used as the arguments to that function
				function chains usually turn one or more frequencies
					into another frequency to be stored in the cell
			9) rules for when to communicate a frequency can be
				simple resistance/threshold rules
			10) Handling of waste
				if a given frequency has reached maximum value/limit
				if the cell simply discards this data
				it will be wasted or output from the cell
		Cells have two neighborhoods
			1) locally linked neighbors (the cross neighborhood)
			2) frequency similarity neighbors
				in a specific dimension of frequency
				some cells that are farther away may be connected to
				and communicated with
				This acts something like attention heads
			3) Cells may add or terminate relationships with neighbors
				can be based on similarity threshold
				can be based on grid distance threshold
				grid or non-grid setup
				random initalizations
	
	Things to consider:
		1) max memory size is calculated as:
			n * max_neighbors * max_dims * var_size
		2) the question: does higher n-d comms mean more defined/precise emergence phenomena?
		3) in visualization, how to compress n-dimensions into r, g, b colors
*/

// A utility function map under _ namespace
var _ = {
	has: function(map, key){
		return Object.hasOwn(map, key);
	},
	q: function(selector){
		return document.querySelector(selector);
	},
	f: function(i){
		switch(i){
		case 0:
			return new Add();
			break;
		case 1:
			return new Sub();
			break;
		case 2:
			return new Mult();
			break;
		case 3:
			return new Div();
			break;
		}
	},
	sample: function(amount, n, summate){
		var dims = null, use_dims = false;
		if (typeof summate === 'boolean'){
			summate = typeof summate === 'undefined' ? false: summate;
		}else{
			dims = summate;
			use_dims = true;
			summate = false;
		}
		// gives back list of `n` floats which randomly add up to `amount`
		var o = [], 
			nn = n - 1,
			r = amount / (n / 2);
		for (var i = 0; i < n; i++){
			if (summate){
				a = (i < nn) ? Math.random() * ((r < amount) ? r: amount): amount;
				amount -= a;
			}else{
				a = Math.random() * ((use_dims) ? dims[i]: amount);
			}
			o.push(a);
		}
		return o;
	},
	add: function(v1, v2){
		var l = v2.length, o = [];
		for (var i = 0; i < l; i++){
			o.push(v1[i] + v2[i]);
		}
		return o;
	},
	diff: function(v1, v2){
		var l = v2.length, o = [];
		for (var i = 0; i < l; i++){
			o.push(v2[i] - v1[i]);
		}
		return o;
	},
	mult: function(v1, t){
		//if (t > 1) console.log('HIGH T:', t);
		var l = v1.length, o = [];
		for (var i = 0; i < l; i++){
			o.push(v1[i] * t);
		}
		return o;
	},
	norm: function(v1, n){
		var l = v1.length, o = [], m = 0;
		for (var i = 0; i < l; i++){
			var a = Math.abs(v1[i]);
			m = a > m ? a: m;
		}
		if (m == 0) return v1;
		for (var i = 0; i < l; i++){
			o.push((v1[i] / m) * n);
		}
		return o;
	},
	avg: function(v1, v2){
		var l = v1.length, o = [];
		for (var i = 0; i < l; i++){
			o.push((v1[i] + v2[i]) * 0.5);
		}
		return o;
	},
	dist: function(v1, v2, max){
		if (typeof max === 'undefined') max = v1.length;
		d = _.diff(v1, v2);
		a = 0;
		for (var i = 0; i < d.length && i < max; i++){
			a += d[i] * d[i];
		}
		return Math.sqrt(Math.abs(a));
	},
	vectDist: function(d, max){
		var a = 0;
		for (var i = 0; i < d.length && i < max; i++){
			a += d[i] * d[i];
		}
		return Math.sqrt(a);
	},
	dist2d: function(v1, v2){
		d = _.diff(v1, v2);
		a = 0;
		for (var i = 0; i < d.length && i < 2; i++){
			a += d[i] * d[i];
		}
		return Math.sqrt(Math.abs(a));
	},
}

// Define the world and layout of the world
class World {
	constructor(config){
		this.config = config;
		this.head = config['head'] || null;
		this.level = config.hasOwnProperty('level') ? config['level']: 0;
		this.subWorld = config['subWorld'] || null;
		this.maxLinks = config['maxLinks'] || 4;
		this.dataWidth = config['dataWidth'] || 2;
		this.numCells = config['numCells'] || 10;
		this.initEnergy = config['initEnergy'] || 100;
		this.interval = config['interval'] || 10;
		this.initDimRange = config['initDimRange'] || null;
		this.initValues = config['initValues'] || null;
		this.dimTitles = config['dimTitles'] || null;
		this.dimTreeIndices = config['dimTreeIndices'] || null;
		this.dimVelConsume = config['dimVelConsume']
		this.neighborDistance = config['neighborDistance'] || null;
		this.cellStats = config['stats'] || null;
		this.stochasticUpdates = config['stochasticUpdates'] || false;
		this.dynamicNeighborhood = typeof config['dynamicNeighborhood'] !== 'undefined' ? config['dynamicNeighborhood']: true;
		this.maxNeighbors = config['maxNeighbors'] || 4;
		this.neighborDistance = config['neighborDistance'] || 300;
		this.useNeighbors = config['useNeighbors'] || (this.maxNeighbors > 0);
		this.actionPerNeighbor = typeof config['actionPerNeighbor'] !== 'undefined' ? config['actionPerNeighbor']: true;
		this.brainConfig = config['brainConfig'] || null;
		this.useDQNAgent = config.hasOwnProperty('brainConfig');
		this.proxyLearning = config['proxyLearning'] || true;
		this.maxAge = config['maxAge'] || 0;
		this.duplicateLevels = config['duplicateLevels'] || 0;
		this.skipBody = config['skipBody'] || 0;
		this.inlineDrawing = config.hasOwnProperty('inlineDrawing') ? config['inlineDrawing']: true;

		// world / body level parameters or data
		this.sharedData = config.hasOwnProperty('sharedData') ? config['sharedData']: false
		this.data = null;
		if (config.hasOwnProperty('data')){
			if (this.sharedData){
				this.data = config['data'];
			}else{
				this.data = JSON.parse(JSON.stringify(config['data']));
			}
		}

		//working vars
		this.session = null;
		this.cells = LL();
		this.elements = [];
		this.frame = 0;
		this.tree = null;
		this.startTime = Date.now();

		//callbacks
		this.onInit = config['init'] || null;
		this.onAddCell = config['cellAdd'] || null;
		this.onDraw = config['draw'] || null;
		this.onCellBeforeStep = config['cellBeforeStep'] || null;
		this.onCellStep = config['cellStep'] || null;
		this.onCalcReward = config['cellReward'] || null;
		this.onLinkCells = config['link'] || null;
		this.onStop = config['stop'] || null;

		//Duplicate the Levels if called for
		if (this.subWorld == null && this.duplicateLevels > 0){
			//config['duplicateLevels'] -= 1;
			this.subWorld = config;
		}
		
		//Define the action space for RL
		//	neighbor is nearest neighbor result
		this.actionSpace = config['actions'] || [];
		//Define rule space for non-RL
		//  neigborhood
		this.ruleSpace = config['rules'] || [];
	}

	initMap(){
		//k-dTree needs this map for nearest neighbor function
		//problem was that was using an array instead
		//replaced by link callback, BUT could in the future use conv kernels
	}

	init(){
		if (this.onInit != null) this.onInit(this);
	}

	createEnv(){
		// numStates = n * 2
		// numActions = []
		const _n = this.actionPerNeighbor ? this.dataWidth: this.maxLinks * this.dataWidth;
		const _m = this.actionSpace.length
		this.env = {};
		this.env.getNumStates = function(){ return _n; }
		this.env.getMaxNumActions = function(){ return _m; }
	}

	createElements(){
		// randomly populate the elemental dimension indices of this system
		// eventually this will use Global Dimensional Index
		// and will be specifiable by holarchs
		for (var i = 0; i < this.dataWidth; i++){
			this.elements.push(Math.round(Math.random() * 65536) - 32768);
		}
	}

	add(data){
		var conf = this.getCellConf();
		var c = new Cell(conf, data);
		this.cells.push(c);
		if (this.onAddCell != null){
			this.onAddCell(this, c);
		}
		this.relink();
		return c;
	}

	shift(){
		this.cells.shift();
		this.relink();
	}

	getCellConf(world){
		if (typeof world === 'undefined') world = this;
		var conf = {
			world: world,
			subWorld: world.subWorld,
			env: world.env,
			dim: world.dataWidth,
			keys: world.dimTitles,
			beforeStep: world.onCellBeforeStep,
			afterStep: world.onCellStep,
			reward: world.onCalcReward,
			stats: world.cellStats,
			useDQNAgent: world.useDQNAgent,
			brain: world.brainConfig,
			neighborDistance: world.neighborDistance,
			maxNeighbors: world.maxNeighbors,
			dynamicNeighborhood: world.dynamicNeighborhood,
			useNeighbors: world.useNeighbors,
			actionPerNeighbor: world.actionPerNeighbor,
			consumers: world.dimVelConsume,
		};
		return conf;
	}

	generate(){
		// Layout initial cells
		this.createEnv();
		if (this.elements.length == 0) 
			this.createElements();
		var conf = this.getCellConf();
		//console.log(conf);
		var use_dr = (this.initDimRange != null) ? this.initDimRange: false;
		var use_iv = this.initValues != null
		for (var i = 0; i < this.numCells; i++){
			var data = _.sample(this.initEnergy, this.dataWidth, use_dr);
			if (use_iv){ 	// Override if initValues are given
				for (var _i = 0; _i < this.initValues.length; _i++){
					var _v = this.initValues[_i];
					if (_v != null) data[_i] = _v;
				}
			}
			var cell = new Cell(conf, data);
			cell.index = i;
			this.cells.push(cell);
		}
		if (this.subWorld != null){
			this.cells.forEach(function(cell, index){
				console.log(index, cell.world.skipBody, index % cell.world.skipBody);
				//if (index % cell.world.skipBody == 0)
					cell.generateBody();
			});
		}
		if (this.onLinkCells != null) this.onLinkCells(this);
	}

	relink(){
		this.cells.forEach(function(cell, index){
			cell.neighbors = [];
		});
		if (this.onLinkCells != null) this.onLinkCells(this);
	}

	step(){
		var cellArr = [];
		//console.log('frame ' + this.frame);
		const dw = this.dataWidth;
		const dt = this.dimTitles;
		const su = this.stochasticUpdates;
		if (this.dynamicNeighborhood){
			this.cells.forEach(function(cell, index){
				var ca = {};
				for (var ci = 0; ci < dw; ci++){
					ca[dt[ci]] = cell.data[ci];
				}
				cellArr.push(ca);
			});
			this.tree = new kdTree(cellArr, _.dist, this.dimTitles);
		}
		this.cells.forEach(function(cell, index){
			var skip = su ? Math.random() < 0.5: false;
			if (skip){
				//console.log('skip');
			}
			cell.step(skip);
		});
		// This needs to be placed perhaps on its own own thread, just accessed.
		// Inline drawing means L(max(n)) is first 
		if (this.inlineDrawing){
			if (this.onDraw != null){
				this.onDraw(this);
			}
		}
		if (this.proxyLearning) this.learnProxy();
		this.frame += 1;
		if (this.frame >= this.maxAge && this.maxAge > 0) this.stop();
	}

	drawAll(){
		// Draws the entire branch of worlds trunk first
		if (this.onDraw != null){
			this.onDraw(this);
		}
		this.cells.forEach(function(cell, index){
			if (cell.hasBody()){
				cell.body.drawAll();
			}
		});
	}

	getState(){
		// returns a vector with ALL cell states
		var state = [];
		this.cells.forEach(function(cell, index){
			state.push(...cell.data);
		});
		return state;
	}

	learnProxy(){
		// Proxy learner learns from the state vector of all cells
		var state = this.getState();

	}

	start(){
		console.log('world started');
		this.init();
		this.session = setInterval(function(){ HIDE.world.step(); }, this.interval);
	}

	stop(){
		console.log('world stopped.');
		clearInterval(this.session);
		this.session = null;
		if (this.onStop != null) this.onStop(this);
	}

	getFPS(){
		var tn = Date.now();
		var e = (tn - this.startTime) / 1000;
		return this.frame / e;
	}

	getSize(){
		var s = 1;
		this.cells.forEach(function(cell, index){
			if (cell.hasBody()){
				s += cell.body.getSize();
			}else{
				s += 1;
			}
		});
		return s;
	}

	hasHead(){
		return this.head != null;
	}

	_inspect(func){
		// if a function is passed, o.f is output as return value, world as input
		var o = {
			level: this.level,
			head: this.hasHead() ? this.head.get(): null,
			parameters: this.data,
			paramShared: this.sharedData,
			duplicate: this.duplicateLevels,
			count: this.cells.count,
		};
		if (typeof func === 'function'){
			func(this, o);
		}
		o.children = [];
		return o;
	}

	inspect(func){
		// Show the structure / branch schemata
		var v = this._inspect(func);
		if (v.count > 0){
			this.cells.forEach(function(cell, index){
				if (cell.hasBody()){
					v.children.push(cell.body.inspect(func));
				}
			});
		}
		return v;
	}

	query(data, values){
		// data is the data to be selected
		// values are cell matching conditions
		// values can be null, specific value, function, or a 2 item array for range
		var o = [];
		var noval = (typeof values === 'undefined');
		this.cells.forEach(function(cell, index){
			var dl = data.length;
			var matches = [], mnum = 0;
			var dout = [];
			for (var di = 0; di < dl; di++){
				var d = data[di], c = values[di];
				var v = cell.data[d];
				var match = false;
				if (c == null || noval) match = true;
				else if (typeof c === 'object') match = c.length == 2 ? v >= c[0] && v < c[1]: false;
				else if (typeof c === 'function') match = c(v);
				else match = v == c;
				if (match) mnum += 1;
				matches.push(match);
				dout.push(v);
			}
			if (mnum > 0) o.push([index, dout, cell]);
		});
		return o;
	}

	pass(func, levels){
		// Passes any per-cell function down through all sub-worlds
		// Levels should be an array of bool if func should run on relative level
		// If no levels exist, pass through to the bottom
		// 	if levels exist: but len of levels is less than holarchy depth
		//		stop if levels[-1] is false, run until bottom if true
		var undef = typeof levels === 'undefined';
		this.cells.forEach(function(cell, index){
			var l0 = !undef ? levels.length > 0 ? levels[0]: null: null;
			if (l0 != null || undef) 
				func(cell, index);
			if (cell.hasBody()){
				cell.body.pass(func, levels);
			}
		});
	}

	fetch(address, o){
		// address: an array of cell indices ie: [0, 2, 5, 1, 0]
		// returns: a [0, ... n] vector/edge of cells a said indices
		var o = o || [], l = 0;
		this.cells.forEach(function(cell, index){
			if (index == address[0]){
				l = cell.world.level;
				o.push(cell);
				if (cell.hasBody()){
					var r = cell.body.fetch(address.slice(1), o);
				}
			}
		});
		return {
			address: address.slice(0, o.length),
			cells: o,
		};
	}
}


class Cell {

	constructor(config, data){
		//World
		this.index = config['index'] || 0;
		// points to actual parent world
		this.world = config['world'] || null;
		// subWorld points to a configuration to generate a world for the body of the cell
		//  it can be iterative in the idea that the config for subWorld may also include subWorld
		this.subWorld = config.hasOwnProperty('subWorld') ? config['subWorld']: null;
		// body points to the actual generated subWorld that is the world of the cells generated wherein
		//  if body is given by config, 
		this.body = config.hasOwnProperty('body') ? config['body']: null;

		//Agent
		this.useDQNAgent = config['useDQNAgent'] || config['DQNAgent'] || config['brain'];
		this.brain = this.useDQNAgent ? config['DQNAgent'] || new RL.DQNAgent(config['env'], config['brain'] || { alpha: 0.01}): null;

		//Neighbors links
		this.useNeighbors = config['useNeighbors'] || true;
		this.actionPerNeighbor = typeof config['actionPerNeighbor'] !== 'undefined' ? config['actionPerNeighbor']: true;
		this.neighbors = []

		//Configuration of cell limits like maxDims, etc.
		this.config = config;
		this.dim = config['dim'] || 10;
		this.maxNeighbors = config['maxNeighbors'] || 4;
		this.neighborDistance = config['neighborDistance'] || 300;
		this.dynamicNeighborhood = typeof config['dynamicNeighborhood'] !== 'undefined' ? config['dynamicNeighborhood']: true;
		this.shape = [this.dim, this.maxNeighbors];
		this.size = this.dim * this.maxNeighbors;

		//Stats
		this.stats = null;
		if (config.hasOwnProperty('stats')){
			this.stats = Object.assign({}, config['stats']);
		}

		//Live cell data (state)
		//	a map of vectors that gives amp/freq
		//  TODO: change so that arrays (data, velocities, init range, init values) becomes an array of maps 
		this.frame = 0;
		this.keys = config['keys'] || [];
		this.data = (typeof data === 'undefined') ? []: data;
		this.velocities = config.velocities || new Array(data.length).fill(0);
		this.consumers = config.consumers || new Array(data.length).fill(0);
		this.dataMap = config['map'] || {};
		this.learning = true;
		this.initMap();

		//Callbacks
		this._eachNeighbor = config['eachNeighbor'] || null;
		this._beforeStep = config['beforeStep'] || null;
		this._afterStep = config['afterStep'] || null;
		this._calcReward = config['reward'] || null;

		//Body instantiation
		if (this.body == null) this.initBody();
	}

	initMap(){
		for (var i = 0; i < this.data.length; i++){
			var v = this.data[i];
			var k = this.keys[i];
			this.dataMap[k] = v;
		}
	}

	hasBody(){
		return this.body != null;
	}

	initBody(){
		// CAUTION: Performs world init in depth-first order
		// 	this can lead to :( ... reference looping? yeah something like that
		//  uses reflection basically
		if (this.subWorld){
			this.subWorld.head = this;
			this.subWorld.level = this.world.level + 1;
			//if (this.subWorld.duplicateLevels > 0)
			this.subWorld.duplicateLevels = this.world.duplicateLevels - 1;
			this.body = new World(this.subWorld);

		}
	}

	generateBody(){
		if (this.hasBody()){
			this.body.generate();
			this.body.init();
		}
	}

	buffer(key, value){
		this.velocities[key] += value;
		this.consumers[key] = 1;
	}

	buff(key, value){
		this.buffer(key, value);
	}

	agg(key, value){
		if (typeof key === 'object'){
			for (var i = 0; i < key.length; i++){
				if (isNaN(key[i])){
					console.log(i, key[i]);
					this.world.stop();
					return;
				}
				this.velocities[i] += key[i];
			}
			return;
		}
		if (isNaN(value)){
			console.log(key, value);
			this.world.stop();
			return;
		}
		this.velocities[key] += value;
	}

	mult(key, value){
		this.data[key] *= value;
		this.dataMap[this.keys[key]] = this.data[key];
	}

	update(key, value){
		this.data[key] = value;
		this.dataMap[this.keys[key]] = value;
	}

	remap(m){
		var o = [];
		var a = this.world.dimTitles;
		for (var i = 0; i < a.length; i++){
			o.push(m[a[i]]);
		}
		return o;
	}

	get(){
		var o = {};
		var l = this.data.length;
		for (var i = 0; i < l; i++){
			o[this.world.dimTitles[i]] = this.data[i];
		}
		return o;
	}

	link(cell){
		this.neighbors.push(cell);
		cell.neighbors.push(this);
	}

	unlink(cell){
		this.neighbors.pop(cell);
	}

	copyBrain(cell){
		this.brain.fromJSON(cell.brain.toJSON());
	}

	shareBrain(cell){
		this.brain = cell.brain;
	}

	distance(neighbor){
		var o = [], l = neighbor.data.length;
		for (var i = 0; i < l; i++){
			o.append(neighbor.data[i] - this.data[i]);
		}
		return o;
	}

	step(skip){
		//take an action, s = vector of max_n * 2
		//change s from concat n.data to only concat shared data
		this.beforeStep();
		if (this.hasBody()){
			this.body.step();
		}
		if (!skip){
			// Rule following first if any
			if (this.hasRules() && this.useNeighbors){
				// Non-DQN agent cell step per neighbor
				var l = this.neighbors.length;
				if (this.dynamicNeighborhood){
					this.neighbors = this.world.tree.nearest(this.dataMap, this.maxNeighbors, this.neighborDistance);
					l = this.neighbors.length;
				}
				if (l == 0) return;
				for (var i = 0; i < l; i++){
					var n = this.neighbors[i];
					//if (this.dynamicNeighborhood && n[1] == 0) continue;
					var m = this.dynamicNeighborhood ? this.remap(n[0]): n;
					this.performRule(0, m, i);
				}
			}
			// Agent based actions if any
			if (this.useDQNAgent && this.hasActions()){
				if (this.useNeighbors){
					var l = this.neighbors.length;
					if (this.dynamicNeighborhood){
						this.neighbors = this.world.tree.nearest(this.dataMap, this.maxNeighbors, this.neighborDistance);
						l = this.neighbors.length;
					}
					if (l == 0) return;
					var s = this.data;

					//For EACH NEIGHBOR
					if (this.actionPerNeighbor){
						for (var i = 0; i < l; i++){
							var n = this.neighbors[i];
							//if (this.dynamicNeighborhood && n[1] == 0) continue;
							var m = this.dynamicNeighborhood ? this.remap(n[0]): n;
							var ss = _.diff(s, m);
							var action = this.brain.act(ss);
							//console.log(ss, action, n);

							this.performAction(action, m, i);

							// calculate reward from this interaction?
							// or async calculation of reward on message reception?
							//console.log(this.data, n);
							if (this.learning){
								var reward = this.calculateReward(m);

								// learn from reward
								this.brain.learn(reward);
							}
						}
					}else{ // One vector representing diff of all neighbors
						var vec = new Array(this.size).fill(0);
						for (var i = 0; i < l; i++){
							var n = this.neighbors[i];
							var m = this.dynamicNeighborhood ? this.remap(n[0]): n;
							var ss = _.diff(s, m);
							for (var ii = 0; ii < this.dim; ii++){
								var iii = (i * this.dim) + ii;
								vec[iii] = ss[ii];
							}
						}
						var action = this.brain.act(vec);
						this.performAction(action);
						if (this.learning){
							var reward = this.calculateReward();
							this.brain.learn(reward);
						}
					}
				}else{
					var action = this.brain.act(this.world.state);
					this.performAction(action);
					if (this.learning){
						var reward = this.calculateReward();
						this.brain.learn(reward);
					}
				}
			}
		}else{
			//console.log('skipped');
		}
		this.afterStep();
	}

	hasWorld(){
		return this.world != null;
	}

	hasActions(){
		if (this.hasWorld()){
			return this.world.actionSpace.length > 0;
		}
	}

	hasRules(){
		if (this.hasWorld()){
			return this.world.ruleSpace.length > 0;
		}
	}

	performAction(action, neighbor, index){
		if (!this.hasWorld()) return 0.0;
		return this.world.actionSpace[action](this, neighbor, index);
	}

	performRule(rule, neighbor, index){
		if (!this.hasWorld()) return 0.0;
		return this.world.ruleSpace[rule](this, neighbor, index);
	}

	calculateReward(neighbor){
		//console.log(this.data, neighbor);
		if (this._calcReward != null)
			return this._calcReward(this, neighbor);
		else
			return 0;
	}

	count(stat, n){
		if (typeof n === 'undefined') n = 1;
		this.stats[stat] += n;
	}

	beforeStep(){
		if (this._beforeStep != null)
			this._beforeStep(this);
	}

	afterStep(){
		if (this._afterStep != null)
			this._afterStep(this);
		this.velUpdate();
	}

	velUpdate(){
		var l = this.data.length;
		for (var i = 0; i < l; i++){
			var v = this.velocities[i];
			if (v != 0){
				this.data[i] += v;
				if (this.consumers[i] == 1) this.velocities[i] = 0;
				this.dataMap[this.keys[i]] = this.data[i];
			}
		}
	}

	// Receive input and do something with it
	input(data){
		/* Things to consider
			what to use
			what to convert
			what to discard
		*/
	}

	// Only returns a list of what needs to be output to each specific neighbor
	get output(){
		var o = [];
		for (n in this.neighbors){
			o.push(this._output(neighbor));
		}
		return o;
	}

	_output(neighbor){
		// according to output mask, which dimensions should be filtered out
		// could do an inspect on the neighbor's output to see what would be gotten
		// and figure out if that is what is needed
	}

}

