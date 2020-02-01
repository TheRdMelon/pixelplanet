/*
 * 3D Chunk
 *
 * @flow
 */

/* We have to look for performance here not for good looking code */
/* eslint-disable prefer-destructuring */

import * as THREE from 'three';

import {
  THREE_TILE_SIZE,
  THREE_CANVAS_HEIGHT,
} from '../core/constants';


const faceDirs = [
  [-1, 0, 0],
  [1, 0, 0],
  [0, -1, 0],
  [0, 1, 0],
  [0, 0, -1],
  [0, 0, 1],
];

const faceCorners = [
  // left
  [
    [0, 1, 0],
    [0, 0, 0],
    [0, 1, 1],
    [0, 0, 1],
  ],
  // right
  [
    [1, 1, 1],
    [1, 0, 1],
    [1, 1, 0],
    [1, 0, 0],
  ],
  // bottom
  [
    [1, 0, 1],
    [0, 0, 1],
    [1, 0, 0],
    [0, 0, 0],
  ],
  // top
  [
    [0, 1, 1],
    [1, 1, 1],
    [0, 1, 0],
    [1, 1, 0],
  ],
  // back
  [
    [1, 0, 0],
    [0, 0, 0],
    [1, 1, 0],
    [0, 1, 0],
  ],
  // front
  [
    [0, 0, 1],
    [1, 0, 1],
    [0, 1, 1],
    [1, 1, 1],
  ],
];

const material = new THREE.MeshLambertMaterial({
  vertexColors: THREE.VertexColors,
});


class Chunk {
  key: string;
  ready: boolean = false;
  palette: Object;
  buffer: Uint8Array;
  mesh: THREE.Mesh = null;
  faceCnt: number;
  lastPixel: number;
  heightMap: Array;

  constructor(palette, key) {
    this.key = key;
    this.palette = palette;
  }

