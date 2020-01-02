# ocean tiles
In order to have the ocean and land on the canvas, or any other background pic, we have to create tiles that we can later upload to the canvas with drawOcean.js.
Those are the commands to create tiles in subfolders:

- create folder for tiles:

```
mkdir ./ocean
cd ocean
```
- to split image into tiles:

```
convert ../ocean.png -crop 128x128 +adjoin ocean_tiles%02d.png
```
- upscale and convert to black and white

```
mogrify -resize 2048x2048 -colors 2 -white-threshold 80% -black-threshold 80% ocean_tiles*.png
```
or without dithering:

```
mogrify +dither -resize 2048x2048 -colors 2 -white-threshold 80% -black-threshold 80% ocean_tiles*.png
```
- create subfolders

```
for i in {0..31}; do mkdir $i; done
```
- put into subfolders

```
for file in ./ocean_tiles*.png; do NUM=`echo $file | sed -e 's/.*ocean_tiles//' -e 's/.png//'`; Y=$(expr $NUM / 32); X=$(expr $NUM % 32); newfile="$X/$Y.png"; mv $file $newfile; done
```

- to remove the subfolders again

```
for i in {0..31}; do rm -r $i; done
```
