#!/usr/bin/env python3
"""
Static page builder for mdhossaincloud.github.io

The site is plain HTML on GitHub Pages (no framework, no runtime build).
This script stitches the shared <head>, header and footer onto each page body,
and renders multilingual pages from _build/i18n/<lang>.json.

Folders starting with "_" are not published by GitHub Pages (Jekyll), so this
script and the page sources stay private to the repository.

Usage:  python3 _build/build.py

Page sources live in _build/pages/ and start with a JSON block inside
<!--meta ... -->. Tokens in a page body:
  {{root}}       relative path to the site root
  {{icon:name}}  inline SVG icon (see icons.py)
  {{t:key}}      translated string (pages with "i18n": true)
"""
import datetime
import html
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from icons import ICON, MONOGRAM  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "_build" / "pages"
I18N = ROOT / "_build" / "i18n"
SITE = "https://mdhossaincloud.github.io"
NAME = "Md. Hossain"
EMAIL = "mdhossain.cloud@gmail.com"
LINKEDIN = "https://www.linkedin.com/in/mdhossain-cloud"
GITHUB = "https://github.com/mdhossaincloud"
VERSION = "4.1.1"

# code, label in its own language, BCP 47 tag, URL prefix ("" = default)
LANGS = [
    ("en", "English", "en", ""),
    ("de", "Deutsch", "de", "de/"),
    ("fr", "Français", "fr", "fr/"),
    ("es", "Español", "es", "es/"),
    ("it", "Italiano", "it", "it/"),
    ("pt", "Português", "pt", "pt/"),
    ("nl", "Nederlands", "nl", "nl/"),
    ("zh", "中文", "zh-Hans", "zh/"),
]
NAV = ["about", "experience", "expertise", "services", "projects", "insights", "contact"]

DICTS = {code: json.loads((I18N / f"{code}.json").read_text(encoding="utf-8")) for code, *_ in LANGS}


def t(lang, key):
    d = DICTS.get(lang, {})
    if key in d:
        return d[key]
    if key in DICTS["en"]:
        return DICTS["en"][key]
    raise SystemExit(f"Missing translation key: {key}")


def rel(depth):
    if depth == -1:
        return "/"
    return "../" * depth if depth else ""


