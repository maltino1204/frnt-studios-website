// Worst-case contrast of Bone text on the 08 band photo: hide the text, screenshot the background, take the
// 98th-percentile luminance under each text line box, compute WCAG contrast against the text colour.
const { launch, BASE, OUT, TMP } = require('./lib');
const { execSync } = require('child_process');
(async () => {
  const b = await launch();
  for (const [w, h] of [[1024, 768], [1280, 800], [1440, 900], [1920, 1080]]) {
    const c = await b.newContext({ viewport: { width: w, height: h } });
    const p = await c.newPage();
    await p.goto(`${BASE}/?motion=none`, { waitUntil: 'networkidle' });
    await p.evaluate(() => { const el = document.querySelector('.lp-band'); scrollTo(0, el.getBoundingClientRect().top + scrollY); });
    await p.waitForTimeout(1200);
    const boxes = await p.evaluate(() => {
      const sel = ['.lp-band-text .type-eyebrow', '.lp-band-title', '.lp-band-lead', '.lp-band-place'];
      const out = [];
      for (const s of sel) {
        const el = document.querySelector(s);
        if (!el) continue;
        const range = document.createRange(); range.selectNodeContents(el);
        const rects = [...range.getClientRects()].filter((r) => r.width > 4 && r.height > 4);
        const col = getComputedStyle(el).color;
        rects.forEach((r, i) => out.push({ s: s + '#' + i, x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), col }));
      }
      return out;
    });
    await p.addStyleTag({ content: '.lp-band-text *, .lp-band-place, .lp-band-place * { color: transparent !important; border-color: transparent !important; } .lp-band-ctas { visibility: hidden !important; } .lp-header{visibility:hidden!important}' });
    await p.waitForTimeout(200);
    const file = `${TMP}/band-bg-${w}.png`;
    await p.screenshot({ path: file });
    const res = JSON.parse(execSync(`python3 -c '
import json,sys
from PIL import Image
im=Image.open("${file}").convert("RGB")
boxes=json.loads(sys.argv[1])
def lin(c):
    c=c/255
    return c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4
def L(px): return 0.2126*lin(px[0])+0.7152*lin(px[1])+0.0722*lin(px[2])
out=[]
for b in boxes:
    if b["y"]<0 or b["y"]+b["h"]>im.size[1]: continue
    crop=im.crop((b["x"],b["y"],b["x"]+b["w"],b["y"]+b["h"]))
    ls=sorted(L(p) for p in crop.getdata())
    p98=ls[int(0.98*(len(ls)-1))]; mx=ls[-1]
    tc=[int(x) for x in b["col"].replace("rgb(","").replace(")","").split(",")[:3]]
    lt=L(tc)
    cr=lambda lb:(max(lt,lb)+0.05)/(min(lt,lb)+0.05)
    out.append([b["s"],round(cr(p98),2),round(cr(mx),2),b["x"]+b["w"]])
print(json.dumps(out))
' '${JSON.stringify(boxes)}'`).toString());
    console.log(`${w}x${h}`, res.map((r) => `${r[0]} p98:${r[1]} worst:${r[2]} right:${r[3]}`).join(' | '));
    await c.close();
  }
  await b.close();
})();
