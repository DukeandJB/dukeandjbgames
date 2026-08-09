# Local dev server with live reload.
# Serves the dukeandjb site AND auto-refreshes any open browser tab the
# moment a file changes, so nobody has to press F5.
#
# This runs ONLY on the local machine. The real dukeandjb.com is served by
# its normal host and never sees any of this — the game/site files on disk
# are untouched (the reload snippet is injected on the fly, here, in dev).

import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # the site folder
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

# Injected into every HTML page the dev server sends. Polls a tiny endpoint
# for the newest file-change time and reloads when it moves.
LIVE = b"""
<script>
(function () {
  var last = null;
  function check() {
    fetch('/__mtime', { cache: 'no-store' })
      .then(function (r) { return r.text(); })
      .then(function (v) {
        if (last === null) { last = v; }
        else if (v !== last) { location.reload(); }
      })
      .catch(function () {});
  }
  setInterval(check, 500);
})();
</script>
"""


def newest_mtime():
    latest = 0.0
    for dirpath, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != '_dev']
        for f in files:
            try:
                m = os.path.getmtime(os.path.join(dirpath, f))
                if m > latest:
                    latest = m
            except OSError:
                pass
    return latest


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def end_headers(self):
        # never cache in dev, so a reload always gets the newest file
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()

    def do_GET(self):
        # change-detection endpoint used by the injected script
        if self.path.split('?')[0] == '/__mtime':
            body = repr(newest_mtime()).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        # inject the live-reload snippet into HTML pages
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            path = os.path.join(path, 'index.html')
        if path.endswith('.html') and os.path.isfile(path):
            with open(path, 'rb') as fh:
                data = fh.read()
            if b'</body>' in data:
                data = data.replace(b'</body>', LIVE + b'</body>', 1)
            else:
                data = data + LIVE
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        return super().do_GET()

    def log_message(self, *a):
        pass  # keep the console quiet


if __name__ == '__main__':
    httpd = ThreadingHTTPServer(('', PORT), Handler)
    print('Live-reload server: ' + ROOT + ' on http://localhost:' + str(PORT))
    httpd.serve_forever()
