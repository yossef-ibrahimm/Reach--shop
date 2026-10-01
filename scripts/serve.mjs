// Minimal static file server for the `out/` folder (verification only).
// Emulates GitHub Pages behaviour: directory → index.html, unknown → 404.html (status 404).
// Usage: node scripts/serve.mjs [rootDir] [port]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = normalize(process.argv[2] ?? 'out');
const port = Number(process.argv[3] ?? 4173);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml; charset=utf-8',
};

async function resolve(pathname) {
  const candidate = normalize(join(root, pathname));
  if (candidate !== root && !candidate.startsWith(root)) return null;
  const direct = await stat(candidate).catch(() => null);
  if (direct?.isFile()) return candidate;
  if (direct?.isDirectory()) {
    const index = join(candidate, 'index.html');
    if ((await stat(index).catch(() => null))?.isFile()) return index;
  }
  return null;
}

createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
    const file = await resolve(pathname);
    if (file) {
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
      res.end(body);
      return;
    }
    const notFound = join(root, '404.html');
    const body = await readFile(notFound).catch(() => 'Not found');
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    res.end(body);
  } catch {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Internal error');
  }
}).listen(port, () => {
  console.log(`Serving ${root} at http://localhost:${port}`);
});
