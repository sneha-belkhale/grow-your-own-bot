const CANNON = require('cannon')

self.addEventListener("message", messageHandler);

var worlds, mass, body, shape, timeStep=1/30,
   camera, scene, renderer, geometry, material, bodyAs, bodyBs, bodyCs, meshesA,meshesB,meshesC, controls;
var mesh2, geometry2, material2, constraint1;

var mesh3, geometry3, material3, constraint2;
var constraint1s, constraint2s
var index;
var counter = 0;

var aPositions = []
var bPositions = []
var cPositions = []
var aQuaternions = []
var bQuaternions = []
var cQuaternions = []
var bVelocityX = []
var bVelocityY = []
var aCollided = []
var cCollided = []
worlds = []

function messageHandler(event) {
  if (event.data.name == 'init'){
    init(event.data.index)
  } else if (event.data.name == 'step'){
      step()
    } else if (event.data.name == 'set'){
        set(event.data)
      }
      else if (event.data.name == 'reset'){
          reset()
        }
}

function reset () {
  aPositions = []
  bPositions = []
  cPositions = []
  aQuaternions = []
  bQuaternions = []
  cQuaternions = []
  bVelocityX = []
  bVelocityY = []
  aCollided = []
  cCollided = []
  worlds = []
  init(index)

  // for ( let i = 0; i<20; i++){
  //   bodyAs[i].position.set(0, -2, 1);
  //   bodyBs[i].position.set(0, 2, 1);
  //   bodyCs[i].position.set(0, 6, 1);
  //   constraint1s[i].setMotorSpeed(0);
  //   constraint2s[i].setMotorSpeed(0);
  // }
  counter =0;
}


function step () {
  for ( let i = 0; i<20; i++){
    worlds[i].step(1/10)
    aPositions[i] = bodyAs[i].position
    bPositions[i] = bodyBs[i].position
    cPositions[i] = bodyCs[i].position
    aQuaternions[i] = bodyAs[i].quaternion
    bQuaternions[i] = bodyBs[i].quaternion
    cQuaternions[i] = bodyCs[i].quaternion
    bVelocityX[i] = bodyBs[i].velocity.x
    bVelocityY[i] = bodyBs[i].velocity.y
    if(bodyAs[i].collided){
      bodyAs[i].collided = false
      aCollided[i] = 1;
    }
    if(bodyCs[i].collided){
      bodyCs[i].collided = false
      cCollided[i] = 1;
    }
  }
  counter += 1;
  this.postMessage({
    start: index,
    counter: counter,
    aPositions: aPositions,
    bPositions: bPositions,
    cPositions: cPositions,
    aQuaternions: aQuaternions,
    bQuaternions: bQuaternions,
    cQuaternions: cQuaternions,
    bVelocityX: bVelocityX,
    bVelocityY: bVelocityY,
    aCollided: aCollided,
    cCollided: cCollided,})
}

function set (data) {
  // console.log(data.motorSpeeds1[0])
  for ( let i = 0; i<20; i++){
    constraint1s[i].setMotorSpeed(Math.max(-12, Math.min(data.motorSpeeds1[i], 12)) );
    constraint2s[i].setMotorSpeed(Math.max(-12, Math.min(data.motorSpeeds2[i], 12)) );
  }
}

function init (i) {
  index = i;
  // ground plane
  var groundShape = new CANNON.Plane();
  var groundBody = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(0,0,-5)
  });
  var he = new CANNON.Vec3(2,2,2);
  var legs = new CANNON.Vec3(2,5,2);

  var shapeA = new CANNON.Box(legs);
  var shapeB = new CANNON.Box(he);
  var shapeC = new CANNON.Box(legs);
  bodyAs = []
  bodyBs = []
  bodyCs = []
  constraint1s = []
  constraint2s = []

  for ( let i = 0; i<20; i++){
    const world = new CANNON.World();
    world.broadphase.useBoundingBoxes = true;
    world.gravity.set(0,0,-30);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;

    const bodyA = new CANNON.Body({ mass: 1.85 });
    bodyA.addEventListener("collide",function(e){
      bodyA.collided = true;
    });

    bodyA.position.set(0, -2, -3);

    bodyA.addShape(shapeA);
    world.addBody(bodyA);
    bodyAs.push(bodyA)

    const bodyB = new CANNON.Body({ mass: 1.5 });
    bodyB.position.set(0, 2, -3);
    bodyB.addShape(shapeB);
    world.addBody(bodyB);
    bodyBs.push(bodyB)

    const bodyC = new CANNON.Body({ mass: 1.85 });
    bodyC.position.set(0, 6, -3);
    bodyC.addShape(shapeC);
    world.addBody(bodyC);
    bodyCs.push(bodyC)
    bodyC.addEventListener("collide",function(e){
      bodyC.collided = true;
    });

    var localPivotA1 = new CANNON.Vec3(-1, 5, -2);
    var localPivotB1 = new CANNON.Vec3(-1, -2, -2);
    var leftAxis =  new CANNON.Vec3(1,0,0);
    var rightAxis =  new CANNON.Vec3(1,0,0);

    const constraint1 = new CANNON.HingeConstraint(bodyA, bodyB,  { pivotA: localPivotA1,axisA:leftAxis,axisA:rightAxis, pivotB: localPivotB1 });
    // var c = new CANNON.DistanceConstraint( bodyA , bodyB,6);
    // c.collideConnected = false;
    // world.addConstraint(c);
    // var c2 = new CANNON.DistanceConstraint( bodyB , bodyC,6);
    // c2.collideConnected = false;
    //
    // world.addConstraint(c2);
    constraint1.enableMotor();
    world.addConstraint(constraint1);
    constraint1s.push(constraint1)

    // var localPivotA11 = new CANNON.Vec3(-2, 5, 2);
    // var localPivotB11 = new CANNON.Vec3(-2, -2, 2);
    // const constraint11 = new CANNON.HingeConstraint(bodyA, bodyB,  { pivotA: localPivotA11, pivotB: localPivotB11 });
    // world.addConstraint(constraint11);

    var localPivotA2 = new CANNON.Vec3(-1, 2, -2);
    var localPivotB2 = new CANNON.Vec3(-1, -5, -2);
    const constraint2 = new CANNON.HingeConstraint(bodyB, bodyC,  { pivotA: localPivotA2,axisA:rightAxis ,axisB:leftAxis,pivotB: localPivotB2 });
    constraint2.enableMotor();
    world.addConstraint(constraint2);
    constraint2s.push(constraint2)

    // var localPivotA22 = new CANNON.Vec3(-2, 2, -2);
    // var localPivotB22 = new CANNON.Vec3(-2, -5, -2);
    // const constraint22 = new CANNON.HingeConstraint(bodyB, bodyC,  { pivotA: localPivotA22, pivotB: localPivotB22 });
    // world.addConstraint(constraint22);

    groundBody.addShape(groundShape);
    world.addBody(groundBody);
    worlds.push(world)
  }
}
