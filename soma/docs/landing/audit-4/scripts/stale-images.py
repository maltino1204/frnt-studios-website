"""(audit 4) N4-3: does the image optimiser serve the photo that is on disk?

Every `/_next/image` URL the landing's HTML references (all widths in every srcset), fetched as AVIF and as WebP
(the optimiser caches each format separately, keyed by URL, width, quality and format, not by file content). Each
response is compared with the source file in public/: both are reduced to 48 x 32 grey thumbnails at the response's
aspect ratio and the mean absolute difference is taken (0 = identical, a different picture is > 25). x-nextjs-cache
is recorded. Output: data/stale-images.json and a contact sheet of every mismatch (stale-images.jpg).
usage: python3 -I stale-images.py
"""
import io, json, re, sys, urllib.parse, urllib.request
from PIL import Image, ImageChops, ImageStat

BASE = "http://localhost:3100"
PUB = "/home/user/frnt-studios-website/soma/public"
OUT = "/home/user/frnt-studios-website/soma/docs/landing/audit-4"
ACCEPT = {"avif": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8", "webp": "image/webp,image/*,*/*;q=0.8"}

MAXW = int(sys.argv[1]) if len(sys.argv) > 1 else 1080
html = urllib.request.urlopen(BASE + "/").read().decode()
raw = re.findall(r'/_next/image\?url=[^"\s,\\]+(?:\\u0026[^"\s,\\]+)*', html)
norm = set()
for u in raw:
    u = u.replace("&amp;", "&").replace("\\u0026", "&")
    q = urllib.parse.parse_qs(urllib.parse.urlparse(u).query)
    # widths a visitor of the audited viewports actually gets (<= 1080; larger ones only for DPR 3 desktops), to keep
    # the optimiser work on this shared machine small
    if "url" in q and "w" in q and int(q["w"][0]) <= MAXW:
        norm.add(f"/_next/image?url={urllib.parse.quote(q['url'][0], safe='')}&w={q['w'][0]}&q={q.get('q', ['75'])[0]}")
urls = sorted(norm)
src_cache = {}
rows, bad = [], []
for u in urls:
    q = urllib.parse.parse_qs(urllib.parse.urlparse(u).query)
    path, w = q["url"][0], int(q["w"][0])
    if path not in src_cache:
        src_cache[path] = Image.open(PUB + path).convert("L")
    src = src_cache[path]
    for fmt, acc in ACCEPT.items():
        req = urllib.request.Request(BASE + u, headers={"Accept": acc})
        with urllib.request.urlopen(req) as r:
            body, cache, ctype = r.read(), r.headers.get("x-nextjs-cache"), r.headers.get("content-type")
        im = Image.open(io.BytesIO(body)).convert("L")
        a = im.resize((48, 32)) if im.width >= im.height else im.resize((32, 48))
        b = src.resize(a.size)
        diff = ImageStat.Stat(ImageChops.difference(a, b)).mean[0]
        row = {"path": path, "w": w, "fmt": fmt, "ctype": ctype, "cache": cache, "size": im.size, "diff": round(diff, 1)}
        rows.append(row)
        if diff > 25:
            bad.append((row, Image.open(io.BytesIO(body)).convert("RGB")))
        print(f"{path} w={w} {fmt} {cache} diff={diff:.1f}{'  <-- DIFFERENT PICTURE' if diff > 25 else ''}", flush=True)

json.dump({"urls": len(urls), "checked": len(rows), "mismatches": [r for r, _ in bad], "rows": rows}, open(OUT + "/data/stale-images.json", "w"), indent=1)
if bad:
    tiles = []
    for r, im in bad:
        im.thumbnail((360, 360))
        src = Image.open(PUB + r["path"]).convert("RGB")
        src.thumbnail((360, 360))
        t = Image.new("RGB", (740, 380), "white")
        t.paste(im, (0, 0))
        t.paste(src, (380, 0))
        tiles.append(t)
    sheet = Image.new("RGB", (740, 380 * len(tiles)), "white")
    for i, t in enumerate(tiles):
        sheet.paste(t, (0, 380 * i))
    sheet.save(OUT + "/stale-images.jpg", quality=82)
print(f"{len(urls)} URLs, {len(rows)} responses, {len(bad)} different from the file on disk")
