#!/bin/bash
# this script parses the pixellogs live and shows which IPs are currently active in 
# a given area and where they placed their last pixel
# Usage: ./liveLog.sh LOGFILE CANVASID STARTX_STARTY ENDX_ENDY
LOGFILE=$1
CANVAS=$2
STARTCOORDS=$3
ENDCOORDS=$4
STARTX=`echo ${STARTCOORDS} | sed 's/_.*$//'`
STARTY=`echo ${STARTCOORDS} | sed 's/^.*_//'`
ENDX=`echo ${ENDCOORDS} | sed 's/_.*$//'`
ENDY=`echo ${ENDCOORDS} | sed 's/^.*_//'`

if [ "$#" -ne 4 ]
then
  echo "  Usage: ./liveLog.sh LOGFILE CANVASID STARTX_STARTY ENDX_ENDY"
  echo ""
  echo "this script parses the pixellogs live and shows which IPs are currently active in "
  echo "a given area and where they placed their last pixel"
  exit 1
fi


parse_log()
{
        while read -r -a args
        do
                CAN=${args[2]}
                X=${args[3]}
                Y=${args[4]}
                if [ "$CAN" -eq "$CANVAS" -a "$X" -ge "$STARTX" -a "$X" -le "$ENDX" -a "$Y" -ge "$STARTY" -a "$Y" -le "$ENDY" ]
                then
                        IP=${args[0]}
                        CLR=${args[6]}
                        printf "%-40s | %-18s | %5s\n" "$IP" "$X,$Y" "$CLR"
                fi
        done <&0
}

declare -A ACTIVEIPS
parse_log_active_ips()
{
        while read -r -a args
        do
                CAN=${args[2]}
                X=${args[3]}
                Y=${args[4]}
                if [ "$CAN" -eq "$CANVAS" -a "$X" -ge "$STARTX" -a "$X" -le "$ENDX" -a "$Y" -ge "$STARTY" -a "$Y" -le "$ENDY" ]
                then
                        IP=${args[0]}
                        if [ -z "${ACTIVEIPS[$IP]}" ]
                        then
                                CNT=0
                        else
                                CNT=`echo ${ACTIVEIPS[$IP]} | sed 's/ .*//'`
                        fi
                        CNT=$((${CNT} + 1))
                        CLR=${args[6]}
                        ACTIVEIPS[$IP]="$CNT $IP $X,$Y $CLR"
                        print_active_ips | sort -rV
                fi
        done <&0
}

print_active_ips()
{
        clear
        for IP in "${!ACTIVEIPS[@]}"
        do
                printf "%-7s | %-40s | %-18s | %5s\n" ${ACTIVEIPS[$IP]}
        done
}


tail -f ${LOGFILE} | parse_log_active_ips
