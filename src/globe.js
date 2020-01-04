import * as THREE from 'three';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { TrackballControls } from 'three-trackballcontrols-ts';


function checkMaterial(object) {
  if (object.material) {
    const materialName = object.material.name;
    if (materialName === 'canvas') {
      return true;
    }
  }
  return false;
}

function parseHashCoords() {
  try {
    const { hash } = window.location;
    const array = hash.substring(1).split(',');
    const ident = array.shift();
    const [id, size, x, y] = array.map((z) => parseInt(z, 10));
    if (!ident || isNaN(x) || isNaN(y) || isNaN(id) || isNaN(size)) {
      throw new Error('NaN');
    }
    return [ident, id, size, x, y];
  } catch (error) {
    return ['d', 0, 65536, 0, 0];
  }
}

function rotateToCoords(canvasSize, object, coords) {
  const [x, y] = coords;
  const rotOffsetX = 0;
  const rotOffsetY = 3 * Math.PI / 2;
  const rotX = -y * Math.PI / canvasSize;
  const rotY = -x * 2 * Math.PI / canvasSize;
  object.rotation.x += rotOffsetX + rotX;
  object.rotation.y += rotOffsetY + rotY;
}


document.addEventListener('DOMContentLoaded', () => {
  const webglEl = document.getElementById('webgl');

  const [canvasIdent, canvasId, canvasSize, x, y] = parseHashCoords();

  const canvasTexture = new THREE.MeshPhongMaterial({
    map: new THREE.TextureLoader().load(`./tiles/${canvasId}/texture.png`),
    bumpMap: new THREE.TextureLoader().load(`./assets3d/normal${canvasId}.jpg`),
    bumpScale: 0.02,
    specularMap: new THREE.TextureLoader()
      .load(`./assets3d/specular${canvasId}.jpg`),
    specular: new THREE.Color('grey'),
  });

  let width = window.innerWidth;
  let height = window.innerHeight;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000);
  camera.position.z = 4.0;

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(width, height);

  scene.add(new THREE.AmbientLight(0x333333));

  let controls = null;
  let object = null;

  function render() {
    controls.update();
    if (object) object.rotation.y += 0.0005;
    requestAnimationFrame(render);
    renderer.render(scene, camera);
  }

  const light = new THREE.DirectionalLight(0xffffff, 0.7);
  light.position.set(10, 6, 10);
  scene.add(light);

  function createControls() {
    const contr = new TrackballControls(camera, renderer.domElement);
    contr.rotateSpeed = 1.8;
    contr.zoomSpeed = 1.0;
    contr.panSpeed = 0.3;
    contr.minDistance = 1.5;
    contr.maxDistance = 70.00;
    contr.keys = [65, 83, 68]; // ASD
    contr.dynamicDampingFactor = 0.2;
    return contr;
  }

  const loader = new GLTFLoader();
  loader.load('./assets3d/globe.glb', (glb) => {
    scene.add(glb.scene);
    const { children } = glb.scene;
    for (let cnt = 0; cnt < children.length; cnt++) {
      if (checkMaterial(children[cnt])) {
        object = children[cnt];
      }
      const grandchildren = children[cnt].children;
      for (let xnt = 0; xnt < grandchildren.length; xnt++) {
        if (checkMaterial(grandchildren[xnt])) {
          object = children[cnt];
        }
      }
    }
    if (object) {
      object.material = canvasTexture;
    }
    rotateToCoords(canvasSize, object, [x, y]);
    controls = createControls();
    render();
    document.getElementById('loading').style.display = 'none';
  }, () => {
    // console.log(`${xhr.loaded} loaded`);
  }, () => {
    // console.log('An error happened', error);
  });


  webglEl.appendChild(renderer.domElement);

  const stars = new THREE.Mesh(
    new THREE.SphereGeometry(90, 64, 64),
    new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load('./assets3d/starfield.png'),
      side: THREE.BackSide,
    }),
  );
  scene.add(stars);


  function onWindowResize() {
    width = window.innerWidth;
    height = window.innerHeight;
    renderer.setSize(width, height);
    const aspect = width / height;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    if (controls) controls.handleResize();
  }
  window.addEventListener('resize', onWindowResize, false);


  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const coorbox = document.getElementById('coorbox');
  function onDocumentMouseMove(event) {
    if (!object) {
      return;
    }
    if (event) {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    } else {
      mouse.x = 0.0;
      mouse.y = 0.0;
    }

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(object);

    const elem = document.getElementsByTagName('BODY')[0];
    if (intersects.length > 0) {
      const { x: xi, y: yi } = intersects[0].uv;
      const xabs = Math.floor((xi - 0.5) * canvasSize);
      const yabs = Math.floor((0.5 - yi) * canvasSize);
      // console.log(`On ${xabs} / ${yabs} cam: ${camera.position.z}`);
      coorbox.innerHTML = `(${xabs}, ${yabs})`;
      elem.style.cursor = 'move';
    } else {
      elem.style.cursor = 'default';
    }
  }

  setInterval(onDocumentMouseMove, 1000);

  function onDocumentDblClick(event) {
    if (!object) {
      return;
    }
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(object);

    if (intersects.length > 0) {
      const { x: xi, y: yi } = intersects[0].uv;
      const xabs = Math.round((xi - 0.5) * canvasSize);
      const yabs = Math.round((0.5 - yi) * canvasSize);
      window.location.href = `./#${canvasIdent},${xabs},${yabs},0`;
    }
  }

  document.addEventListener('mousemove', onDocumentMouseMove, false);
  document.addEventListener('dblclick', onDocumentDblClick, false);
});
