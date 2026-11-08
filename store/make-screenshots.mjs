// renders the real popup and settings pages with mock data and saves
// 1280x800 screenshots for the addons.mozilla.org listing.
// needs microsoft edge or google chrome installed. run: npm run screenshots

import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { inflateSync, deflateSync, crc32 } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const storeDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(storeDir, '..');
const genDir = path.join(storeDir, '.gen');
const outDir = path.join(storeDir, 'screenshots');
const version = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8')).version;

const shots = [
  { file: '01-popup-dark.png', url: `/store/.gen/frame.html?theme=dark&scale=1.3` },
  { file: '02-popup-light-estimate.png', url: `/store/.gen/frame.html?theme=light&open=estimate&scale=1.02` },
  { file: '03-settings-dark.png', url: `/store/.gen/options.html?theme=dark` },
  { file: '04-settings-behavior-light.png', url: `/store/.gen/options.html?theme=light&section=behavior` },
  { file: '05-settings-languages-dark.png', url: `/store/.gen/options.html?theme=dark&section=languages` }
];

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png'
};

function findBrowser() {
  const candidates = [
    process.env.BROWSER_PATH,
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/microsoft-edge'
  ];
  return candidates.find(candidate => candidate && existsSync(candidate));
}

// wrap a real page so it loads the mock api first and uses absolute paths
async function wrapPage(name) {
  let html = await readFile(path.join(root, name, `${name}.html`), 'utf8');
  html = html
    .replace('<script src="../shared/theme.js"></script>',
      '<script src="/store/mock-browser.js"></script><script src="/shared/theme.js"></script>' +
      '<style>html{scroll-behavior:auto!important}::-webkit-scrollbar{display:none}</style>')
    .replaceAll('href="styles.css"', `href="/${name}/styles.css"`)
    .replaceAll(`src="${name}.js"`, `src="/${name}/${name}.js"`)
    .replaceAll('src="../icons/', 'src="/icons/');
  await writeFile(path.join(genDir, `${name}.html`), html);
}

// the popup on its own backdrop, scaled up so it reads at listing size
const frameHtml = `<!doctype html>
<html><head><meta charset="utf-8">
<script src="/store/mock-browser.js"></script>
<script src="/shared/theme.js"></script>
<link rel="stylesheet" href="/popup/styles.css">
<style>
  html, body { width: 1280px; height: 800px; margin: 0; overflow: hidden; }
  body { display: grid; place-items: center; background: var(--sunken); }
  .holder { transform-origin: center; }
  iframe { display: block; width: 340px; border: 1px solid var(--line-strong); border-radius: 8px;
    background: var(--bg); box-shadow: 0 24px 60px rgba(0,0,0,.28), 0 2px 6px rgba(0,0,0,.12); }
</style></head>
<body><div class="holder"><iframe id="popup" scrolling="no"></iframe></div>
<script>
  const params = new URLSearchParams(location.search);
  const frame = document.getElementById('popup');
  document.querySelector('.holder').style.transform = 'scale(' + (params.get('scale') || 1.2) + ')';
  frame.src = 'popup.html?' + params.toString() + '&version=${version}';
  frame.addEventListener('load', () => {
    const fit = () => { frame.style.height = frame.contentDocument.body.scrollHeight + 'px'; };
    fit();
    setTimeout(fit, 300);
  });
</script></body></html>`;

// headless chromium loses ~93px of the window to invisible browser chrome,
// so we render a taller window and keep only the top 800 rows.
// rows only depend on the rows above them, so cutting the bottom is safe
function cropPngHeight(buffer, height) {
  const chunks = [];
  let offset = 8;
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    chunks.push({ type, data: buffer.subarray(offset + 8, offset + 8 + length) });
    offset += 12 + length;
  }

  const header = Buffer.from(chunks.find(chunk => chunk.type === 'IHDR').data);
  const width = header.readUInt32BE(0);
  const channels = { 2: 3, 6: 4 }[header[9]];
  if (header[8] !== 8 || !channels || header[12] !== 0) throw new Error('unexpected png format');

  const pixels = inflateSync(Buffer.concat(chunks.filter(chunk => chunk.type === 'IDAT').map(chunk => chunk.data)));
  const rowBytes = 1 + width * channels;
  header.writeUInt32BE(height, 4);

  const chunk = (type, data) => {
    const out = Buffer.alloc(12 + data.length);
    out.writeUInt32BE(data.length, 0);
    out.write(type, 4, 'ascii');
    data.copy(out, 8);
    out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 8 + data.length);
    return out;
  };

  return Buffer.concat([
    buffer.subarray(0, 8),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(pixels.subarray(0, rowBytes * height), { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function startServer() {
  const server = createServer(async (request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.join(root, pathname);
    if (!file.startsWith(root)) {
      response.writeHead(403).end();
      return;
    }
    try {
      const body = await readFile(file);
      response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
      response.end(body);
    } catch (e) {
      response.writeHead(404).end();
    }
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

const browserPath = findBrowser();
if (!browserPath) {
  console.error('no edge or chrome found, set BROWSER_PATH to a chromium-based browser');
  process.exit(1);
}

await rm(genDir, { recursive: true, force: true });
await mkdir(genDir, { recursive: true });
await mkdir(outDir, { recursive: true });
await wrapPage('popup');
await wrapPage('options');
await writeFile(path.join(genDir, 'frame.html'), frameHtml);

const server = await startServer();
const { port } = server.address();
const profile = path.join(tmpdir(), `queryveil-shots-${Date.now()}`);

try {
  for (const shot of shots) {
    const target = path.join(outDir, shot.file);
    await run(browserPath, [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      `--user-data-dir=${profile}`,
      '--window-size=1280,893', // 800 visible plus the chrome headless reserves
      '--force-device-scale-factor=1',
      '--virtual-time-budget=4000',
      `--screenshot=${target}`,
      `http://127.0.0.1:${port}${shot.url}`
    ]);
    await writeFile(target, cropPngHeight(await readFile(target), 800));
    console.log('saved', path.relative(root, target));
  }
} finally {
  server.close();
  await rm(genDir, { recursive: true, force: true });
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}
