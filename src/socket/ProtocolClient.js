/**
 *
 * @flow
 */

import EventEmitter from 'events';

import CoolDownPacket from './packets/CoolDownPacket';
import PixelUpdate from './packets/PixelUpdate';
import OnlineCounter from './packets/OnlineCounter';
import RegisterCanvas from './packets/RegisterCanvas';
import RegisterChunk from './packets/RegisterChunk';
import RegisterMultipleChunks from './packets/RegisterMultipleChunks';
import DeRegisterChunk from './packets/DeRegisterChunk';
import RequestChatHistory from './packets/RequestChatHistory';
import ChangedMe from './packets/ChangedMe';
import KickMember from './packets/Factions/KickMember';
import PromoteMember from './packets/Factions/PromoteMember';
import DemoteMember from './packets/Factions/DemoteMember';

const chunks = [];

class ProtocolClient extends EventEmitter {
  url: string;
  ws: WebSocket;
  name: string;
  canvasId: number;
  timeConnected: number;
  isConnected: number;
  isConnecting: boolean;
  msgQueue: Array;

  constructor() {
    super();
    console.log('creating ProtocolClient');
    this.isConnecting = false;
    this.isConnected = false;
    this.ws = null;
    this.name = null;
    this.canvasId = null;
    this.msgQueue = [];
  }

  async connect() {
    this.isConnecting = true;
    if (this.ws) {
      console.log('WebSocket already open, not starting');
    }
    this.timeConnected = Date.now();
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${location.hostname}${
      location.port ? `:${location.port}` : ''
    }/ws`;
    this.ws = new WebSocket(url);
    this.ws.binaryType = 'arraybuffer';
    this.ws.onopen = this.onOpen.bind(this);
    this.ws.onmessage = this.onMessage.bind(this);
    this.ws.onclose = this.onClose.bind(this);
    this.ws.onerror = this.onError.bind(this);
  }

  sendWhenReady(msg) {
    if (this.isConnected) {
      this.ws.send(msg);
    } else {
      console.log('Tried sending message when websocket was closed!');
      this.msgQueue.push(msg);
      if (!this.isConnecting) {
        this.connect();
      }
    }
  }

  processMsgQueue() {
    while (this.msgQueue.length > 0) {
      this.sendWhenReady(this.msgQueue.shift());
    }
  }

  onOpen() {
    this.isConnecting = false;
    this.isConnected = true;
    this.emit('open', {});
    this.requestChatHistory();
    this.processMsgQueue();
    if (this.canvasId !== null) {
      this.ws.send(RegisterCanvas.dehydrate(this.canvasId));
    }
    console.log(`Register ${chunks.length} chunks`);
    this.ws.send(RegisterMultipleChunks.dehydrate(chunks));
  }

  onError(err) {
    console.error('Socket encountered error, closing socket', err);
    this.ws.close();
  }

  setName(name) {
    if (this.isConnected && this.name !== name) {
      console.log('Name change requieres WebSocket restart');
      this.reconnect();
    }
  }

  setCanvas(canvasId) {
    if (this.canvasId === canvasId || canvasId === null) {
      return;
    }
    console.log('Notify websocket server that we changed canvas');
    this.canvasId = canvasId;
    chunks.length = 0;
    this.sendWhenReady(RegisterCanvas.dehydrate(this.canvasId));
  }

  registerChunk(cell) {
    const [i, j] = cell;
    const chunkid = (i << 8) | j;
    chunks.push(chunkid);
    const buffer = RegisterChunk.dehydrate(chunkid);
    if (this.isConnected) this.ws.send(buffer);
  }

  deRegisterChunk(cell) {
    const [i, j] = cell;
    const chunkid = (i << 8) | j;
    const buffer = DeRegisterChunk.dehydrate(chunkid);
    if (this.isConnected) this.ws.send(buffer);
    const pos = chunks.indexOf(chunkid);
    if (~pos) chunks.splice(pos, 1);
  }

  requestChatHistory() {
    const buffer = RequestChatHistory.dehydrate();
    if (this.isConnected) this.ws.send(buffer);
  }

  sendMessage(message) {
    if (this.isConnected) this.ws.send(message);
  }

  onMessage({ data: message }) {
    try {
      if (typeof message === 'string') {
        this.onTextMessage(message);
      } else {
        this.onBinaryMessage(message);
      }
    } catch (err) {
      console.log(err);
      console.log(
        `An error occured while parsing websocket message ${message}`,
      );
    }
  }

  onTextMessage(message) {
    if (!message) return;
    const data = JSON.parse(message);

    if (Array.isArray(data)) {
      if (Array.isArray(data[0])) {
        // Array in Array: Chat History
        this.emit('chatHistory', data);
        return;
      }
      if (data.length == 2) {
        // Ordinary array: Chat message
        const [name, text] = data;
        this.emit('chatMessage', name, text);
      }
    } else {
      // string = name
      this.name = data;
    }
  }

  onBinaryMessage(buffer) {
    if (buffer.byteLength === 0) return;
    const data = new DataView(buffer);
    const opcode = data.getUint8(0);

    switch (opcode) {
      case PixelUpdate.OP_CODE:
        this.emit('pixelUpdate', PixelUpdate.hydrate(data));
        break;
      case OnlineCounter.OP_CODE:
        this.emit('onlineCounter', OnlineCounter.hydrate(data));
        break;
      case CoolDownPacket.OP_CODE:
        this.emit('cooldownPacket', CoolDownPacket.hydrate(data));
        break;
      case ChangedMe.OP_CODE:
        console.log('Websocket requested api/me reload');
        this.emit('changedMe');
        break;
      case KickMember.OP_CODE:
        this.emit('factionKick', KickMember.hydrate(buffer));
        break;
      case PromoteMember.OP_CODE:
        this.emit('factionPromote', PromoteMember.hydrate(buffer));
        break;
      case DemoteMember.OP_CODE:
        this.emit('factionDemote', DemoteMember.hydrate(buffer));
        break;
      default:
        console.error(`Unknown op_code ${opcode} received`);
        break;
    }
  }

  onClose(e) {
    this.emit('close');
    this.ws = null;
    this.isConnected = false;
    // reconnect in 1s if last connect was longer than 7s ago, else 5s
    const timeout = this.timeConnected < Date.now() - 7000 ? 1000 : 5000;
    console.warn(
      'Socket is closed. ' + `Reconnect will be attempted in ${timeout} ms.`,
      e.reason,
    );

    setTimeout(() => this.connect(), 5000);
  }

  close() {
    this.ws.close();
  }

  reconnect() {
    if (this.isConnected) {
      this.isConnected = false;
      console.log('Restarting WebSocket');
      this.ws.onclose = null;
      this.ws.onmessage = null;
      this.ws.close();
      this.ws = null;
      this.connect();
    }
  }
}

export default new ProtocolClient();
