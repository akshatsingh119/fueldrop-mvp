// Tiny static server with SPA fallback for the production build.
import http from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const root = join(process.cwd(), 'dist')
const port = +(process.env.PORT || 4173)
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.json': 'application/json' }
http.createServer(async (req, res) => {
  let p = normalize(decodeURIComponent((req.url || '/').split('?')[0])).replace(/^(\.\.[/\\])+/, '')
  let file = join(root, p)
  try { if (!(await stat(file)).isFile()) throw 0 } catch { file = join(root, 'index.html') }
  try {
    const body = await readFile(file)
    const ext = extname(file)
    res.writeHead(200, { 'content-type': types[ext] || 'application/octet-stream', 'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable' })
    res.end(body)
  } catch { res.writeHead(500); res.end('error') }
}).listen(port, '0.0.0.0', () => console.log(`FuelDrop serving on http://localhost:${port}`))
