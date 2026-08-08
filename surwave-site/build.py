from __future__ import annotations

import html
import os
import re
import shutil
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
SITE = Path(__file__).resolve().parent
DIST = SITE / "dist"
ASSETS_SRC = ROOT / ".gitbook" / "assets"
ASSETS_DST = DIST / "assets" / "content"
STYLE_SRC = SITE / "assets" / "css" / "site.css"
LOGO_SRC = SITE / "assets" / "logos" / "surwave-wiki-logo.png"

PRIMARY = "#00ff78"
SECONDARY = "#00ffc0"


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def strip_frontmatter(text: str) -> str:
    if text.startswith("---\n"):
        end = text.find("\n---\n", 4)
        if end != -1:
            return text[end + 5 :]
    return text


def slugify(value: str) -> str:
    value = re.sub(r"<[^>]+>", "", value)
    value = html.unescape(value).strip().lower()
    value = re.sub(r"[^a-zа-яё0-9]+", "-", value, flags=re.I)
    return value.strip("-") or "section"


def parse_summary(text: str):
    groups = []
    current_group = None
    order = []
    for raw in text.splitlines():
        if raw.startswith("## "):
            current_group = {"title": raw[3:].strip(), "items": []}
            groups.append(current_group)
            continue
        m = re.match(r"^(\s*)\* \[(.+?)\]\((.+?)\)\s*$", raw)
        if not m:
            continue
        indent = len(m.group(1)) // 2
        title, path = m.group(2), m.group(3)
        item = {"title": title, "path": path, "indent": indent}
        if current_group is None:
            current_group = {"title": "Разделы", "items": []}
            groups.append(current_group)
        current_group["items"].append(item)
        order.append(item)
    return groups, order


def page_output_path(md_path: str) -> Path:
    p = Path(md_path)
    if p.name.lower() == "readme.md":
        if str(p.parent) == ".":
            return DIST / "index.html"
        return DIST / p.parent / "index.html"
    return DIST / p.with_suffix(".html")


def page_url(md_path: str) -> str:
    p = page_output_path(md_path).relative_to(DIST).as_posix()
    return p


def convert_link_target(target: str) -> str:
    if target.startswith(("http://", "https://", "mailto:", "#")):
        return target
    base, anchor = (target.split("#", 1) + [None])[:2] if "#" in target else (target, None)
    if base.endswith(".md"):
        out = page_url(base)
        if anchor:
            out += "#" + anchor
        return "/" + out
    return target


def local_asset_src(src: str) -> str:
    marker = ".gitbook/assets/"
    if marker in src:
        name = src.split(marker, 1)[1]
        return "/assets/content/" + quote(name)
    return src


def inline(text: str) -> str:
    text = text.replace("&#x20;", " ")
    text = re.sub(r'<mark style="color:\$primary;?">(.*?)</mark>', rf'<span style="color:{PRIMARY}">\1</span>', text, flags=re.S)
    text = re.sub(r'<mark style="color:yellow;?">(.*?)</mark>', r'<span class="mark-warning">\1</span>', text, flags=re.S)
    text = re.sub(r'<mark style="color:pink;?">(.*?)</mark>', r'<span class="mark-pink">\1</span>', text, flags=re.S)
    text = re.sub(r'<mark style="color:\$success;?">(.*?)</mark>', r'<span class="mark-success">\1</span>', text, flags=re.S)
    text = re.sub(r'<mark style="color:[^\"]+">(.*?)</mark>', r'\1', text, flags=re.S)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"(?<!\*)\*([^*\n]+?)\*(?!\*)", r"<em>\1</em>", text)
    text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)

    def repl_link(m):
        label, target = m.group(1), m.group(2).split(' "', 1)[0]
        href = convert_link_target(target)
        external = href.startswith(("http://", "https://"))
        attrs = ' target="_blank" rel="noopener"' if external else ""
        return f'<a href="{html.escape(href, quote=True)}"{attrs}>{label}</a>'

    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", repl_link, text)
    return text


def preprocess_gitbook(text: str) -> str:
    # content-ref: preserve only markdown link inside it.
    text = re.sub(r"\{% content-ref[^%]*%\}(.*?)\{% endcontent-ref %\}", lambda m: m.group(1), text, flags=re.S)

    # embeds
    def embed(m):
        url = m.group(1)
        body = (m.group(2) or "").strip()
        body_html = f'<div class="embed-note">{inline(body)}</div>' if body else ""
        return f'\n<div class="embed-card"><a href="{html.escape(url, quote=True)}" target="_blank" rel="noopener">{html.escape(url)}</a>{body_html}</div>\n'
    text = re.sub(r'\{% embed url="([^"]+)" %\}(.*?)(?:\{% endembed %\})?', embed, text, flags=re.S)

    # hints
    def hint(m):
        style = m.group(1)
        body = m.group(2).strip()
        return f'\n<div class="hint {style}">\n{body}\n</div>\n'
    text = re.sub(r'\{% hint style="([^"]+)" %\}(.*?)\{% endhint %\}', hint, text, flags=re.S)

    # steppers
    text = text.replace("{% stepper %}", '\n<div class="stepper">\n').replace("{% endstepper %}", "\n</div>\n")
    text = text.replace("{% step %}", '\n<div class="step">\n').replace("{% endstep %}", "\n</div>\n")

    # figures
    def fig(m):
        src = local_asset_src(m.group(1))
        alt = m.group(2) or ""
        caption = re.sub(r"<.*?>", "", m.group(3) or "").strip()
        cap_html = f'<figcaption>{html.escape(caption)}</figcaption>' if caption else ""
        return f'\n<figure class="wiki-figure"><img loading="lazy" src="{html.escape(src, quote=True)}" alt="{html.escape(alt, quote=True)}">{cap_html}</figure>\n'
    text = re.sub(r'<figure><img src="([^"]+)" alt="([^"]*)"><figcaption>(.*?)</figcaption></figure>', fig, text, flags=re.S)

    return text


