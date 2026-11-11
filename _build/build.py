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
import urllib.parse

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
VERSION = "6.1.0"

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
    ("bn", "বাংলা", "bn", "bn/"),
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
    og_locale = {"en": "en_US", "de": "de_DE", "fr": "fr_FR", "es": "es_ES", "it": "it_IT", "pt": "pt_PT", "nl": "nl_NL", "zh": "zh_CN", "bn": "bn_BD"}[lang]
    bn_preload = (f'<link rel="preload" href="{r}assets/fonts/hind-siliguri-bn-400.woff2" as="font" type="font/woff2" crossorigin>\n'
                  if lang == "bn" else "")
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
{bn_preload}<link rel="stylesheet" href="{r}assets/css/site.css?v={VERSION}">
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
      <summary>{ICON['globe']}<span>{lang.upper()}</span><span class="sr-only"> {html.escape(t(lang, 'ui.language'))}: {cur[0]}</span></summary>
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


def footer(depth, lang, scripts, site_root, home_page=False):
    r = rel(depth)
    sr = rel(site_root)
    e = lambda k: html.escape(t(lang, k))
    home = "" if home_page else (r or "./")
    year = datetime.date.today().year
    tags = "\n".join(f'<script src="{sr}assets/js/{s}?v={VERSION}" defer></script>' for s in ["site.js"] + scripts)
    explore = "".join(f'<li><a href="{home}#{k}">{e("nav." + k)}</a></li>' for k in ["about", "experience", "services", "projects"])
    binary = " ".join(format(ord(c), "08b") for c in "RELIABLE IT, QUIETLY RUNNING ")
    return f"""<footer class="site-footer">
  <div class="foot-signal" aria-hidden="true"><span>{binary} {binary}</span></div>
  <div class="wrap foot-grid">
    <div class="foot-brand">
      <a class="brand" href="{home or './'}">{MONOGRAM}<span>Md. Hossain<small>{e('ui.brandline')}</small></span></a>
      <p>{e('foot.tag')}</p>
      <p class="foot-avail"><i aria-hidden="true"></i>{e('spec.avail.v')}</p>
    </div>
    <nav class="foot-col" aria-label="{e('foot.explore')}">
      <h2>{e('foot.explore')}</h2>
      <ul>{explore}</ul>
    </nav>
    <nav class="foot-col" aria-label="{e('foot.learn')}">
      <h2>{e('foot.learn')}</h2>
      <ul>
        <li><a href="{sr}knowledge/">{e('ui.hub')}</a></li>
        <li><a href="{home}#insights">{e('foot.lab')}</a></li>
        <li><a href="{sr}knowledge/#paths">{e('foot.paths')}</a></li>
        <li><a href="{sr}knowledge/#glossary">{e('foot.glossary')}</a></li>
      </ul>
    </nav>
    <nav class="foot-col" aria-label="{e('foot.connect')}">
      <h2>{e('foot.connect')}</h2>
      <ul>
        <li><a href="mailto:{EMAIL}">{ICON['mail']}<span>{e('foot.email')}</span></a></li>
        <li><a href="{LINKEDIN}" rel="noopener">{ICON['linkedin']}<span>LinkedIn</span></a></li>
        <li><a href="{GITHUB}" rel="noopener">{ICON['github']}<span>GitHub</span></a></li>
        <li><a href="{sr}cv/MD_Hossain_CV.pdf" download>{ICON['download']}<span>{e('ui.cv')}</span></a></li>
      </ul>
    </nav>
  </div>
  <div class="wrap foot-base">
    <p>&copy; {year} Md. Hossain &middot; {e('ui.place')}</p>
    <p class="foot-time">{e('foot.time')} <time id="dhaka-time">GMT+6</time></p>
    <p>{e('foot.privacy')}</p>
    <a class="foot-top" href="#top">{e('foot.top')} <span aria-hidden="true">&uarr;</span></a>
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


LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'
FOLDER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2h8.5A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/></svg>'


def tree_html(name):
    """Folder structure of a repository: names only, no links, no contents."""
    data = json.loads((ROOT / "_build" / "trees" / f"{name}.json").read_text(encoding="utf-8"))
    stats = {"d": 0}

    def node(n, depth):
        stats["d"] += 1
        label = html.escape(n["n"])
        if "c" in n:
            return (f'<li class="t-dir t-sealed"><span>{FOLDER}{label}/</span>'
                    f'<small>{n["c"]:,} {"file" if n["c"] == 1 else "files"}</small></li>')
        kids = "".join(node(d, depth + 1) for d in n.get("d", []))
        kids += "".join(f'<li class="t-file"><span>{LOCK}{html.escape(f)}</span></li>' for f in n.get("f", []))
        opened = " open" if depth < 2 else ""
        return f'<li class="t-dir"><details{opened}><summary>{FOLDER}{label}/</summary><ul>{kids}</ul></details></li>'

    body = node(data, 0)
    return (f'<div class="repo-tree"><ul class="t-root">{body}</ul></div>'
            f'<p class="tree-stats">{data["total"]:,} files &middot; {stats["d"]:,} folders shown</p>')


def render(body, lang, r):
    body = re.sub(r"\{\{tree:([a-z\-]+)\}\}", lambda m: tree_html(m.group(1)), body)
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
                        + footer(depth, code, meta.get("scripts", []), depth, home_page=True))
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

    out.extend(build_articles())

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


# ---------------------------------------------------------------------------
# Knowledge Hub guides: _build/articles/<slug>.md  ->  knowledge/<slug>/
# ---------------------------------------------------------------------------
ARTICLES = ROOT / "_build" / "articles"
GUIDE_ORDER = [  # reading order used for "next guide" links and the hub
    "no-internet-troubleshooting", "ip-addressing-subnetting-basics", "microsoft-365-basics",
    "m365-mfa-security-defaults", "onedrive-sharepoint-teams", "security-basics-for-staff",
    "active-directory-basics", "powershell-first-commands", "mikrotik-first-day-hardening",
    "backup-3-2-1-rule", "cctv-storage-planning", "it-onboarding-offboarding-checklist",
    "it-support-career-roadmap",
]
PUBLISHED = "2026-11-10"


def load_articles():
    import markdown  # build-time only
    arts = []
    for p in ARTICLES.glob("*.md"):
        raw = p.read_text(encoding="utf-8")
        m = re.match(r"---\n(.*?)\n---\n", raw, re.S)
        fm = {}
        for line in m.group(1).splitlines():
            k, v = line.split(":", 1)
            fm[k.strip()] = v.strip()
        md = raw[m.end():]
        words = len(re.findall(r"\w+", md))
        body = markdown.markdown(md, extensions=["tables", "fenced_code", "sane_lists", "toc"],
                                 extension_configs={"toc": {"toc_depth": "2"}})
        # checklists: "- [ ] text" -> tickable items (kept in the page only)
        body = re.sub(r"<li>\[ \] ", '<li class="task"><input type="checkbox" aria-label="Done"> ', body)
        body = re.sub(r"<ul>\n(<li class=\"task\">)", r'<ul class="tasks">\n\1', body)
        body = body.replace("<table>", '<div class="table-wrap"><table>').replace("</table>", "</table></div>")
        body = body.replace("<blockquote>", '<aside class="callout">').replace("</blockquote>", "</aside>")
        heads = re.findall(r'<h2 id="([^"]+)">(.*?)</h2>', body)
        arts.append({
            "slug": p.stem, "title": fm["title"], "topic": fm["topic"], "level": fm["level"],
            "summary": fm["summary"], "takeaways": [x.strip() for x in fm["takeaways"].split("|")],
            "scripts": [s.strip() for s in fm.get("scripts", "").split(",") if s.strip()],
            "minutes": max(2, round(words / 200)), "body": body, "heads": heads,
        })
    arts.sort(key=lambda a: GUIDE_ORDER.index(a["slug"]) if a["slug"] in GUIDE_ORDER else 99)
    return arts


def card(a, prefix):
    return (f'<li class="hub-item"><a href="{prefix}{a["slug"]}/"><h3>{html.escape(a["title"])}</h3>'
            f'<p>{html.escape(a["summary"])}</p><div class="meta"><span class="tag">{html.escape(a["topic"])}</span>'
            f'<span class="tag">{a["level"]}</span><span class="tag">{a["minutes"]} min read</span></div></a></li>')


def build_articles():
    arts = load_articles()
    out = []
    for i, a in enumerate(arts):
        path = f"knowledge/{a['slug']}/"
        depth = 2
        r = rel(depth)
        meta = {
            "path": path, "out": path, "ogtype": "article",
            "title": f"{a['title']} | Knowledge Hub | Md. Hossain",
            "description": a["summary"],
            "jsonld": {"@context": "https://schema.org", "@graph": [
                {"@type": "TechArticle", "headline": a["title"], "description": a["summary"],
                 "inLanguage": "en", "datePublished": PUBLISHED, "dateModified": PUBLISHED,
                 "proficiencyLevel": a["level"], "articleSection": a["topic"],
                 "author": {"@type": "Person", "name": NAME, "url": SITE + "/"},
                 "mainEntityOfPage": SITE + "/" + path},
                breadcrumbs_ld([["Home", ""], ["Knowledge Hub", "knowledge/"], [a["title"], path]]),
            ]},
        }
        toc = "".join(f'<li><a href="#{h}">{t_}</a></li>' for h, t_ in a["heads"])
        keys = "".join(f"<li>{html.escape(k)}</li>" for k in a["takeaways"])
        related = [b for b in arts if b["topic"] == a["topic"] and b is not a]
        related += [b for b in arts[i + 1:] + arts[:i] if b not in related and b is not a]
        nxt = arts[(i + 1) % len(arts)]
        body = f"""<main id="main">
