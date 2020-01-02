/* @flow
 *
 * Serverside communication with websockets.
 * In general all values that get broadcasted here have to be sanitized already.
 *
 */

import url from 'url';

import logger from '../core/logger';
import { SECOND } from '../core/constants';
import { getChunkOfPixel } from '../core/utils';

import ChatHistory from './ChatHistory';
import SocketServer from './SocketServer';
import APISocketServer from './APISocketServer';
import OnlineCounter from './packets/OnlineCounter';
import PixelUpdate from './packets/PixelUpdate';

const usersocket = new SocketServer();
const apisocket = new APISocketServer();

/*
 * broadcast message via websocket
 * @param message Message to send
 */
export async function broadcast(message: Buffer) {
  if (usersocket) usersocket.broadcast(message);
}

/*
 * broadcast pixel message via websocket
 * @param canvasIdent ident of canvas
 * @param i x coordinates of chunk
 * @param j y coordinates of chunk
 * @param offset offset of pixel within this chunk
 * @param color colorindex
 */
export async function broadcastPixel(
  canvasId: number,
  i: number,
  j: number,
  offset: number,
  color: number,
) {
  const chunkid = (i << 8) | j;
  const buffer = PixelUpdate.dehydrate(i, j, offset, color);
  if (usersocket) usersocket.broadcastPixelBuffer(canvasId, chunkid, buffer);
  if (apisocket && canvasId == 0) apisocket.broadcastPixelBuffer(chunkid, buffer);
}

/*
 * broadcast chat message
 * @param name chatname
 * @param message Message to send
 * @param sendapi If chat message should get boradcasted to api websocket
 *                (usefull if the api is supposed to not answer to its own messages)
 */
export async function broadcastChatMessage(name: string, message: string, sendapi: boolean = true) {
  logger.info(`Received chat message ${message} from ${name}`);
  ChatHistory.addMessage(name, message);
  if (usersocket) usersocket.broadcastText(JSON.stringify([name, message]));
  if (sendapi && apisocket) apisocket.broadcastChatMessage(name, message);
}

/*
 * broadcast minecraft linking to API
 * @param name pixelplanetname
 * @param minecraftid minecraftid
 * @param accepted If link request got accepted
 */
export async function broadcastMinecraftLink(name: string, minecraftid: string, accepted: boolean) {
  if (apisocket) apisocket.broadcastMinecraftLink(name, minecraftid, accepted);
}

/*
 * Notify user on websocket that he should rerequest api/message
 * Currently just used for getting minecraft link message.
 */
export async function notifyChangedMe(name: string) {
  if (usersocket) usersocket.notifyChangedMe(name);
}

/*
 * broadcast mc tp request to API
 * @param minecraftid minecraftid
 * @param x x coords
 * @param y y coords
 */
export async function broadcastMinecraftTP(minecraftid, x, y) {
  if (apisocket) apisocket.broadcastMinecraftTP(minecraftid, x, y);
}

/*
 * send websocket package of online counter every x seconds
 */
function startOnlineCounterBroadcast() {
  setInterval(() => {
    if (usersocket) {
      const online = usersocket.getConnections();
      const buffer = OnlineCounter.dehydrate({ online });
      usersocket.broadcast(buffer);
      if (apisocket) apisocket.broadcastOnlineCounter(buffer);
    }
  }, 15 * SECOND);
}
startOnlineCounterBroadcast();

/*
 * websocket upgrade / establishing connection
 * Get hooked up to httpServer and routes to the right socket
 */
export function wsupgrade(request, socket, head) {
  const pathname = url.parse(request.url).pathname;

  if (pathname === '/ws') {
    usersocket.wss.handleUpgrade(request, socket, head, (ws) => {
      usersocket.wss.emit('connection', ws, request);
    });
  } else if (pathname === '/mcws') {
    apisocket.wss.handleUpgrade(request, socket, head, (ws) => {
      apisocket.wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
}
