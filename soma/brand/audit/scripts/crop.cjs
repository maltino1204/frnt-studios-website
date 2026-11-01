const sharp = require('/home/user/frnt-studios-website/soma/node_modules/sharp');
const [src, out, top, height, left, width] = process.argv.slice(2);
(async()=>{ const m=await sharp(src).metadata(); const t=+top, h=Math.min(+height, m.height-t); const l=+(left||0); const w=+(width||m.width-l);
await sharp(src).extract({left:l, top:t, width:Math.min(w,m.width-l), height:h}).toFile(out); console.log(m.width,m.height); })();
