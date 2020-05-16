/* @flow */


import WebSocket from 'ws';

import logger from '../core/logger';
import Counter from '../utils/Counter';
import RateLimiter from '../utils/RateLimiter';
import { getIPFromRequest } from '../utils/ip';

import CoolDownPacket from './packets/CoolDownPacket';
import PixelUpdate from './packets/PixelUpdateServer';
import PixelReturn from './packets/PixelReturn';
import RegisterCanvas from './packets/RegisterCanvas';
import RegisterChunk from './packets/RegisterChunk';
import RegisterMultipleChunks from './packets/RegisterMultipleChunks';
import DeRegisterChunk from './packets/DeRegisterChunk';
import DeRegisterMultipleChunks from './packets/DeRegisterMultipleChunks';
import RequestChatHistory from './packets/RequestChatHistory';
import ChangedMe from './packets/ChangedMe';
import OnlineCounter from './packets/OnlineCounter';

import chatProvider, { ChatProvider } from '../core/ChatProvider';
import authenticateClient from './verifyClient';
import WebSocketEvents from './WebSocketEvents';
import webSockets from './websockets';
import { drawSafeByOffset } from '../core/draw';
import { needCaptcha } from '../utils/captcha';
import { cheapDetector } from '../core/isProxy';


const ipCounter: Counter<string> = new Counter();

function heartbeat() {
  this.isAlive = true;
}

async function verifyClient(info, done) {
  const { req } = info;
  const { headers } = req;

  // Limiting socket connections per ip
  const ip = getIPFromRequest(req);
  logger.info(`Got ws request from ${ip} via ${headers.origin}`);
  if (ipCounter.get(ip) > 50) {
    logger.info(`Client ${ip} has more than 50 connections open.`);
    return done(false);
  }

  ipCounter.add(ip);
  return done(true);
}


class SocketServer extends WebSocketEvents {
  wss: WebSocket.Server;
  CHUNK_CLIENTS: Map<number, Array>;

