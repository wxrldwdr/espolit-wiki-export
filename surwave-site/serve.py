from __future__ import annotations

import http.server
import socket
import socketserver
import threading
import time
import webbrowser
from pathlib import Path

HERE = Path(__file__).resolve().parent
DIST = HERE / "dist"
HOST = "127.0.0.1"


def free_port(start=8080, end=8190):
    for port in range(start, end + 1):
        with socket.socket() as s:
            try:
                s.bind((HOST, port))
                return port
            except OSError:
                pass
    raise RuntimeError("Не удалось найти свободный локальный порт")


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIST), **kwargs)

    def log_message(self, fmt, *args):
        print("[Surwave Wiki]", fmt % args)


if __name__ == "__main__":
    if not (DIST / "index.html").exists():
        raise SystemExit("Сайт ещё не собран. Сначала запусти build.py")
    port = free_port()
    url = f"http://{HOST}:{port}/"
    with socketserver.ThreadingTCPServer((HOST, port), Handler) as server:
        server.daemon_threads = True
        print(f"Surwave Wiki: {url}")
        threading.Thread(target=lambda: (time.sleep(.6), webbrowser.open(url)), daemon=True).start()
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nSurwave Wiki остановлен")
