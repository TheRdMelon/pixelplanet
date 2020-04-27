#!/bin/sh
TMPDIR="/tmp/backup"

#delete older daily backup folders from local filesystem if exist
cd ${TMPDIR}
if [ "`ls -t | wc -l`" -gt "1" ]
  then
    ls -t | tail -n +2 | xargs rm -rf --
fi
cd - > /dev/null

rsync -r ${TMPDIR}/ backup@ayylmao:/backup/pixelplanet/canvas

#clear current daily folder
#we do NOT delete the daily folder itself, because the backup script would create
#a new full backup if its missing
rm -rf ${TMPDIR}/*/*
