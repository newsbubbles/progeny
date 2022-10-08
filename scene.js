//Creates scene and camera

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

//Creates renderer and adds it to the DOM

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

//The Box!

world.cells.forEach(function(cell, index){
    //BoxGeometry (makes a geometry)
    var ip = isPredator(cell);
    var s = ip ? 2: 1;
    var geometry = new THREE.BoxGeometry(s, s, s);
    //Material to apply to the cube (green)
    var material = new THREE.MeshBasicMaterial( { color: ip ? 0xff0000: 0x00ff00 } );
    //Applies material to BoxGeometry
    var cube = new THREE.Mesh( geometry, material );
    cube.position.x = cell.data[0];
    cube.position.y = cell.data[1];
    cube.position.z = cell.data[7];
    //Adds cube to the scene
    scene.add( cube );
    cell.object = cube;
});

//Sets camera's distance away from cube (using this explanation only for simplicity's sake - in reality this actually sets the 'depth' of the camera's position)

camera.position.z = 100;
camera.position.y = 100;
camera.position.x = 0;

//Rendering

function render() {
  requestAnimationFrame( render );
  renderer.render( scene, camera );
}
render();