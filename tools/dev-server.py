#!/usr/bin/env python3
"""
Entwicklungsserver für die Vorschau.

Wie `python3 -m http.server`, aber mit `Cache-Control: no-store`. Ohne das
hält der Browser geänderte ES-Module in seiner Modulkarte fest, und man
sieht nach dem Speichern weiter den alten Stand.

Nur für die lokale Vorschau gedacht – im Livebetrieb sorgt die .htaccess
für sinnvolle Cache-Zeiten.

    python3 tools/dev-server.py [Port]
"""

import os
import sys
from functools import partial
from http.server import HTTPServer, SimpleHTTPRequestHandler

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        # Nur Fehler melden; sonst rauscht die Konsole bei 222 Bildern zu.
        if not str(args[1] if len(args) > 1 else "").startswith("2"):
            super().log_message(fmt, *args)


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4361
    handler = partial(NoCacheHandler, directory=ROOT)
    print(f"→ Vorschau auf http://localhost:{port} (ohne Cache)")
    HTTPServer(("127.0.0.1", port), handler).serve_forever()


if __name__ == "__main__":
    main()
