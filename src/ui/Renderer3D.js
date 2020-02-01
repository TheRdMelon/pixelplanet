/*
 * 3D Renderer for VoxelCanvas
 *
 * @flow
 */

import * as THREE from 'three';
import { Sky } from './Sky';

import InfiniteGridHelper from './InfiniteGridHelper';
import VoxelPainterControls from '../controls/VoxelPainterControls';
import ChunkLoader from './ChunkLoader3D';
import {
  getChunkOfPixel,
} from '../core/utils';
import {
  THREE_TILE_SIZE,
} from '../core/constants';
import {
  setHover,
  tryPlacePixel,
  selectColor,
} from '../actions';


class Renderer {
  is3D = true;
  //--
  store;
  //--
  scene: Object;
  camera: Object;
  rollOverMesh: Object;
  objects: Array<Object>;
  loadedChunks: Array<Object>;
  plane: Object;
  //--
  controls: Object;
  threeRenderer: Object;
  //--
  mouse;
  mouseMoveStart;
  raycaster;
  pressTime: number;
  pressCdTime: number;
  //--
  chunkLoader: ChunkLoader = null;
  forceNextRender: boolean = false;

  constructor(store) {
    this.store = store;
    const state = store.getState();
    this.objects = [];
    this.chunkLoader = null;

    // camera
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      400,
    );
    camera.position.set(10, 16, 26);
    camera.lookAt(0, 0, 0);
    this.camera = camera;

    // scene
    const scene = new THREE.Scene();
    // scene.background = new THREE.Color(0xf0f0f0);
    this.scene = scene;

    // lights
    const ambientLight = new THREE.AmbientLight(0x222222);
    scene.add(ambientLight);

    // const directionalLight = new THREE.DirectionalLight(0xffffff);
    // directionalLight.position.set(1, 1.2, 0.8).normalize();
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(80, 80, 75);
    const contourLight = new THREE.DirectionalLight(0xffffff, 0.4);
    contourLight.position.set(-80, 80, -75);
    scene.add(directionalLight);
    scene.add(contourLight);

    const sky = new Sky();
    sky.scale.setScalar(450000);
    scene.add(sky);

    scene.fog = new THREE.FogExp2(0xffffff, 0.003);

    const effectController = {
      turbidity: 10,
      rayleigh: 2,
      mieCoefficient: 0.005,
      mieDirectionalG: 0.8,
      luminance: 1,
      inclination: 0.49, // elevation / inclination
      azimuth: 0.25, // Facing front,
      sun: !true,
    };
    const { uniforms } = sky.material;
    uniforms.turbidity.value = effectController.turbidity;
    uniforms.rayleigh.value = effectController.rayleigh;
    uniforms.luminance.value = effectController.luminance;
    uniforms.mieCoefficient.value = effectController.mieCoefficient;
    uniforms.mieDirectionalG.value = effectController.mieDirectionalG;
    uniforms.sunPosition.value.set(400000, 400000, 400000);