def head(meta, depth, lang, alternates):
    r = rel(depth)
    tag = dict((c, b) for c, _, b, _ in LANGS)[lang]
    url = SITE + "/" + meta["out"]
    title = html.escape(meta["title"])
    desc = html.escape(meta["description"])
    robots = '<meta name="robots" content="noindex">\n' if meta.get("noindex") else ""
    alt = ""
    if alternates:
        alt = "".join(f'<link rel="alternate" hreflang="{b}" href="{SITE}/{p}">\n' for c, _, b, p in LANGS)
        alt += f'<link rel="alternate" hreflang="x-default" href="{SITE}/">\n'
    ld = meta.get("jsonld")
    ld_html = ('<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False, separators=(",", ":")) + "</script>\n") if ld else ""
    js_dict = ""
    if meta.get("i18n") and lang != "en":
        js_dict = "<script>window.I18N=" + json.dumps(DICTS[lang].get("js", {}), ensure_ascii=False, separators=(",", ":")) + ";</script>\n"
    og_locale = {"en": "en_US", "de": "de_DE", "fr": "fr_FR", "es": "es_ES", "it": "it_IT", "pt": "pt_PT", "nl": "nl_NL", "zh": "zh_CN"}[lang]
    return f"""<!DOCTYPE html>
<html lang="{tag}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
{robots}<link rel="canonical" href="{url}">
{alt}<meta name="author" content="{NAME}">
<meta name="theme-color" content="#070d1a">
<meta property="og:type" content="{meta.get('ogtype', 'website')}">
<meta property="og:locale" content="{og_locale}">
<meta property="og:site_name" content="{NAME}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/assets/img/og-card.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Md. Hossain, IT professional and technology entrepreneur, Dhaka">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="{SITE}/assets/img/og-card.png">
<link rel="icon" href="{r}assets/img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="{r}assets/img/apple-touch-icon.png">
<link rel="preload" href="{r}assets/fonts/archivo-wdth.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="{r}assets/fonts/plex-sans-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{r}assets/css/site.css?v={VERSION}">
<script>/* theme before paint: dark by default, remembered choice wins */
(function(){{var d=document.documentElement;d.classList.add('js');try{{var t=localStorage.getItem('mh-theme');if(t==='light'||t==='dark')d.dataset.theme=t;}}catch(e){{}}}})();</script>
{js_dict}{ld_html}</head>
<body>
<a class="skip" href="#main">{html.escape(t(lang, 'ui.skip'))}</a>
<div class="progress" id="progress" aria-hidden="true"></div>
"""


def lang_switcher(lang, depth):
    r = rel(depth)
    cur = dict((c, (lab, b)) for c, lab, b, _ in LANGS)[lang]
    items = []
    for c, lab, b, p in LANGS:
        href = (r + p) or "./"
        attrs = ' aria-current="true"' if c == lang else ""
        items.append(f'<li><a href="{href}" hreflang="{b}" lang="{b}"{attrs}>{lab}</a></li>')
    return f"""<details class="lang" id="lang">
      <summary aria-label="{html.escape(t(lang, 'ui.language'))}: {cur[0]}">{ICON['globe']}<span>{lang.upper()}</span></summary>
      <ul>{''.join(items)}</ul>
    </details>"""


def header(depth, lang, home_page, active=None):
    r = rel(depth)
    home = r or "./"
    items = []
    for key in NAV:
        href = f"#{key}" if home_page else f"{r}#{key}"
        cur = ' aria-current="page"' if active == key else ""
        items.append(f'<li><a href="{href}" data-spy="{key}"{cur}>{html.escape(t(lang, "nav." + key))}</a></li>')
    return f"""<header class="site-header" id="top">
  <div class="wrap bar">
    <a class="brand" href="{home}" aria-label="Md. Hossain, {html.escape(t(lang, 'ui.home'))}">
      {MONOGRAM}<span>Md. Hossain<small>{html.escape(t(lang, 'ui.brandline'))}</small></span>
    </a>
    <nav class="site-nav" id="site-nav" aria-label="{html.escape(t(lang, 'ui.mainnav'))}">
      <ul class="nav-links">{''.join(items)}</ul>
    </nav>
    {lang_switcher(lang, depth)}
    <button class="icon-btn theme-btn" id="theme-btn" type="button" data-label-light="{html.escape(t(lang, 'ui.tolight'))}" data-label-dark="{html.escape(t(lang, 'ui.todark'))}" aria-label="{html.escape(t(lang, 'ui.tolight'))}">{ICON['moon']}{ICON['sun']}</button>
    <button class="icon-btn menu-btn" id="menu-btn" type="button" aria-expanded="false" aria-controls="site-nav" data-label-open="{html.escape(t(lang, 'ui.menuopen'))}" data-label-close="{html.escape(t(lang, 'ui.menuclose'))}" aria-label="{html.escape(t(lang, 'ui.menuopen'))}">{ICON['menu']}</button>
  </div>
</header>
"""


def footer(depth, lang, scripts, site_root):
    r = rel(depth)
    sr = rel(site_root)
    year = datetime.date.today().year
    tags = "\n".join(f'<script src="{sr}assets/js/{s}?v={VERSION}" defer></script>' for s in ["site.js"] + scripts)
    return f"""<footer class="site-footer">
  <div class="wrap foot">
    <span>&copy; {year} Md. Hossain. {html.escape(t(lang, 'ui.place'))}</span>
    <nav aria-label="{html.escape(t(lang, 'ui.footnav'))}">
      <a href="{r or './'}#projects">{html.escape(t(lang, 'nav.projects'))}</a>
      <a href="{sr}knowledge/">{html.escape(t(lang, 'ui.hub'))}</a>
      <a href="{sr}cv/MD_Hossain_CV.pdf" download>{html.escape(t(lang, 'ui.cv'))}</a>
      <a href="{GITHUB}" rel="noopener">GitHub</a>
      <a href="{LINKEDIN}" rel="noopener">LinkedIn</a>
    </nav>
  </div>
</footer>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
{tags}
</body>
</html>
"""


def breadcrumbs_ld(trail):
    return {
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": n, "item": SITE + "/" + p}
            for i, (n, p) in enumerate(trail)
        ],
    }


