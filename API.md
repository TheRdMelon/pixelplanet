# API Websocket

This websocket provides unlimited access to many functions of the site, it is used for Discord Chat Bridge and Minecraft Bridge.

Websocket url:
`https://[old.]pixelplanet.fun/mcws`

Connection just possible with header:

```
Authorization: "Bearer APISOCKETKEY"
```

All requests are made as JSON encoded array.
### Subscribe to chat messages
```["sub", "chat"]```

All chat messages, except the once you send with `chat` or `mcchat`, will be sent to you in the form:

```["msg", name, message]```
### Subscribe to online user counter
```["sub", "online"]```

Online counter will be sent to you as typical binary packages all 15s
### Subscribe to pixel packages
```["sub", "pxl"]```

All pixels (including your own) will be sent to you as typical binary packages
### Set Pixel

```[ "setpxl", minecraftid, ip, x, y, clr ]```

(x, y, clr are integers, rest strings)

Sets a pixel with the according cooldown to minecraftid, ip. Minecraftid is optional, but ip is required if it is given. If both minecraftid and ip are null/None, the pixel will get set without cooldown check. No race condition checks are performed.

You will get a reply with:

```["retpxl", id, error, success, waitSeconds, coolDownSeconds]```

(id and error as strings, success as boolean, waitSeconds and coolDownSeconds as float)

ID is minecraftid, if given, else ip. 
error is a message on error, else null.
success... self explanatory 
waitSeconds is the current cooldown. 
coolDownSeconds is the added cooldown (negative if pixel couldn't be set because max cooldown got reached)
### Minecraft Login notification
```["login", minecraftid, minecraftname, ip]```

You will get an answer back like:

```["mcme", minecraftid, waitSeconds, pixelplanetname]```

with pixelplanetname being null/None if there is no pixelplanet account linked to this minecraftid.
wait Seconds is the cooldown like in `retpixel` above.
### Minecraft LogOut notification
```["logout", minecraftid]```
### Send Chat Message from Minecraft
```["mcchat", minecraftname, message]```

(got an extra command because minecraftname gets resolved to linked pixelplanet user if possible)
### Send Chat Message
```["chat", name, message]```

(messages with the name "info" will be displayed as red notifications in the chat window)
### Link Minecraft Account to pixelplanet Account
```["linkacc", minecraftid, minecraftname, pixelplanetname]```

Immediate answer:

```["linkret", minecraftid, error]```

Error will be null/None if link request can get sent, else it will be a string with the reason why not, examples:

- "You are already verified to [name]"
- "Can not find user [name] on pixelplanet"
- "You already linked to other account [name]"

User will then be asked if he wants to link the account on pixelplanet.

Answer after accept/deny by user:

```["linkver", minecraftid, pixelplanetname, accepted]```

With accepted being either true or false. This will be sent to every client connected to the API websocket.
### Report online minecraft users
Send list of all online users in minecraft periodically (all 10 to 15min) to avoid getting out of sync.

```["userlst", [["minecraftid1", "minecraftname1"], ["minecraftid2", "minecraftname2"], ...]]```
### Minecraft TP request

If a user requests a tp in minecraft you get a message

```["mctp", "minecraftid", x, y]```
