from __future__ import annotations

import base64
import json
import os
import re
import socket
import sys
import threading
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "surwave-site"
CONTENT = SITE / "content"
WIKI = SITE / "wiki"
DATA_FILE = SITE / "assets" / "js" / "site-data.json"
SETTINGS_FILE = SITE / "assets" / "js" / "site-settings.json"
MEDIA = ROOT / ".gitbook" / "assets"
WIKI_PATH = "/surwave-site/wiki/index.html"
EDITOR_PATH = "/surwave-site/editor/index.html"
MAX_BODY = 64 * 1024 * 1024
DEFAULT_SETTINGS = {
    "logo": {
        "src": "/surwave-site/assets/logos/surwave-wiki-logo.svg",
        "width": 226,
        "height": 58,
        "x": 0,
        "y": 0,
    }
}


def find_port(start: int = 8080, end: int = 8099) -> int:
    for port in range(start, end + 1):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                sock.bind(("127.0.0.1", port))
            except OSError:
                continue
            return port
    raise RuntimeError("Не найден свободный порт 8080-8099")


def safe_rel(value: str) -> Path:
    value = value.replace("\\", "/").strip().lstrip("/")
    path = Path(value)
    if not value or path.suffix.lower() != ".md" or any(part in {"", ".", ".."} for part in path.parts):
        raise ValueError("Некорректный путь страницы")
    return path


def content_path(value: str) -> Path:
    rel = safe_rel(value)
    target = (CONTENT / rel).resolve()
    if CONTENT.resolve() not in target.parents:
        raise ValueError("Путь вне каталога content")
    return target


def page_href(source: str) -> str:
    p = safe_rel(source)
    if p.name.lower() == "readme.md":
        return "index.html" if str(p.parent) == "." else (p.parent / "index.html").as_posix()
    return p.with_suffix(".html").as_posix()


def wrapper_path(source: str) -> Path:
    return WIKI / page_href(source)


def wrapper_html(title: str, source: str) -> str:
    esc_title = (title or "Surwave Wiki").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")
    esc_source = source.replace("&", "&amp;").replace('"', "&quot;")
    return (
        '<!doctype html><html lang="ru"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        '<meta name="theme-color" content="#060a0c">'
        f'<title>{esc_title} — Surwave Wiki</title>'
        '<link rel="stylesheet" href="/surwave-site/assets/css/site.css"></head>'
        f'<body data-source="{esc_source}"><div id="app"></div>'
        '<script src="/surwave-site/assets/js/migrated-wiki.js"></script>'
        '<script src="/surwave-site/assets/js/gradient-runtime.js?v=20260812-1612"></script>'
        '<script src="/surwave-site/assets/js/site-ui-runtime.js?v=20260812-1612"></script>'
        '</body></html>'
    )


def load_nav() -> dict:
    try:
        data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
        if isinstance(data, dict) and isinstance(data.get("groups"), list):
            return data
    except (OSError, json.JSONDecodeError):
        pass
    return {"groups": []}


def save_nav(data: dict) -> None:
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    DATA_FILE.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def first_title(text: str, fallback: str) -> str:
    text = re.sub(r"^---\r?\n[\s\S]*?\r?\n---\r?\n", "", text, count=1)
    match = re.search(r"^#\s+(.+?)\s*$", text, re.M)
    if match:
        title = re.sub(r"<[^>]+>", "", match.group(1))
        title = re.sub(r"\*+", "", title).strip()
        if title:
            return title
    return fallback


def page_inventory() -> list[dict]:
    nav = load_nav()
    known: dict[str, dict] = {}
    order = 0
    for group in nav.get("groups", []):
        group_title = str(group.get("title") or "Разделы")
        for item in group.get("items", []):
            source = str(item.get("source") or "")
            if source:
                known[source] = {
                    "path": source,
                    "title": str(item.get("title") or Path(source).stem),
                    "group": group_title,
                    "href": str(item.get("href") or page_href(source)),
                    "order": order,
                }
                order += 1
    pages = list(known.values())
    if CONTENT.exists():
        for file in sorted(CONTENT.rglob("*.md")):
            source = file.relative_to(CONTENT).as_posix()
            if source in known:
                continue
            try:
                text = file.read_text(encoding="utf-8")
            except OSError:
                text = ""
            pages.append({
                "path": source,
                "title": first_title(text, file.stem.replace("-", " ").title()),
                "group": "Без раздела",
                "href": page_href(source),
                "order": order,
            })
            order += 1
    return pages


