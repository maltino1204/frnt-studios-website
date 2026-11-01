// Instagram profile-grid preview and the story/avatar overview board.
import fs from "node:fs";
import path from "node:path";
import * as L from "./lib.mjs";
const { C } = L;
const OUT = path.join(L.APPS, "social");
const posts = fs.readdirSync(path.join(OUT, "instagram")).filter((f) => f.startsWith("post-")).sort();
const file = (p) => "file://" + path.join(OUT, p);
const html = L.page(`<div style="width:1290px;padding:56px 60px 40px">
  <div style="display:flex;gap:48px;align-items:center">
    <img src="${file("avatar-1080.png")}" style="width:168px;height:168px;border-radius:50%">
    <div><div style="font-size:30px;font-weight:600">soma</div>
    <div style="margin-top:10px;font-size:20px;line-height:1.5"><span lang="en">SOMA · Your body. Your place.</span><br>Beauty &amp; Wellness. Bei dir – in {Städte}.</div>
    <div class="ai" style="margin-top:8px;color:${C.umberDeep};font-size:14px">Vorschau · {Städte} kommt aus dem Coverage-Gate: nur Städte mit buchbaren Profis</div></div></div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-top:44px">${posts.map((p) => `<img src="${file("instagram/" + p)}" style="width:100%;aspect-ratio:4/5;display:block;object-fit:cover">`).join("")}</div></div>`, { w: 1290, h: 1790 });
await L.png(html, path.join(OUT, "instagram-grid-preview.png"), { w: 1290, h: 1790 });
const stories = fs.readdirSync(path.join(OUT, "stories")).sort();
await L.png(L.page(`<div style="display:flex;gap:40px;padding:60px">${stories.map((s) => `<img src="${file("stories/" + s)}" style="width:420px;border-radius:24px;box-shadow:var(--shadow-float)">`).join("")}</div>`, { w: 1440, h: 867 }), path.join(OUT, "stories-overview.png"), { w: 1440, h: 867 });
await L.close();
