#!/usr/bin/python3

from struct import *
import websocket
import json

try:
    import thread
except ImportError:
    import _thread as thread
import time

def on_message(ws, message):
    if type(message) is str:
        print("Got message: " + str(message))
        return
    if unpack_from('B', message, 0)[0] == 193:
        x = unpack_from('B', message, 1)[0]
        y = unpack_from('B', message, 2)[0]
        a = unpack_from('!h', message, 4)[0]
        color = int(unpack_from('!B', message, 6)[0])
        if color == 0:
            color = 19
        elif color == 1:
            color = 2
        color -= 2
        number = (65520 & a) >> 4
        x = int(x * 256 + a % 256 - 256 * 256 / 2)
        y = int(y * 256 + a // 256 + 256 - 256 * 256 / 2)
        if x != 10000 and y != 10000:
            return
        print('Pixel Received: @%s,%s - color %s' % (str(x), str(y), str(color)))

def on_error(ws, error):
    print(error)

def on_close(ws):
    print("### closed ###")

def on_open(ws):
    def run(*args):
        ws.send(json.dumps(["sub", "pxl"]))
        time.sleep(3)
        print('Send pixel 10.000 10.000 7')
        ws.send(json.dumps(["setpxl", "07ef7f62-a631-45c9-a150-a52d5f9f1b42", "123.123.123.123", 10000, 10000, 7]))
        #ws.send(json.dumps(["setpxl", None, None, 10000, 10000, 7]))
        time.sleep(120)
        ws.close()
    thread.start_new_thread(run, ())


if __name__ == "__main__":
    websocket.enableTrace(True)
    ws = websocket.WebSocketApp("wss://pixelplanet.fun/mcws",
                              on_message = on_message,
                              on_error = on_error,
                              on_close = on_close,
                              header = { "Authorization": "Bearer APISOCKETKEY"})
    ws.on_open = on_open
    ws.run_forever()