def upsert_nav(source: str, title: str, group_title: str) -> None:
    data = load_nav()
    groups = data.setdefault("groups", [])
    found_item = None
    old_group = None
    for group in groups:
        for item in list(group.get("items", [])):
            if item.get("source") == source:
                found_item = item
                old_group = group
                break
        if found_item:
            break
    target = next((g for g in groups if g.get("title") == group_title), None)
    if target is None:
        target = {"title": group_title or "Разделы", "items": []}
        groups.append(target)
    if found_item is None:
        found_item = {"title": title, "href": page_href(source), "source": source}
        target.setdefault("items", []).append(found_item)
    else:
        found_item["title"] = title
        found_item["href"] = page_href(source)
        found_item["source"] = source
        if old_group is not target:
            old_group.get("items", []).remove(found_item)
            target.setdefault("items", []).append(found_item)
    data["groups"] = [g for g in groups if g.get("items") or g is target]
    save_nav(data)


def delete_nav(source: str) -> None:
    data = load_nav()
    for group in data.get("groups", []):
        group["items"] = [item for item in group.get("items", []) if item.get("source") != source]
    data["groups"] = [g for g in data.get("groups", []) if g.get("items")]
    save_nav(data)


def unique_media_name(name: str) -> str:
    name = Path(name).name
    stem = re.sub(r"[^0-9A-Za-zА-Яа-яЁё._ -]+", "_", Path(name).stem).strip(" ._") or "media"
    suffix = Path(name).suffix.lower()
    if suffix not in {".png", ".jpg", ".jpeg", ".gif", ".apng", ".webp", ".svg", ".mp4", ".webm"}:
        raise ValueError("Неподдерживаемый формат медиа")
    candidate = f"{stem}{suffix}"
    index = 2
    while (MEDIA / candidate).exists():
        candidate = f"{stem}-{index}{suffix}"
        index += 1
    return candidate


def clamp_number(value: object, minimum: int, maximum: int, fallback: int) -> int:
    try:
        number = int(float(value))
    except (TypeError, ValueError):
        return fallback
    return max(minimum, min(maximum, number))


def load_settings() -> dict:
    try:
        data = json.loads(SETTINGS_FILE.read_text(encoding="utf-8"))
        if isinstance(data, dict):
            logo = data.get("logo") if isinstance(data.get("logo"), dict) else {}
            return {
                "logo": {
                    "src": str(logo.get("src") or DEFAULT_SETTINGS["logo"]["src"]),
                    "width": clamp_number(logo.get("width"), 16, 2000, 226),
                    "height": clamp_number(logo.get("height"), 16, 1000, 58),
                    "x": clamp_number(logo.get("x"), -2000, 2000, 0),
                    "y": clamp_number(logo.get("y"), -2000, 2000, 0),
                }
            }
    except (OSError, json.JSONDecodeError):
        pass
    return json.loads(json.dumps(DEFAULT_SETTINGS))