<article class="guide">
<header class="page-hero guide-hero">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><ol>
      <li><a href="{r}">Home</a></li><li><a href="{r}knowledge/">Knowledge Hub</a></li><li><span aria-current="page">{html.escape(a['topic'])}</span></li>
    </ol></nav>
    <p class="guide-topic"><a href="{r}knowledge/?topic={urllib.parse.quote(a['topic'])}">{html.escape(a['topic'])}</a></p>
    <h1>{html.escape(a['title'])}</h1>
    <p class="lead">{html.escape(a['summary'])}</p>
    <ul class="guide-meta">
      <li><span>Level</span>{a['level']}</li>
      <li><span>Reading time</span>{a['minutes']} minutes</li>
      <li><span>Updated</span><time datetime="{PUBLISHED}">10 November 2026</time></li>
      <li><span>Written by</span>Md. Hossain</li>
    </ul>
  </div>
</header>
<div class="wrap guide-layout">
  <aside class="guide-aside">
    <nav class="toc" aria-labelledby="toc-h"><p id="toc-h">On this page</p><ol>{toc}</ol></nav>
  </aside>
  <div class="guide-body">
    <section class="takeaways" aria-labelledby="kt"><h2 id="kt">Key takeaways</h2><ul>{keys}</ul></section>
    <div class="prose article-prose">
{a['body']}
    </div>
    <div class="author-card">
      <img src="{r}assets/img/hossain-avatar.jpg" alt="" width="56" height="56" loading="lazy">
      <div><p><b>Md. Hossain</b>, IT Infrastructure Specialist in Dhaka. Eight years supporting users, networks and Microsoft 365 in Bangladeshi companies.</p>
      <p class="muted">General guidance for learning. Test changes in a lab and follow your organisation's change process before applying them to live systems.</p></div>
    </div>
    <a class="next-guide" href="../{nxt['slug']}/"><span>Next guide</span><b>{html.escape(nxt['title'])}</b>{ICON['arrow']}</a>
  </div>
</div>
<section class="section related" aria-labelledby="rel-h">
  <div class="wrap">
    <div class="section-head"><h2 id="rel-h">Keep learning</h2><p>More guides from the Knowledge Hub.</p></div>
    <ul class="hub-list">{''.join(card(b, '../') for b in related[:4])}</ul>
    <p class="related-more"><a class="btn" href="{r}knowledge/">All guides and explainers {ICON['arrow']}</a></p>
  </div>
</section>
</article>
</main>
"""
        page = (head(meta, depth, "en", alternates=False)
                + header(depth, "en", home_page=False)
                + body
                + footer(depth, "en", a["scripts"], depth))
        write(path, page)
        out.append(meta)

    index = [{"title": a["title"], "summary": a["summary"], "topic": a["topic"], "level": a["level"],
              "url": a["slug"] + "/", "minutes": a["minutes"], "date": PUBLISHED,
              "text": re.sub(r"<[^>]+>", " ", a["body"])[:2500]} for a in arts]
    (ROOT / "assets" / "js" / "articles.js").write_text(
        "/* Generated by _build/build.py from _build/articles/*.md. Do not edit by hand. */\n"
        "window.ARTICLES = " + json.dumps(index, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8")
    return out


if __name__ == "__main__":
    build()
