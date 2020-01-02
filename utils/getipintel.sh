email="cxyvsf2@gmail.com"
RESULT=`geoiplookup $1 | sed -e 's/.*, //'`
PROXY=`wget "http://check.getipintel.net/check.php?ip=$1&contact=alpha@gmail.com" -qO -`
echo "$1 $RESULT $PROXY"
