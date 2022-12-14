//Linked list helper object for 
//creating and editing unidirectional linked lists
//Author: Nathaniel Dwight Gibson

var LL = function(data){
	var o = {};
	o.node = {d: data, next: null, last: null};
	o.iterators = {};	// Added Nov-2022, allows multi-operation access
	o.origNode = null;
	o.lastNode = null;
	o.count = 0;
	o.iterCount = 0;

	o.push = function(data, func){
		this.node.next = {d: data, next: null, last: this.lastNode};
		if (typeof func === 'function') func(this.node.next.d);
		this.lastNode = this.node;
		this.node = this.node.next;
		if (this.origNode == null) this.origNode = this.node;
		this.count++;
	};
	o.pop = function(){
		this.lastNode.next = null;
		this.node = this.lastNode;
		this.count--;
	};
	o.shift = function(){
		var o = this.origNode;
		this.origNode = this.origNode.next;
		this.count--;
		return o;
	};

	o.next = function(){
		if (this.node != null){
			var o = this.node.d;
			this.node = this.node.next;
			return o;
		}
		return null;
	};
	o.prev = function(){
		if (this.node != null){
			var o = this.node.d;
			this.node = this.node.last;
			return o;
		}
		return null;
	};

	o.reset = function(){
		this.node = this.origNode;
	};
	o.finish = function(){
		//like reset but puts node cursor at last element
		this.node = this.lastNode;
	};

	o.forEach = function(func){
		//this.reset();
		var iti = this.iterCount;
		this.iterators[iti] = this.origNode;
		var node = this.iterators[iti];
		this.iterCount++;
		var i = 0;
		while (node != null){
			func(node.d, i);
			node = node.next;
			i += 1;
		}
		delete this.iterators[iti];
	};

	return o;
};