#!/usr/bin/env python3
"""
Static page builder for mdhossaincloud.github.io

Why: the site is plain HTML on GitHub Pages (no framework, no runtime build).
This script only stitches the shared header, footer and <head> metadata onto
each page body so navigation and SEO tags stay consistent. Output is committed.

Folders starting with "_" are not published by GitHub Pages (Jekyll), so this
script and the page sources stay private to the repository.

Usage:  python3 _build/build.py
Each source in _build/pages/ starts with a JSON block inside <!--meta ... -->.
"""
import json, re, pathlib, html, datetime

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "_build" / "pages"
SITE = "https://mdhossaincloud.github.io"
NAME = "Md. Hossain"
EMAIL = "mdhossain.cloud@gmail.com"
LINKEDIN = "https://www.linkedin.com/in/mdhossain-cloud"
GITHUB = "https://github.com/mdhossaincloud"
VERSION = "3.0.0"

NAV = [
    ("about", "About"), ("expertise", "Expertise"), ("lab", "Infrastructure Lab"),
    ("projects", "Projects"), ("experience", "Experience"),
    ("credentials", "Certifications"), ("knowledge", "Knowledge Hub"), ("contact", "Contact"),
]

ICON = {
    "sun": '<svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    "moon": '<svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    "menu": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    "arrow": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    "download": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
    "mail": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>',
    "copy": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/></svg>',
    "linkedin": '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.1V21h-4v-5.2c0-1.24-.02-2.84-1.73-2.84-1.73 0-2 1.35-2 2.75V21h-4z"/></svg>',
    "github": '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z"/></svg>',
    "pin": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    "file": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>',
    "external": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
    "search": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    "prev": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
    "next": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
    "play": '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
    "pause": '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',
    "reset": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
}

MONOGRAM = (
    '<svg viewBox="0 0 32 32" aria-hidden="true">'
    '<rect x="1" y="1" width="30" height="30" rx="8" fill="var(--sf-2)" stroke="var(--ln-2)"/>'
    '<path d="M6 22V10l4.5 6 4.5-6v12" fill="none" stroke="var(--ink)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/><path d="M19 10v12M26 10v12M19 16h7" fill="none" stroke="var(--acc)" stroke-width="2.2" stroke-linecap="round"/></svg>'
)


def rel(depth):
    if depth == -1:
        return "/"
    return "../" * depth if depth else ""


def head(meta, depth):
    r = rel(depth)
    url = SITE + "/" + meta["path"]
    title = html.escape(meta["title"])
    desc = html.escape(meta["description"])
    robots = '<meta name="robots" content="noindex">\n' if meta.get("noindex") else ""
    ld = meta.get("jsonld")
    ld_html = ""
    if ld:
        ld_html = '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False, separators=(",", ":")) + "</script>\n"
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
{robots}<link rel="canonical" href="{url}">
<meta name="author" content="{NAME}">
<meta name="theme-color" content="#070d1a">
<meta property="og:type" content="{meta.get('ogtype', 'website')}">
<meta property="og:site_name" content="{NAME}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/assets/img/og-card.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Md. Hossain, IT infrastructure and systems support specialist, Dhaka">
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
{ld_html}</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="progress" id="progress" aria-hidden="true"></div>
"""


def header(depth, active=None):
    r = rel(depth)
    home = r or "./"
    items = []
    for key, label in NAV:
        if key == "knowledge":
            href = f"{r}knowledge/"
        else:
            href = f"#{key}" if depth == 0 else f"{r}#{key}"
        cur = ' aria-current="page"' if active == key else ""
        items.append(f'<li><a href="{href}" data-spy="{key}"{cur}>{label}</a></li>')
    return f"""<header class="site-header" id="top">
  <div class="wrap bar">
    <a class="brand" href="{home}" aria-label="Md. Hossain, home">
      {MONOGRAM}<span>Md. Hossain<small>IT Infrastructure &amp; Systems</small></span>
    </a>
    <nav class="site-nav" id="site-nav" aria-label="Main">
      <ul class="nav-links">{''.join(items)}</ul>
    </nav>
    <button class="icon-btn theme-btn" id="theme-btn" type="button" aria-label="Switch to light theme">{ICON['moon']}{ICON['sun']}</button>
    <button class="icon-btn menu-btn" id="menu-btn" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Open menu">{ICON['menu']}</button>
  </div>
