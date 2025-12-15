import * as THREE from "three";
import { gsap } from "gsap";
import { Howl } from "howler";
import { loadGLB } from "./essentials";
import Stats from "three/examples/jsm/libs/stats.module.js";
import "./game_object.js";

// const stats = new Stats();
// stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
// document.body.appendChild(stats.dom);


let cta = window.game_object.Cta;
let cta_screen = null;

let textureLoader = new THREE.TextureLoader();

let ctaScreen = null;
let textOnTop = document.getElementById("text-on-top");
let play_button = null;


/*!{{CTA_DEFINITION}}*/
createCTA();


const GameElements = window.game_object.GameElements;
const Theme = window.game_object.GameThemes[game_object.GameThemes.selected];
const Audio = window.game_object.Audio;


const HexaModelBase64 = GameElements.Tile.model;
//const particlesModelBase64 = GameElements.ParticlesMesh.model;
////////////////////////////////Audio Context and loading
let user_int = false;
// Step 1: Create AudioContext
//
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

let audioUnintialized = true;
audioContext.suspend();

const flip_sound_src = document.getElementById("flip_sound");
const drop_sound_src = document.getElementById("drop_sound");
const delete_sound_src = document.getElementById("delete_sound");
const music_src = document.getElementById("music");

const flip_sound = new Howl({
  src: [Audio.flipSound.data],
  format: ['mp3'],
  volume: 1.0,
  loop: false,
});

const drop_sound = new Howl({
  src: [Audio.dropSound.data],
  format: ['mp3'],
  volume: 1.0,
  loop: false,
});

const music = new Howl({
  src: [Audio.music.data],
  format: ['mp3'],
  volume: 1.0,
  loop: false,
});

const delete_sound = new Howl({
  src: [Audio.deleteSound.data],
  volume: 1.0,
  loop: false,
});

document.addEventListener(
  "touchend",
  function (e) {
    // Your event handling code here
    if (audioUnintialized) {
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }
      audioUnintialized = false;
      hand.visible = false;
      music.play();
    }
  },
  { once: true },
);
//                          Game Code
const baseColor = 0xb7b5b8;


function greenComponentHack(array) {
  const matches = {};
  let colors = [];

  for (let i = 0; i < array.length; i++) {
    const green = getGreenComponentFromHex(array[i]);
    
    console.log(green);
    if (!matches[green]) {
      matches[green] = [];
      colors.push(green);
    }

    matches[green].push(i);
  }

  console.log(matches);

  
  for(let i of colors){
    if(matches[i].length > 1){
      for(let j=1; j<matches[i].length; j++){
        
        let temp = addGreen(hexagonColors[matches[i][j]], -1*j);
        console.log(temp);
        
        if(temp === hexagonColors[matches[i][j]]){
          temp = addGreen(hexagonColors[matches[i]], 1*j);
        }
        
        hexagonColors[matches[i][j]] = temp;
      }
    }
  }
}

function addGreen(hex, delta) {
  const r = (hex >> 16) & 0xff;
  const g = (hex >> 8) & 0xff;
  const b = hex & 0xff;

  const newG = Math.min(255, Math.max(0, g + delta));

  return (r << 16) | (newG << 8) | b;
}

function getGreenComponentFromHex(hex) {
  return (hex >> 8) & 0xff;
}

const hexagonColors = Theme.Tile.colors;

greenComponentHack(hexagonColors);

const _hex_array_color = [
  [1, 3, 5, 0, 2, 4],
  [5, 7, 7, 3, 7, 5],
  [0, 2, 4, 6, 1, 3],
  [6, 5, 0, 2, 4, 6],
  [4, 3, 1, 3, 5, 0],
  [5, 0, 2, 4, 6, 1],
  [6, 1, 3, 7, 0, 2],
  [0, 2, 4, 6, 1, 3],
  [1, 3, 5, 0, 2, 4],
  [2, 4, 6, 1, 3, 5],
  [3, 7, 2, 2, 4, 6],
  [4, 6, 1, 3, 5, 0],
  [5, 3, 7, 4, 6, 1],
  [6, 1, 3, 5, 0, 2],
  [7, 2, 4, 6, 1, 7],
  [1, 3, 5, 0, 2, 4],
  [2, 4, 6, 1, 3, 5],
  [7, 5, 0, 2, 4, 6],
  [4, 6, 1, 3, 7, 0],
  [5, 0, 2, 4, 6, 1],
];

let hex_ref_array = [];
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xd3d3d3);

const frustumSize = 25; // Controls the "zoom level" - smaller = more zoomed in
const aspect = window.innerWidth / window.innerHeight;

const camera = new THREE.OrthographicCamera(
  (frustumSize * aspect) / -2, // left
  (frustumSize * aspect) / 2, // right
  frustumSize / 2, // top
  frustumSize / -2, // bottom
  0.00001, // near
  200, // far
);

function resizeCamera(camera, frustumSize = 25) {
  const aspect = window.innerWidth / window.innerHeight;

  // Update camera properties
  camera.left = (frustumSize * aspect) / -2;
  camera.right = (frustumSize * aspect) / 2;
  camera.top = frustumSize / 2;
  camera.bottom = frustumSize / -2;

  // Update the projection matrix
  camera.updateProjectionMatrix();
}
/*
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  400,
);
 */

const pinkText = document.getElementById("pink-text");

const title_text = document.getElementById("title-text");

title_text.childNodes[0].textContent = window.game_object.Ui.TitleText.white;
pinkText.textContent = window.game_object.Ui.TitleText.pink;


camera.position.z = 10;
camera.position.y = 15;

camera.lookAt(new THREE.Vector3(0, -3, 0));
camera.position.x = -0.8;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let mouseDown = false;
let mousePrev;
let selectableDecks = [];
let selectedDeck;
let selectedDeckPosBackup;
let intersection;
let hoverPos;
let fixedElements = [];
let HexArray = [];
let Matches = [];
let matches = null;
let fromDeck = null;
let toDeck = null;
let fromDeckIndex = null;
let toDeckIndex = null;
let matchPathCurve = [];
let matchPathTime = 0;
let matchUntil = 0;
let matchedUpto;
let leafVertex;
let matchAnimataionHelper;
let pieceTimeArray = [];
let numberOfDecksAdded = 0;
let matchColor = null;
let stack_anim_playing = false;
let isdestroyingDeck = false;
let destroyDeckTimer = 0;
let destroyingDeck = null;
let destroyDeckIndex;
let odds = 0;
let gc_of_destroyingDeck = null;
const supports_touch_input = hasTouchInput();
document.addEventListener("DOMContentLoaded", function () {
  if (supports_touch_input) {
    //console.log("TouchInput Added");
    document.addEventListener("touchstart", onTouchStart);
    document.addEventListener("touchmove", onTouchMove);
    document.addEventListener("touchend", onTouchEnd);
    document.addEventListener("touchcancel", onTouchEnd); // To account for interruptions
  } else {
    //console.log("pointer");
    //console.log("mouseInput Added");
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerUp);
  }
});

