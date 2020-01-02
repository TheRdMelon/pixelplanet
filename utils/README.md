# Utils for map creation, conversion, 3d models and related stuff
Note:
- we use blender 2.8
- js script are executed with babel-node

## sphere-protection.blend
This blend file includes the sphere we use to display the globe with two UV maps, one for protection like it's used on many globe textures of the earth like [here](http://blog.mastermaps.com/2013/09/creating-webgl-earth-with-threejs.html) and [here](http://www.shadedrelief.com/natural3/pages/textures.html) and one for our mercator projection that is the same as on OpenStreetMap, with additional changes for poles.
The shader nodes in the bumpmap material are setup so that they bake from one uv map to another.

If you want to generate the .glb model file for the site thats in public/globe/globe.glb:
1. delete all materials of the sphere
2. delete the "fake-mercator" uv map, so that just the mercator one is left
3. create a new one without textures
4. name the material "canvas" (this will then be set by the script to the canvas textures)
5. select the sphere and export as .glb

## ocean-tiles
Used to generate tiles based on a uv texture that can then be drawn on the canvas, like the oceans and continents.

## country-locations
Generates a json list of country codes and their coordinates on the canvas based on lat and lon

## redis-convert.js
Script to convert redis canvas database to different color / different layout

## redis-copy.js
Script to copy a canvas from one redis to another, with different keys if neccessary

## sql-commandtest.js
Script that connects to the mysql database and does some stuff, just for testing

## proxyConvert.sh
Converts a proxy list in specific txt format to a better readable list
