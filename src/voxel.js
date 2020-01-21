import * as THREE from 'three';
import { VoxelPainterControls } from './controls/VoxelPainterControls';
// import { OrbitControls } from './controls/OrbitControls';

var camera, scene, renderer;
var plane;
var mouse, raycaster;

var rollOverMesh, rollOverMaterial;
var cubeGeo, cubeMaterial;

var controls;

var objects = [];

document.addEventListener('DOMContentLoaded', () => {
  init();
  render();
});

function init() {

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
  camera.position.set( 100, 160, 260 );
  camera.lookAt( 0, 0, 0 );

  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xf0f0f0 );

  // roll-over helpers

  var rollOverGeo = new THREE.BoxBufferGeometry( 10, 10, 10 );
  rollOverMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, opacity: 0.5, transparent: true } );
  rollOverMesh = new THREE.Mesh( rollOverGeo, rollOverMaterial );
  scene.add( rollOverMesh );

  // cubes
  cubeGeo = new THREE.BoxBufferGeometry( 10, 10, 10 );
  cubeMaterial = new THREE.MeshLambertMaterial( { color: 0xfeb74c } );

  // grid
  var gridHelper = new THREE.GridHelper( 1000, 100, 0x555555, 0x555555  );
  scene.add( gridHelper );

  //
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();


  // Floor with random cold color triangles
  var floorGeometry = new THREE.PlaneBufferGeometry( 1000, 1000, 100, 100 );
  floorGeometry.rotateX( - Math.PI / 2 );
  // vertex displacement
  var vertex = new THREE.Vector3();
  var color = new THREE.Color();
  var position = floorGeometry.attributes.position;
  for ( var i = 0, l = position.count; i < l; i ++ ) {
    vertex.fromBufferAttribute( position, i );
    vertex.x += Math.random() * 20 - 10;
    vertex.y += Math.random() * 2;
    vertex.z += Math.random() * 20 - 10;
    position.setXYZ( i, vertex.x, vertex.y, vertex.z );
  }
  floorGeometry = floorGeometry.toNonIndexed(); // ensure each face has unique vertices
  position = floorGeometry.attributes.position;
  var colors = [];
  for ( var i = 0, l = position.count; i < l; i ++ ) {
    color.setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
    colors.push( color.r, color.g, color.b );
  }
  floorGeometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
  var floorMaterial = new THREE.MeshBasicMaterial( { vertexColors: THREE.VertexColors } );
  plane = new THREE.Mesh( floorGeometry, floorMaterial );
  scene.add( plane );
  objects.push( plane );

  /*
  // Plane Floor
  var geometry = new THREE.PlaneBufferGeometry( 5000, 5000 );
  geometry.rotateX( - Math.PI / 2 );
  plane = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial({ color: 0x009900 }) );
  scene.add( plane );
  objects.push( plane );
  */


  // lights

  var ambientLight = new THREE.AmbientLight( 0x606060 );
  scene.add( ambientLight );

  var directionalLight = new THREE.DirectionalLight( 0xffffff );
  directionalLight.position.set( 1, 0.75, 0.5 ).normalize();
  scene.add( directionalLight );

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );

  controls = new VoxelPainterControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.75;
  controls.maxPolarAngle = Math.PI / 2;
  controls.minDistance = 100.00;
  controls.maxDistance = 1000.00;
  /*controls.rotateSpeed = 1.5;
  controls.zoomSpeed = 10.0;
  controls.panSpeed = 0.3;
  controls.keys = [65, 83, 68]; // ASD
  controls.dynamicDampingFactor = 0.2;
  */

  renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
  renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
  renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false );
  //document.addEventListener( 'keydown', onDocumentKeyDown, false );
  //document.addEventListener( 'keyup', onDocumentKeyUp, false );
  //
  window.addEventListener( 'resize', onWindowResize, false );

}

function render() {
  controls.update();
  renderer.render( scene, camera );
  requestAnimationFrame(render);
}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );

}

function onDocumentMouseMove( event ) {

  event.preventDefault();

  mouse.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );

  raycaster.setFromCamera( mouse, camera );

  var intersects = raycaster.intersectObjects( objects );

  if ( intersects.length > 0 ) {

    var intersect = intersects[ 0 ];

    rollOverMesh.position.copy( intersect.point ).add( intersect.face.normal );
    rollOverMesh.position.divideScalar( 10 ).floor().multiplyScalar( 10 ).addScalar( 5 );

  }
}

var pressTime = 0;
function onDocumentMouseDown( event ) { 
  pressTime = Date.now();
}

function onDocumentMouseUp( event ) {
  if (Date.now() - pressTime > 600) {
    return;
  }

  event.preventDefault();
  mouse.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );

  raycaster.setFromCamera( mouse, camera );

  var intersects = raycaster.intersectObjects( objects );

  if ( intersects.length > 0 ) {
    var intersect = intersects[ 0 ];

    switch ( event.button ) {
      case 0:
        // left mouse button
        console.log("set voxel");
        var voxel = new THREE.Mesh( cubeGeo, cubeMaterial );
        voxel.position.copy( intersect.point ).add( intersect.face.normal );
        voxel.position.divideScalar( 10 ).floor().multiplyScalar( 10 ).addScalar( 5 );
        scene.add( voxel );

        objects.push( voxel );
        break;
      case 2:
        // right mouse button
        console.log("remove voxel");
        if ( intersect.object !== plane ) {
          scene.remove( intersect.object );
          objects.splice( objects.indexOf( intersect.object ), 1 );
        }
        break;
    }
  }
}
