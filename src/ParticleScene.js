import * as THREE from 'three'
import * as CANNON from 'cannon'
import NeuralNet from './NeuralNet'
import Population from './Population'

var OrbitControls = require('three-orbit-controls')(THREE)

var world, mass, body, shape, timeStep=1/60,
   camera, scene, renderer, geometry, material, bodyA, bodyB, bodyC, mesh, controls;
var mesh2, geometry2, material2, constraint1;

var mesh3, geometry3, material3, constraint2;

var net;

export default function initWebScene() {
  initThree();
  initCannon();
  update();
}

let i = 0;
let step = 0;
let netIdx = 0;
let totalReward = 0;
const destinationPoint = new THREE.Vector3(0,10,0);
const pop = new Population(100, 0.1, [2, 7, 5, 7, 2]);

function update() {
  if(i > 30) return;
  if(netIdx>=pop.population.length-1){
    netIdx = 0;
    i++;
    console.log(i)
    pop.createNewGeneration()
  }
  if(step>=30){
    pop.population[netIdx].fitness = totalReward;
    bodyA.position.set(0, -2, 2);
    bodyB.position.set(0, 2, 2);
    bodyC.position.set(0, 6, 2);
    totalReward = 0;
    step =0;
    netIdx ++;
  }
  step ++;

  // Step the physics world
  world.step(timeStep);

  // Copy coordinates from Cannon.js to Three.js
  mesh.position.copy(bodyA.position);
  mesh.quaternion.copy(bodyA.quaternion);

  mesh2.position.copy(bodyB.position);
  mesh2.quaternion.copy(bodyB.quaternion);

  mesh3.position.copy(bodyC.position);
  mesh3.quaternion.copy(bodyC.quaternion);

  const angle1 = mesh.quaternion.angleTo(mesh2.quaternion)
  const angle2 = mesh3.quaternion.angleTo(mesh2.quaternion)
  const motorSpeeds = pop.population[netIdx].getOutput([angle1, angle2])

  constraint1.setMotorSpeed(0.05*motorSpeeds.get(0));
  constraint2.setMotorSpeed(0.05*motorSpeeds.get(1));

  totalReward += (1/bodyB.position.distanceTo(destinationPoint));
  requestAnimationFrame(update);
  if(i>2){
    renderer.render(scene, camera);
  }
}

function startGenerations(){
  const destinationPoint = new THREE.Vector3(0,10,0);
  const pop = new Population(100, 0.1, [2, 7, 5, 7, 2]);
  for (let i = 0; i <5; i++){
    let maxReward = 0
    let bestPos = [0,0]

    pop.population.forEach( (nn)=> {
      let totalReward = 0
      for (let step = 0; step <30; step++){
        // Step the physics world
        world.step(timeStep);

        // Copy coordinates from Cannon.js to Three.js
        mesh.position.copy(bodyA.position);
        mesh.quaternion.copy(bodyA.quaternion);

        mesh2.position.copy(bodyB.position);
        mesh2.quaternion.copy(bodyB.quaternion);

        mesh3.position.copy(bodyC.position);
        mesh3.quaternion.copy(bodyC.quaternion);

        const angle1 = mesh.quaternion.angleTo(mesh2.quaternion)
        const angle2 = mesh3.quaternion.angleTo(mesh2.quaternion)

        const motorSpeeds = nn.getOutput([angle1, angle2])

        constraint1.setMotorSpeed(0.2*motorSpeeds.get(0));
        constraint2.setMotorSpeed(0.2*motorSpeeds.get(1));

        totalReward += (1/bodyB.position.distanceTo(destinationPoint));
        renderer.render(scene, camera);
        console.log(bodyA.position)
      }
      nn.fitness = totalReward
      bodyA.position.set(0, -2, 2);
      bodyB.position.set(0, 2, 2);
      bodyC.position.set(0, 6, 2);
    });
    pop.createNewGeneration()
  }
}

