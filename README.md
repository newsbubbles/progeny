# progeny.js
An Emergent Computing Playground for DQN CAs

## Usage
```HTML
...
  <canvas id="world"></canvas>
```
```javascript
var conf = {
  numCells: 30,
  dataWidth: 4,
  initDimRange: [100, 100, 1, 1],
  actions: [
    function(cell, neighbor){
      // Do something
      // cell = the actual cell, neighbor = neibhor's data vector
    },
    function(cell, neighbor){
      // Add as many functions as you want
      // as long as they are in this format...
    },
    ...
  ],
  cellStep: function(cell){
    // this function does something at the end of each step
  },
  cellReward: function(cell, neighbor){
    // Most important function of all, controls what behaviors emerge
    // good to start out with some metric like k-dimensional distance
    // note: this function is only in the scope of a cell and one neighbor
  }
};

// Create world from configuration
var world = new World(conf);

// Create the cells in the world
world.generate();
  			
// Start the world, to stop use world.stop()
world.start();
```

### Configuration Options
* `actions` - An array of action functions that each cell can perform
* `dataWidth` - The number of dimensions in the `data` vector of each cell
* `numCells` - Total number of cells to add to the `World`
* `dimTitles` - The titles for each dimension given by `dataWidth`
* `initDimRange` - The range within which to choose randomly for init values
* `initValues` - Overrides `initDimRange` to make value fixed. index matches `dimTitles` and `initDimRange`
* `stats` - An object that counts happenings in the cell
* `maxLinks` - Maximum number of links a cell can have (default 4)
* `initEnergy` - Used to distribute among random values across each dim
* `neighborDistance` - Maximum distance to search for nearest neighbors
* `interval` - The interval between world frames in `ms`
* `draw` - Callback function for drawing the world on a canvas
* `cellReward` - The reward function for each cell (controls how they learn)
* `cellStep` - Callback function happening at the end of each step for cell
