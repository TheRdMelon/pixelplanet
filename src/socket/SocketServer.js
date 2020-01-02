/* @flow */


import EventEmitter from 'events';
import WebSocket from 'ws';

import logger from '../core/logger';
import Counter from '../utils/Counter';
import RateLimiter from '../utils/RateLimiter';
import { getIPFromRequest } from '../utils/ip';

import RegisterCanvas from './packets/RegisterCanvas';
import RegisterChunk from './packets/RegisterChunk';
import RegisterMultipleChunks from './packets/RegisterMultipleChunks';
import DeRegisterChunk from './packets/DeRegisterChunk';
import DeRegisterMultipleChunks from './packets/DeRegisterMultipleChunks';
import RequestChatHistory from './packets/RequestChatHistory';
import CoolDownPacket from './packets/CoolDownPacket';
import PixelUpdate from './packets/PixelUpdate';
import ChangedMe from './packets/ChangedMe';

import ChatHistory from './ChatHistory';
import authenticateClient from './verifyClient';
import { broadcastChatMessage } from './websockets';


const ipCounter: Counter<string> = new Counter();

function heartbeat() {
  this.isAlive = true;
}

async function verifyClient(info, done) {
  const { req } = info;

  // Limiting socket connections per ip
  const ip = await getIPFromRequest(req);
  logger.info(`Got ws request from ${ip}`);
  if (ipCounter.get(ip) > 50) {
    logger.info(`Client ${ip} has more than 50 connections open.`);
    return done(false);
  }

  ipCounter.add(ip);
  return done(true);
}


class SocketServer extends EventEmitter {
  wss: WebSocket.Server;
  CHUNK_CLIENTS: Map<number, Array>;

  // constructor(server: http.Server) {
  constructor() {
    super();
    this.CHUNK_CLIENTS = new Map();
    logger.info('Starting websocket server');

    const wss = new WebSocket.Server({
      perMessageDeflate: false,
      clientTracking: true,
      maxPayload: 65536,
      // path: "/ws",
      // server,
      noServer: true,
      verifyClient,
    });
    this.wss = wss;

    wss.on('error', logger.error);

    wss.on('connection', async (ws, req) => {
      ws.isAlive = true;
      ws.canvasId = null;
      ws.startDate = Date.now();
      ws.on('pong', heartbeat);
      const user = await authenticateClient(req);
      ws.user = user;
      ws.name = (user.regUser) ? user.regUser.name : null;
      ws.rateLimiter = new RateLimiter(20, 15, true);
      const ip = await getIPFromRequest(req);

      if (ws.name) {
        ws.send(`"${ws.name}"`);
      }

      ws.on('error', logger.error);
      ws.on('close', () => {
        // is close called on terminate?
        // possible memory leak?
        ipCounter.delete(ip);
        this.deleteAllChunks(ws);
      });
      ws.on('message', (message) => {
        if (typeof message === 'string') { this.onTextMessage(message, ws); } else { this.onBinaryMessage(message, ws); }
      });
    });

    this.ping = this.ping.bind(this);
    this.killOld = this.killOld.bind(this);

    setInterval(this.killOld, 10 * 60 * 1000);
    // https://github.com/websockets/ws#how-to-detect-and-close-broken-connections
    setInterval(this.ping, 45 * 1000);
  }


