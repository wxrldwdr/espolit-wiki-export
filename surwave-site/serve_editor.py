from __future__ import annotations

import os
import sys
import threading
import webbrowser
from http.server import ThreadingHTTPServer
from urllib.parse import urlparse

import serve_migrated as base

EDITOR_API_VERSION = 3


def upsert_nav_preserve_groups(source: str, title: str, group_title: str) -> None:
    data = base.load_nav()
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
    target = next((g for g in groups if str(g.get("title") or "") == group_title), None)
    if target is None:
        target = {"title": group_title or "Разделы", "items": [], "archived": False}
        groups.append(target)
    if found_item is None:
        found_item = {"title": title, "href": base.page_href(source), "source": source, "archived": False}
        target.setdefault("items", []).append(found_item)
    else:
        found_item["title"] = title
        found_item["href"] = base.page_href(source)
        found_item["source"] = source
        if old_group is not target:
            old_group.setdefault("items", []).remove(found_item)
            target.setdefault("items", []).append(found_item)
    base.save_nav(data)


def delete_nav_preserve_groups(source: str) -> None:
    data = base.load_nav()
    for group in data.get("groups", []):
        group["items"] = [item for item in group.get("items", []) if item.get("source") != source]
    base.save_nav(data)


def create_group(title: str) -> None:
    title = title.strip()
    if not title:
        raise ValueError("Название раздела не может быть пустым")
    data = base.load_nav()
    groups = data.setdefault("groups", [])
    if any(str(group.get("title") or "").casefold() == title.casefold() for group in groups):
        raise ValueError("Раздел с таким названием уже существует")
    groups.append({"title": title, "items": [], "archived": False})
    base.save_nav(data)


def move_page(source: str, target_group: str, target_index: int) -> None:
    source = str(source or "").strip()
    target_group = str(target_group or "").strip()
    base.content_path(source)
    if not target_group:
        raise ValueError("Не указан раздел назначения")

    data = base.load_nav()
    groups = data.setdefault("groups", [])
    target = next((g for g in groups if str(g.get("title") or "") == target_group), None)
    if target is None:
        raise ValueError("Раздел назначения не найден")

    item = None
    for group in groups:
        for candidate in list(group.get("items", [])):
            if str(candidate.get("source") or "") == source:
                item = candidate
                group.setdefault("items", []).remove(candidate)
                break
        if item is not None:
            break
    if item is None:
        raise ValueError("Страница отсутствует в навигации")

    items = target.setdefault("items", [])
    try:
        index = int(target_index)
    except (TypeError, ValueError):
        index = len(items)
    index = max(0, min(len(items), index))
    items.insert(index, item)
    base.save_nav(data)


base.upsert_nav = upsert_nav_preserve_groups
base.delete_nav = delete_nav_preserve_groups

_original_wrapper_html = base.wrapper_html


def wrapper_html_fresh(title: str, source: str) -> str:
    html = _original_wrapper_html(title, source)
    return html.replace(
        "/surwave-site/assets/js/site-ui-runtime.js?v=20260812-1740",
        "/surwave-site/assets/js/site-ui-runtime.js?v=20260814-1420",
    )


base.wrapper_html = wrapper_html_fresh


class EditorWikiHandler(base.WikiHandler):
    server_version = "SurwaveWiki/2.0"

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/editor/capabilities":
            self.send_json({
                "server": "serve_editor",
                "editorApi": EDITOR_API_VERSION,
                "createGroup": True,
                "movePage": True,
                "pasteUpload": True,
            })
            return
        return super().do_GET()

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path not in {"/api/editor/create-group", "/api/editor/move-page"}:
            return super().do_POST()
        try:
            data = self.read_json()
            if parsed.path == "/api/editor/create-group":
                title = str(data.get("title") or "")
                create_group(title)
                self.send_json({"ok": True, "title": title.strip()})
                return
            source = str(data.get("path") or "")
            target_group = str(data.get("group") or "")
            target_index = data.get("index", 0)
            move_page(source, target_group, target_index)
            self.send_json({"ok": True})
        except (ValueError, OSError) as exc:
            self.send_json({"error": str(exc)}, 400)


def main() -> None:
    os.chdir(base.ROOT)
    base.save_nav(base.load_nav())
    base.save_settings(base.load_settings())
    base.regenerate_wrappers()
    port = base.find_port()
    editor_mode = "--editor" in sys.argv
    start_path = base.EDITOR_PATH if editor_mode else base.WIKI_PATH
    url = f"http://127.0.0.1:{port}{start_path}"
    server = ThreadingHTTPServer(("127.0.0.1", port), EditorWikiHandler)
    print(f"Surwave Wiki: {url}")
    print(f"Editor API: v{EDITOR_API_VERSION}")
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