def markdown_to_html(text: str):
    text = preprocess_gitbook(strip_frontmatter(text))
    lines = text.splitlines()
    out = []
    para = []
    list_stack = []
    in_code = False
    code_lang = ""
    code_lines = []

    def flush_para():
        nonlocal para
        if para:
            joined = " ".join(x.strip() for x in para).strip()
            if joined:
                out.append(f"<p>{inline(joined)}</p>")
            para = []

    def close_lists(target=-1):
        nonlocal list_stack
        while len(list_stack) > target + 1:
            out.append(f"</{list_stack.pop()}>")

    for raw in lines:
        line = raw.rstrip()
        if line.startswith("```"):
            flush_para(); close_lists()
            if not in_code:
                in_code = True; code_lang = line[3:].strip(); code_lines = []
            else:
                code = html.escape("\n".join(code_lines))
                cls = f' class="language-{html.escape(code_lang)}"' if code_lang else ""
                out.append(f"<pre><code{cls}>{code}</code></pre>")
                in_code = False
            continue
        if in_code:
            code_lines.append(raw); continue

        if not line.strip():
            flush_para(); close_lists(); continue

        if line.strip() in ("***", "---", "___"):
            flush_para(); close_lists(); out.append("<hr>"); continue

        if line.lstrip().startswith("<div ") or line.strip() in ("</div>",):
            flush_para(); close_lists(); out.append(line); continue
        if line.lstrip().startswith("<figure") or line.lstrip().startswith("<iframe"):
            flush_para(); close_lists(); out.append(line); continue
        if line.lstrip().startswith("<details") or line.lstrip().startswith("</details") or line.lstrip().startswith("<summary"):
            flush_para(); close_lists(); out.append(line); continue

        hm = re.match(r"^(#{1,6})\s+(.+)$", line)
        if hm:
            flush_para(); close_lists()
            level = min(len(hm.group(1)), 4)
            title = inline(hm.group(2))
            sid = slugify(re.sub(r"<[^>]+>", "", hm.group(2)))
            out.append(f'<h{level} id="{sid}">{title}<a class="anchor" href="#{sid}">#</a></h{level}>')
            continue

        if line.startswith("> "):
            flush_para(); close_lists(); out.append(f"<blockquote>{inline(line[2:])}</blockquote>"); continue

        lm = re.match(r"^(\s*)([-*]|\d+\.)\s+(.+)$", line)
        if lm:
            flush_para()
            indent = len(lm.group(1)) // 2
            typ = "ol" if lm.group(2).endswith(".") and lm.group(2)[0].isdigit() else "ul"
            while len(list_stack) > indent + 1:
                out.append(f"</{list_stack.pop()}>")
            if len(list_stack) <= indent:
                list_stack.append(typ); out.append(f"<{typ}>")
            out.append(f"<li>{inline(lm.group(3))}</li>")
            continue

        # raw block tags created by preprocess can contain markdown body, leave wrapper and parse content normally
        if line.startswith("<div class=\"hint") or line.startswith("<div class=\"step") or line.startswith("<div class=\"embed"):
            flush_para(); close_lists(); out.append(line); continue

        para.append(line)

    flush_para(); close_lists()
    return "\n".join(out)


def breadcrumb_for(groups, target):
    for group in groups:
        for item in group["items"]:
            if item["path"] == target:
                return group["title"], item["title"]
    return "Wiki", Path(target).stem


def render_nav(groups, current):
    parts = ['<a class="home-link active" href="/index.html"><span>Добро пожаловать</span><span>›</span></a>']
    for group in groups:
        items = group["items"]
        open_group = any(i["path"] == current for i in items)
        parts.append(f'<section class="nav-group{" open" if open_group else ""}"><button class="nav-title" type="button"><span>{html.escape(group["title"])}</span><span>›</span></button><div class="nav-items"><div class="nav-items-inner">')
        for item in items:
            href = "/" + page_url(item["path"])
            cls = "nav-link active" if item["path"] == current else "nav-link"
            pad = 18 + item["indent"] * 12
            parts.append(f'<a class="{cls}" style="padding-left:{pad}px" href="{href}">{html.escape(item["title"])}</a>')
        parts.append('</div></div></section>')
    return "\n".join(parts)


