#!/usr/bin/python3

import PIL.Image
import sys, os, io
import asyncio
import aiohttp

class Color(object):
    def __init__(self, index, name, rgb):
        self.name = name
        self.rgb = rgb
        self.index = index

class EnumColorPixelplanet:

    ENUM = [
        #Color 0 and 1 are unset colors.
        #Bot adds +2 to color number. So subtract 2 from the browser inspector to match.
        Color(0, 'aryan white', 	(255, 255, 255, 255)),	#HEX FFFFFF
        Color(1, 'light gray', 		(228, 228, 228, 255)),	#HEX E4E4E4
        Color(2, 'mid gray', 		(196, 196, 196, 255)),	#HEX C4C4C4
        Color(3, 'dark gray', 		(136, 136, 136, 255)),	#HEX 888888
        Color(4, 'darker gray', 	(78, 78, 78, 255)),		#HEX 4E4E4E
        Color(5, 'black', 			(0, 0, 0, 255)),		#HEX 000000
        Color(6, 'light peach',		(244, 179, 174, 255)),	#HEX F4B3AE
        Color(7, 'light pink', 		(255, 167, 209, 255)),	#HEX FFA7D1
        Color(8, 'pink', 			(255, 84, 178, 255)),	#HEX FF54B2
        Color(9, 'peach', 			(255, 101, 101, 255)),	#HEX FF6565
        Color(10, 'windmill red',	(229, 0, 0, 255)),		#HEX E50000
        Color(11, 'blood red',		(154, 0, 0, 255)),		#HEX 9A0000
        Color(12, 'orange',			(254, 164, 96, 255)),	#HEX FEA460
        Color(13, 'light brown',	(229, 149, 0, 255)),	#HEX E59500
        Color(14, 'brazil skin',	(160, 106, 66, 255)),	#HEX A06A42
        Color(15, 'nig skin', 		(96, 64, 40, 255)),		#HEX 604028
        Color(16, 'normal skin', 	(245, 223, 176, 255)),	#HEX FEDFB0
        Color(17, 'yellow', 		(255, 248, 137, 255)),	#HEX FFF889
        Color(18, 'dark yellow', 	(229, 217, 0, 255)),	#HEX E5D900
        Color(19, 'light green', 	(148, 224, 68, 255)),	#HEX 94E044
        Color(20, 'green', 			(2, 190, 1, 255)),		#HEX 02BE01
        Color(21, 'dark green',		(104, 131, 56, 255)),	#HEX 688338
        Color(22, 'darker green', 	(0, 101, 19, 255)),		#HEX 006513
        Color(23, 'sky blew', 		(202, 227, 255, 255)),	#HEX CAE3FF
        Color(24, 'lite blew', 		(0, 211, 221, 255)),	#HEX 00D3DD
        Color(25, 'dark blew', 		(0, 131, 199, 255)),	#HEX 0083C7
        Color(26, 'blew', 			(0, 0, 234, 255)),		#HEX 0000EA
        Color(27, 'darker blew', 	(25, 25, 115, 255)),	#HEX 191973
        Color(28, 'light violette', (207, 110, 228, 255)),	#HEX CF6EE4
        Color(29, 'violette', 		(130, 0, 128, 255))		#HEX 820080
    ]

    @staticmethod
    def index(i):
        for color in EnumColorPixelplanet.ENUM:
            if i == color.index:
                return color
        # White is default color
        return EnumColorPixelplanet.ENUM[0]

class Matrix:
    def __init__(self):
        self.start_x = None
        self.start_y = None
        self.width = None
        self.height = None
        self.matrix = {}

    def add_coords(self, x, y, w, h):
        if self.start_x is None or self.start_x > x:
            self.start_x = x
        if self.start_y is None or self.start_y > y:
            self.start_y = y
        end_x_a = x + w
        end_y_a = y + h
        if self.width is None or self.height is None:
            self.width = w
            self.height = h
        else:
            end_x_b = self.start_x + self.width
            end_y_b = self.start_y + self.height
            self.width = max(end_x_b, end_x_a) - self.start_x
            self.height = max(end_y_b, end_y_a) - self.start_y

    def create_image(self, filename = None):
        img = PIL.Image.new('RGBA', (self.width, self.height), (255, 0, 0, 0))
        pxls = img.load()
        for x in range(self.width):
            for y in range(self.height):
                try: 
                    color = self.matrix[x + self.start_x][y + self.start_y].rgb
                    pxls[x, y] = color
                except (IndexError, KeyError, AttributeError):
                    pass
        if filename is not None:
          if filename == 'b':
            b = io.BytesIO()
            img.save(b, "PNG")
            b.seek(0)
            return b
          else:
            img.save(filename)
        else:
            img.show()
        img.close()

    def set_pixel(self, x, y, color):
        if x >= self.start_x and x < (self.start_x + self.width) and y >= self.start_y and y < (self.start_y + self.height):
            if x not in self.matrix:
                self.matrix[x] = {}
            self.matrix[x][y] = color

async def fetch(session, ix, iy, target_matrix):
    url = 'https://pixelplanet.fun/chunks/0/%s/%s.bmp' % (ix, iy)
    attempts = 0
    while True:
        try:
            async with session.get(url) as resp:
                data = await resp.read()
                offset = int(-256 * 256 / 2)
                off_x = ix * 256 + offset
                off_y = iy * 256 + offset
                if len(data) == 0:
                    clr = EnumColorPixelplanet.index(23)
                    for i in range(256*256):
                        tx = off_x + i % 256 
                        ty = off_y + i // 256
                        target_matrix.set_pixel(tx, ty, clr)
                else:
                    c = 0
                    i = 0
                    for b in data:
                        tx = off_x + i % 256 
                        ty = off_y + i // 256
                        if b == 0:
                            c = 23
                        elif b == 1:
                            c = 0
                        else:
                            c = b - 2;
                        target_matrix.set_pixel(tx, ty, EnumColorPixelplanet.index(c))
                        i += 1
                print("Loaded %s  with %s pixels" %  (url, i))
                break
        except:
            if attempts > 3:
                raise
            attempts += 1
            pass

async def get_area(x, y, w, h):
    target_matrix = Matrix()
    target_matrix.add_coords(x, y, w, h)
    offset = int(-256 * 256 / 2)
    xc = (x - offset) // 256
    wc = (x + w - offset) // 256
    yc = (y - offset) // 256
    hc = (y + h - offset) // 256
    print("Load from %s / %s to %s / %s" % (xc, yc, wc + 1, hc + 1), "PixelGetter")
    tasks = []
    async with aiohttp.ClientSession() as session:
        for iy in range(yc, hc + 1):
            for ix in range(xc, wc + 1):
                tasks.append(fetch(session, ix, iy, target_matrix))
        await asyncio.gather(*tasks)
        return target_matrix


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Download an area of pixelplanet")
        print("Usage: areaDownload.py startX_startY endX_endY filename.png")
        print("(user R key on pixelplanet to copy coordinates)")
    else:
        start = sys.argv[1].split('_')
        end = sys.argv[2].split('_')
        filename = sys.argv[3]
        x = int(start[0])
        y = int(start[1])
        w = int(end[0]) - x
        h =int( end[1]) - y
        loop = asyncio.get_event_loop()
        matrix = loop.run_until_complete(get_area(x, y, w, h))
        matrix.create_image(filename)
        print("Done!")
