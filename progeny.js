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
}

// Define the world and layout of the world
class World {
	constructor(config, canvas){
		this.config = config;
		this.canvas = canvas;
		this.rows = config['rows'] || 80;
		this.cols = config['cols'] || 60;
		this.size = this.rows * this.cols;
		this.maxLinks = config['maxLinks'] || 4;
		this.dataWidth = config['dataWidth'] || 2;
		this.numCells = config['numCells'] || 10;

		//working vars
		this.session = null;
		this.cells = LL()
		//Define the action space (acts on a cell or neighbor)
		this.actionSpace = [
			function(cell, neighbor){

			},
		]
	}

	createEnv(){
		// numStates = n * 2
		// numActions = []
		const _n = this.maxLinks * this.dataWidth;
		const _m = this
		this.env = {};
		this.env.getNumStates = function(){ return _n; }
		this.env.getMaxNumActions = function(){ return  }
	}

	generate(){
		// Layout initial cells
		this.createEnv();
		for (var i = 0; i < this.numCells; i++){

		}
	}

	step(){
		var cell;
		while ((cell = this.cells.next()) !== null){
			cell.step()
		}
	}

	start(){
		this.session = setInterval(this.step(), 0);
	}

	layout(type){
		conf = this.config;

	}
}

/*
3 term equations are a simple function o = f(x, y)
basic operations account for both frequency and value ratios
reversing the 3 term equation 
A matrix of this function can be 
*/
class Func {
	construct(){
		this.initialized = false;
	}

	input(x, y){
		this.d = [x, y];
		Object.freeze(this.d);
		this.forward();
		this.initilized = true;
	}

	forward(){
		this.o = this.d[0] + this.d[1];
		return this.o;
	}

	/* Usage: reverse([0, 1]) */
	reverse(a){
		return this.o - this._get(a)[0];
	}

	_get(given){
		if (given > 1 || given < 0) return null;
		var _given = given == 0 ? 1: 0;
		return [this.d[given], this.d[_given]];
	}
}

class Add extends Func {
	forward(){
		this.o = this.d[0] + this.d[1];
		return this.o;
	}
	reverse(a){
		return this.o - this._get(a)[0];
	}
}

class Sub extends Func {
	forward(){
		this.o = this.d[0] - this.d[1];
		return this.o;
	}
	reverse(a){
		return this.o + this._get(a)[0];
	}
}

class Mult extends Func {
	forward(){
		this.o = this.d[0] * this.d[1];
		return this.o;
	}
	reverse(a){
		return this.o / this._get(a)[0];
	}
}

class Div extends Func {
	forward(){
		this.o = this.d[0] / this.d[1];
		return this.o;
	}
	reverse(a){
		return this.o * this._get(a)[0];
	}	
}

/*	
	A pipe is used to compute some output from input data
*/
class Pipe {
	constructor(funcs){
		this.steps = (typeof(funcs) !== 'undefined') ? funcs: this.genfuncs(3);
	}

	genfuncs(n){
		this.steps = [];
		for (var i = 0; i < n; i++){
			var r = Math.floor(Math.random() * 3.999)
			console.log(i + ': ' + r)
			this.steps.push(_.f(r));
		}
		return this.steps;
	}
}

class Cell {

	constructor(config, data){
		//Agent
		this.brain = new RL.DQNAgent(config['env'], config['spec'] || { alpha: 0.01});

		//Neighbors links
		this.neighbors = []

		//Configuration of cell limits like maxDims, etc.
		this.config = config;
		
		//Live cell data (state)
		//	a map of vectors that gives amp/freq
		this.data = (data == null) ? {}: data;

	}

	step(){
		//take an action, s = vector of max_n * 2
		s = this.input
		var action = this.brain.act(s);

		// do stuff in world and get reward
		cell.brain.learn(reward);
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

pipe = new Pipe()
console.log(pipe.steps)