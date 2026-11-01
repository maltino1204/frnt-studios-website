const sharp = require('/home/user/frnt-studios-website/soma/node_modules/sharp');
const [out, h, ...files]=process.argv.slice(2);
(async()=>{ const H=+h;
const bufs=await Promise.all(files.map(f=>sharp(f).resize({height:H}).png().toBuffer()));
const metas=await Promise.all(bufs.map(b=>sharp(b).metadata()));
const W=metas.reduce((a,m)=>a+m.width+12,12);
let x=12; const comps=bufs.map((b,i)=>{const c={input:b,left:x,top:12}; x+=metas[i].width+12; return c;});
await sharp({create:{width:W,height:H+24,channels:4,background:'#999999'}}).composite(comps).png().toFile(out);})();
