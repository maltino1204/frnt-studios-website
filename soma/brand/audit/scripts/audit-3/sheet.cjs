const sharp = require('/home/user/frnt-studios-website/soma/node_modules/sharp');
const fs=require('fs');
(async()=>{
const [out, ...files]=process.argv.slice(2);
const bufs=await Promise.all(files.map(async f=>sharp(f).resize({height:256, fit:'contain', background:'#888'}).png().toBuffer()));
const metas=await Promise.all(bufs.map(b=>sharp(b).metadata()));
const W=metas.reduce((a,m)=>a+m.width+10,10);
let x=10; const comps=bufs.map((b,i)=>{const c={input:b,left:x,top:10}; x+=metas[i].width+10; return c;});
await sharp({create:{width:W,height:276,channels:4,background:'#888888'}}).composite(comps).png().toFile(out);
})();
