// A/B harness for the Lighthouse first-paint stall (round 3): forwards to :3100, injects CSS (INJECT) / replaces HTML (REPLACE), can 404 /sw.js (BLOCK_SW).
// A/B harness: forwards to :3100 and injects CSS (env INJECT) before </head> in HTML responses. usage: PORT=3101 INJECT='...' node proxy.js
const http = require('http');
const zlib = require('zlib');
const PORT = Number(process.env.PORT || 3101);
const INJECT = process.env.INJECT || '';
http.createServer((req, res) => {
  if (process.env.BLOCK_SW && req.url.startsWith('/sw.js')) { res.writeHead(404); res.end(); return; }
  const headers = { ...req.headers, host: 'localhost:3100' };
  if ((req.headers.accept || '').includes('text/html')) delete headers['accept-encoding'];
  const p = http.request({ host: 'localhost', port: 3100, path: req.url, method: req.method, headers }, (r) => {
    const ct = r.headers['content-type'] || '';
    if (!ct.includes('text/html') || !INJECT) { res.writeHead(r.statusCode, r.headers); r.pipe(res); return; }
    const chunks = []; r.on('data', (c) => chunks.push(c)); r.on('end', () => {
      let h = Buffer.concat(chunks).toString('utf8');
      h = h.replace('</head>', `<style id="ab">${INJECT}</style></head>`);
      for (const [a, b] of JSON.parse(process.env.REPLACE || '[]')) h = h.split(a).join(b);
      const hd = { ...r.headers }; delete hd['content-length']; delete hd['transfer-encoding'];
      const gz = /gzip/.test(req.headers['accept-encoding'] || '');
      const body = gz ? zlib.gzipSync(h) : Buffer.from(h);
      if (gz) hd['content-encoding'] = 'gzip';
      hd['content-length'] = body.length;
      res.writeHead(r.statusCode, hd); res.end(body);
    });
  });
  req.pipe(p);
  p.on('error', (e) => { res.writeHead(502); res.end(String(e)); });
}).listen(PORT, () => console.log('proxy on', PORT));
