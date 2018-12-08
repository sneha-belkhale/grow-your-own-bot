import * as CANNON from 'cannon'
import NeuralNet from './NeuralNet'
import Population from './Population'
import Worker from './file.worker.js';
import {gridShader, vertexShader} from './gridShader';

var THREE = require('three');
var OrbitControls = require('three-orbit-controls')(THREE);
var FBXLoader = require('three-fbx-loader');


var camera, scene, renderer, geometry, material
var meshesA, meshesB,meshesC, controls;

var motorSpeeds1 = []
var motorSpeeds2 = []

var workers = [];

const POPULATIONCOUNT =100;

var net;

export default function initWebScene() {
  initThree();

  for (let i = 0; i < 5; i ++){
    let worker = new Worker();
    worker.postMessage({ index:i, name:'init'});
    worker.postMessage({ a:1, name:'step'});
    worker.addEventListener('message',(event)=>{
      set(event)
    });

    workers.push({
      worker:worker,
      finished: false,
    });
  }

  update();
}

let i = 0;
let step = 0;
let netIdx = 0;
let totalRewards = Array(POPULATIONCOUNT);
const destinationPoint = new THREE.Vector3(0,0,0);
const pop = new Population(POPULATIONCOUNT, 0.4, [6, 12, 7, 5, 2]);


function set(event) {
  // Copy coordinates from Cannon.js to Three.js
  for (let netIdx = 20*event.data.start ; netIdx<20*event.data.start+20; netIdx++){
    let i = netIdx%20;
    if(event.data.counter > 2){
      meshesB[netIdx].position.y -= 40*netIdx;
      totalRewards[netIdx] += 0.002*(meshesB[netIdx].position.distanceTo(event.data.bPositions[i]));
    }
    meshesA[netIdx].position.copy(event.data.aPositions[i]);
    meshesA[netIdx].quaternion.copy(event.data.aQuaternions[i]);
    meshesA[netIdx].position.y += 40*netIdx;
    meshesB[netIdx].position.copy(event.data.bPositions[i]);
    meshesB[netIdx].quaternion.copy(event.data.bQuaternions[i]);
    // totalRewards[netIdx] -= meshesB[netIdx].position.z;

    meshesB[netIdx].position.y += 40*netIdx;

    meshesC[netIdx].position.copy(event.data.cPositions[i]);
    meshesC[netIdx].quaternion.copy(event.data.cQuaternions[i]);
    meshesC[netIdx].position.y += 40*netIdx;

    const angle1 = meshesA[netIdx].quaternion.angleTo(meshesB[netIdx].quaternion)
    const angle2 = meshesC[netIdx].quaternion.angleTo(meshesB[netIdx].quaternion)
    const motorSpeeds = pop.population[netIdx].getOutput([event.data.aCollided[i], event.data.cCollided[i], event.data.bVelocityX[i], event.data.bVelocityY[i], angle1, angle2])
    // const motorSpeed1 = Math.max(-2, Math.min(motorSpeeds.get(0,0), 2));
    // const motorSpeed2 = Math.max(-2, Math.min(motorSpeeds.get(0,1), 2));
    motorSpeeds1[i] = -motorSpeeds.get(0,0);
    motorSpeeds2[i] = -motorSpeeds.get(0,1);
  }

  //once all of them have reached 20..
  if(event.data.counter > 300){
    workers[event.data.start].finished = true;
    let finished = true;
    workers.forEach((worker)=> {
      if(!worker.finished){
        finished = false;
      }
    })
    if(finished){
      generateNewPopulation()
    }
  } else {
    workers[event.data.start].worker.postMessage({name:'set', motorSpeeds1: motorSpeeds1, motorSpeeds2: motorSpeeds2 })
    workers[event.data.start].worker.postMessage({ name:'step'});
  }
}

