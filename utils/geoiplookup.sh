email="cxyvsf@gmail.com"
while read i; do 
  RESULT=`geoiplookup $i | sed -e 's/.*, //'`
  #PROXY=`wget "http://check.getipintel.net/check.php?ip=$i&contact=alpha@gmail.com" -qO -`
  echo "$i $RESULT"
done < ./ips