def save_settings(data: dict) -> dict:
    logo = data.get("logo") if isinstance(data.get("logo"), dict) else {}
    clean = {
        "logo": {
            "src": str(logo.get("src") or DEFAULT_SETTINGS["logo"]["src"]).strip() or DEFAULT_SETTINGS["logo"]["src"],
            "width": clamp_number(logo.get("width"), 16, 2000, 226),
            "height": clamp_number(logo.get("height"), 16, 1000, 58),
            "x": clamp_number(logo.get("x"), -2000, 2000, 0),
            "y": clamp_number(logo.get("y"), -2000, 2000, 0),
        }
    }
    SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    SETTINGS_FILE.write_text(json.dumps(clean, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    return clean


def regenerate_wrappers() -> None:
    WIKI.mkdir(parents=True, exist_ok=True)
    for page in page_inventory():
        source = str(page.get("path") or "")
        if not source:
            continue
        wrapper = wrapper_path(source)
        wrapper.parent.mkdir(parents=True, exist_ok=True)
        wrapper.write_text(wrapper_html(str(page.get("title") or "Surwave Wiki"), source), encoding="utf-8")


class WikiHandler(SimpleHTTPRequestHandler):
    server_version = "SurwaveWiki/1.3"

    def end_headers(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path.startswith("/surwave-site/editor/") or parsed.path in {
            "/surwave-site/assets/js/gradient-runtime.js",
            "/surwave-site/assets/js/site-ui-runtime.js",
            "/surwave-site/assets/js/site-settings.json",
        }:
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
        super().end_headers()

    def send_json(self, payload: object, status: int = 200) -> None:
        raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(raw)

    def read_json(self) -> dict:
        length = int(self.headers.get("Content-Length") or "0")
        if length <= 0 or length > MAX_BODY:
            raise ValueError("Некорректный размер запроса")
        data = json.loads(self.rfile.read(length).decode("utf-8"))
        if not isinstance(data, dict):
            raise ValueError("Ожидался JSON-объект")
        return data

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/editor/pages":
            nav = load_nav()
            self.send_json({"pages": page_inventory(), "groups": [str(g.get("title") or "Разделы") for g in nav.get("groups", [])]})
            return
        if parsed.path == "/api/editor/page":
            try:
                source = parse_qs(parsed.query).get("path", [""])[0]
                file = content_path(source)
                if not file.is_file():
                    self.send_json({"error": "Страница не найдена"}, 404)
                    return
                self.send_json({"path": source, "content": file.read_text(encoding="utf-8")})
            except (ValueError, OSError) as exc:
                self.send_json({"error": str(exc)}, 400)
            return
        if parsed.path == "/api/editor/site-settings":
            self.send_json(load_settings())
            return
        super().do_GET()

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        try:
            data = self.read_json()
            if parsed.path == "/api/editor/save":
                source = str(data.get("path") or "")
                title = str(data.get("title") or "Без названия").strip() or "Без названия"
                group = str(data.get("group") or "Разделы").strip() or "Разделы"
                content = str(data.get("content") or "")
                file = content_path(source)
                file.parent.mkdir(parents=True, exist_ok=True)
                file.write_text(content, encoding="utf-8")
                wrapper = wrapper_path(source)
                wrapper.parent.mkdir(parents=True, exist_ok=True)
                wrapper.write_text(wrapper_html(title, source), encoding="utf-8")
                upsert_nav(source, title, group)
                self.send_json({"ok": True, "href": "/surwave-site/wiki/" + page_href(source)})
                return
            if parsed.path == "/api/editor/delete":
                source = str(data.get("path") or "")
                file = content_path(source)
                if file.exists():
                    file.unlink()
                wrapper = wrapper_path(source)
                if wrapper.exists():
                    wrapper.unlink()
                delete_nav(source)
                self.send_json({"ok": True})
                return
            if parsed.path == "/api/editor/upload":
                name = unique_media_name(str(data.get("name") or "media.png"))
                encoded = str(data.get("data") or "")
                if "," in encoded and encoded.startswith("data:"):
                    encoded = encoded.split(",", 1)[1]
                raw = base64.b64decode(encoded, validate=True)
                if len(raw) > 48 * 1024 * 1024:
                    raise ValueError("Файл слишком большой")
                MEDIA.mkdir(parents=True, exist_ok=True)
                (MEDIA / name).write_bytes(raw)
                self.send_json({"ok": True, "name": name, "source": ".gitbook/assets/" + name, "url": "/.gitbook/assets/" + name})
                return
            if parsed.path == "/api/editor/site-settings":
                clean = save_settings(data)
                regenerate_wrappers()
                self.send_json(clean)
                return
            self.send_json({"error": "Неизвестный API-метод"}, 404)
        except (ValueError, OSError, json.JSONDecodeError, base64.binascii.Error) as exc:
            self.send_json({"error": str(exc)}, 400)


def main() -> None:
    os.chdir(ROOT)
    save_settings(load_settings())
    regenerate_wrappers()
    port = find_port()
    editor_mode = "--editor" in sys.argv
    start_path = EDITOR_PATH if editor_mode else WIKI_PATH
    url = f"http://127.0.0.1:{port}{start_path}"
    server = ThreadingHTTPServer(("127.0.0.1", port), WikiHandler)
    print(f"Surwave Wiki: {url}")
    print("Для остановки нажмите Ctrl+C")
    threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
