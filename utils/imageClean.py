#!/usr/bin/env python3
# this script filters out noise froma n indexed image
import PIL.Image
import sys


def check_pixel(pix, x, y):
    # if pixel is sourrounded by just the same color
    # and max one different one
    cnt_clr1 = 0
    cnt_clr2 = 0
    clr1 = pix[x-1,y-1]
    clr2 = None
    for xrel in range(-1, 2):
        for yrel in range(-1, 2):
            if not xrel and not yrel:
                continue
            clr = pix[x + xrel,y + yrel]
            if clr == clr1:
                cnt_clr1 += 1
            elif clr2 is None:
                clr2 = clr
                cnt_clr2 += 1
            elif clr == clr2:
                cnt_clr2 += 1
            else:
                return None
    if cnt_clr1 > 1 and cnt_clr2 > 1:
        return None
    if cnt_clr1 > 1:
        return clr1
    return clr2

def clean_image(filename):
    im = PIL.Image.open(filename).convert('RGBA')
    width, height = im.size
    pix = im.load()
    im_new = PIL.Image.new('RGBA', (width, height), (255, 0, 0, 0))
    pix_new = im_new.load()
    for x in range(1, width - 1):
        for y in range(1, height - 1):
            target = check_pixel(pix, x, y)
            if target is not None and target != pix[x, y]:
                pix_new[x,y] = target
    im.close()
    im_new.save("%s-cleaned.png" % filename[:-4])
    im_new.close()

if __name__ == "__main__":
    filename = sys.argv[1]
    clean_image(filename)
