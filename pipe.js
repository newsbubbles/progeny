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
