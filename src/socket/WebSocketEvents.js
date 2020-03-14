/* @flow
 *
 * Parent class for socket servers
 *
 */

/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */

class WebSocketEvents {
  broadcast(message: Buffer) {}

  broadcastPixelBuffer(canvasId: number, chunkid: number, buffer: Buffer) {}

  broadcastChatMessage(name: string, message: string) {}

  broadcastMinecraftLink(
    name: string,
    minecraftid: string,
    accepted: boolean,
  ) {}

  notifyChangedMe(name: string) {}

  broadcastMinecraftTP(minecraftid: string, x: number, y: number) {}

  broadcastOnlineCounter(data: Buffer) {}

  notifyKickedMember(userId, factionId) {}

  notifyPromotedMember(userId, factionId) {}

  notifyDemotedMember(userId, factionId) {}
}

export default WebSocketEvents;
