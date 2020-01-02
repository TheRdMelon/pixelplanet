# Utils and informations of current deployment
Files here might be very specific to the setup of pixelplanet.fun and might not be relevant for everyone

## updtmsg
Basic nodejs script to print a message and a youtube video, used as a message while updating

## post-receive
Pixelplanet has its own git repository for deployment on the live system, if an commit get pushed to it, it will automatically build the canvas and deploy it and post update messages to discord. This hook is managing that on the server.

## Some notes:
Cloudflare Caching Setting `Broser Cache Expiration` should be set to `Respect Existing Headers` or it would default to 4h, which is unreasonable for chunks.
Additinally make sure that cachebreakers get blocked by setting Cloudflare Firewall rules to block empty query strings at least for chunks