function initThree() {

  var group = new THREE.Group();

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 100 );
  camera.position.z = 35;
  scene.add( camera );

  var light = new THREE.PointLight();
  light.position.set(0,10,30)
  group.add(light);

  geometry = new THREE.BoxGeometry(4,10,4 );
  material = new THREE.MeshPhongMaterial( { color: 0x00ff00} );
  mesh = new THREE.Mesh( geometry, material );
  group.add( mesh );


  geometry2 = new THREE.BoxGeometry(4,4,4 );
  material2 = new THREE.MeshPhongMaterial( { color: 0xffff00} );
  mesh2 = new THREE.Mesh( geometry2, material2 );
  group.add( mesh2 );

  geometry3 = new THREE.BoxGeometry(4,10,4 );
  material3 = new THREE.MeshPhongMaterial( { color: 0xffff00} );
  mesh3 = new THREE.Mesh( geometry3, material3 );
  group.add( mesh3 );

  var groundGeometry = new THREE.PlaneGeometry( 20, 20, 10,10 );
  var groundMaterial = new THREE.MeshPhongMaterial( { color: 0xff00ff} );
  var groundMesh = new THREE.Mesh( groundGeometry, groundMaterial );
  groundMesh.position.set(0,0,-5);
  group.add( groundMesh );

  group.rotation.x = -Math.PI/2;
  scene.add(group)
  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );
  controls = new OrbitControls(camera);
}

function initCannon() {
  world = new CANNON.World();
  world.gravity.set(0,0,-20);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 3;
  var he = new CANNON.Vec3(2,2,2);
  var legs = new CANNON.Vec3(2,5,2);

  var shapeA = new CANNON.Box(legs);
  var shapeB = new CANNON.Box(he);
  var shapeC = new CANNON.Box(legs);

  bodyA = new CANNON.Body({ mass: 0.1 });
  bodyB = new CANNON.Body({ mass: 0.1 });
  bodyC = new CANNON.Body({ mass: 0.1 });

  // bodyA.angularVelocty = new CANNON.Vec3(0,1,1);
  // bodyB.angularVelocty = new CANNON.Vec3(0,1,1);
  // bodyB.velocity = new CANNON.Vec3(0,10,3);
  bodyA.position.set(0, -2, 2);
  bodyB.position.set(0, 2, 2);
  bodyC.position.set(0, 6, 2);

  bodyA.addShape(shapeA);
  bodyB.addShape(shapeB);
  bodyC.addShape(shapeC);

  world.addBody(bodyA);
  world.addBody(bodyB);
  world.addBody(bodyC);

  var localPivotA = new CANNON.Vec3(-2, 5, -2);
  var localPivotB = new CANNON.Vec3(-2, -2, -2);
  constraint1 = new CANNON.HingeConstraint(bodyA, bodyB,  { pivotA: localPivotA, pivotB: localPivotB });
  constraint1.enableMotor();
  constraint1.setMotorSpeed(1);
  // var constraint1 = new CANNON.PointToPointConstraint(bodyA, localPivotA, bodyB, localPivotB);
  world.addConstraint(constraint1);

  var localPivotA1 = new CANNON.Vec3(-2, 2, -2);
  var localPivotB1 = new CANNON.Vec3(-2, -5, -2);
  constraint2 = new CANNON.HingeConstraint(bodyB, bodyC,  { pivotA: localPivotA1, pivotB: localPivotB1 });
  constraint2.enableMotor();
  constraint2.setMotorSpeed(1);
  // var constraint2 = new CANNON.PointToPointConstraint(bodyA, localPivotA, bodyB, localPivotB);
  world.addConstraint(constraint2);




  // ground plane
  var groundShape = new CANNON.Plane();
  var groundBody = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(0,0,-5)
  });
  groundBody.addShape(groundShape);
  world.addBody(groundBody);
}

// function update() {


  // // Step the physics world
  // world.step(timeStep);
  //
  // // Copy coordinates from Cannon.js to Three.js
  // mesh.position.copy(bodyA.position);
  // mesh.quaternion.copy(bodyA.quaternion);
  //
  // mesh2.position.copy(bodyB.position);
  // mesh2.quaternion.copy(bodyB.quaternion);
  //
  // mesh3.position.copy(bodyC.position);
  // mesh3.quaternion.copy(bodyC.quaternion);
  //
  // const angle1 = mesh.quaternion.angleTo(mesh2.quaternion)
  // const angle2 = mesh3.quaternion.angleTo(mesh2.quaternion)
  //
  // const motorSpeeds = net.getOutput([angle1, angle2])
  //
  // constraint1.setMotorSpeed(motorSpeeds.get(0));
  // constraint2.setMotorSpeed(motorSpeeds.get(1));

  // renderer.render(scene, camera);
  // requestAnimationFrame(update);
// }
