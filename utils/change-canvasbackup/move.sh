#!/bin/bash
# this script creates tiles in the backup folder for the moon canvas
# to be able to increase its size from 1024 to 4096
# If it wouldn't be padded by those additional tiles, it would show loading tiles
# in historical view at the parts that exceed the previous size
# (which wouldn't be too bad tbh. but let be save and put those there)

CANVAS=1

for DATEFOLDERS in `ls`
do
  TILEFOLDER="${DATEFOLDERS}/${CANVAS}/tiles"
  if [ -d "${TILEFOLDER}" ]
  then
    y=15
    while [ $y -ge 0 ]
    do
      TILEYDIR="${TILEFOLDER}/${y}"
      if [ ! -d "${TILEYDIR}" ]
      then
        mkdir "${TILEYDIR}"
      fi

      if [ $y -lt 4 ]
      then
        newy=$(( $y + 6 ))
        NEWTILEYDIR="${TILEFOLDER}/${newy}"
        echo "Move ${TILEYDIR} to ${NEWTILEYDIR}"
        mv "${NEWTILEYDIR}" ./tmptiledir
        mv "${TILEYDIR}" "${NEWTILEYDIR}"
        mv ./tmptiledir "${TILEYDIR}"
   
        x=15
        while [ $x -ge 0 ]
        do
          TILE="${NEWTILEYDIR}/${x}.png"
          if [ $x -lt 4 ]
          then
            newx=$(( $x + 6 ))
            NEWTILE="${NEWTILEYDIR}/${newx}.png"
            echo "Move ${TILE} to ${NEWTILE}"
            mv "${NEWTILE}" ./tmptile.png
            mv "${TILE}" "${NEWTILE}"
            mv ./tmptile.png "${TILE}"
          else
            if [ ! -f "${TILE}" ]
            then
              cp ./empty.png "${TILE}"
              echo "Create ${TILE}"
            fi
          fi
          x=$(( $x - 1 ))
        done
      else
        x=0
        while [ $x -lt 16 ]
        do
          TILE="${TILEYDIR}/${x}.png"
          if [ ! -f "${TILE}" ]
          then
            cp ./empty.png "${TILE}"
            echo "Create ${TILE}"
          fi
          x=$(( $x + 1 ))
        done
      fi
      y=$(( $y - 1 ))
    done
  fi
done

for DATEFOLDERS in `ls -d */`
do
  CANVASFOLDER="${DATEFOLDERS}${CANVAS}"
  if [ -d "${CANVASFOLDER}" ]
  then
    for TIMES in `ls ${CANVASFOLDER}`
    do
      if [ "${TIMES}" != "tiles" ]
      then
        TIMEFOLDER="${CANVASFOLDER}/${TIMES}"
        for y in `ls -r "${TIMEFOLDER}"`
        do
          newy=$(( $y + 6 ))
          TILEYDIR="${TIMEFOLDER}/${y}"
          NEWTILEYDIR="${TIMEFOLDER}/${newy}"
          echo "Move ${TILEYDIR} to ${NEWTILEYDIR}"
          mv "${TILEYDIR}" "${NEWTILEYDIR}"
          for XNAME in `ls -r ${NEWTILEYDIR}`
          do
            x=`echo ${XNAME} | sed 's/.png//'`
            newx=$(( $x + 6 ))
            TILE="${NEWTILEYDIR}/${x}.png"
            NEWTILE="${NEWTILEYDIR}/${newx}.png"
            echo "Move ${TILE} to ${NEWTILE} "
            mv "${TILE}" "${NEWTILE}"
          done
        done
      fi
    done
  fi
done
