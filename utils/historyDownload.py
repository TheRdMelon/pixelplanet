#!/usr/bin/python3

import PIL.Image
import sys, io, os
import datetime
import asyncio
import aiohttp
import json

canvas_size = 256*256
canvas_id = 0
frameskip = 1

async def fetch(session, url, offx, offy, image, needed = False):
    attempts = 0
    while True:
        try:
            async with session.get(url) as resp:
                if resp.status == 404:
                    if needed:
                        img = PIL.Image.new('RGB', (256, 256), color = (202, 227, 255))
                        image.paste(img, (offx, offy))
                        img.close()
                    return
                if resp.status != 200:
                    if needed:
                        continue
                    return
                data = await resp.read()
                img = PIL.Image.open(io.BytesIO(data)).convert('RGBA')
                image.paste(img, (offx, offy), img)
                img.close()
                return
        except:
            if attempts > 3:
                raise
            attempts += 1
            pass

async def get_area(x, y, w, h, start_date, end_date):
    offset = int(-canvas_size / 2)
    xc = (x - offset) // 256
    wc = (x + w - offset) // 256
    yc = (y - offset) // 256
    hc = (y + h - offset) // 256
    print("Load from %s / %s to %s / %s" % (xc, yc, wc + 1, hc + 1))
    delta = datetime.timedelta(days=1)
    end_date = end_date.strftime("%Y%m%d")
    iter_date = None
    cnt = 0
    #frames = []
    while iter_date != end_date:
        iter_date = start_date.strftime("%Y%m%d")
        print('------------------------------------------------')
        print('Getting frames for date %s' % (iter_date))
        start_date = start_date + delta
        tasks = []
        async with aiohttp.ClientSession() as session:
            image = PIL.Image.new('RGBA', (w, h))
            for iy in range(yc, hc + 1):
                for ix in range(xc, wc + 1):
                    url = 'https://storage.pixelplanet.fun/%s/%s/tiles/%s/%s.png' % (iter_date, canvas_id, ix, iy)
                    offx = ix * 256 + offset - x
                    offy = iy * 256 + offset - y
                    tasks.append(fetch(session, url, offx, offy, image, True))
            await asyncio.gather(*tasks)
            print('Got start of day')
            cnt += 1
            #frames.append(image.copy())
            image.save('./timelapse/t%s.png' % (cnt))
            while True:
                async with session.get('https://pixelplanet.fun/api/history?day=%s&id=%s' % (iter_date, canvas_id)) as resp:
                    try:
                        time_list = json.loads(await resp.text())
                        break
                    except:
                        print('Couldn\'t decode json for day %s, trying again' % (iter_date))
            i = 0
            for time in time_list:
                i += 1
                if (i % frameskip) != 0:
                    continue
                tasks = []
                for iy in range(yc, hc + 1):
                    for ix in range(xc, wc + 1):
                        url = 'https://storage.pixelplanet.fun/%s/%s/%s/%s/%s.png' % (iter_date, canvas_id, time, ix, iy)
                        offx = ix * 256 + offset - x
                        offy = iy * 256 + offset - y
                        tasks.append(fetch(session, url, offx, offy, image))
                await asyncio.gather(*tasks)
                print('Got time %s' % (time))
                cnt += 1
                #frames.append(image.copy())
                image.save('./timelapse/t%s.png' % (cnt))
            image.close()
    # this would save a gif right out of the script, but giffs are huge and not good
    #frames[0].save('timelapse.png', save_all=True, append_images=frames[1:], duration=100, loop=0, default_image=False, blend=1)


if __name__ == "__main__":
    if len(sys.argv) != 4 and len(sys.argv) != 5:
        print("Download history of an area of pixelplanet - useful for timelapses")
        print("Usage: historyDownload.py startX_startY endX_endY start_date [end_date]")
        print("→start_date and end_date are in YYYY-MM-dd formate")
        print("→user R key on pixelplanet to copy coordinates)")
        print("→images will be saved into timelapse folder)")
        print("-----------")
        print("You can create a timelapse from the resulting files with ffmpeg like that:")
        print("ffmpeg -framerate 15 -f image2 -i timelapse/t%d.png -c:v libvpx-vp9 -pix_fmt yuva420p output.webm")
    else:
        start = sys.argv[1].split('_')
        end = sys.argv[2].split('_')
        start_date = datetime.date.fromisoformat(sys.argv[3])
        if len(sys.argv) == 5:
            end_date = datetime.date.fromisoformat(sys.argv[4])
        else:
            end_date = datetime.date.today()
        x = int(start[0])
        y = int(start[1])
        w = int(end[0]) - x
        h =int( end[1]) - y
        loop = asyncio.get_event_loop()
        if not os.path.exists('./timelapse'):
            os.mkdir('./timelapse')
        loop.run_until_complete(get_area(x, y, w, h, start_date, end_date))
        print("Done!")
        print("to create a timelapse from it:")
        print("ffmpeg -framerate 15 -f image2 -i timelapse/t%d.png -c:v libvpx-vp9 -pix_fmt yuva420p output.webm")