def title_from_md(text: str, fallback: str) -> str:
    m = re.search(r"^#\s+(.+)$", strip_frontmatter(text), re.M)
    if not m:
        return fallback
    return re.sub(r"<[^>]+>", "", m.group(1)).replace("**", "").strip()


def build_toc(body_html: str) -> str:
    links = []
    for level, sid, title in re.findall(r'<h([23]) id="([^"]+)">(.*?)<a class="anchor".*?</h\1>', body_html, flags=re.S):
        clean = re.sub(r"<[^>]+>", "", title)
        cls = ' class="toc-sub"' if level == "3" else ""
        links.append(f'<a{cls} href="#{sid}">{html.escape(html.unescape(clean))}</a>')
    return "\n".join(links) or '<span class="toc-empty">Нет подразделов</span>'


def render_page(groups, order, item, idx):
    src = ROOT / item["path"]
    if not src.exists():
        return
    raw = read_text(src)
    title = title_from_md(raw, item["title"])
    body = markdown_to_html(raw)
    group, crumb = breadcrumb_for(groups, item["path"])
    nav = render_nav(groups, item["path"])
    toc = build_toc(body)
    prev_item = order[idx - 1] if idx > 0 else None
    next_item = order[idx + 1] if idx + 1 < len(order) else None
    pagination = ['<div class="page-nav">']
    pagination.append(f'<a href="/{page_url(prev_item["path"])}">← {html.escape(prev_item["title"])}</a>' if prev_item else '<span></span>')
    pagination.append(f'<a class="next" href="/{page_url(next_item["path"])}">{html.escape(next_item["title"])} →</a>' if next_item else '<span></span>')
    pagination.append('</div>')
    page = f'''<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#060a0c"><title>{html.escape(title)} — Surwave Wiki</title><link rel="icon" href="/assets/logos/favicon.png"><link rel="stylesheet" href="/assets/css/site.css"></head><body>
<aside class="sidebar" id="sidebar"><a class="brand" href="/index.html"><img src="/assets/logos/surwave-wiki-logo.png" alt="Surwave Wiki"></a><nav>{nav}</nav></aside>
<header class="topbar"><button id="mobileMenu" class="mobile-menu">☰</button><div class="search"><input id="searchInput" placeholder="Поиск по Wiki..." autocomplete="off"><div id="searchResults" class="search-results"></div></div><button class="copy-link" id="copyLink">Копировать ссылку</button></header>
<main class="main"><div class="content-grid"><article class="article"><div class="breadcrumbs">{html.escape(group)} <span>›</span> {html.escape(crumb)}</div><section class="hero"><h1>{html.escape(title)}</h1></section>{body}{''.join(pagination)}</article><aside class="toc"><strong>На этой странице</strong>{toc}</aside></div></main>
<script src="/assets/js/site-data.js"></script><script src="/assets/js/site.js"></script></body></html>'''
    out = page_output_path(item["path"])
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(page, encoding="utf-8")


def build_site_data(groups):
    rows = []
    for g in groups:
        for i in g["items"]:
            rows.append({"title": i["title"], "group": g["title"], "href": "/" + page_url(i["path"])})
    import json
    return "window.SURWAVE_PAGES=" + json.dumps(rows, ensure_ascii=False) + ";"


def main():
    if DIST.exists():
        shutil.rmtree(DIST)
    (DIST / "assets" / "css").mkdir(parents=True)
    (DIST / "assets" / "js").mkdir(parents=True)
    (DIST / "assets" / "logos").mkdir(parents=True)
    shutil.copy2(STYLE_SRC, DIST / "assets" / "css" / "site.css")
    if LOGO_SRC.exists():
        shutil.copy2(LOGO_SRC, DIST / "assets" / "logos" / "surwave-wiki-logo.png")
    favicon = SITE / "assets" / "logos" / "favicon.png"
    if favicon.exists():
        shutil.copy2(favicon, DIST / "assets" / "logos" / "favicon.png")
    if ASSETS_SRC.exists():
        shutil.copytree(ASSETS_SRC, ASSETS_DST, dirs_exist_ok=True)

    groups, order = parse_summary(read_text(ROOT / "SUMMARY.md"))
    # ensure root README is first and represented even if SUMMARY changes
    seen = {i["path"] for i in order}
    if "README.md" not in seen:
        first = {"title": "О сервере", "path": "README.md", "indent": 0}
        groups.insert(0, {"title": "Главная", "items": [first]}); order.insert(0, first)

    for idx, item in enumerate(order):
        render_page(groups, order, item, idx)

    (DIST / "assets" / "js" / "site-data.js").write_text(build_site_data(groups), encoding="utf-8")
    shutil.copy2(SITE / "assets" / "js" / "site.js", DIST / "assets" / "js" / "site.js")
    print(f"Built {len(order)} pages into {DIST}")


if __name__ == "__main__":
    main()
