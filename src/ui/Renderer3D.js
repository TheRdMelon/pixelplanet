/*
 * 3D Renderer for VoxelCanvas
 *
 * @flow
 */

import * as THREE from 'three';

import VoxelPainterControls from '../controls/VoxelPainterControls';
import ChunkLoader from './ChunkLoader3D';
import {
  getChunkOfPixel,
  getOffsetOfPixel,
} from '../core/utils';
import {
  THREE_TILE_SIZE,
} from '../core/constants';
import {
  setHover,
} from '../actions';


class Renderer {
  is3D = true;
  //--
  store;
  //--
  scene: Object;
  camera: Object;
  rollOverMesh: Object;
  voxel: Object;
  voxelMaterials: Array<Object>;
  objects: Array<Object>;
  loadedChunks: Array<Object>;
  plane: Object;
  //--
  controls: Object;
  threeRenderer: Object;
  //--
  mouse;
  raycaster;
  pressTime: number;
  //--
  chunkLoader: ChunkLoader = null;
  forceNextRender: boolean = false;

  constructor(store) {
    this.store = store;
    const state = store.getState();
    this.objects = [];
    this.loadedChunks = new Map();
    this.chunkLoader = new ChunkLoader(store);

    // camera
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      200,
    );
    camera.position.set(10, 16, 26);
    camera.lookAt(0, 0, 0);
    this.camera = camera;

    // scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    this.scene = scene;
    window.scene = scene;
    window.THREE = THREE;

