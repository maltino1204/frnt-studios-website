const sharp = require('/home/user/frnt-studios-website/soma/node_modules/sharp');
// usage: file x y w h  -> reports luminance stats of region (excluding near-text pixels by percentile)
const [f,x,y,w,h]=process.argv.slice(2);
(async()=>{
 const {data,info}=await sharp(f).extract({left:+x,top:+y,width:+w,height:+h}).removeAlpha().raw().toBuffer({resolveWithObject:true});
 const L=[]; const lin=c=>{c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4)};
 for(let i=0;i<data.length;i+=3){L.push(0.2126*lin(data[i])+0.7152*lin(data[i+1])+0.0722*lin(data[i+2]));}
 L.sort((a,b)=>a-b); const p=q=>L[Math.floor(q*(L.length-1))];
 const cr=(a,b)=>(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
 console.log('p10',p(.1).toFixed(3),'p50',p(.5).toFixed(3),'p90',p(.9).toFixed(3),'p99',p(.99).toFixed(3),'| ratio p99 vs p50:',cr(p(.99),p(.5)).toFixed(2),'p99 vs p90',cr(p(.99),p(.9)).toFixed(2));
})();
