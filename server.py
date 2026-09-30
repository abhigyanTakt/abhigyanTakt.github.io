import sys
import os
import re
import http.server
import socketserver

portfolio_root = os.path.dirname(os.path.abspath(__file__))
os.chdir(portfolio_root)

class RangeHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            self._range_length = None
            return super().send_head()

        ctype = self.guess_type(path)
        try:
            f = open(path, 'rb')
        except OSError:
            self.send_error(404, "File not found")
            return None

        fs = os.fstat(f.fileno())
        size = fs[6]

        range_header = self.headers.get('Range')
        if range_header:
            m = re.match(r'^bytes=(\d*)-(\d*)$', range_header)
            if m:
                s_str, e_str = m.groups()
                start = int(s_str) if s_str else 0
                end = int(e_str) if e_str else size - 1
                if start >= size:
                    self.send_error(416, "Requested Range Not Satisfiable")
                    f.close()
                    return None
                end = min(end, size - 1)
                length = end - start + 1

                self.send_response(206)
                self.send_header("Content-Type", ctype)
                self.send_header("Accept-Ranges", "bytes")
                self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
                self.send_header("Content-Length", str(length))
                self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
                self.end_headers()

                f.seek(start)
                self._range_length = length
                return f

        self._range_length = None
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Length", str(size))
        self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
        if ctype and any(t in ctype for t in ("html", "javascript", "css")):
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
        self.end_headers()
        return f

    def copyfile(self, source, outputfile):
        if getattr(self, '_range_length', None) is not None:
            rem = self._range_length
            while rem > 0:
                chunk = source.read(min(rem, 65536))
                if not chunk:
                    break
                try:
                    outputfile.write(chunk)
                except (ConnectionResetError, BrokenPipeError):
                    break
                rem -= len(chunk)
        else:
            try:
                super().copyfile(source, outputfile)
            except (ConnectionResetError, BrokenPipeError):
                pass

    def log_message(self, format, *args):
        if len(args) > 1 and str(args[1]) in ("200", "206", "304"):
            return
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), format % args))
        sys.stderr.flush()

class ThreadedHTTPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True

def run():
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass

    try:
        with ThreadedHTTPServer(("", port), RangeHTTPRequestHandler) as httpd:
            url = f"http://localhost:{port}"
            print("=" * 60, flush=True)
            print("  Persona Portfolio Server running!", flush=True)
            print(f"  Serving HTTP on: {url}", flush=True)
            print(f"  Direct Link:     http://localhost:{port}", flush=True)
            print("  Features: Multi-threading & HTTP Range (Smooth Video Streaming)", flush=True)
            print("=" * 60, flush=True)
            print("Press Ctrl+C to stop the server.\n", flush=True)
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[Server stopped]", flush=True)
    except Exception as e:
        print(f"\n[Error]: {e}", flush=True)

if __name__ == "__main__":
    run()