</header>
"""


def footer(depth, scripts):
    r = rel(depth)
    home = r or "./"
    year = datetime.date.today().year
    tags = "\n".join(f'<script src="{r}assets/js/{s}?v={VERSION}" defer></script>' for s in ["site.js"] + scripts)
    return f"""<footer class="site-footer">
  <div class="wrap foot">
    <span>&copy; {year} Md. Hossain. Dhaka, Bangladesh.</span>
    <nav aria-label="Footer">
      <a href="{home}#projects">Projects</a>
      <a href="{r}knowledge/">Knowledge Hub</a>
      <a href="{r}cv/MD_Hossain_CV.pdf" download>CV (PDF)</a>
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


def render_icons(body):
    return re.sub(r"\{\{icon:([a-z]+)\}\}", lambda m: ICON[m.group(1)], body)


def build():
    out = []
    for src in sorted(SRC.rglob("*.html")):
        text = src.read_text(encoding="utf-8")
        m = re.match(r"\s*<!--meta\s*(\{.*?\})\s*-->\s*", text, re.S)
        if not m:
            raise SystemExit(f"Missing meta block: {src}")
        meta = json.loads(m.group(1))
        body = render_icons(text[m.end():])
        depth = meta["path"].count("/")
        if meta.get("absolute"):
            depth = -1  # 404 is served from any URL: use root-absolute paths
        if meta.get("trail"):
            meta["jsonld"] = breadcrumbs_ld(meta["trail"])
        if meta["path"] == "":
            meta["jsonld"] = HOME_LD
        r = rel(depth)
        body = body.replace("{{root}}", r)
        page = head(meta, depth) + header(depth, meta.get("active")) + body + footer(depth, meta.get("scripts", []))
        target = ROOT / (meta["path"] + "index.html" if meta["path"].endswith("/") or meta["path"] == "" else meta["path"])
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(page, encoding="utf-8")
        out.append(meta)
    # sitemap
    today = datetime.date.today().isoformat()
    urls = "\n".join(
        f"  <url><loc>{SITE}/{m['path']}</loc><lastmod>{today}</lastmod></url>"
        for m in out if not m.get("noindex")
    )
    (ROOT / "sitemap.xml").write_text(
        f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}\n</urlset>\n',
        encoding="utf-8")
    print(f"Built {len(out)} pages")
    for m in out:
        print("  /" + m["path"])


HOME_LD = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "Person", "@id": SITE + "/#person", "name": NAME,
            "alternateName": "Md Hossain", "url": SITE + "/",
            "email": "mailto:" + EMAIL,
            "jobTitle": "Senior IT Officer",
            "worksFor": {"@type": "Organization", "name": "MKR Group"},
            "address": {"@type": "PostalAddress", "addressLocality": "Dhaka", "addressCountry": "BD"},
            "knowsAbout": ["IT support", "Microsoft 365 administration", "Active Directory", "Group Policy",
                           "Network administration", "MikroTik", "Site-to-site VPN", "VLAN",
                           "IP CCTV and NVR", "IT asset management", "PowerShell"],
            "sameAs": [LINKEDIN, GITHUB],
        },
        {
            "@type": "WebSite", "@id": SITE + "/#website", "url": SITE + "/",
            "name": "Md. Hossain, IT Infrastructure & Systems", "inLanguage": "en",
            "publisher": {"@id": SITE + "/#person"},
        },
    ],
}

if __name__ == "__main__":
    build()
