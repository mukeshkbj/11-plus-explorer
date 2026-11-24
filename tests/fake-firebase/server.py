"""A tiny stand-in for Firebase Auth and Firestore, used by the fake firebase-*.js modules in this folder.
Everything is kept in memory. Run on its own (python3 server.py) or start it from a test with start()."""
import json, http.server, threading, uuid
DOCS = {}; USERS = {}
PORT = 8765   # the fake modules call http://127.0.0.1:8765

class H(http.server.BaseHTTPRequestHandler):
    def cors(self):
        self.send_header('Access-Control-Allow-Origin', '*'); self.send_header('Access-Control-Allow-Headers', '*'); self.send_header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    def do_OPTIONS(self): self.send_response(204); self.cors(); self.end_headers()
    def reply(self, obj, code=200):
        b = json.dumps(obj).encode(); self.send_response(code); self.cors(); self.send_header('Content-Type', 'application/json'); self.end_headers(); self.wfile.write(b)
    def do_POST(self):
        n = int(self.headers.get('Content-Length', 0)); body = json.loads(self.rfile.read(n) or b'{}')
        if self.path == '/signup':
            if body['email'] in USERS: return self.reply({'code': 'auth/email-already-in-use'}, 400)
            USERS[body['email']] = (body['pw'], 'u' + uuid.uuid4().hex[:8]); return self.reply({'uid': USERS[body['email']][1]})
        if self.path == '/signin':
            u = USERS.get(body['email'])
            if not u or u[0] != body['pw']: return self.reply({'code': 'auth/invalid-credential'}, 400)
            return self.reply({'uid': u[1]})
        if self.path == '/set': DOCS[body['path']] = body['data']; return self.reply({'ok': True})
        if self.path == '/get': return self.reply({'data': DOCS.get(body['path'])})
        self.reply({'code': 'not-found'}, 404)
    def log_message(self, *a): pass

def start(port=PORT):
    """Starts the server in a background thread and returns it (call .shutdown() when done)."""
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', port), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv

def reset():
    DOCS.clear(); USERS.clear()

if __name__ == '__main__':
    http.server.ThreadingHTTPServer(('127.0.0.1', PORT), H).serve_forever()
