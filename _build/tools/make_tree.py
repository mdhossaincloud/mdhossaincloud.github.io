#!/usr/bin/env python3
"""Snapshot a repository's folder structure (names only, never contents).

Usage: make_tree.py <repo-dir> <out.json> <label> [--expand path ...] [--collapse path ...]

* Dot-files, archives and OS clutter are left out.
* Folders under --collapse (and anything not on an --expand path once the
  depth limit is reached) are shown as a single node with a file count.
"""
import json, os, sys, pathlib, subprocess

SKIP_NAMES = {".git", "desktop.ini", "Thumbs.db", ".DS_Store", "__pycache__", "node_modules"}
SKIP_EXT = {".zip", ".log", ".bak", ".sql", ".pem", ".key"}

def files_of(root):
    try:
        out = subprocess.run(["git", "-C", root, "ls-files"], capture_output=True, text=True, check=True).stdout
        return [l for l in out.splitlines() if l]
    except Exception:
        return [str(p.relative_to(root)) for p in pathlib.Path(root).rglob("*") if p.is_file()]

def visible(parts):
    return not any(p.startswith(".") or p in SKIP_NAMES for p in parts) and pathlib.Path(parts[-1]).suffix.lower() not in SKIP_EXT

def main():
    root, out, label, *rest = sys.argv[1:]
    expand, collapse, mode = [], [], None
    for a in rest:
        if a in ("--expand", "--collapse"): mode = a; continue
        (expand if mode == "--expand" else collapse).append(a.strip("/"))
    tree = {"name": label, "dirs": {}, "files": []}
    count = 0
    for f in files_of(root):
        parts = f.split("/")
        if not visible(parts):
            continue
        count += 1
        node, path = tree, []
        for i, d in enumerate(parts[:-1]):
            path.append(d)
            p = "/".join(path)
            node = node["dirs"].setdefault(d, {"name": d, "dirs": {}, "files": []})
            if any(p == c or p.startswith(c + "/") for c in collapse) and not any(e == p or e.startswith(p + "/") or p.startswith(e + "/") for e in expand):
                node["collapsed"] = node.get("collapsed", 0) + 1
                break
        else:
            node["files"].append(parts[-1])
    def clean(n):
        res = {"n": n["name"]}
        if n.get("collapsed"):
            res["c"] = n["collapsed"]; return res
        if n["dirs"]: res["d"] = [clean(v) for k, v in sorted(n["dirs"].items(), key=lambda kv: kv[0].lower())]
        if n["files"]: res["f"] = sorted(n["files"], key=str.lower)
        return res
    data = clean(tree); data["total"] = count
    pathlib.Path(out).write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(out, count, "files")

main()
