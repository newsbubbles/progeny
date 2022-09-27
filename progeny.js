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
	diff: function(v1, v2){
		var l = v2.length, o = [];
		for (var i = 0; i < l; i++){
			o.push(v2[i] - v1[i]);
		}
		return o;
	},
}

// Define the world and layout of the world
class World {
	constructor(config){
		this.config = config;
		this.rows = config['rows'] || 80;
		this.cols = config['cols'] || 60;
		this.size = this.rows * this.cols;
		this.maxLinks = config['maxLinks'] || 4;
		this.dataWidth = config['dataWidth'] || 2;
		this.numCells = config['numCells'] || 10;
		this.initEnergy = config['initEnergy'] || 100;
		this.interval = config['interval'] || 10;
		this.initDimRange = config['initDimRange'] || null;

		//working vars
		this.session = null;
		this.cells = LL();
		this.elements = [];
		this.frame = 0;

		//callbacks
		this.onDraw = config['draw'] || null;
		this.onCellStep = config['cellStep'] || null;
		this.onCalcReward = config['cellReward'] || null;
		
		//Define the action space (acts on a cell or neighbor)
		this.actionSpace = config['actions'] || [
			function(cell, neighbor){
				//Do Nothing...
				cell.data[0] -= 1;
			},
			function(cell, neighbor){
				//Send Neighbor a message
				cell.data[0] += 1;
			},
			function(cell, neighbor){
				//Do Nothing...
				cell.data[1] += 1;
			},
			function(cell, neighbor){
				//Do Nothing...
				cell.data[1] -= 1;
			},
		];
	}

	createEnv(){
		// numStates = n * 2
		// numActions = []
		const _n = this.dataWidth; //this.maxLinks * this.dataWidth;
		const _m = this.actionSpace.length
		this.env = {};
		this.env.getNumStates = function(){ return _n; }
		this.env.getMaxNumActions = function(){ return _m; }
	}

	createElements(){
		for (var i = 0; i < this.dataWidth; i++){
			this.elements.push(Math.round(Math.random() * 65536) - 32768);
		}
	}

	generate(){
		// Layout initial cells
		this.createEnv();
		if (this.elements.length == 0) 
			this.createElements();
		var conf = {
			'world': this,
			'env': this.env,
			'dim': this.dataWidth,
			'keys': this.elements,
			'afterStep': this.onCellStep,
			'reward': this.onCalcReward,
		};
		console.log(conf);
		var use_dr = (this.initDimRange != null) ? this.initDimRange: false;
		for (var i = 0; i < this.numCells; i++){
			var data = _.sample(this.initEnergy, this.dataWidth, use_dr);
			var cell = new Cell(conf, data);

			//TODO: Replace simple static linking like this
			if (this.cells.count > 0)
				cell.link(this.cells.node.d);

			this.cells.push(cell);
		}
	}

	step(){
		var cell;
		this.cells.forEach(function(cell, index){
			cell.step();
		});
		if (this.onDraw != null){
			this.onDraw(this);
		}
		this.frame += 1;
	}

	start(){
		this.session = setInterval(function(){window.world.step()}, this.interval);
	}

	stop(){
		clearInterval(this.session);
		this.session = null;
	}

	layout(type){
		var conf = this.config;

	}
}


class Cell {

	constructor(config, data){
		//World
		this.world = config['world'] || null;

		//Agent
		this.brain = new RL.DQNAgent(config['env'], config['spec'] || { alpha: 0.01});

		//Neighbors links
		this.neighbors = []

		//Configuration of cell limits like maxDims, etc.
		this.config = config;
		this.dim = config['dim'] || 10;
		this.maxNeighbors = config['maxNeighbors'] || 4;
		this.shape = [this.dim, this.maxNeighbors];
		this.size = this.dim * this.maxNeighbors;

		//Live cell data (state)
		//	a map of vectors that gives amp/freq
		this.keys = config['keys'] || [];
		this.data = (typeof data === 'undefined') ? {}: data;

		//Callbacks
		this._afterStep = config['afterStep'] || null;
		this._calcReward = config['reward'] || null;
	}

	link(cell){
		this.neighbors.push(cell);
		cell.neighbors.push(this);
	}

	unlink(cell){
		this.neighbors.pop(cell);
	}

	distance(neighbor){
		var o = [], l = neighbor.data.length;
		for (var i = 0; i < l; i++){
			o.append(neighbor.data[i] - this.data[i]);
		}
		return o;
	}

	step(){
		//take an action, s = vector of max_n * 2
		//change s from concat n.data to only concat shared data
		var l = this.neighbors.length;
		if (l == 0) return;
		var s = this.data;

		//For EACH NEIGHBOR
		for (var i = 0; i < l; i++){
			var n = this.neighbors[i];
			var ss = _.diff(s, n.data);
			var action = this.brain.act(ss);
			//console.log(ss, action, n);

			this.performAction(action, n);

			// calculate reward from this interaction?
			// or async calculation of reward on message reception?
			//console.log(this.data, n);
			var reward = this.calculateReward(n);

			// learn from reward
			this.brain.learn(reward);
		}
		this.afterStep();
	}

	performAction(action, neighbor){
		if (this.world == null) return 0.0;
		return this.world.actionSpace[action](this, neighbor);
	}

	calculateReward(neighbor){
		//console.log(this.data, neighbor);
		if (this._calcReward != null)
			return this._calcReward(this, neighbor);
		else
			return 0;
	}

	afterStep(){
		if (this._afterStep != null)
			this._afterStep(this);
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

