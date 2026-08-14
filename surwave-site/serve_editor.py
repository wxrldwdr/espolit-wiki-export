from __future__ import annotations

import os
import sys
import threading
import webbrowser
from http.server import ThreadingHTTPServer
from urllib.parse import urlparse

import serve_migrated as base

EDITOR_API_VERSION = 6


_raw_load_nav = base.load_nav


def normalize_nav(data: dict) -> tuple[dict, bool]:
    groups = data.setdefault("groups", [])
    normalized: list[dict] = []
    by_key: dict[str, dict] = {}
    item_keys: dict[str, set[tuple[str, ...]]] = {}
    changed = False

    for raw_group in groups:
        if not isinstance(raw_group, dict):
            changed = True
            continue

        raw_title = str(raw_group.get("title") or "Разделы")
        title = raw_title.strip() or "Разделы"
        key = title.casefold()
        if raw_title != title:
            changed = True

        target = by_key.get(key)
        if target is None:
            target = dict(raw_group)
            target["title"] = title
            target["items"] = []
            normalized.append(target)
            by_key[key] = target
            item_keys[key] = set()
        else:
            changed = True

        seen = item_keys[key]
        for raw_item in raw_group.get("items", []) or []:
            if not isinstance(raw_item, dict):
                changed = True
                continue
            source = str(raw_item.get("source") or "").strip()
            href = str(raw_item.get("href") or "").strip()
            item_title = str(raw_item.get("title") or "").strip()
            identity = ("source", source) if source else ("fallback", href, item_title)
            if identity in seen:
                changed = True
                continue
            seen.add(identity)
            target.setdefault("items", []).append(dict(raw_item))

    if len(normalized) != len(groups):
        changed = True
    data["groups"] = normalized
    return data, changed


def load_nav_normalized() -> dict:
    data = _raw_load_nav()
    data, changed = normalize_nav(data)
    if changed:
        base.save_nav(data)
    return data


base.load_nav = load_nav_normalized


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
    if any(str(group.get("title") or "").strip().casefold() == title.casefold() for group in groups):
        raise ValueError("Раздел с таким названием уже существует")
    groups.append({"title": title, "items": [], "archived": False})
    base.save_nav(data)


def delete_group(group_title: str) -> list[str]:
    title = str(group_title or "").strip()
    if not title:
        raise ValueError("Не указан раздел")

    data = base.load_nav()
    groups = data.setdefault("groups", [])
    index = next(
        (i for i, group in enumerate(groups) if str(group.get("title") or "").strip().casefold() == title.casefold()),
        -1,
    )
    if index < 0:
        raise ValueError("Раздел не найден")

    items = list(groups[index].get("items", []) or [])
    if items:
        count = len(items)
        raise ValueError(f"В разделе «{groups[index].get('title') or title}» {count} стр. Сначала перенеси или удали их.")

    deleted_title = str(groups[index].get("title") or title)
    groups.pop(index)
    base.save_nav(data)

    saved = group_order()
    if any(name.casefold() == deleted_title.casefold() for name in saved):
        raise OSError("Раздел не удалился из site-data-editor.json")
    return saved


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


def group_order(data: dict | None = None) -> list[str]:
    nav = data if data is not None else base.load_nav()
    return [str(group.get("title") or "Разделы") for group in nav.get("groups", [])]


def move_group(group_title: str, direction: int) -> tuple[int, list[str]]:
    title = str(group_title or "").strip()
    if not title:
        raise ValueError("Не указан раздел")
    try:
        step = -1 if int(direction) < 0 else 1
    except (TypeError, ValueError):
        raise ValueError("Некорректное направление перемещения")

    data = base.load_nav()
    groups = data.setdefault("groups", [])
    index = next((i for i, group in enumerate(groups) if str(group.get("title") or "") == title), -1)
    if index < 0:
        raise ValueError("Раздел не найден")

    target = index + step
    if target < 0 or target >= len(groups):
        return index, group_order(data)

    expected = group_order(data)
    expected[index], expected[target] = expected[target], expected[index]

    groups[index], groups[target] = groups[target], groups[index]
    base.save_nav(data)

    saved = group_order()
    if saved != expected:
        raise OSError("Порядок разделов не сохранился в site-data-editor.json")
    return target, saved


base.upsert_nav = upsert_nav_preserve_groups
base.delete_nav = delete_nav_preserve_groups

_original_wrapper_html = base.wrapper_html


def wrapper_html_fresh(title: str, source: str) -> str:
    html = _original_wrapper_html(title, source)
    return html.replace(
        "/surwave-site/assets/js/site-ui-runtime.js?v=20260812-1740",
        "/surwave-site/assets/js/site-ui-runtime.js?v=20260814-2035",
    )


base.wrapper_html = wrapper_html_fresh


class EditorWikiHandler(base.WikiHandler):
    server_version = "SurwaveWiki/2.4"

    def copyfile(self, source, outputfile) -> None:
        try:
            super().copyfile(source, outputfile)
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            return

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/editor/capabilities":
            self.send_json({
                "server": "serve_editor",
                "editorApi": EDITOR_API_VERSION,
                "createGroup": True,
                "movePage": True,
                "moveGroup": True,
                "deleteGroup": True,
                "duplicateGroupCleanup": True,
                "verifiedGroupPersistence": True,
                "pasteUpload": True,
            })
            return
        return super().do_GET()

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path not in {
            "/api/editor/create-group",
            "/api/editor/move-page",
            "/api/editor/move-group",
            "/api/editor/delete-group",
        }:
            return super().do_POST()
        try:
            data = self.read_json()
            if parsed.path == "/api/editor/create-group":
                title = str(data.get("title") or "")
                create_group(title)
                self.send_json({"ok": True, "title": title.strip(), "groups": group_order()})
                return
            if parsed.path == "/api/editor/delete-group":
                title = str(data.get("group") or "")
                groups = delete_group(title)
                self.send_json({"ok": True, "group": title.strip(), "groups": groups})
                return
            if parsed.path == "/api/editor/move-group":
                title = str(data.get("group") or "")
                index, groups = move_group(title, data.get("direction", 1))
                self.send_json({"ok": True, "group": title.strip(), "index": index, "groups": groups})
                return
            source = str(data.get("path") or "")
            target_group = str(data.get("group") or "")
            target_index = data.get("index", 0)
            move_page(source, target_group, target_index)
            self.send_json({"ok": True, "groups": group_order()})
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