  destructor() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
    }
  }

  getVoxel(x: number, y: number, z: number) {
    const { buffer } = this;
    if (!buffer) return 0;
    if (x < 0 || x >= THREE_TILE_SIZE || y >= THREE_CANVAS_HEIGHT
      || z < 0 || z >= THREE_TILE_SIZE) return 0;
    if (y < 0) return 1;
    // z and y are swapped in api/pixel for compatibility
    // with 2D canvas
    const offset = Chunk.getOffsetOfVoxel(x, y, z);
    return this.buffer[offset];
  }

  getVoxelByOffset(offset: number) {
    const { buffer } = this;
    if (!buffer) return 0;
    return buffer[offset];
  }

  /*
  // Test Sin encironment creation for load tests
  async generateSin() {
    let cnt = 0;
    this.buffer = new Uint8Array(THREE_TILE_SIZE * THREE_TILE_SIZE * THREE_CANVAS_HEIGHT);
    const cellSize = THREE_TILE_SIZE;
    for (let y = 0; y < THREE_CANVAS_HEIGHT; ++y) {
      for (let z = 0; z < THREE_TILE_SIZE; ++z) {
        for (let x = 0; x < THREE_TILE_SIZE; ++x) {
          const height = (Math.sin(x / cellSize * Math.PI * 2) + Math.sin(z / cellSize * Math.PI * 3)) * (cellSize / 6) + (cellSize / 2);
          if (y < height) {
            const offset = x
              + z * THREE_TILE_SIZE
              + y * THREE_TILE_SIZE * THREE_TILE_SIZE;
            // const clr = 1 + Math.floor(Math.random() * 31);
            const clr = 14;
            this.buffer[offset] = clr;
            cnt += 1;
          }
        }
      }
    }
    console.log(`Created buffer with ${cnt} voxels`);
    const [faceCnt, lastPixel, heightMap] = Chunk.calculateMetaData(this.buffer);
    this.faceCnt = faceCnt;
    this.lastPixel = lastPixel;
    this.heightMap = heightMap;
    this.renderChunk();
    this.ready = true;
  }
  */

  static calculateMetaData(buffer: Uint8Array) {
    const rowVolume = THREE_TILE_SIZE ** 2;
    const heightMap = new Uint8Array(rowVolume);

    let totalHeight = 0;
    let lastPixel = 0;
    let faceCnt = 0;
    for (let z = THREE_TILE_SIZE - 1; z >= 0; --z) {
      for (let x = THREE_TILE_SIZE - 1; x >= 0; --x) {
        let heighestPixel = 0;
        const startOffset = x + z * THREE_TILE_SIZE;
        let u = startOffset;
        for (let y = 0; y < THREE_CANVAS_HEIGHT; ++y) {
          if (buffer[u] !== 0) {
            // heighest pixel fo x,z in heightmap
            heighestPixel = y;
            // number of faces to render
            if (x === 0
              || buffer[u - 1] === 0) {
              faceCnt += 1;
            }
            if (x === THREE_TILE_SIZE - 1
              || buffer[u + 1] === 0) {
              faceCnt += 1;
            }
            if (z === 0
              || buffer[u - THREE_TILE_SIZE] === 0) {
              faceCnt += 1;
            }
            if (z === THREE_TILE_SIZE - 1
              || buffer[u + THREE_TILE_SIZE] === 0) {
              faceCnt += 1;
            }
            if (y !== 0
              && buffer[u - (THREE_TILE_SIZE ** 2)] === 0) {
              faceCnt += 1;
            }
            if (y === THREE_CANVAS_HEIGHT - 1
              || buffer[u + (THREE_TILE_SIZE ** 2)] === 0) {
              faceCnt += 1;
            }
          }
          u += rowVolume;
        }
        heightMap[startOffset] = heighestPixel;
        if (heighestPixel > totalHeight) {
          // last total pixel
          totalHeight = heighestPixel;
          lastPixel = Chunk.getOffsetOfVoxel(x, heighestPixel, z);
        }
      }
    }
    return [faceCnt, lastPixel, heightMap];
  }

  static getOffsetOfVoxel(x: number, y: number, z: number) {
    return x + z * THREE_TILE_SIZE + y * THREE_TILE_SIZE * THREE_TILE_SIZE;
  }

  static getXZOfVoxel(offset) {
    const xzOffset = offset % (THREE_TILE_SIZE * THREE_TILE_SIZE);
    const y = (offset - xzOffset) / (THREE_TILE_SIZE * THREE_TILE_SIZE);
    const x = xzOffset % THREE_TILE_SIZE;
    const z = (xzOffset - x) / THREE_TILE_SIZE;
    return [x, y, z];
  }

  setVoxelByOffset(offset: number, clr: number) {
    if (offset > this.lastPixel) {
      this.lastPixel = offset;
    }
    // TODO heightmap if pixel got deleted instead
    // of set
    const rowVolume = THREE_TILE_SIZE ** 2;
    const rowOffset = offset % rowVolume;
    const y = (offset - rowOffset) / rowVolume;
    if (y > this.heightMap[rowOffset]) {
      this.heightMap[rowOffset] = y;
    }
    this.buffer[offset] = clr;
    this.faceCnt += 6;
    this.renderChunk();
  }

  setVoxel(x: number, y: number, z: number, clr: number) {
    const offset = Chunk.getOffsetOfVoxel(x, y, z);
    this.setVoxelByOffset(offset, clr);
  }

  async fromBuffer(chunkBuffer: Uint8Array) {
    this.buffer = chunkBuffer;
    const [faceCnt, lastPixel, heightMap] = Chunk.calculateMetaData(
      chunkBuffer,
    );
    this.faceCnt = faceCnt;
    this.lastPixel = lastPixel;
    this.heightMap = heightMap;
    this.renderChunk();
    this.ready = true;
  }

  empty() {
    const buffer = new Uint8Array(
      THREE_TILE_SIZE * THREE_TILE_SIZE * THREE_CANVAS_HEIGHT,
    );
    const heightMap = new Uint8Array(
      THREE_TILE_SIZE * THREE_TILE_SIZE,
    );
    this.buffer = buffer;
    this.heightMap = heightMap;
    this.faceCnt = 0;
    this.lastPixel = 0;
    this.renderChunk();
    this.ready = true;
  }

  calculateGeometryData() {
    const rowVolume = THREE_TILE_SIZE ** 2;
    let cnt = 0;
    let voxel;
    const { faceCnt } = this;
    const positions = new Float32Array(faceCnt * 4 * 3);
    const normals = new Float32Array(faceCnt * 4 * 3);
    const colors = new Uint8Array(faceCnt * 4 * 3);
    const indices = new Uint32Array(faceCnt * 6);
    const { rgb } = this.palette;
    // just render faces that do not have an adjescent voxel
    for (let z = 0; z < THREE_TILE_SIZE; ++z) {
      for (let x = 0; x < THREE_TILE_SIZE; ++x) {
        const startOffset = x + z * THREE_TILE_SIZE;
        const height = this.heightMap[startOffset];
        let u = startOffset;
        for (let y = 0; y <= height; ++y) {
          voxel = this.buffer[u] & 0x3F;
          if (voxel !== 0) {
            voxel *= 3;
            for (let i = 0; i < 6; ++i) {
              const dir = faceDirs[i];
              const corners = faceCorners[i];

              const neighbor = this.getVoxel(
                x + dir[0],
                y + dir[1],
                z + dir[2],
              );
              if (neighbor === 0) {
                // this voxel has no neighbor in this direction
                // so we need a face
                let ndx = cnt * 4 * 3;
                for (let c = 0; c < 4; ++c) {
                  const pos = corners[c];
                  positions[ndx] = pos[0] + x;
                  normals[ndx] = dir[0];
                  colors[ndx++] = rgb[voxel];
                  positions[ndx] = pos[1] + y;
                  normals[ndx] = dir[1];
                  colors[ndx++] = rgb[voxel + 1];
                  positions[ndx] = pos[2] + z;
                  normals[ndx] = dir[2];
                  colors[ndx++] = rgb[voxel + 2];
                }
                const idx = cnt * 4;
                ndx = cnt * 6;
                indices[ndx++] = idx;
                indices[ndx++] = idx + 1;
                indices[ndx++] = idx + 2;
                indices[ndx++] = idx + 2;
                indices[ndx++] = idx + 1;
                indices[ndx] = idx + 3;

                cnt += 1;
              }
            }
          }
          u += rowVolume;
        }
      }
    }
    this.faceCnt = cnt;
    return [positions, normals, colors, indices];
  }

  renderChunk() {
    const time1 = Date.now();
    const [positions, normals, colors, indices] = this.calculateGeometryData();
    const time2 = Date.now();

    const geometry = (this.mesh)
      ? this.mesh.geometry
      : new THREE.BufferGeometry();

    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(
        positions,
        3,
      ),
    );
    geometry.setAttribute(
      'normal',
      new THREE.BufferAttribute(
        normals,
        3,
      ),
    );
    geometry.setAttribute(
      'color',
      new THREE.BufferAttribute(
        colors,
        3,
        true,
      ),
    );
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeBoundingSphere();
    geometry.setDrawRange(0, this.faceCnt * 6);

    if (!this.mesh) {
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.name = this.key;
    }

    const time3 = Date.now();
    // eslint-disable-next-line no-console, max-len
    console.log(`Created mesh with ${this.faceCnt} faces in ${time3 - time2}ms webgl and ${time2 - time1}ms data creation`);
  }
}

export default Chunk;
