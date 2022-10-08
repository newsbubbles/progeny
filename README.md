# progeny.js
An Emergent Computing Playground for DQN CAs

## Demos

### [Predator and Prey 2D](https://newsbubbles.github.io/progeny)
This simulation takes the progeny.js library and makes it simulate a predator and prey scenario in a continuous 2D space.  Predators must learn how to hunt efficiently while prey must learn how to eveade predators.  This is a simple context for using the library in a setting where Deep Q Agents must be driven to gain a sense of self preservation.  Use the keyboard arrow keys to change agents or click on the agent in the menu on the bottom left.

### [Predator and Prey 3D](https://newsbubbles.github.io/progeny/3d.html)
This simulation is the exact same one as the 2D simulation except I used Three.js to add two more dimensions to the cell data: (Z and Z-Velocity).  The simulation is set to follow the selected agent by default (vomit warning?) and you can make the camera stop/start following the selected agent by pressing `spacebar`.

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
  },
  draw: function(world){
    // Go through all cells in the world...
    world.cells.forEach(function(cell, index){
      // Show each cell on a canvas or however you want to visualize the cell.data space.
    });
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
* `brainConfig` - This is a configuration object for the rl.js DQNAgent class. See demos for more settings.
