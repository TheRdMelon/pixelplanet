#!/usr/bin/python3

import PIL.Image
import sys, io, os
import datetime
import json
import threading

# minus half the canvas size
offset = int(-256 * 256 / 2)

class GetDay(threading.Thread):
    def __init__(self, x, y, w, h, iter_date, cnt):
        threading.Thread.__init__(self)
        self.x = x
        self.y = y
        self.w = w
        self.h = h
        self.iter_date = iter_date
        self.cnt = cnt * 1000
        self.daemon = True
    def run(self):
        iter_date = self.iter_date
        x = self.x
        y = self.y
        w = self.w
        h = self.h
        cnt = self.cnt
        xc = (x - offset) // 256
        wc = (x + w - offset) // 256
        yc = (y - offset) // 256
        hc = (y + h - offset) // 256
        print('------------------------------------------------')
        print('Getting frames for date %s' % (iter_date))
        image = PIL.Image.new('RGBA', (w, h))
        for iy in range(yc, hc + 1):
            for ix in range(xc, wc + 1):
                path = './canvas/%s/0/tiles/%s/%s.png' % (iter_date, ix, iy)
                offx = ix * 256 + offset - x
                offy = iy * 256 + offset - y
                img = PIL.Image.open(path).convert('RGBA')
                image.paste(img, (offx, offy), img)
                img.close()
        print('Got start of day')
        cnt += 1
        image.save('./timelapse/t%06d.png' % (cnt))
        time_list = os.listdir('./canvas/%s/%s' % (iter_date, 0))
        for time in time_list:
            if time == 'tiles':
                continue
            for iy in range(yc, hc + 1):
                for ix in range(xc, wc + 1):
                    path = './canvas/%s/0/%s/%s/%s.png' % (iter_date, time, ix, iy)
                    if not os.path.exists(path):
                        continue
                    offx = ix * 256 + offset - x
                    offy = iy * 256 + offset - y
                    img = PIL.Image.open(path).convert('RGBA')
                    image.paste(img, (offx, offy), img)
                    img.close()
            print('Got time %s' % (time))
            cnt += 1
            image.save('./timelapse/t%06d.png' % (cnt))
        image.close()

def get_area(x, y, w, h, start_date, end_date):
    delta = datetime.timedelta(days=1)
    end_date = end_date.strftime("%Y%m%d")
    iter_date = None
    cnt = 0
    threads = []
    while iter_date != end_date:
        iter_date = start_date.strftime("%Y%m%d")
        start_date = start_date + delta
        thread = GetDay(x, y, w, h, iter_date, cnt)
        thread.start()
        threads.append(thread)
        cnt += 1
    for t in threads:
        t.join()
 

if __name__ == "__main__":
    if len(sys.argv) != 4 and len(sys.argv) != 5:
        print("Download history of an area of pixelplanet - useful for timelapses")
        print("Usage: historyDownload.py startX_startY endX_endY amount_days")
        print("→start_date and end_date are in YYYY-MM-dd formate")
        print("→user R key on pixelplanet to copy coordinates)")
        print("→images will be saved into timelapse folder)")
        print("-----------")
        print("You can create a timelapse from the resulting files with ffmpeg like that:")
        print("ffmpeg -framerate 15 -f image2 -i timelapse/t%06d.png -c:v libx264 -pix_fmt yuva420p output.mp4")
    else:
        start = sys.argv[1].split('_')
        end = sys.argv[2].split('_')
        amount_days = datetime.timedelta(days=int(sys.argv[3]));
        end_date = datetime.date.today()
        start_date = end_date - amount_days
        x = int(start[0])
        y = int(start[1])
        w = int(end[0]) - x
        h =int( end[1]) - y
        if not os.path.exists('./timelapse'):
            os.mkdir('./timelapse')
        get_area(x, y, w, h, start_date, end_date)
        print("Done!")
        print("to create a timelapse from it:")
        print("ffmpeg -framerate 15 -f image2 -i timelapse/t%06d.png -c:v libx264 -pix_fmt yuva420p output.mp4")

