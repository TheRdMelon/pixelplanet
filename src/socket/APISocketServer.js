/* eslint-disable no-underscore-dangle */
/*
 *
 * This WebSocket is used for connecting
 * to minecraft server.
 * The minecraft server can set pixels and report user logins
 * and more.
 *
 * @flow */

import WebSocket from 'ws';

import WebSocketEvents from './WebSocketEvents';
import webSockets from './websockets';
import { getIPFromRequest } from '../utils/ip';
import Minecraft from '../core/minecraft';
import { drawUnsafe, setPixel } from '../core/draw';
import logger from '../core/logger';
import { APISOCKET_KEY } from '../core/config';

function heartbeat() {
  this.isAlive = true;
}

async function verifyClient(info, done) {
  const { req } = info;
  const { headers } = req;
  const ip = await getIPFromRequest(req);

  if (
    !headers.authorization
    || headers.authorization != `Bearer ${APISOCKET_KEY}`
  ) {
    logger.warn(`API ws request from ${ip} authenticated`);
    return done(false);
  }
  logger.warn(`API ws request from ${ip} successfully authenticated`);
  return done(true);
}

class APISocketServer extends WebSocketEvents {
  wss: WebSocket.Server;
  mc: Minecraft;

  constructor() {
    super();
    logger.info('Starting API websocket server');
    webSockets.addListener(this);

    const wss = new WebSocket.Server({
      perMessageDeflate: false,
      clientTracking: true,
      maxPayload: 65536,
      // path: "/mcws",
      // server,
      noServer: true,
      verifyClient,
    });
    this.wss = wss;
    this.mc = new Minecraft();

    wss.on('error', logger.error);

    wss.on('connection', async (ws) => {
      ws.isAlive = true;
      ws.subChat = false;
      ws.subPxl = false;
      ws.subOnline = false;
      ws.on('pong', heartbeat);

      ws.on('message', (message) => {
        if (typeof message === 'string') {
          this.onTextMessage(message, ws);
        }
      });
    });

    this.ping = this.ping.bind(this);
    setInterval(this.ping, 45 * 1000);
  }

  broadcastChatMessage(name, msg, sendapi, ws = null) {
    if (!sendapi) return;

    const sendmsg = JSON.stringify(['msg', name, msg]);
    this.wss.clients.forEach((client) => {
      if (
        client !== ws
        && client.subChat
        && client.readyState === WebSocket.OPEN
      ) {
        client.send(sendmsg);
      }
    });
  }

  broadcastMinecraftLink(name, minecraftid, accepted) {
    const sendmsg = JSON.stringify(['linkver', minecraftid, name, accepted]);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(sendmsg);
      }
    });
  }

  broadcastMinecraftTP(minecraftid, x, y) {
    const sendmsg = JSON.stringify(['mctp', minecraftid, x, y]);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(sendmsg);
      }
    });
  }

  broadcastOnlineCounter(buffer) {
    const frame = WebSocket.Sender.frame(buffer, {
      readOnly: true,
      mask: false,
      rsv1: false,
      opcode: 2,
      fin: true,
    });
    this.wss.clients.forEach((client) => {
      if (client.subOnline && client.readyState === WebSocket.OPEN) {
        frame.forEach((data) => {
          try {
            client._socket.write(data);
          } catch (error) {
            logger.error('(!) Catched error on write apisocket:', error);
          }
        });
      }
    });
  }

  broadcastPixelBuffer(canvasId, chunkid, buffer) {
    if (canvasId !== 0) return;
    const frame = WebSocket.Sender.frame(buffer, {
      readOnly: true,
      mask: false,
      rsv1: false,
      opcode: 2,
      fin: true,
    });
    this.wss.clients.forEach((client) => {
      if (client.subPxl && client.readyState === WebSocket.OPEN) {
        frame.forEach((data) => {
          try {
            client._socket.write(data);
          } catch (error) {
            logger.error('(!) Catched error on write apisocket:', error);
          }
        });
      }
    });
  }

  async onTextMessage(message, ws) {
    logger.info(`Got message ${message}`);
    try {
      const packet = JSON.parse(message);
      const command = packet[0];
      packet.shift();
      if (!command) {
        return;
      }
      if (command == 'sub') {
        const even = packet[0];
        if (even == 'chat') {
          ws.subChat = true;
        }
        if (even == 'pxl') {
          ws.subPxl = true;
        }
        if (even == 'online') {
          ws.subOnline = true;
        }
        return;
      }
      if (command == 'setpxl') {
        const [minecraftid, ip, x, y, clr] = packet;
        if (clr < 0 || clr > 32) return;
        // be aware that user null has no cd
        if (!minecraftid && !ip) {
          setPixel(0, clr, x, y);
          ws.send(JSON.stringify(['retpxl', null, null, true, 0, 0]));
          return;
        }
        const user = this.mc.minecraftid2User(minecraftid);
        user.ip = ip;
        const {
          error,
          success,
          waitSeconds,
          coolDownSeconds,
        } = await drawUnsafe(user, 0, clr, x, y, null);
        ws.send(
          JSON.stringify([
            'retpxl',
            minecraftid || ip,
            error || null,
            success,
            waitSeconds,
            coolDownSeconds || null,
          ]),
        );
        return;
      }
      if (command == 'login') {
        const [minecraftid, minecraftname, ip] = packet;
        const user = await this.mc.report_login(minecraftid, minecraftname);
        // get userinfo
        user.ip = ip;
        const wait = await user.getWait(0);
        const waitSeconds = wait ? (wait - Date.now()) / 1000 : null;
        const name = user.id == null ? null : user.regUser.name;
        ws.send(JSON.stringify(['mcme', minecraftid, waitSeconds, name]));
        return;
      }
      if (command == 'userlst') {
        const [userlist] = packet;
        if (!Array.isArray(userlist) || !Array.isArray(userlist[0])) {
          logger.error('Got invalid minecraft userlist on APISocketServer');
          return;
        }
        this.mc.report_userlist(userlist);
        return;
      }
      if (command == 'logout') {
        const [minecraftid] = packet;
        this.mc.report_logout(minecraftid);
        return;
      }
      if (command == 'mcchat') {
        const [minecraftname, msg] = packet;
        const user = this.mc.minecraftname2User(minecraftname);
        const chatname = user.id
          ? `[MC] ${user.regUser.name}`
          : `[MC] ${minecraftname}`;
        webSockets.broadcastChatMessage(chatname, msg, false);
        this.broadcastChatMessage(chatname, msg, true, ws);
        return;
      }
      if (command == 'chat') {
        const [name, msg] = packet;
        webSockets.broadcastChatMessage(name, msg, false);
        this.broadcastChatMessage(name, msg, true, ws);
        return;
      }
      if (command == 'linkacc') {
        const [minecraftid, minecraftname, name] = packet;
        const ret = await this.mc.linkacc(minecraftid, minecraftname, name);
        if (!ret) {
          webSockets.notifyChangedMe(name);
        }
        ws.send(JSON.stringify(['linkret', minecraftid, ret]));
      }
    } catch (err) {
      logger.error(`Got undecipherable api-ws message ${message}`);
    }
  }

  ping() {
    this.wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping(() => {});
      return null;
    });
  }
}

export default APISocketServer;