let placementHelperMesh;
let placementHelperMaterial = new THREE.MeshPhongMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.5,
  shininess: 30,
});

const canvas = document.querySelector("#threejs-canvas");
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  powerPreference: "high-performance",
});

//const controls = new OrbitControls(camera, renderer.domElement);
const hexMaterial = new THREE.MeshPhongMaterial({
  color: 0xffffff, // Diffuse color (green)
  specular: 0x454545, // Specular color (gray)
  shininess: 60, // Shininess (higher = more focused highlight)
  side: THREE.FrontSide,
  flatShading: false, // Enable smooth shading (default)
  emissive: 0x000000, // Self-illumination color
  emissiveIntensity: 0, // Intensity of emissive light
  wireframe: false, // Render as wireframe (for debugging)
});

const baseMaterial = new THREE.MeshLambertMaterial({
  color: baseColor,
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
//console.log(window.innerWidth);

window.addEventListener("resize", onWindowResize, false);
function onWindowResize() {
  // Update renderer size
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Update camera
  resizeCamera(camera, frustumSize);
}
let model_mesh;
let boundingBox;
let mesh_height;
let mesh_breadth;
let mesh_length;
let mesh_length_by2;
let mesh_breadth_by2;
let selectableDeckPos = [
  new THREE.Vector3(-3, 0, 13),
  new THREE.Vector3(0, 0, 13),
  new THREE.Vector3(3, 0, 13),
];
let cubeGeometry;
let cube;

loadGLB(HexaModelBase64).then(({ geometry, mesh }) => {
  boundingBox = new THREE.Box3().setFromObject(mesh);
  mesh_height = boundingBox.max.z - boundingBox.min.z;
  mesh_height = mesh_height * GameElements.Tile.scale.z;
  mesh_breadth = boundingBox.max.y - boundingBox.min.y;
  mesh_length = boundingBox.max.x - boundingBox.min.x;
  mesh_length_by2 = mesh_length / 2 - 0.2;
  mesh_breadth_by2 = mesh_breadth / 2 - 0.2;
  model_mesh = geometry;
  placementHelperMesh = new THREE.Mesh(geometry, placementHelperMaterial);
  placementHelperMesh.rotateX(Math.PI / 2);
  placementHelperMesh.visible = false;
  scene.add(placementHelperMesh);
  //console.log(mesh);
  createBase(geometry, 6, 20);
  createHexArray(geometry, 6, 20, 7);
  selectableDecks.push(
    deckGeneratorUniform(geometry, selectableDeckPos[0], 6, 0, 1, mesh_height),
    deckGeneratorUniform(geometry, selectableDeckPos[1], 6, 0, 2, mesh_height),
    deckGeneratorUniform(geometry, selectableDeckPos[2], 7, 0, 0, mesh_height),
  );

  // Create a plane geometry (width, height, widthSegments, heightSegments)
  const planeGeometry = new THREE.PlaneGeometry(50, 50);

  // Create a material for the plane
  const planeMaterial = new THREE.MeshLambertMaterial({
    color: Theme.Background.color, // Light grey
    side: THREE.FrontSide,
  });

  // Create the mesh
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);

  // Position and rotate the plane (default is vertical)
  plane.rotation.x = -Math.PI / 2; // Rotate to be horizontal
  plane.position.y = -mesh_height / 2 - 0.001; // Adjust height if needed

  // Enable shadows (if needed)
  plane.receiveShadow = true; // Allows shadows to appear on the plane
  // Add to scene
  scene.add(plane);
  fixedElements.push(plane);
  //let matches_00 = findAllMatchesRecursive(0, 0);
  //console.log(matches_00);
  //console.log(fixedElements);
  //scene.add(model);
});
const particlesTexture = new THREE.Texture(
  document.getElementById("cartoon_thunder"),
);
particlesTexture.needsUpdate = true;
particlesTexture.colorSpace = THREE.SRGBColorSpace;
particlesTexture.wrapS = THREE.ClampToEdgeWrapping; // Horizontal wrapping
particlesTexture.wrapT = THREE.ClampToEdgeWrapping; // Vertical wrapping

const particlesMaterial = new THREE.MeshBasicMaterial({
  map: particlesTexture,
  side: THREE.DoubleSide,
  transparent: true,
  depthTest: false,
});

let particleMeshBase64 = `data:model/gltf-binary;base64, Z2xURgIAAABkDQAAyAMAAEpTT057ImFzc2V0Ijp7ImdlbmVyYXRvciI6Iktocm9ub3MgZ2xURiBCbGVuZGVyIEkvTyB2NC40LjU2IiwidmVyc2lvbiI6IjIuMCJ9LCJzY2VuZSI6MCwic2NlbmVzIjpbeyJuYW1lIjoiU2NlbmUiLCJub2RlcyI6WzBdfV0sIm5vZGVzIjpbeyJtZXNoIjowLCJuYW1lIjoiQ2lyY2xlIn1dLCJtZXNoZXMiOlt7Im5hbWUiOiJDaXJjbGUiLCJwcmltaXRpdmVzIjpbeyJhdHRyaWJ1dGVzIjp7IlBPU0lUSU9OIjowLCJOT1JNQUwiOjEsIlRFWENPT1JEXzAiOjJ9LCJpbmRpY2VzIjozfV19XSwiYWNjZXNzb3JzIjpbeyJidWZmZXJWaWV3IjowLCJjb21wb25lbnRUeXBlIjo1MTI2LCJjb3VudCI6NjQsIm1heCI6WzEuNjk2MTA3MjY4MzMzNDM1LDEuNjk2MTA3MjY4MzMzNDM1LDAuNTQ2MjU5ODgwMDY1OTE4XSwibWluIjpbLTEuNjk2MTA3MjY4MzMzNDM1LC0xLjY5NjEwNzI2ODMzMzQzNSwwLjA0MDExNjA3MTcwMTA0OTgwNV0sInR5cGUiOiJWRUMzIn0seyJidWZmZXJWaWV3IjoxLCJjb21wb25lbnRUeXBlIjo1MTI2LCJjb3VudCI6NjQsInR5cGUiOiJWRUMzIn0seyJidWZmZXJWaWV3IjoyLCJjb21wb25lbnRUeXBlIjo1MTI2LCJjb3VudCI6NjQsInR5cGUiOiJWRUMyIn0seyJidWZmZXJWaWV3IjozLCJjb21wb25lbnRUeXBlIjo1MTIzLCJjb3VudCI6MTkyLCJ0eXBlIjoiU0NBTEFSIn1dLCJidWZmZXJWaWV3cyI6W3siYnVmZmVyIjowLCJieXRlTGVuZ3RoIjo3NjgsImJ5dGVPZmZzZXQiOjAsInRhcmdldCI6MzQ5NjJ9LHsiYnVmZmVyIjowLCJieXRlTGVuZ3RoIjo3NjgsImJ5dGVPZmZzZXQiOjc2OCwidGFyZ2V0IjozNDk2Mn0seyJidWZmZXIiOjAsImJ5dGVMZW5ndGgiOjUxMiwiYnl0ZU9mZnNldCI6MTUzNiwidGFyZ2V0IjozNDk2Mn0seyJidWZmZXIi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`;
let particlesMesh;

// const pMesh = atob(particlesModelBase64);
// const bytes2 = new Uint8Array(pMesh.length);
// for (let i = 0; i < pMesh.length; i++) {
//   bytes2[i] = pMesh.charCodeAt(i);
// }
// const blob2 = new Blob([bytes2], { type: "model/gltf-binary" });
// const url2 = URL.createObjectURL(blob2);
loadGLB(particleMeshBase64).then(({ geometry, mesh }) => {
  particlesMesh = new THREE.Mesh(geometry, particlesMaterial);
  scene.add(particlesMesh);
  particlesMesh.position.set(0, 2, 0);
  particlesMesh.rotateX(Math.PI * 1.5);
  particlesMesh.visible = false;
});

////////////////////////////////////Hand Sprite
const handTexture = textureLoader.load(window.game_object.Ui.HandSprite.data);
//handTexture.needsUpdate = true;
//handTexture.wrapS = THREE.RepeatWrapping;
//handTexture.wrapT = THREE.RepeatWrapping;
handTexture.colorSpace = THREE.SRGBColorSpace;
let handMaterial = new THREE.MeshBasicMaterial({
  map: handTexture,
  side: THREE.FrontSide,
  transparent: true,
  depthTest: false,
});

const planeGeometry = new THREE.PlaneGeometry(2, 2 * 1.24);

planeGeometry.deleteAttribute("uv");

// Create custom UV array
const uvs = new Float32Array([
  0,
  1, // bottom-left
  1,
  1, // bottom-right
  0,
  0, // top-left
  1,
  0, // top-right
]);

planeGeometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
//handMaterial.map.offset.x = 0.5;
const hand = new THREE.Mesh(planeGeometry, handMaterial);
hand.castShadow = true;
scene.add(hand);
hand.lookAt(camera.position);
hand.rotateX(-Math.PI/5);
hand.position.copy(
  selectableDeckPos[1].clone().add(new THREE.Vector3(0.8, 0.5, 0.5)),
);

const hand_timeline = gsap.timeline({ repeat: -1, yoyo: true });

let first_time = true;
hand_timeline.to(hand.position, {
  x: 0.5,
  y: 1,
  z: 9,
  duration: 2,
  ease: "power1.inOut",
  onComplete: () => {
    //if(!first_time){
      hand.rotateX(Math.PI/5);
    // }else{
    //   first_time = false;
    // }
    //handMaterial.map.offset.x = 0;
  },
  onReverseComplete: () => {
    hand.rotateX(-Math.PI/5);
    // When returning to original position
    //handMaterial.map.offset.x = 0.5;
  },
});

//////////////////////////////////////Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(3, 10, 3);
directionalLight.target.position.set(-1, 0, 0);
//directionalLight.castShadow = true; // Enable shadow casting

// Configure shadow properties for better quality
directionalLight.shadow.mapSize.width = 1024 * 2; // Shadow map resolution
directionalLight.shadow.mapSize.height = 1024 * 2;
directionalLight.shadow.camera.near = 0.001;
directionalLight.shadow.camera.far = 30;

// For directional light, configure the shadow camera bounds
directionalLight.shadow.camera.left = -30;
directionalLight.shadow.camera.right = 30;
directionalLight.shadow.camera.top = 30;
directionalLight.shadow.camera.bottom = -30;
// Optional: Add bias to prevent shadow acne
directionalLight.shadow.bias = 0.001;
renderer.shadowMap.enabled = true; // <-- Add this
renderer.shadowMap.type = THREE.PCFShadowMap; // Optional: for smoother shadows
directionalLight.castShadow = true;
scene.add(directionalLight);
let previousTime = 0;

let animationId;
let getAnimationId = false;
function animate(currentTime) {
  //stats.begin();
  const deltaTime = currentTime - previousTime;
  if (stack_anim_playing) {
    playMatchAnimation(currentTime, deltaTime);
  }
  if (isdestroyingDeck) {
    destroyDeck(currentTime);
  }
  renderer.render(scene, camera);
  previousTime = currentTime;
  //stats.end();
}

////////////////////////////////////Function Declarations
function deckGenerator(
  geometry,
  position,
  instanceCount,
  Yrot,
  _colorParcel,
  stepHeight,
) {
  let hexModel = geometry;
  let instancedMesh = createInstancedMesh(
    hexModel,
    hexMaterial,
    instanceCount,
    new THREE.Vector3(0, 0, 0),
    Yrot,
    stepHeight,
  );
  const ICgt5 = instanceCount > 3;
  const colorArray = new Float32Array(instanceCount * 3); // r, g, b for each instance
  let _color; // = new THREE.Color().setHex(colors[Math.floor(Math.random() * 10)]);
  let _hex_color = Math.round(Math.random() * 10) % hexagonColors.length;
  if (!ICgt5) {
    _color = new THREE.Color().setHex(hexagonColors[_colorParcel]);
  }
  for (let i = 0; i < instanceCount; i++) {
    if (ICgt5) {
      if (i >= 3) {
        _color = new THREE.Color().setHex(hexagonColors[_colorParcel]);
      } else {
        _color = new THREE.Color().setHex(hexagonColors[_hex_color]);
      }
    }
    colorArray[i * 3] = _color.r;
    colorArray[i * 3 + 1] = _color.g;
    colorArray[i * 3 + 2] = _color.b;
  }
  const instanceColor = new THREE.InstancedBufferAttribute(colorArray, 3);
  //  console.log(instanceColor);
  instancedMesh.instanceColor = instanceColor;
  instancedMesh.instanceColor.needsUpdate = true;
  instancedMesh.castShadow = true;
  instancedMesh.receiveShadow = true;
  instancedMesh.position.set(position.x, position.y, position.z);
  return instancedMesh;
}

function deckGeneratorUniform(
  geometry,
  position,
  instanceCount,
  Yrot,
  _colorParcel,
  stepHeight,
) {
  let hexModel = geometry;
  let instancedMesh = createInstancedMesh(
    hexModel,
    hexMaterial,
    instanceCount,
    new THREE.Vector3(0, 0, 0),
    Yrot,
    stepHeight,
  );

  const colorArray = new Float32Array(instanceCount * 3); // r, g, b for each instance
  let _color; // = new THREE.Color().setHex(colors[Math.floor(Math.random() * 10)]);
  let _hex_color = Math.round(Math.random() * 10) % hexagonColors.length;
  _color = new THREE.Color().setHex(hexagonColors[_colorParcel]);

  for (let i = 0; i < instanceCount; i++) {
    colorArray[i * 3] = _color.r;
    colorArray[i * 3 + 1] = _color.g;
    colorArray[i * 3 + 2] = _color.b;
  }
  const instanceColor = new THREE.InstancedBufferAttribute(colorArray, 3);
  //  console.log(instanceColor);
  instancedMesh.instanceColor = instanceColor;
  instancedMesh.instanceColor.needsUpdate = true;
  instancedMesh.castShadow = true;
  instancedMesh.receiveShadow = true;
  instancedMesh.position.set(position.x, position.y, position.z);
  return instancedMesh;
}

function deckGeneratorCA(
  geometry,
  position,
  instanceCount,
  Yrot,
  _colorArray,
  stepHeight,
) {
  let hexModel = geometry;
  let instancedMesh = createInstancedMesh(
    hexModel,
    hexMaterial,
    instanceCount,
    new THREE.Vector3(0, 0, 0),
    Yrot,
    stepHeight,
  );

  const colorArray = new Float32Array(instanceCount * 3); // r, g, b for each instance
  let _color; // = new THREE.Color().setHex(colors[Math.floor(Math.random() * 10)]);

  for (let i = 0; i < instanceCount; i++) {
    _color = new THREE.Color().setHex(_colorArray[i]);

    colorArray[i * 3] = _color.r;
    colorArray[i * 3 + 1] = _color.g;
    colorArray[i * 3 + 2] = _color.b;
  }
  const instanceColor = new THREE.InstancedBufferAttribute(colorArray, 3);
  //  console.log(instanceColor);
  instancedMesh.instanceColor = instanceColor;
  instancedMesh.instanceColor.needsUpdate = true;
  instancedMesh.castShadow = true;
  instancedMesh.receiveShadow = true;
  instancedMesh.position.set(position.x, position.y, position.z);
  return instancedMesh;
}

let dummy = new THREE.Object3D();
const tilescale = GameElements.Tile.scale;
dummy.scale.set(tilescale.x, tilescale.y, tilescale.z);

function createInstancedMesh(
  geometry,
  material,
  count,
  origin,
  Yrot,
  stepHeight,
) {
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  for (let i = 0; i < count; i++) {
    const x = origin.x;
    const y = origin.y + i * stepHeight;
    const z = origin.z;

    dummy.position.set(x, y, z);
    dummy.rotation.x = Math.PI / 2;
    dummy.rotation.z = Yrot;
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  scene.add(mesh);
  return mesh;
}

function createBase(geometry, dimX, dimY) {
  let offsetX;

  const instancedMesh = new THREE.InstancedMesh(
    geometry,
    baseMaterial,
    dimX * dimY,
  );
  let index = 0;

  //instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // Optional for performance if matrices will change

  for (let indY = -dimY / 2; indY < dimY / 2; indY++) {
    if (indY % 2 === 0) {
      offsetX = 0;
    } else {
      offsetX = mesh_length * 0.75;
    }
    const posy = -mesh_height / 2 - 0.001;
    for (let indX = -dimX / 2; indX < dimX / 2; indX++) {
      const dummy = new THREE.Object3D();
      dummy.position.x = offsetX + indX * spacingX;
      dummy.position.y = posy;
      dummy.position.z = indY * spacingY;
      dummy.rotation.x = Math.PI / 2;
      dummy.updateMatrix();

      // Set the instance matrix
      instancedMesh.setMatrixAt(index, dummy.matrix);
      index++;
    }
  }
  scene.add(instancedMesh);
  instancedMesh.castShadow = true;
  instancedMesh.receiveShadow = true;
  instancedMesh.instanceMatrix.needsUpdate = true;
}

// Cube animation using beziers
// Create the cube
//const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);

let spacingX = 3.1935081481933594;
let spacingY = 0.9660263061523438;

function createHexArray(geometry, dimX, dimY, maxHeight) {
  for (let indY = -dimY / 2; indY < dimY / 2; indY++) {
    let offsetX;
    let row = [];
    if (indY % 2 === 0) {
      offsetX = 0;
    } else {
      offsetX = mesh_length * 0.75;
    }

    const offX = spacingX;
    const offZ = spacingY;

    for (let indX = -dimX / 2; indX < dimX / 2; indX++) {
      //let deckHeight = Math.round(maxHeight * Math.random()); // Assign Random heights for decks
      let deck;
      let X = offsetX + indX * offX;
      let Z = indY * offZ;

      if (indY === 8 && indX === 0) {
        deck = deckGeneratorUniform(
          geometry,
          new THREE.Vector3(
            X,
            0,
            Z,
          ),
          0,
          0,
          _hex_array_color[indY + dimY / 2][indX + dimX / 2]%hexagonColors.length,
          mesh_height,
        );
      } else {
        deck = deckGeneratorUniform(
          geometry,
          new THREE.Vector3(
            X,
            0,
            Z,
          ),
          randBelow10(),
          0,
          _hex_array_color[indY + dimY / 2][indX + dimX / 2]%hexagonColors.length,
          mesh_height,
        );
      }
      row.push(deck);
      fixedElements.push(deck);
    }
    hex_ref_array.push(row);
  }
}

////////// End of cube animation using beziers
//                              Mouse Input

let first_tap = true;
function onPointerDown(event) {
  if(first_tap){
    first_tap = false;
    setTimeout(() => {
      showCTA();
    }, window.game_object.Cta.endTime * 1000);
  }
  if (audioUnintialized) {
    if (audioContext.state === "suspended") {
      audioContext.resume();
      music.play();
      audioUnintialized = false;
    }
    hand.visible = false;

    //music.play();
  }
  mouseDown = true;
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(selectableDecks, true);
  //console.log(isdestroyingDeck, stack_anim_playing);
  if (intersects.length > 0) {
    //console.log(intersects[0].point);
    selectedDeck = intersects[0].object;
    selectedDeckPosBackup = { ...selectedDeck.position }; // Making a copy of the array
    intersects[0].object.position.setY(3);
    drop_sound.play();
  }

  mousePrev = pointer.x;
}

function onPointerMove(event) {
  if (mouseDown && selectedDeck) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(fixedElements, true);
    if (intersects.length > 0) {
      intersection = intersects[0];
      //console.log(intersection.object.count);
      if (intersection.object.count === undefined) {
        for (let i = 0; i < hex_ref_array.length; i++) {
          for (let j = 0; j < hex_ref_array[i].length; j++) {
            let hex = hex_ref_array[i][j];
            if (
              Math.abs(hex.position.x - selectedDeck.position.x) <
                mesh_length_by2 &&
              Math.abs(hex.position.z - selectedDeck.position.z) <
                mesh_breadth_by2
            ) {
              placementHelperMesh.position.copy(
                hex_ref_array[i][j].position
                  .clone()
                  .add(new THREE.Vector3(0, 0, 0)),
              );
              placementHelperMesh.visible = true;
              break;
            } else {
            }
          }
        }
      } else {
        //console.log("placemnet_helper invisible");
        placementHelperMesh.visible = false;
      }
      //console.log(intersection.object.position);

      hoverPos = intersection.point.clone();
      selectedDeck.position.set(hoverPos.x, hoverPos.y + 2, hoverPos.z);
    }

    mousePrev = pointer.x;
  }
}

function onPointerUp(event) {
  mouseDown = false;
  if (selectedDeck) {
    if (hoverPos) {
      selectedDeck.position.set(hoverPos.x, hoverPos.y, hoverPos.z);
      //console.log(selectedDeck);
      placementHelperMesh.visible = false;
      placingFunction();
    } else {
      selectedDeck.position.copy(selectedDeckPosBackup);
    }
    selectedDeckPosBackup = null;
    selectedDeck = null;
  }
  //console.log(matches);
}

//                          Touch Input
function onTouchStart(event) {
  //event.preventDefault(); // Prevent default touch behaviors like scrolling

  if (hand.visible) {
    hand.visible = false;
    //music.play();
  }

  mouseDown = true;

  // Get the first touch point
  const touch = event.touches[0];
  pointer.x = (touch.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(touch.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(selectableDecks, true);

  if (intersects.length > 0) {
    selectedDeck = intersects[0].object;
    selectedDeckPosBackup = { ...selectedDeck.position }; // Making a copy of the array
    intersects[0].object.position.setY(3);
    drop_sound.play();
    hoverPos = intersects[0].point.clone();
  }

  mousePrev = pointer.x;
}

function onTouchMove(event) {
  //event.preventDefault(); // Prevent scrolling while dragging

  if (mouseDown && selectedDeck) {
    // Get the first touch point
    const touch = event.touches[0];
    pointer.x = (touch.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(touch.clientY / window.innerHeight) * 2 + 1 + 0.1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(fixedElements, true);

    if (intersects.length > 0) {
      intersection = intersects[0];
      if (intersection.object.count === undefined) {
        for (let i = 0; i < hex_ref_array.length; i++) {
          for (let j = 0; j < hex_ref_array[i].length; j++) {
            let hex = hex_ref_array[i][j];
            if (
              Math.abs(hex.position.x - selectedDeck.position.x) <
                mesh_length_by2 &&
              Math.abs(hex.position.z - selectedDeck.position.z) <
                mesh_breadth_by2
            ) {
              placementHelperMesh.position.copy(
                hex_ref_array[i][j].position
                  .clone()
                  .add(new THREE.Vector3(0, 0, 0)),
              );
              placementHelperMesh.visible = true;
              break;
            } else {
            }
          }
        }
      } else {
        //console.log("placemnet_helper invisible");
        placementHelperMesh.visible = false;
      }

      hoverPos = intersection.point.clone();
      selectedDeck.position.set(hoverPos.x, hoverPos.y + 2, hoverPos.z);
    }

    mousePrev = pointer.x;
  }
}

function onTouchEnd(event) {
  //event.preventDefault();
  mouseDown = false;

  if (selectedDeck) {
    if (hoverPos) {
      selectedDeck.position.set(hoverPos.x, hoverPos.y, hoverPos.z);
      placementHelperMesh.visible = false;
      placingFunction();
    } else {
      selectedDeck.position.copy(selectedDeckPosBackup);
    }
    selectedDeckPosBackup = null;
    selectedDeck = null;
  }
}

function placingFunction() {
  let notPlaced = true;

  for (let i = 0; i < hex_ref_array.length; i++) {
    for (let j = 0; j < hex_ref_array[i].length; j++) {
      let hex = hex_ref_array[i][j];
      if (
        Math.abs(hex.position.x - selectedDeck.position.x) < mesh_length_by2 &&
        Math.abs(hex.position.z - selectedDeck.position.z) < mesh_length_by2
      ) {
        //console.log(hex.count);
        if (hex.count === 0) {
          selectedDeck.position.copy(hex.position);

          //console.log(selectedDeck.position);
          notPlaced = false;
          for (let i = 0; i < fixedElements.length; i++) {
            if (fixedElements[i] === hex) {
              fixedElements[i] = selectedDeck; // Directly assign to the array index
            }
          }
          hex_ref_array[i][j] = selectedDeck;

          scene.remove(hex);
          //console.log(stack_anim_playing, isdestroyingDeck);
          selectableDecks = removeFromArray(selectableDecks, selectedDeck);
          if (!stack_anim_playing && !isdestroyingDeck) {
            checkForMatchesEveryWhere();
          }
          if (selectableDecks.length === 0) {
            bringNewDecks();
          }
        }
      }
    }
  }

  if (notPlaced) {
    selectedDeck.position.set(
      selectedDeckPosBackup.x,
      selectedDeckPosBackup.y,
      selectedDeckPosBackup.z,
    );
  }
}

function findAndStage(i, j) {
  //console.log("find and stage called");
  if (hasMatchesNearBY([i, j])) {
    matches = [];
    matches = findAllMatchesRecursive(i, j);
    fromDeckIndex = getTheOutermostElement(matches);
    toDeckIndex = getMatchesNearBY(fromDeckIndex);
    stagingAMatch(fromDeckIndex, toDeckIndex);

    //console.log("find and stage worked");
    return true;
  } else {
    return false;
  }
}

function bringNewDecks() {
  setTimeout(() => {
    addToSelectableDecks();
    //console.log("added");
  }, 500);
}

function addToSelectableDecks() {
  const color1 = Math.round(
    Math.round(hexagonColors.length * Math.random()) % hexagonColors.length,
  );
  const color2 = Math.round(
    Math.round(hexagonColors.length * Math.random()) % hexagonColors.length,
  );
  const color3 = Math.round(
    Math.round(hexagonColors.length * Math.random()) % hexagonColors.length,
  );
  const deck1 = deckGenerator(
    model_mesh,
    selectableDeckPos[0].clone().add(new THREE.Vector3(24, 0, 0)),
    7,
    0,
    color1,
    mesh_height,
  );
  const deck2 = deckGeneratorUniform(
    model_mesh,
    selectableDeckPos[1].clone().add(new THREE.Vector3(28, 0, 0)),
    7,
    0,
    color2,
    mesh_height,
  );
  const deck3 = deckGeneratorUniform(
    model_mesh,
    selectableDeckPos[2].clone().add(new THREE.Vector3(32, 0, 0)),
    8,
    0,
    color3,
    mesh_height,
  );
  selectableDecks.push(deck1, deck2, deck3);

  gsap.to(selectableDecks[0].position, {
    x: selectableDeckPos[0].x,
    y: selectableDeckPos[0].y,
    z: selectableDeckPos[0].z,
    duration: 0.5,
    ease: "elastic(0.1, 0.4)",
    onUpdate: () => {},
  });

  gsap.to(selectableDecks[1].position, {
    x: selectableDeckPos[1].x,
    y: selectableDeckPos[1].y,
    z: selectableDeckPos[1].z,
    duration: 0.5,
    ease: "elastic(0.1, 0.4)",
    onUpdate: () => {},
  });

  gsap.to(selectableDecks[2].position, {
    x: selectableDeckPos[2].x,
    y: selectableDeckPos[2].y,
    z: selectableDeckPos[2].z,
    duration: 0.5,
    ease: "elastic(0.1, 0.4)",
    onUpdate: () => {},
  });
}

function removeFromArray(Array, element) {
  return Array.filter((item) => item !== element);
}

function randBelow10() {
  return Math.max(2, Math.ceil(5 * Math.random()));
}

function checkForMatches() {
  for (let i = 0; i < hex_ref_array.length; i++) {
    for (let j = 0; j < hex_ref_array[i].length; j++) {
      if (hasMatches(i, j)) {
        Matches.push([i, j]);
        //console.log(i, j);
      }
    }
  }
  //console.log(findSimpleLineSegments(Matches));
}

//      finds only the nearby matches
function getMatchesNearBY(arr) {
  let matchGraph;
  let neighbors;
  const y = arr[0];
  const x = arr[1];
  let hexColor = getGreenComponent(hex_ref_array[y][x]);
  if (y % 2 === 0) {
    neighbors = [
      [y - 1, x - 1],
      [y - 1, x],
      [y + 1, x - 1],
      [y + 1, x],
      [y - 2, x],
      [y + 2, x],
    ];
  } else {
    neighbors = [
      [y - 1, x],
      [y - 1, x + 1],
      [y + 1, x],
      [y + 1, x + 1],
      [y - 2, x],
      [y + 2, x],
    ];
  }

  // Check each neighbor
  for (let [neighborY, neighborX] of neighbors) {
    //console.log(neighborY, neighborX);
    if (hex_ref_array[neighborY] && hex_ref_array[neighborY][neighborX]) {
      let thisHexColor = getGreenComponent(hex_ref_array[neighborY][neighborX]);

      if (thisHexColor === hexColor) {
        matchGraph = [neighborY, neighborX];
        return matchGraph;
      }
    }
  }
}

function hasMatchesNearBY(arr) {
  let neighbors;
  const y = arr[0];
  const x = arr[1];
  let hexColor = getGreenComponent(hex_ref_array[y][x]);
  if (y % 2 === 0) {
    neighbors = [
      [y - 1, x - 1],
      [y - 1, x],
      [y + 1, x - 1],
      [y + 1, x],
      [y - 2, x],
      [y + 2, x],
    ];
  } else {
    neighbors = [
      [y - 1, x],
      [y - 1, x + 1],
      [y + 1, x],
      [y + 1, x + 1],
      [y - 2, x],
      [y + 2, x],
    ];
  }
  // Check each neighbor
  for (let [neighborY, neighborX] of neighbors) {
    //console.log(neighborY, neighborX);
    if (hex_ref_array[neighborY] && hex_ref_array[neighborY][neighborX]) {
      let thisHexColor = getGreenComponent(hex_ref_array[neighborY][neighborX]);

      if (thisHexColor === hexColor) {
        return true;
      }
    }
  }
  return false;
}

// Recursive
function findAllMatchesRecursive(y, x, match_graph = [], visited = new Set()) {
  let matchGraph = Array.isArray(match_graph) ? match_graph : [];
  let visitedSet = visited instanceof Set ? visited : new Set();

  // Create unique key for this position
  let posKey = `${y},${x}`;
  if (visitedSet.has(posKey)) {
    leafVertex = [y, x];
    return matchGraph;
  }
  visitedSet.add(posKey);
  let hexColor = getGreenComponent(hex_ref_array[y][x]);

  if (hexColor === undefined) {
    //console.log("deck is empty");
    return null;
  }
  // Define hexagonal neighbors based on row parity
  let neighbors;
  if (y % 2 === 0) {
    neighbors = [
      [y - 1, x - 1],
      [y - 1, x],
      [y + 1, x - 1],
      [y + 1, x],
      [y - 2, x],
      [y + 2, x],
    ];
  } else {
    neighbors = [
      [y - 1, x],
      [y - 1, x + 1],
      [y + 1, x],
      [y + 1, x + 1],
      [y - 2, x],
      [y + 2, x],
    ];
  }

  // Check each neighbor
  for (let [neighborY, neighborX] of neighbors) {
    //console.log(neighborY, neighborX);
    if (hex_ref_array[neighborY] && hex_ref_array[neighborY][neighborX]) {
      let thisHexColor = getGreenComponent(hex_ref_array[neighborY][neighborX]);

      if (thisHexColor === hexColor) {
        let neighborKey = `${neighborY},${neighborX}`;
        if (!visitedSet.has(neighborKey)) {
          if (matchGraph.length === 0) {
            matchGraph.push([y, x]);
          }
          matchGraph.push([neighborY, neighborX]);
          // Recursively find matches from this neighbor
          findAllMatchesRecursive(neighborY, neighborX, matchGraph, visitedSet);
        }
      }
    }
  }
  if (matchGraph.length === 0) {
    return null;
  } else {
    return matchGraph;
  }
}

function getGreenComponent(instancedMesh) {
  // Returns the green component of the topmost element
  if (instancedMesh.instanceColor) {
    // Green component is at index (instanceIndex * 3 + 1)
    let instanceIndex = instancedMesh.count - 1;
    const greenValue = instancedMesh.instanceColor.array[instanceIndex * 3 + 1];
    return greenValue;
  }
  return null;
}

function getGreenComponentOfIndex(instancedMesh, index) {
  // Returns the green component of the topmost element
  if (instancedMesh.instanceColor) {
    // Green component is at index (instanceIndex * 3 + 1)
    let instanceIndex = index;
    const greenValue = instancedMesh.instanceColor.array[instanceIndex * 3 + 1];
    return greenValue;
  }
  return null;
}

function rgbToHex(r, g, b) {
  const color = new THREE.Color();
  color.setRGB(r, g, b); // Normalize 0-255 to 0-1
  return "0x" + color.getHexString();
}

function getColorOfIndex(instancedMesh, index) {
  // Returns the green component of the topmost element
  if (instancedMesh.instanceColor) {
    // Green component is at index (instanceIndex * 3 + 1)
    let instanceIndex = index;
    const redValue = instancedMesh.instanceColor.array[instanceIndex * 3];
    const greenValue = instancedMesh.instanceColor.array[instanceIndex * 3 + 1];
    const blueValue = instancedMesh.instanceColor.array[instanceIndex * 3 + 2];
    return rgbToHex(redValue, greenValue, blueValue);
  }
  return null;
}

function stagingAMatch(fromId, toId) {
  stack_anim_playing = true;
  fromDeck = hex_ref_array[fromId[0]][fromId[1]];
  toDeck = hex_ref_array[toId[0]][toId[1]];
  matchedUpto = fromDeck.count - 1;
  matchColor = getColorOfIndex(fromDeck, fromDeck.count - 1);
  pieceTimeArray = [];
  matchPathCurve = [];
  pieceTimeArray.push(0);
  const fromDeckHeight = fromDeck.count * mesh_height;
  const toDeckHeight = toDeck.count * mesh_height;
  const curvePosFrom = new THREE.Vector3(
    fromDeck.position.x,
    fromDeck.position.y + fromDeckHeight,
    fromDeck.position.z,
  );
  const curvePosTo = new THREE.Vector3(
    toDeck.position.x,
    toDeck.position.y + toDeckHeight,
    toDeck.position.z,
  );

  //matchPathTime = 0;
  if (fromDeck.count > 1) {
    let _top_color = getGreenComponent(fromDeck);
    let _is_uniform = true;
    matchUntil = fromDeck.count - 1;
    for (let i = fromDeck.count - 2; i >= 0; i--) {
      if (getGreenComponentOfIndex(fromDeck, i) === _top_color) {
        matchUntil = i;
      }
    }
  } else {
    matchUntil = fromDeck.count - 1;
  }

  for (let i = 0; i < fromDeck.count - matchUntil; i++) {
    const ixmesh_height = i * mesh_height;
    matchPathCurve.push(
      new THREE.CubicBezierCurve3(
        new THREE.Vector3(
          curvePosFrom.x,
          curvePosFrom.y - ixmesh_height,
          curvePosFrom.z,
        ), // Start point
        new THREE.Vector3(
          curvePosFrom.x,
          curvePosFrom.y + 3 + ixmesh_height,
          curvePosFrom.z,
        ), // Control point 1
        new THREE.Vector3(
          curvePosTo.x,
          curvePosTo.y + 3 + ixmesh_height,
          curvePosTo.z,
        ), // Control point 2
        new THREE.Vector3(
          curvePosTo.x,
          curvePosTo.y + ixmesh_height,
          curvePosTo.z,
        ), // End point
      ),
    );
  }
  //console.log(matchUntil);
}

function playMatchAnimation(curTime, deltaTime) {
  const dummy = new THREE.Object3D();
  if (!matchAnimataionHelper) {
    matchAnimataionHelper = curTime;
  }
  let animation_played = false;
  // Initial positions
  if (matchedUpto > matchUntil) {
    if (curTime - matchAnimataionHelper > 50) {
      pieceTimeArray.push(0);
      matchedUpto--;
      //flip_sound.play();
      matchAnimataionHelper = curTime;
    }
  }
  for (let i = fromDeck.count - 1; i >= matchedUpto; i--) {
    const index_ptarr = fromDeck.count - 1 - i;
    const position = fromDeck.worldToLocal(
      matchPathCurve[index_ptarr].getPoint(pieceTimeArray[index_ptarr]),
    );
    const tangent = matchPathCurve[index_ptarr].getTangent(
      pieceTimeArray[index_ptarr],
    );
    if (pieceTimeArray[index_ptarr] < 1) {
      animation_played = true;
      pieceTimeArray[index_ptarr] += 0.004 * deltaTime;
      if (1 - pieceTimeArray[index_ptarr] < 0.01) {
        pieceTimeArray[index_ptarr] = 1;
        flip_sound.play();
      }
    } else if (index_ptarr === matchedUpto) {
      //flip_sound.play();
    }

    // Set position, rotation, scale for each instance
    fromDeck.getMatrixAt(i, dummy.matrix);
    dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
    dummy.position.copy(position);
    dummy.lookAt(dummy.position.clone().add(tangent));
    // Update the dummy's matrix and apply it to the instanced mesh
    dummy.updateMatrix();
    fromDeck.setMatrixAt(i, dummy.matrix);
    //console.log(i);
  }
  // checks if animation has stopped playing
  if (!animation_played) {
    //updateFixedElementsArray(toDeck, fromDeck);
    stack_anim_playing = false;
    //isdestroyingDeck = false;
    pieceTimeArray = [];
    let _to_deck_CA = copyMatchedDeckData(); //copies colors
    let newDeck = deckGeneratorCA(
      model_mesh,
      toDeck.position,
      _to_deck_CA.length,
      0,
      _to_deck_CA,
      mesh_height,
    );
    hex_ref_array[toDeckIndex[0]][toDeckIndex[1]] = newDeck;
    updateFixedElementsArray(toDeck, newDeck);
    scene.remove(toDeck);
    toDeck = newDeck;

    if (matchUntil === 0) {
      fromDeck.count = 0;
    } else {
      fromDeck.count = matchUntil; //have to replace deck

      let _remaining_colors = copyRemainingDeckData(fromDeck);
      let replacing = deckGeneratorCA(
        model_mesh,
        fromDeck.position,
        _remaining_colors.length,
        0,
        _remaining_colors,
        mesh_height,
      );
      for (let i = 0; i < fixedElements.length; i++) {
        if (fixedElements[i] === fromDeck) {
          fixedElements[i] = replacing; // Directly assign to the array index
        }
      }
      hex_ref_array[fromDeckIndex[0]][fromDeckIndex[1]] = replacing;
      scene.remove(fromDeck);
      fromDeck = replacing;

      // if (!findAndStage(toDeckIndex[0], toDeckIndex[1])) {
      //   console.log("interfere match");
      //   findAndStage(fromDeckIndex[0], fromDeckIndex[1]);
      // }
    }
    //console.log("deck_height", toDeck.count);

    fromDeck = null;
    toDeck = null;
    if (checkForMatchesEveryWhere()) {
      // console.log("match found by global checker");
    }
  }
  if (fromDeck) {
    fromDeck.instanceMatrix.needsUpdate = true;
    toDeck.instanceMatrix.needsUpdate = true;
  }
  // Important: Mark the instance matrix as needing update
}

function hasTouchInput() {
  // Check for touch events support
  if ("ontouchstart" in window) {
    return true;
  } else {
    return false;
  }
}

function destroyDeck(_time) {
  if (_time - destroyDeckTimer > 50) {
    odds += 1;
    if (odds % 3 === 0) {
      destroyDeckTimer = _time;
      if (destroyingDeck.count > 0) {
        if (
          gc_of_destroyingDeck ===
          getGreenComponentOfIndex(destroyingDeck, destroyingDeck.count - 1)
        ) {
          //console.log("destroying Deck");
          destroyingDeck.count--;
          if (destroyingDeck.count <= 0) {
            isdestroyingDeck = false;
            checkForMatchesEveryWhere();
            odds = 0;
            return;
          }
          if (destroyingDeck.count === 2) {
            particlesMesh.position.copy(destroyingDeck.position);
            particlesMesh.visible = true;
            gsap.to(particlesMesh.scale, {
              x: 1.3,
              y: 1.3,
              z: 1.3,
              duration: 0.1,
              ease: "power2",
              onComplete: () => {
                particlesMesh.scale.setScalar(1);
                particlesMesh.visible = false;
              },
            });
          }
          delete_sound.play();
        } else {
          isdestroyingDeck = false;
          checkForMatchesEveryWhere();
        }
      } else {
        isdestroyingDeck = false;
        checkForMatchesEveryWhere();
      }
    } else {
      if (destroyingDeck) {
        if (destroyingDeck.count <= 0) {
          isdestroyingDeck = false;
          checkForMatchesEveryWhere();
          odds = 0;
          return;
        }
        if (
          gc_of_destroyingDeck ===
          getGreenComponentOfIndex(destroyingDeck, destroyingDeck.count - 1)
        ) {
          scaleInstance(destroyingDeck, destroyingDeck.count - 1);
        }
      }
    }
  }
}

function copyMatchedDeckData() {
  const toDinstC = toDeck.count;
  //console.log("deckheight", toDinstC);
  let colors = [];
  //copy toDeck colors
  for (let i = 0; i < toDinstC; i++) {
    colors.push(getColorOfIndex(toDeck, i));
  }

  for (let i = 0; i < fromDeck.count - matchUntil; i++) {
    colors.push(matchColor);
  }
  //console.log(colors);
  return colors;
}

function copyRemainingDeckData(Deck) {
  const fromDinstC = Deck.count;
  //console.log("deckheight", toDinstC);
  let colors = [];
  //copy toDeck colors
  for (let i = 0; i < fromDinstC; i++) {
    colors.push(getColorOfIndex(Deck, i));
  }
  //console.log(colors);
  return colors;
}

//console.log(supports_touch_input);

function scaleInstance(instancedMesh, instanceId) {
  // Create a temporary matrix and vector for calculations
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();

  // Get the current transform of the instance
  instancedMesh.getMatrixAt(instanceId, matrix);

  // Decompose the matrix into position, rotation and scale
  matrix.decompose(position, quaternion, scale);

  // Apply scaling

  // Scale along specific axis if provided
  scale.x = scale.x * 0.8;
  //scale.z *= 0.25;
  scale.y = scale.y * 0.8;
  if (scale.x < 0.7 && scale.x > 0.4) {
    if (
      getGreenComponentOfIndex(instancedMesh, instanceId - 1) ===
      getGreenComponentOfIndex(instancedMesh, instanceId)
    ) {
      scaleInstance(instancedMesh, instanceId - 1);
    }
  }

  // Recompose the matrix with new scale
  matrix.compose(position, quaternion, scale);

  // Update the instance's matrix
  instancedMesh.setMatrixAt(instanceId, matrix);

  // Mark the instance as needing update
  instancedMesh.instanceMatrix.needsUpdate = true;
}

function doesColorAppear10Times(mesh_instance) {
  let count = 0;
  let color = getGreenComponentOfIndex(mesh_instance, mesh_instance.count - 1);
  for (let i = mesh_instance.count - 1; i > -1; i--) {
    if (color === getGreenComponentOfIndex(mesh_instance, i)) {
      count++;
      if (count >= 10) {
        return true;
      }
    } else {
      return false;
    }
  }
}

function isUniformDeck(mesh_instance) {
  let count = 0;
  let color = getGreenComponentOfIndex(mesh_instance, mesh_instance.count - 1);
  for (let i = mesh_instance.count - 1; i > -1; i--) {
    if (color === getGreenComponentOfIndex(mesh_instance, i)) {
      count++;
      if (count >= 10) {
        return true;
      }
    } else {
      return false;
    }
  }
}

function getTheOutermostElement(arr) {
  // Finding the center
  let y = 0;
  let x = 0;
  let count = 100;
  for (let point of arr) {
    y += point[0];
    x += point[1];
  }
  y = y / arr.length;
  x = x / arr.length;
  const center = [y, x];
  // Finding the array
  let max_distance = 0;
  let point_of_max_distance = arr[0];
  for (let point of arr) {
    const dist = distanceBetween(point, center);
    if (dist > max_distance && point != center) {
      max_distance = dist;
      point_of_max_distance = point;
    }
  }

  return point_of_max_distance;
}

function distanceBetween(arr1, arr2) {
  //return Math.sqrt((arr1[0] - arr2[0]) ** 2, (arr1[1] - arr2[1]) ** 2);
  const pos1 = hex_ref_array[arr1[0]][arr1[1]].position.clone();
  const pos2 =
    hex_ref_array[Math.round(arr2[0])][Math.round(arr2[1])].position.clone();
  return pos1.distanceTo(pos2);
}

function updateFixedElementsArray(_from, _with) {
  for (let i = 0; i < fixedElements.length; i++) {
    if (fixedElements[i] === _from) {
      fixedElements[i] = _with; // Directly assign to the array index
    }
  }
}

function checkForMatchesEveryWhere() {
  matches = [];
  let min_height = 1;
  for (let i = 0; i < hex_ref_array.length; i++) {
    for (let j = 0; j < hex_ref_array[i].length; j++) {
      const deck = hex_ref_array[i][j];
      if (deck.count) {
        min_height = Math.min(min_height, deck.count);
        // console.log(min_height);
        if (!isdestroyingDeck) {
          if (findAndStage(i, j)) {
            //console.log("matches found");
            return;
          }
        }
        if (deck.count >= 10 && !isdestroyingDeck) {
          if (doesColorAppear10Times(deck)) {
            //console.log("full decks exist");
            isdestroyingDeck = true;
            destroyingDeck = deck;
            gc_of_destroyingDeck = getGreenComponentOfIndex(
              destroyingDeck,
              destroyingDeck.count - 1,
            );
            //stack_anim_playing = false;
            // console.log("yes");
            //fromDeck = null;
            //toDeck = null;
            return;
          }
        }
      } else {
        min_height = Math.min(min_height, 0);
      }
    }
  }

  if (min_height > 0) {
    showCTA();
  }
}


function showCTA() {
  //textOnTop.classList.add("hidden");
  //ctaScreen.classList.remove("hidden");
  ctaScreen.style.display = "flex";
  getAnimationId = true;
  renderer.setAnimationLoop(null);
  if (supports_touch_input) {
    // console.log("TouchInput Added");
    document.removeEventListener("touchstart", onTouchStart);
    document.removeEventListener("touchmove", onTouchMove);
    document.removeEventListener("touchend", onTouchEnd);
    document.removeEventListener("touchcancel", onTouchEnd); // To account for interruptions
  } else {
    //console.log("pointer");
    // console.log("mouseInput Added");
    document.removeEventListener("pointerdown", onPointerDown);
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
    document.removeEventListener("pointercancel", onPointerUp);
  }
  play_button = document.getElementById("play-button");
  setTimeout(() => {
    play_button.classList.add("play-button");
  }, 300);
}

function stopRendering() {
  if (animationId) {
    renderer.setAnimationLoop(null);
  }
}



function createCTA(){
  console.log("Create CTA called");
  // Create the parent div
  const ctaDiv = document.createElement("div");
  ctaDiv.id = "CTA";

  // Create the Icon image
  const iconImg = document.createElement("img");
  iconImg.id = "Icon";
  iconImg.src = cta.icon.data;

  // Create the Text image
  const textImg = document.createElement("img");
  textImg.id = "Text";
  textImg.src = cta.text.data;

  // Create the Play Button image
  const playButton = document.createElement("img");
  playButton.id = "play-button";
  playButton.src = cta.playButton.data;

  // Append images to the parent div
  ctaDiv.appendChild(iconImg);
  ctaDiv.appendChild(textImg);
  ctaDiv.appendChild(playButton);

  // Add the whole div to the document (e.g., inside body)
  document.body.appendChild(ctaDiv);


  const play_button = document.getElementById("play-button");
  play_button.addEventListener("click", window.openStoreLink);

  cta_screen = document.getElementById("CTA");
  ctaScreen = document.getElementById("CTA");
  //textOnTop = document.getElementById("text-on-top");

}