  // constructor(server: http.Server) {
  constructor() {
    super();
    this.CHUNK_CLIENTS = new Map();
    logger.info('Starting websocket server');
    webSockets.addListener(this);

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

    wss.on('error', (e) => {
      logger.error(`WebSocket Server Error ${e.message}`);
    });

    wss.on('connection', async (ws, req) => {
      ws.isAlive = true;
      ws.canvasId = null;
      ws.startDate = Date.now();
      ws.on('pong', heartbeat);
      const user = await authenticateClient(req);
      ws.user = user;
      ws.name = (user.regUser) ? user.regUser.name : null;
      ws.rateLimiter = new RateLimiter(20, 15, true);
      cheapDetector(user.ip);

      if (ws.name) {
        ws.send(`"${ws.name}"`);
      }

      ws.send(OnlineCounter.dehydrate({
        online: this.wss.clients.size || 0,
      }));

      const ip = getIPFromRequest(req);
      ws.on('error', (e) => {
        logger.error(`WebSocket Client Error for ${ws.name}: ${e.message}`);
      });
      ws.on('close', () => {
        // is close called on terminate?
        // possible memory leak?
        ipCounter.delete(ip);
        this.deleteAllChunks(ws);
      });
      ws.on('message', (message) => {
        if (typeof message === 'string') {
          SocketServer.onTextMessage(message, ws);
        } else {
          this.onBinaryMessage(message, ws);
        }
      });
    });

    this.onlineCounterBroadcast = this.onlineCounterBroadcast.bind(this);
    this.ping = this.ping.bind(this);

    /*
     * i don't tink that we really need that, it just stresses the server
     * with lots of reconnects at once, the overhead of having a few idle
     * connections isn't too bad in comparison
     */
    // this.killOld = this.killOld.bind(this);
    // setInterval(this.killOld, 10 * 60 * 1000);

    setInterval(this.onlineCounterBroadcast, 10 * 1000);
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
            // eslint-disable-next-line no-underscore-dangle
            ws._socket.write(buffer);
          } catch (error) {
            logger.error(`WebSocket broadcast error: ${error.message}`);
          }
        });
      }
    });
  }

  broadcastOnlineCounter(buffer: Buffer) {
    this.broadcast(buffer);
  }

  broadcastChatMessage(
    name: string,
    message: string,
    country: string,
    channelId: number = 0,
  ) {
    const text = JSON.stringify([name, message, country, channelId]);
    this.wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(text);
      }
    });
  }

  broadcastPixelBuffer(canvasId: number, chunkid, data: Buffer) {
    const frame = WebSocket.Sender.frame(data, {
      readOnly: true,
      mask: false,
      rsv1: false,
      opcode: 2,
      fin: true,
    });
    if (this.CHUNK_CLIENTS.has(chunkid)) {
      const clients = this.CHUNK_CLIENTS.get(chunkid);
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN
          // canvasId can be number or string, caused by
          // js disctionaries not being able to have numbers as keys
          // eslint-disable-next-line eqeqeq
          && client.canvasId == canvasId
        ) {
          frame.forEach((buffer) => {
            try {
              // eslint-disable-next-line no-underscore-dangle
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
      if (ws.name === name) {
        const buffer = ChangedMe.dehydrate();
        ws.send(buffer);
      }
    });
  }

  killOld() {
    const now = Date.now();
    this.wss.clients.forEach((ws) => {
      const lifetime = now - ws.startDate;
      if (lifetime > 30 * 60 * 1000 && Math.random() < 0.3) ws.terminate();
    });
  }

  ping() {
    this.wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        ws.terminate();
      } else {
        ws.isAlive = false;
        ws.ping(() => {});
      }
    });
  }

  onlineCounterBroadcast() {
    const online = this.wss.clients.size || 0;
    webSockets.broadcastOnlineCounter(online);
  }

  static async onTextMessage(text, ws) {
    try {
      let message;
      let channelId;
      try {
        const data = JSON.parse(text);
        [message, channelId] = data;
        channelId = Number(channelId);
        if (Number.isNaN(channelId)) {
          throw new Error('NaN');
        }
      } catch {
        logger.warn(
          `Received unparseable message from ${ws.name} on websocket: ${text}`,
        );
        return;
      }
      message = message.trim();

      if (ws.name && message) {
        const { user } = ws;
        const waitLeft = ws.rateLimiter.tick();
        if (waitLeft) {
          ws.send(JSON.stringify([
            'info',
            // eslint-disable-next-line max-len
            `You are sending messages too fast, you have to wait ${Math.floor(waitLeft / 1000)}s :(`,
            'il',
            channelId,
          ]));
          return;
        }
        // check proxy
        if (await cheapDetector(user.ip)) {
          logger.info(
            `${ws.name} / ${user.ip} tried to send chat message with proxy`,
          );
          ws.send(JSON.stringify([
            'info',
            'You can not send chat messages with a proxy',
            'il',
            channelId,
          ]));
          return;
        }
        //
        const errorMsg = await chatProvider.sendMessage(
          user,
          message,
          channelId,
        );
        if (!errorMsg) {
          // automute on repeated message spam
          if (ws.last_message && ws.last_message === message) {
            ws.message_repeat += 1;
            if (ws.message_repeat >= 4) {
              logger.info(`User ${ws.name} got automuted`);
              ChatProvider.automute(ws.name, channelId);
              ws.message_repeat = 0;
            }
          } else {
            ws.message_repeat = 0;
            ws.last_message = message;
          }
        } else {
          ws.send(JSON.stringify(['info', errorMsg, 'il', channelId]));
        }
        logger.info(
          `Received chat message ${message} from ${ws.name} / ${ws.user.ip}`,
        );
      } else {
        logger.info('Got empty message or message from unidentified ws');
      }
    } catch {
      logger.info('Got invalid ws text message');
    }
  }

  async onBinaryMessage(buffer, ws) {
    if (buffer.byteLength === 0) return;
    const opcode = buffer[0];

    try {
      switch (opcode) {
        case PixelUpdate.OP_CODE: {
          const { canvasId, user } = ws;
          if (canvasId === null) {
            return;
          }
          const { ip } = user;
          // check if captcha needed
          if (await needCaptcha(ip)) {
            // need captcha
            ws.send(PixelReturn.dehydrate(10, 0, 0));
            break;
          }
          // (re)check for Proxy
          if (await cheapDetector(ip)) {
            ws.send(PixelReturn.dehydrate(11, 0, 0));
            break;
          }
          // receive pixels here
          const {
            i, j, offset,
            color,
          } = PixelUpdate.hydrate(buffer);
          const {
            wait,
            coolDown,
            retCode,
          } = await drawSafeByOffset(
            ws.user,
            ws.canvasId,
            color,
            i, j, offset,
          );
          ws.send(PixelReturn.dehydrate(retCode, wait, coolDown));
          break;
        }
        case RegisterCanvas.OP_CODE: {
          const canvasId = RegisterCanvas.hydrate(buffer);
          if (ws.canvasId !== null && ws.canvasId !== canvasId) {
            this.deleteAllChunks(ws);
          }
          ws.canvasId = canvasId;
          const wait = await ws.user.getWait(canvasId);
          const waitMs = (wait) ? wait - Date.now() : 0;
          ws.send(CoolDownPacket.dehydrate(waitMs));
          break;
        }
        case RegisterChunk.OP_CODE: {
          const chunkid = RegisterChunk.hydrate(buffer);
          this.pushChunk(chunkid, ws);
          break;
        }
        case RegisterMultipleChunks.OP_CODE: {
          this.deleteAllChunks(ws);
          let posu = 2;
          while (posu < buffer.length) {
            const chunkid = buffer[posu++] | buffer[posu++] << 8;
            this.pushChunk(chunkid, ws);
          }
          break;
        }
        case DeRegisterChunk.OP_CODE: {
          const chunkidn = DeRegisterChunk.hydrate(buffer);
          this.deleteChunk(chunkidn, ws);
          break;
        }
        case DeRegisterMultipleChunks.OP_CODE: {
          let posl = 2;
          while (posl < buffer.length) {
            const chunkid = buffer[posl++] | buffer[posl++] << 8;
            this.deleteChunk(chunkid, ws);
          }
          break;
        }
        case RequestChatHistory.OP_CODE: {
          const history = JSON.stringify(chatProvider.history);
          ws.send(history);
          break;
        }
        default:
          break;
      }
    } catch (e) {
      logger.info('Got invalid ws binary message');
      throw e;
    }
  }

  pushChunk(chunkid, ws) {
    if (!this.CHUNK_CLIENTS.has(chunkid)) {
      this.CHUNK_CLIENTS.set(chunkid, []);
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
