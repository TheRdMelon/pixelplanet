/*
 * .vox file exporter for 3D canvas
 * .vox is the Magica Voxel file format that is also compatible with
 * other vodel editors like Goxel.
 * A object in a .vox file can have a max dimension of 128x128 and 256 height
 * As of the latest release with 0.99.5 4/5/2020 this limit is now 256x256x256,
 * however, lets keep with the old restreints for support of other software.
 * In .vox, 0,0 is the corner of the model and coordinates are unsigned int,
 * the z dimension is the height, contrarian to pixelplanet with y.
 *
 * Reference:
 * https://github.com/ephtracy/voxel-model/blob/master/MagicaVoxel-file-format-vox.txt
 *
 * @flow
 */

/*
 * THIS IS JUST THE START, I WONT CONTINUE IT ANYTIME SOON SO ITS ALREADY
 * COMMITED AS A REFERENCE AND IDEA
 * The idea is to export a 128x128 area around the focal point of where the user
 * is currently looking at as .vox. The file should just have one model.
 */

import { THREE_TILE_SIZE, THREE_CANVAS_HEIGHT } from './constants';

const VOX_OBJECT_SIZE = 128;
const VOX_OBJECT_CSIZE = VOX_OBJECT_SIZE / THREE_TILE_SIZE;


function calcChunkSize(buffer) {
  let cnt = 0;
  let u = buffer.length;
  while (u >= 0) {
    u -= 1;
    if (buffer[u] !== 0) {
      cnt += 1;
    }
  }
  return cnt;
}

async function exportVox(
  chunks,
  canvas,
  centerPoint,
) {
  const { size: canvasSize, colors } = canvas;
  // round to chunk with its -x and -y corner closest to centerPoint
  const [xc,, yc] = centerPoint.map((z) => {
    const zabs = z + (canvasSize / 2);
    return Math.round(zabs / THREE_TILE_SIZE);
  });

  const [xcMin, ycMin] = [xc, yc].map((zc) => {
    const zcMin = zc - VOX_OBJECT_CSIZE / 2;
    return (zcMin >= 0) ? zcMin : zc;
  });

  const posMax = canvasSize / THREE_TILE_SIZE - 1;
  const [xcMax, ycMax] = [xc, yc].map((zc) => {
    if (zc > posMax) {
      return zc - 1;
    }
    const zcMax = zc + VOX_OBJECT_CSIZE / 2 + 1;
    return (zcMax <= posMax) ? zcMax : zc;
  });

  //  Size Chunk
  // 4 bytes SIZE
  // 4 bytes size
  // 4 bytes size children chunks (0)
  // 4 * 3 (x, y, z) size
  const sizeChunkSize = 4 * 3;
  const sizeChunkLength = 4 + 4 + 4 + sizeChunkSize;
  //  Voxel Chunk
  // 4 bytes XYZI
  // 4 bytes size
  // 4 bytes size children chunks (0)
  // 4 bytes numVoxels
  // 4 bytes (x, y, z, clr) for every voxel
  let numVoxels = 0;
  for (let j = ycMin; j <= ycMax; j += 1) {
    for (let i = xcMin; i <= xcMax; i += 1) {
      const key = `${i}:${j}`;
      const { buffer } = chunks.get(key);
      numVoxels += calcChunkSize(buffer);
    }
  }
  const xyziChunkSize = 4 + 4 * numVoxels;
  const xyziChunkLength = 4 + 4 + 4 + xyziChunkSize;
  // 4 bytes 'RGBA'
  // 4 bytes size
  // 4 bytes children chunks (0)
  // 4 * 256 palette content (rgba * 256 colors)
  const rgbaChunkSize = 4 * 256;
  const rgbaChunkLength = 4 + 4 + 4 + rgbaChunkSize;
  const rgbaPadding = [256, 256, 256, 256];
  // Main Chunk
  // 4 bytes MAIN
  // 4 bytes size (0)
  // 4 bythes  size children chnks
  const mainChildrenChunkSize = sizeChunkLength
    + xyziChunkLength + rgbaChunkLength;
  const mainChunkLength = 4 + 4 + 4 + mainChildrenChunkSize;
  // 4 bytes 'VOX '
  // 4 bythes version number
  const fileLength = 4 + 4 + mainChunkLength;

  const voxFile = new ArrayBuffer(fileLength);
  const voxFileView = new DataView(voxFile);
  // TODO how to ascii and how to make less ugly
  const charEncoder = new TextEncoder('utf-8');
  let offset = 0;
  voxFileView.setUint8(charEncoder('V')[0], offset++);
  voxFileView.setUint8(charEncoder('O')[0], offset++);
  voxFileView.setUint8(charEncoder('X')[0], offset++);
  voxFileView.setUint8(charEncoder(' ')[0], offset++);
  voxFileView.setUint32(150, offset);
  offset += 4;
  voxFileView.setUint8(charEncoder('M')[0], offset++);
  voxFileView.setUint8(charEncoder('A')[0], offset++);
  voxFileView.setUint8(charEncoder('I')[0], offset++);
  voxFileView.setUint8(charEncoder('N')[0], offset++);
  voxFileView.setUint32(0, offset);
  offset += 4;
  voxFileView.setUint32(mainChildrenChunkSize, offset);
  offset += 4;
  voxFileView.setUint8(charEncoder('S')[0], offset++);
  voxFileView.setUint8(charEncoder('I')[0], offset++);
  voxFileView.setUint8(charEncoder('Z')[0], offset++);
  voxFileView.setUint8(charEncoder('E')[0], offset++);
  voxFileView.setUint32(sizeChunkSize, offset);
  offset += 4;
  voxFileView.setUint32(0, offset);
  offset += 4;
  voxFileView.setUint32(VOX_OBJECT_SIZE, offset);
  offset += 4;
  voxFileView.setUint32(VOX_OBJECT_SIZE, offset);
  offset += 4;
  voxFileView.setUint32(THREE_CANVAS_HEIGHT, offset);
  offset += 4;
  voxFileView.setUint8(charEncoder('X')[0], offset++);
  voxFileView.setUint8(charEncoder('Y')[0], offset++);
  voxFileView.setUint8(charEncoder('Z')[0], offset++);
  voxFileView.setUint8(charEncoder('I')[0], offset++);
  voxFileView.setUint32(xyziChunkSize, offset);
  offset += 4;
  voxFileView.setUint32(0, offset);
  offset += 4;
  // TODO load voxels here
  offset += xyziChunkSize;
  voxFileView.setUint8(charEncoder('R')[0], offset++);
  voxFileView.setUint8(charEncoder('G')[0], offset++);
  voxFileView.setUint8(charEncoder('B')[0], offset++);
  voxFileView.setUint8(charEncoder('A')[0], offset++);
  voxFileView.setUint32(rgbaChunkSize, offset);
  offset += 4;
  voxFileView.setUint32(0, offset);
  offset += 4;
  // TODO load palette here, unused indices set to rgbaPadding

  return voxFile;
  // can then be saved from the UI with react-file-downloader
  // aka js-file-doanloader
}

export default exportVox;