def home_ld(lang):
    tag = dict((c, b) for c, _, b, _ in LANGS)[lang]
    return {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Person", "@id": SITE + "/#person", "name": NAME,
                "alternateName": "Md Hossain", "url": SITE + "/",
                "email": "mailto:" + EMAIL,
                "jobTitle": "Senior IT Officer",
                "worksFor": {"@type": "Organization", "name": "MKR Group"},
                "founder": {"@type": "Organization", "name": "Fixible IT", "url": "https://fixibleit.com/"},
                "address": {"@type": "PostalAddress", "addressLocality": "Dhaka", "addressCountry": "BD"},
                "knowsLanguage": ["bn", "en"],
                "knowsAbout": ["IT support", "Systems administration", "Network administration",
                               "Microsoft 365 administration", "Active Directory", "Group Policy",
                               "MikroTik", "Site-to-site VPN", "VLAN", "IP CCTV and NVR",
                               "IT asset management", "PowerShell", "WordPress", "WooCommerce"],
                "sameAs": [LINKEDIN, GITHUB],
            },
            {
                "@type": "WebSite", "@id": SITE + "/#website", "url": SITE + "/",
                "name": "Md. Hossain", "inLanguage": [b for _, _, b, _ in LANGS],
                "publisher": {"@id": SITE + "/#person"},
            },
            {
                "@type": "ProfilePage", "url": SITE + "/" + dict((c, p) for c, _, _, p in LANGS)[lang],
                "inLanguage": tag, "mainEntity": {"@id": SITE + "/#person"},
            },
        ],
    }


def render(body, lang, r):
    body = re.sub(r"\{\{icon:([a-z]+)\}\}", lambda m: ICON[m.group(1)], body)
    body = re.sub(r"\{\{t:([a-zA-Z0-9_.\-]+)\}\}", lambda m: t(lang, m.group(1)), body)
    return body.replace("{{root}}", r)


def write(path, text):
    target = ROOT / (path + "index.html" if path.endswith("/") or path == "" else path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text, encoding="utf-8")


def build():
    out = []
    for src in sorted(SRC.rglob("*.html")):
        text = src.read_text(encoding="utf-8")
        m = re.match(r"\s*<!--meta\s*(\{.*?\})\s*-->\s*", text, re.S)
        if not m:
            raise SystemExit(f"Missing meta block: {src}")
        meta = json.loads(m.group(1))
        body = text[m.end():]

        if meta.get("i18n"):
            for code, _, _, prefix in LANGS:
                pm = dict(meta)
                pm["out"] = prefix + meta["path"]
                pm["title"] = t(code, meta["title_key"])
                pm["description"] = t(code, meta["desc_key"])
                pm["jsonld"] = home_ld(code)
                depth = pm["out"].count("/")
                r = rel(depth)
                page = (head(pm, depth, code, alternates=True)
                        + header(depth, code, home_page=True)
                        + render(body, code, r)
                        + footer(depth, code, meta.get("scripts", []), depth))
                write(pm["out"], page)
                out.append(pm)
            continue

        meta["out"] = meta["path"]
        depth = meta["path"].count("/")
        if meta.get("absolute"):
            depth = -1  # 404 is served from any URL: use root-absolute paths
        if meta.get("trail"):
            meta["jsonld"] = breadcrumbs_ld(meta["trail"])
        r = rel(depth)
        page = (head(meta, depth, "en", alternates=False)
                + header(depth, "en", home_page=False, active=meta.get("active"))
                + render(body, "en", r)
                + footer(depth, "en", meta.get("scripts", []), depth))
        write(meta["path"], page)
        out.append(meta)

    today = datetime.date.today().isoformat()
    urls = "\n".join(
        f"  <url><loc>{SITE}/{m['out']}</loc><lastmod>{today}</lastmod></url>"
        for m in out if not m.get("noindex")
    )
    (ROOT / "sitemap.xml").write_text(
        f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}\n</urlset>\n',
        encoding="utf-8")
    print(f"Built {len(out)} pages")
    for m in out:
        print("  /" + m["out"])


if __name__ == "__main__":
    build()
