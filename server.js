// Jalankan: node server.js  (Node 18+)  lalu buka http://localhost:3000
// Taruh index.html di folder yang sama.
const http = require('http'), fs = require('fs'), path = require('path');

const allowed = h => /(^|\.)(tikwm\.com|tiktok\.com|tiktokcdn[\w-]*\.com|tiktokv\.com|byteoversea\.com|muscdn\.com)$/.test(h);

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost');
  try {
    if (u.pathname === '/api/health') return res.end('ok');

    if (u.pathname === '/api/resolve') {
      const t = u.searchParams.get('url') || '';
      res.setHeader('content-type', 'application/json');
      if (!/^https?:\/\/([\w-]+\.)?tiktok\.com\//.test(t)) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ code: -1, msg: 'Tautan TikTok tidak valid' }));
      }
      // Resolver pihak ketiga yang mengembalikan link video tanpa watermark
      const r = await fetch('https://www.tikwm.com/api/?hd=1&url=' + encodeURIComponent(t));
      return res.end(await r.text());
    }

    if (u.pathname === '/api/download') {
      let f = u.searchParams.get('url') || '';
      if (f.startsWith('/')) f = 'https://www.tikwm.com' + f;
      if (!allowed(new URL(f).hostname)) { res.statusCode = 403; return res.end('Ditolak'); }
      const r = await fetch(f);
      const name = (u.searchParams.get('name') || 'file').replace(/[^\w.-]/g, '_');
      res.setHeader('content-type', r.headers.get('content-type') || 'application/octet-stream');
      res.setHeader('content-disposition', `attachment; filename="${name}"`);
      return res.end(Buffer.from(await r.arrayBuffer()));
    }

    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ code: -1, msg: 'Kesalahan server' }));
  }
}).listen(process.env.PORT || 3000, () => console.log('KlipBersih jalan di port', process.env.PORT || 3000));
