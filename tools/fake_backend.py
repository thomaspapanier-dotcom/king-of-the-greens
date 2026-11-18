"""Local stand-in for the Supabase live-game functions (for testing only).

Mimics supabase/setup.sql: POST /rest/v1/rpc/kog_create_game | kog_get_game | kog_update_game.
Games live in memory and vanish when the server stops.

Usage: python tools/fake_backend.py [port]   (default 54321)
In the browser console on localhost: localStorage.setItem('kog.devSync', 'http://127.0.0.1:54321')
"""
import json
import random
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
GAMES = {}
LOCK = threading.Lock()


def create(args):
    with LOCK:
        while True:
            code = "".join(random.choice(ALPHABET) for _ in range(6))
            if code not in GAMES:
                GAMES[code] = {"state": args["p_state"], "version": 1}
                return code


def get(args):
    with LOCK:
        g = GAMES.get(str(args["p_code"]).upper())
        if g and g["version"] > int(args.get("p_since", 0)):
            return [dict(g)]
        return []


def update(args):
    with LOCK:
        g = GAMES.get(str(args["p_code"]).upper())
        if not g or g["version"] != int(args["p_version"]):
            return []
        g["state"] = args["p_state"]
        g["version"] += 1
        return [dict(g)]


ROUTES = {"kog_create_game": create, "kog_get_game": get, "kog_update_game": update}


class Handler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "apikey, authorization, content-type")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_POST(self):
        name = self.path.rsplit("/", 1)[-1]
        fn = ROUTES.get(name)
        if not self.path.startswith("/rest/v1/rpc/") or not fn:
            self.send_response(404)
            self._cors()
            self.end_headers()
            return
        length = int(self.headers.get("Content-Length", 0))
        body = json.dumps(fn(json.loads(self.rfile.read(length) or b"{}"))).encode()
        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        sys.stderr.write("%s\n" % (fmt % args))


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 54321
    print(f"Fake KOG backend on http://127.0.0.1:{port}", flush=True)
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