function generateNewPopulation() {
  for (let netIdx = 0 ; netIdx<POPULATIONCOUNT; netIdx++){
    pop.population[netIdx].fitness = totalRewards[netIdx];
    console.log(pop.population[netIdx].fitness)
    totalRewards[netIdx] = 0
  }
  pop.createNewGeneration()
  console.log(pop)
  workers.forEach((worker)=> {
    worker.finished = false;
    worker.worker.postMessage({ a:1, name:'reset'});
    worker.worker.postMessage({ a:1, name:'step'});
  })
}

function update() {
  requestAnimationFrame(update);
    renderer.render(scene, camera);
}

function initThree() {

  var group = new THREE.Group();

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
  // camera.position.z = 35;
  // camera.position.y = -305;
  scene.add( camera );

  var light = new THREE.PointLight(0xffffff, 3, 1000);
  light.position.set(0,100,100)
  light.castShadow = true;
  light.shadow.camera.far = 1000
  group.add(light);

  meshesA = [];
  meshesB = [];
  meshesC = [];
  const material = new THREE.MeshPhongMaterial( { color: 0x5f0707} );
  const material1 = new THREE.MeshPhongMaterial( { color: 0x5f0707} );
  const material2 = new THREE.MeshPhongMaterial( { color: 0x5f0707} );

  var phongShader = THREE.ShaderLib.phong;
  //define monkey gridMaterial
  var gridMaterial = new THREE.ShaderMaterial ({
    uniforms : phongShader.uniforms,
    vertexShader: vertexShader,
    fragmentShader: gridShader,
    lights: true,
    side : THREE.DoubleSide,
    derivatives: true,
  });

  renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.shadowMap.enabled = true

  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );
  // instantiate a loader
  var loader = new FBXLoader();

  // load a resource
  loader.load(
  	require('./creature-01.fbx'),
  	// called when resource is loaded
  	function ( object ) {
      const legGeo = object.children[0].children[0].geometry
      const bodyMat = object.children[0].children[0].material

      const bodyGeo = object.children[0].children[1].geometry
      const legMat = object.children[0].children[0].material

      for ( let i = 0; i<POPULATIONCOUNT; i++){
        const mesh = new THREE.Mesh( legGeo, legMat );
        mesh.castShadow = true
        // mesh.scale.multiplyScalar(0.01)
        group.add( mesh );
        meshesA.push(mesh)

        const mesh1 = new THREE.Mesh( bodyGeo, bodyMat );
        // mesh1.scale.multiplyScalar(0.01)
        mesh1.castShadow = true

        group.add( mesh1 );
        meshesB.push(mesh1)

        const mesh2 = new THREE.Mesh( legGeo, legMat );
        // mesh2.scale.multiplyScalar(0.01)
        mesh2.castShadow = true

        group.add( mesh2 );
        meshesC.push(mesh2)
      }
      var groundGeometry = new THREE.PlaneGeometry( 2000, 2000, 10,10 );
      var groundMaterial = new THREE.MeshPhongMaterial( { color: 0x0000ff} );
      var groundMesh = new THREE.Mesh( groundGeometry, gridMaterial );
      groundMesh.receiveShadow = true;

      groundMesh.position.set(0,0,-5);
      group.add( groundMesh );

      var size = 2000;
      var divisions = 100;
      var gridHelper = new THREE.GridHelper( size, divisions, 0xff27eb, 0x0000eb );
      gridHelper.position.set(0,0,-5);
      gridHelper.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0), Math.PI/2)
      // group.add( gridHelper );
      //
      //
      const destination = new THREE.Mesh( bodyGeo, bodyMat );
      destination.position.set(destinationPoint.x, destinationPoint.y, destinationPoint.z);
      group.add( destination );

      group.rotation.x = -Math.PI/2;
      scene.add(group)
      controls = new OrbitControls(camera);
      controls.target.set(50,0,-305)
      camera.position.z = -305;
      camera.position.x = 5;

      controls.update()

  	}
  );
}
