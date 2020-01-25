/*
 * 3D Chunk
 *
 * @flow
 */

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

  constructor(palette, key) {
    this.key = key;
    this.palette = palette;
  }

  getVoxel(x: number, y: number, z: number) {
    const { buffer } = this;
    if (!buffer) return 0;
    if (x < 0 || x >= THREE_TILE_SIZE || y >= THREE_CANVAS_HEIGHT
      || z < 0 || z >= THREE_TILE_SIZE)
      return 0;
    if (y < 0)
      return 1;
    // z and y are swapped in api/pixel for compatibility
    // with 2D canvas
    const offset = Chunk.getOffsetOfVoxel(x, y, z)
    return this.buffer[offset];
  }

  async generateSin() {
    let cnt = 0;
    this.buffer = new Uint8Array(THREE_TILE_SIZE * THREE_TILE_SIZE * THREE_CANVAS_HEIGHT);
    const cellSize = 64;
    for (let y = 0; y < THREE_CANVAS_HEIGHT; ++y) {
      for (let z = 0; z < THREE_TILE_SIZE; ++z) {
        for (let x = 0; x < THREE_TILE_SIZE; ++x) {
          const height = (Math.sin(x / cellSize * Math.PI * 2) + Math.sin(z / cellSize * Math.PI * 3)) * (cellSize / 6) + (cellSize / 2);
          if (y < height) {
            const offset = x
              + z * THREE_TILE_SIZE
              + y * THREE_TILE_SIZE * THREE_TILE_SIZE;
            const clr = 1 + Math.floor(Math.random() * 31);
            this.buffer[offset] = clr;
            cnt += 1;
          }
        }
      }
    }
    console.log(`Created buffer with ${cnt} voxels`);
    this.faceCnt = Chunk.estimateNeededFaces(this.buffer);
    this.renderChunk();
    this.ready = true;
  }

  static estimateNeededFaces(buffer: Uint8Array) {
    let totalCnt = 0;

    let u = 0;
    for (let y = 0; y < THREE_CANVAS_HEIGHT; ++y) {
      for (let z = 0; z < THREE_TILE_SIZE; ++z) {
        for (let x = 0; x < THREE_TILE_SIZE; ++x) {
          if (buffer[u] !== 0) {
            if (x === 0
              || buffer[u - 1] === 0) {
              totalCnt += 1;
            }
            if (x === THREE_TILE_SIZE - 1
              || buffer[u + 1] === 0) {
              totalCnt += 1;
            }
            if (z === 0
              || buffer[u - THREE_TILE_SIZE] === 0) {
              totalCnt += 1;
            }
            if (z === THREE_TILE_SIZE - 1
              || buffer[u + THREE_TILE_SIZE] === 0) {
              totalCnt += 1;
            }
            if (y !== 0
              && buffer[u - (THREE_TILE_SIZE ** 2)] === 0) {
              totalCnt += 1;
            }
            if (y === THREE_CANVAS_HEIGHT - 1
              || buffer[u + (THREE_TILE_SIZE ** 2)] === 0) {
              totalCnt += 1;
            }
          }
          u += 1;
        }
      }
    }
    return totalCnt;
  }

  static getOffsetOfVoxel(x: number, y: number, z: number) {
    return x + z * THREE_TILE_SIZE + y * THREE_TILE_SIZE * THREE_TILE_SIZE;
  }

  setVoxelByOffset(offset: number, clr: number) {
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
    this.renderChunk();
    this.ready = true;
  }

  renderChunk() {
    let time1 = Date.now();

    let cnt = 0;
    let cntv = 0;
    let voxel;
    const faceCnt = this.faceCnt;
    const positions = new Float32Array(faceCnt * 4 * 3);
    const normals = new Float32Array(faceCnt * 4 * 3);
    const colors = new Uint8Array(faceCnt * 4 * 3);
    const indices = new Uint32Array(faceCnt * 6);
    const { rgb } = this.palette;
    // just render faces that do not have an adjescent voxel
    for (let y = 0; y < THREE_CANVAS_HEIGHT; ++y) {
      for (let z = 0; z < THREE_TILE_SIZE; ++z) {
        for (let x = 0; x < THREE_TILE_SIZE; ++x) {
          voxel = this.getVoxel(x, y, z);
          if (voxel !== 0) {
            voxel *= 3;
            cntv += 1;
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
        }
      }
    }
    let time2 = Date.now();

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
    geometry.setDrawRange(0, cnt * 6);

    this.faceCnt = cnt;

    if (!this.mesh) {
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.name = this.key;
    }

    let time3 = Date.now();
    console.log(`Created mesh for ${cntv} voxels with ${cnt} faces in ${time3 - time2}ms webgl and ${time2 - time1}ms data creation`);
  }
}

export default Chunk;
