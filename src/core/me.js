/**
 *
 * Userdata that gets sent to the client on
 * various api endpoints.
 *
 * @flow
 */
import canvases from '../canvases.json';


export default async function getMe(user) {
  const userdata = user.getUserData();
  // sanitize data
  const {
    name, mailVerified, minecraftname, mcVerified,
  } = userdata;
  if (!name) userdata.name = null;
  const messages = [];
  if (name && !mailVerified) {
    messages.push('not_verified');
  }
  if (minecraftname && !mcVerified) {
    messages.push('not_mc_verified');
  }
  if (messages.length > 0) {
    userdata.messages = messages;
  }
  delete userdata.mailVerified;
  delete userdata.mcVerified;

  userdata.canvases = canvases;

  return userdata;
}