    // hover helper
    const rollOverGeo = new THREE.BoxBufferGeometry(1, 1, 1);
    const rollOverMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      opacity: 0.5,
      transparent: true,
    });
    this.rollOverMesh = new THREE.Mesh(rollOverGeo, rollOverMaterial);
    scene.add(this.rollOverMesh);

    // grid
    // const gridHelper = new THREE.GridHelper(100, 10, 0x555555, 0x555555);
    const gridHelper = new InfiniteGridHelper(1, 10);
    scene.add(gridHelper);

    //
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Plane Floor
    const geometry = new THREE.PlaneBufferGeometry(1024, 1024);
    geometry.rotateX(-Math.PI / 2);
    const plane = new THREE.Mesh(
      geometry,
      new THREE.MeshLambertMaterial({ color: 0xcae3ff }),
    );
    scene.add(plane);
    this.plane = plane;
    this.objects.push(plane);
    this.plane.position.y = -0.1;

    // renderer
    const threeRenderer = new THREE.WebGLRenderer({
      preserveDrawingBuffer: true,
    });
    threeRenderer.setPixelRatio(window.devicePixelRatio);
    threeRenderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(threeRenderer.domElement);
    this.threeRenderer = threeRenderer;
    const { domElement } = threeRenderer;

    // controls
    const controls = new VoxelPainterControls(
      camera,
      domElement,
      store,
    );
    controls.enableDamping = true;
    controls.dampingFactor = 0.10;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minDistance = 10.00;
    controls.maxDistance = 100.00;
    this.controls = controls;


    this.onDocumentMouseMove = this.onDocumentMouseMove.bind(this);
    this.onDocumentMouseDown = this.onDocumentMouseDown.bind(this);
    this.onDocumentMouseUp = this.onDocumentMouseUp.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    domElement.addEventListener('mousemove', this.onDocumentMouseMove, false);
    domElement.addEventListener('mousedown', this.onDocumentMouseDown, false);
    domElement.addEventListener('mouseup', this.onDocumentMouseUp, false);
    window.addEventListener('resize', this.onWindowResize, false);

    this.updateCanvasData(state);
  }

  destructor() {
    window.addEventListener('resize', this.onWindowResize, false);
    this.threeRenderer.dispose();
    this.controls.dispose();
    const { domElement } = this.threeRenderer;
    this.threeRenderer = null;
    domElement.remove();
    if (this.chunkLoader) {
      this.chunkLoader.destructor();
    }
  }

  updateView() {
    this.forceNextRender = true;
  }

  getViewport() {
    return this.threeRenderer.domElement;
  }

  updateCanvasData(state: State) {
    const {
      canvasId,
      view,
    } = state.canvas;
    if (canvasId !== this.canvasId) {
      this.canvasId = canvasId;
      if (canvasId !== null) {
        if (this.chunkLoader) {
          // destroy old chunks,
          // meshes need to get disposed
          if (this.loadedChunks) {
            this.loadedChunks.forEach((chunk) => {
              this.scene.remove(chunk);
              this.objects = [this.plane];
            });
            this.chunkLoader.destructor();
          }
        }
        this.loadedChunks = new Map();
        this.chunkLoader = new ChunkLoader(this.store);
      }
    }
    this.controls.setView(view);
    this.forceNextRender = true;
  }

  // eslint-disable-next-line class-methods-use-this
  updateScale() {
    return null;
  }

  // TODO use GC to dispose unused chunks
  // eslint-disable-next-line class-methods-use-this
  getAllChunks() {
    return null;
  }

  renderPixel(
    i: number,
    j: number,
    offset: number,
    color: number,
  ) {
    const { chunkLoader } = this;
    if (chunkLoader) {
      chunkLoader.getVoxelUpdate(i, j, offset, color);
    }
  }

  reloadChunks() {
    if (!this.chunkLoader) {
      return;
    }
    const renderDistance = 150;
    const state = this.store.getState();
    const {
      canvasSize,
      view,
    } = state.canvas;
    const x = view[0];
    const z = view[2] || 0;
    const {
      scene,
      loadedChunks,
      chunkLoader,
    } = this;
    const [xcMin, zcMin] = getChunkOfPixel(
      canvasSize,
      x - renderDistance,
      0,
      z - renderDistance,
    );
    const [xcMax, zcMax] = getChunkOfPixel(
      canvasSize,
      x + renderDistance,
      0,
      z + renderDistance,
    );
    // console.log(`Get ${xcMin} - ${xcMax} - ${zcMin} - ${zcMax}`);
    const curLoadedChunks = [];
    for (let zc = zcMin; zc <= zcMax; ++zc) {
      for (let xc = xcMin; xc <= xcMax; ++xc) {
        const chunkKey = `${xc}:${zc}`;
        curLoadedChunks.push(chunkKey);
        if (!loadedChunks.has(chunkKey)) {
          const chunk = chunkLoader.getChunk(xc, zc, true);
          if (chunk) {
            loadedChunks.set(chunkKey, chunk);
            chunk.position.fromArray([
              xc * THREE_TILE_SIZE - canvasSize / 2,
              0,
              zc * THREE_TILE_SIZE - canvasSize / 2,
            ]);
            window.chunk = chunk;
            scene.add(chunk);
          }
        }
      }
    }
    const newObjects = [this.plane];
    loadedChunks.forEach((chunk, chunkKey) => {
      if (curLoadedChunks.includes(chunkKey)) {
        newObjects.push(chunk);
      } else {
        scene.remove(chunk);
        loadedChunks.delete(chunkKey);
      }
    });
    this.plane.position.x = x;
    this.plane.position.z = z;
    this.objects = newObjects;
  }

  render() {
    if (!this.threeRenderer) {
      return;
    }
    this.controls.update();
    if (this.forceNextRender) {
      this.reloadChunks();
      this.forceNextRender = false;
    }
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
      store,
    } = this;
    const {
      placeAllowed,
    } = store.getState().user;

    mouse.set(
      (clientX / innerWidth) * 2 - 1,
      -(clientY / innerHeight) * 2 + 1,
    );

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(objects);
    if (intersects.length > 0) {
      const intersect = intersects[0];
      const target = intersect.point.clone()
        .add(intersect.face.normal.multiplyScalar(0.5))
        .floor()
        .addScalar(0.5);
      if (!placeAllowed
        || target.clone().sub(camera.position).length() > 120) {
        rollOverMesh.position.y = -10;
      } else {
        rollOverMesh.position.copy(target);
      }
    }
    const hover = rollOverMesh.position
      .toArray().map((u) => Math.floor(u));
    this.store.dispatch(setHover(hover));
  }

  onDocumentMouseDown() {
    this.pressTime = Date.now();
    const state = this.store.getState();
    this.mouseMoveStart = state.gui.hover;
  }

  onDocumentMouseUp(event) {
    const curTime = Date.now();
    if (curTime - this.pressCdTime < 200) {
      return;
    }
    if (curTime - this.pressTime > 500) {
      this.pressCdTime = curTime;
      return;
    }

    const state = this.store.getState();
    const {
      placeAllowed,
    } = state.user;
    if (!placeAllowed) {
      return;
    }

    const [px, py, pz] = this.mouseMoveStart;
    const [qx, qy, qz] = state.gui.hover;
    if (px !== qx || py !== qy || pz !== qz) {
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
      store,
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
          const target = intersect.point.clone()
            .add(intersect.face.normal.multiplyScalar(0.5))
            .floor()
            .addScalar(0.5)
            .floor();
          if (target.clone().sub(camera.position).length() < 120) {
            const cell = target.toArray();
            store.dispatch(tryPlacePixel(cell));
          }
          break;
        }
        case 1: {
          // middle mouse button
          const target = intersect.point.clone()
            .add(intersect.face.normal.multiplyScalar(-0.5))
            .floor()
            .addScalar(0.5)
            .floor();
          if (target.y < 0) {
            return;
          }
          if (target.clone().sub(camera.position).length() < 120) {
            const cell = target.toArray();
            if (this.chunkLoader) {
              const clr = this.chunkLoader.getVoxel(...cell);
              if (clr) {
                store.dispatch(selectColor(clr));
              }
            }
          }
          break;
        }
        case 2: {
          // right mouse button
          const target = intersect.point.clone()
            .add(intersect.face.normal.multiplyScalar(-0.5))
            .floor()
            .addScalar(0.5)
            .floor();
          if (target.y < 0) {
            return;
          }
          if (target.clone().sub(camera.position).length() < 120) {
            const cell = target.toArray();
            store.dispatch(tryPlacePixel(cell, 0));
          }
          break;
        }
        default:
          break;
      }
    }
  }
}

export default Renderer;
