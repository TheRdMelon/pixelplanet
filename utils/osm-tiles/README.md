# OSM tiles
This osm tiles and pictures are just informational, they don't get used for creating the map on directly on pixelplanet.fun.

## Download zoomlevel 5
1. download tiles
```bash
for i in {0..31}; do mkdir $i; for u in {0..31}; do wget https://b.tile.thunderforest.com/mobile-atlas/5/$i/$u.png?apikey=7c352c8ff1244dd8b732e349e0b0fe8d -O $i/$u.png; done ; done
```
2. combine tiles
```bash
for i in {0..31}; do convert -append "$i/%d.png[0-31]" $i.png; done
convert +append "%d.png[0-31]" out.png
```
3. fix to our custom projection
- scale x: 1
- scale y: 1060 / 1024 = 530 / 512 = 265 / 256
- centered
```bash
convert out.png -resize 8192x8480\! final.png
# (8480 - 8192) / 2 = 144
mogrify -shave 0x144 final.png
```
4. clean up
```bash
for i in {0..31}; do rm $i.png; done
for i in {0..31}; do rm -r $i; done
rm out.png
```

## Download zoomlevel 8
1. downloading it in columns
```bash
mkdir tmp
for i in {0..255}; do for u in {0..255}; do wget https://a.tile.openstreetmap.org/8/$i/$u.png -O tmp/$u.png; done; convert -append "tmp/%d.png[0-255]" $i.png; rm tmp/*; done
rm -r tmp
```
2. conbining straps t 2048 width, fix scale to our projection like above with zoomlevel 5
```bash
for i in {0..31}; do LOW=$(expr $i "*" 8); UP=$(expr $LOW + 7); echo "Generating s$i.png from $LOW to $UP"; convert +append "%d.png[${LOW}-${UP}]" s$i.png; done
```
3. delete old stripes
```bash
for i in {0..255}; do rm $i.png; done
```
4. convert to our projection
```bash
for i in {0..31}; do echo "Generating c$i.png"; convert s$i.png -resize 2048x67840\! -shave 0x1152 c$i.png; done
``` 
5. create subfolders for tiles
```bash
mkdir osm
for i in {0..31}; do mkdir osm/$i; done
```
6. split into tiles
```bash
for i in {0..32}; do echo "Generating tiles for x=$i"; convert c$i.png -crop 2048x2048 +adjoin osm/$i/%02d.png; done
```
7. clean up
```bash
rm s*.png
rm c*.png
```
