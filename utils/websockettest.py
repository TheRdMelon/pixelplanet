#!/usr/bin/python3

import websocket
import json
try:
    import thread
except ImportError:
    import _thread as thread
import time

def on_message(ws, message):
    print("Got message: " + str(message))

def on_error(ws, error):
    print(error)

def on_close(ws):
    print("### closed ###")

def on_open(ws):
    def run(*args):
        ws.send(json.dumps(["sub", "chat"]))
        ws.send(json.dumps(["chat", "name", "message"]))
        ws.send(json.dumps(["linkacc", "someid", "mymcname", "hallo"]))
        #ws.send(json.dumps(["login", "someid", "mymcname", "127.0.0.1"]))
        time.sleep(120)
        ws.close()
    thread.start_new_thread(run, ())


if __name__ == "__main__":
    websocket.enableTrace(True)
    ws = websocket.WebSocketApp("wss://old.pixelplanet.fun/mcws",
                              on_message = on_message,
                              on_error = on_error,
                              on_close = on_close,
                              header = { "Authorization": "Bearer APISOCKETKEY"})
    ws.on_open = on_open
    ws.run_forever()
