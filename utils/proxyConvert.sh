#!/bin/bash
#Basic shell script to convert text proxy list to readable list

echo "" > proxies.txt
for i in `cat ips-static.txt`; do
  HOST=`echo $i | sed 's/\(.*\):.*:.*:.*/\1/'`
  PORT=`echo $i | sed 's/.*:\(.*\):.*:.*/\1/'`
  USER=`echo $i | sed 's/.*:.*:\(.*\):.*/\1/'`
  IP=`echo $USER | sed 's/.*-\(.*\)/\1/'`
  PASSWORD=`echo $i | sed 's/.*:.*:.*:\(.*\)/\1/'`
  #COUNTRY=`geoiplookup $IP`
  echo "http://$USER:$PASSWORD@$HOST:$PORT" >> proxies.txt
done