    // hover helper
    const rollOverGeo = new THREE.BoxBufferGeometry(1, 1, 1);
    const rollOverMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      opacity: 0.5,
      transparent: true,
    });
    this.rollOverMesh = new THREE.Mesh(rollOverGeo, rollOverMaterial);
    scene.add(this.rollOverMesh);

    // cubes
    this.voxel = new THREE.BoxBufferGeometry(1, 1, 1);
    this.initCubeMaterials(state);

    // grid
    const gridHelper = new THREE.GridHelper(100, 10, 0x555555, 0x555555);
    scene.add(gridHelper);

    //
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Plane Floor
    const geometry = new THREE.PlaneBufferGeometry(500, 500);
    geometry.rotateX(-Math.PI / 2);
    const plane = new THREE.Mesh(
      geometry,
      new THREE.MeshLambertMaterial({ color: 0xcae3ff }),
    );
    scene.add(plane);
    this.plane = plane;
    this.objects.push(plane);

    // lights
    const ambientLight = new THREE.AmbientLight(0x606060);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(1, 0.75, 0.5).normalize();
    scene.add(directionalLight);

    // renderer
    const threeRenderer = new THREE.WebGLRenderer({ antialias: true });
    threeRenderer.setPixelRatio(window.devicePixelRatio);
    threeRenderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(threeRenderer.domElement);
    this.threeRenderer = threeRenderer;

    // controls
    const controls = new VoxelPainterControls(camera, threeRenderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.75;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minDistance = 10.00;
    controls.maxDistance = 100.00;
    this.controls = controls;

    const { domElement } = threeRenderer;

    this.onDocumentMouseMove = this.onDocumentMouseMove.bind(this);
    this.onDocumentMouseDown = this.onDocumentMouseDown.bind(this);
    this.onDocumentMouseUp = this.onDocumentMouseUp.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    domElement.addEventListener('mousemove', this.onDocumentMouseMove, false);
    domElement.addEventListener('mousedown', this.onDocumentMouseDown, false);
    domElement.addEventListener('mouseup', this.onDocumentMouseUp, false);
    window.addEventListener('resize', this.onWindowResize, false);

    this.forceNextRender = true;
  }

  destructor() {
    window.addEventListener('resize', this.onWindowResize, false);
    this.threeRenderer.dispose();
    const { domElement } = this.threeRenderer;
    this.threeRenderer = null;
    domElement.remove();
  }

  static getAllChunks() {
    return null;
  }

  initCubeMaterials(state) {
    const { palette } = state.canvas;
    const { colors } = palette;
    const cubeMaterials = [];
    for (let index = 0; index < colors.length; index++) {
      const material = new THREE.MeshLambertMaterial({
        color: colors[index],
      });
      cubeMaterials.push(material);
    }
    this.voxelMaterials = cubeMaterials;
  }

  reloadChunks() {
    console.log('Reload Chunks');
    const renderDistance = 50;
    const state = this.store.getState();
    const { canvasSize, view } = state.canvas;
    // const [x,, z] = view;
    const [x, z] = [0, 0];
    const {
      scene,
      loadedChunks,
      chunkLoader,
    } = this;
    const [xcMin, zcMin] = getChunkOfPixel(canvasSize, x - 50, z - 50, 0);
    const [xcMax, zcMax] = getChunkOfPixel(canvasSize, x + 50, z + 50, 0);
    console.log(`Get ${xcMin} - ${xcMax} - ${zcMin} - ${zcMax}`);
    for (let zc = zcMin; zc <= zcMax; ++zc) {
      for (let xc = xcMin; xc <= xcMax; ++xc) {
        const chunkKey = `${xc}:${zc}`;
        const chunk = chunkLoader.getChunk(xc, zc, true);
        if (chunk) {
          console.log(`Got Chunk ${chunkKey}`);
          loadedChunks.set(chunkKey, chunk);
          this.objects.push(chunk);
          chunk.position.fromArray([
            xc * THREE_TILE_SIZE - canvasSize / 2,
            0,
            zc * THREE_TILE_SIZE - canvasSize / 2,
          ]);
          window.chunk = chunk;
          scene.add(chunk);
          console.log(`added chunk`);
        }
      }
    }
  }

  render() {
    if (!this.threeRenderer) {
      return;
    }
    if (this.forceNextRender) {
      this.reloadChunks();
      this.forceNextRender = false;
    }
    this.controls.update();
    this.threeRenderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.threeRenderer.setSize(window.innerWidth, window.innerHeight);
  }

  onDocumentMouseMove(event) {
    event.preventDefault();
    const {
      clientX,
      clientY,
    } = event;
    const {
      innerWidth,
      innerHeight,
    } = window;
    const {
      camera,
      objects,
      raycaster,
      mouse,
      rollOverMesh,
    } = this;

    mouse.set(
      (clientX / innerWidth) * 2 - 1,
      -(clientY / innerHeight) * 2 + 1,
    );

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(objects);
    if (intersects.length > 0) {
      const intersect = intersects[0];
      rollOverMesh.position
        .copy(intersect.point)
        .add(intersect.face.normal.multiplyScalar(0.5));
      rollOverMesh.position
        .floor()
        .addScalar(0.5);
    }
    const hover = rollOverMesh.position
      .toArray().map((u) => Math.floor(u));
    this.store.dispatch(setHover(hover));
  }

  onDocumentMouseDown() {
    this.pressTime = Date.now();
  }

  onDocumentMouseUp(event) {
    if (Date.now() - this.pressTime > 600) {
      return;
    }
    event.preventDefault();
    const {
      clientX,
      clientY,
    } = event;
    const {
      innerWidth,
      innerHeight,
    } = window;
    const {
      camera,
      objects,
      raycaster,
      mouse,
      plane,
      voxel,
      voxelMaterials,
      store,
      scene,
    } = this;

    mouse.set(
      (clientX / innerWidth) * 2 - 1,
      -(clientY / innerHeight) * 2 + 1,
    );

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(objects);
    if (intersects.length > 0) {
      const intersect = intersects[0];

      switch (event.button) {
        case 0: {
          // left mouse button
          const state = store.getState();
          const { selectedColor, hover } = state.gui;
          const { canvasSize } = state.canvas;
          //const pos = new THREE.Vector3();
          const [x, y, z] = hover;
          /*
          const [x, y, z] = pos.copy(intersect.point)
            .add(intersect.face.normal.multiplyScalar(0.5))
            .floor()
            .addScalar(0.5)
            .toArray();
            */
          const offset = getOffsetOfPixel(canvasSize, x, z, y);
          const [xc, zc] = getChunkOfPixel(canvasSize, x, z, y);
          this.chunkLoader.getVoxelUpdate(xc, zc, offset, selectedColor);
          /*
          const newVoxel = new THREE.Mesh(
            voxel,
            voxelMaterials[selectedColor],
          );
          newVoxel.position
            .copy(intersect.point)
            .add(intersect.face.normal.multiplyScalar(0.5));
          newVoxel.position
            .floor()
            .addScalar(0.5);
          scene.add(newVoxel);
          objects.push(newVoxel);
          */
        }
          break;
        case 2:
          // right mouse button
          const state = store.getState();
          const { hover } = state.gui;
          const { canvasSize } = state.canvas;
          const normal = intersect.face.normal;
          let [x, y, z] = hover;
          x -= normal.x; 
          y -= normal.y;
          z -= normal.z;
          const offset = getOffsetOfPixel(canvasSize, x, z, y);
          const [xc, zc] = getChunkOfPixel(canvasSize, x, z, y);
          this.chunkLoader.getVoxelUpdate(xc, zc, offset, 0);
          /*
          if (intersect.object !== plane) {
            scene.remove(intersect.object);
            objects.splice(objects.indexOf(intersect.object), 1);
          }
          */
          break;
        default:
          break;
      }
    }
  }
}

export default Renderer;
