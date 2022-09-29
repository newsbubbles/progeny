# progeny.js
An Emergent Computing Playground for DQN CAs

## Usage
```HTML
...
  <canvas id="world"></canvas>
```
```javascript
var conf = {...};

// Create world from configuration
var world = new World(conf);

// Create the cells in the world
world.generate();
  			
// Start the world, to stop use world.stop()
world.start();
```

### Configuration Options