  /**
   * https://github.com/websockets/ws/issues/617
   * @param data
   */
  broadcast(data: Buffer) {
    const frame = WebSocket.Sender.frame(data, {
      readOnly: true,
      mask: false,
      rsv1: false,
      opcode: 2,
      fin: true,
    });
    this.wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        frame.forEach((buffer) => {
          try {
            ws._socket.write(buffer);
          } catch (error) {
            logger.error('(!) Catched error on write socket:', error);
          }
        });
      }
    });
  }

  broadcastText(text: string) {
    this.wss.clients.forEach((ws) => {
      if (ws.readyState == WebSocket.OPEN) {
        ws.send(text);
      }
    });
  }

  broadcastPixelBuffer(canvasId, chunkid, buffer) {
    const frame = WebSocket.Sender.frame(buffer, {
      readOnly: true,
      mask: false,
      rsv1: false,
      opcode: 2,
      fin: true,
    });
    if (this.CHUNK_CLIENTS.has(chunkid)) {
      const clients = this.CHUNK_CLIENTS.get(chunkid);
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client.canvasId == canvasId) {
          frame.forEach((buffer) => {
            try {
              client._socket.write(buffer);
            } catch (error) {
              logger.error('(!) Catched error on write socket:', error);
            }
          });
        }
      });
    }
  }

  notifyChangedMe(name) {
    this.wss.clients.forEach((ws) => {
      if (ws.name == name) {
        const buffer = ChangedMe.dehydrate();
        ws.send(buffer);
      }
    });
  }

  getConnections(): number {
    return this.wss.clients.size || 0;
  }

  killOld() {
    const now = Date.now();
    this.wss.clients.forEach((ws) => {
      const lifetime = now - ws.startDate;
      if (lifetime > 30 * 60 * 1000) ws.terminate();
    });
  }

  ping() {
    this.wss.clients.forEach((ws) => {
      if (!ws.isAlive) return ws.terminate();

      ws.isAlive = false;
      ws.ping(() => {});
    });
  }

  onTextMessage(message, ws) {
    if (ws.name && message) {
      const waitLeft = ws.rateLimiter.tick();
      if (waitLeft) {
        ws.send(JSON.stringify(['info', `You are sending messages too fast, you have to wait ${Math.floor(waitLeft / 1000)}s :(`]));
      } else {
        broadcastChatMessage(ws.name, message);
      }
    } else {
      logger.info('Got empty message or message from unidentified ws');
    }
  }

  async onBinaryMessage(buffer, ws) {
    if (buffer.byteLength === 0) return;
    const opcode = buffer[0];

    switch (opcode) {
      case RegisterCanvas.OP_CODE:
        const canvasId = RegisterCanvas.hydrate(buffer);
        if (ws.canvasId !== null && ws.canvasId !== canvasId) {
          this.deleteAllChunks(ws);
        }
        ws.canvasId = canvasId;
        const wait = await ws.user.getWait(canvasId);
        const waitSeconds = (wait) ? Math.ceil((wait - Date.now()) / 1000) : 0;
        ws.send(CoolDownPacket.dehydrate(waitSeconds));
        break;
      case RegisterChunk.OP_CODE:
        const chunkid = RegisterChunk.hydrate(buffer);
        this.pushChunk(chunkid, ws);
        break;
      case RegisterMultipleChunks.OP_CODE:
        this.deleteAllChunks(ws);
        const length = buffer.length;
        let posu = 2;
        while (posu < length) {
          const chunkid = buffer[posu++] | buffer[posu++] << 8;
          this.pushChunk(chunkid, ws);
        }
        break;
      case DeRegisterChunk.OP_CODE:
        const chunkidn = DeRegisterChunk.hydrate(buffer);
        this.deleteChunk(chunkidn, ws);
        break;
      case DeRegisterMultipleChunks.OP_CODE:
        const lengthl = buffer.length;
        let posl = 2;
        while (posl < lengthl) {
          const chunkid = buffer[posl++] | buffer[posl++] << 8;
          this.deleteChunk(chunkid, ws);
        }
        break;
      case RequestChatHistory.OP_CODE:
        const history = JSON.stringify(ChatHistory.history);
        ws.send(history);
        break;
      default:
        break;
    }
  }

  pushChunk(chunkid, ws) {
    if (!this.CHUNK_CLIENTS.has(chunkid)) {
      this.CHUNK_CLIENTS.set(chunkid, new Array());
    }
    const clients = this.CHUNK_CLIENTS.get(chunkid);
    const pos = clients.indexOf(ws);
    if (~pos) return;
    clients.push(ws);
  }

  deleteChunk(chunkid, ws) {
    if (!this.CHUNK_CLIENTS.has(chunkid)) return;
    const clients = this.CHUNK_CLIENTS.get(chunkid);
    const pos = clients.indexOf(ws);
    if (~pos) clients.splice(pos, 1);
  }

  deleteAllChunks(ws) {
    this.CHUNK_CLIENTS.forEach((client) => {
      if (!client) return;
      const pos = client.indexOf(ws);
      if (~pos) client.splice(pos, 1);
    });
  }
}

export default SocketServer;
