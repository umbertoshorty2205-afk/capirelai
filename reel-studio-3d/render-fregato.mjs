/**
 * Capire l'AI — Parallel 2-Worker 3D Cinema Renderer per Reel 10 ("Fregato da ChatGPT")
 * Riutilizza integralmente la traccia vocale naturale + SFX originali di public/assets/aistudio/out_e8cfe8a9.mp4
 * e ricostruisce la scena 3D pulita con i modelli PBR di /reel-studio-3d/models/capirelai-3d-models.js.
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn, execSync } from 'node:child_process';

const MODE = process.argv[2] || 'full'; // 'preview' | 'full'
const FPS = 24;
const DURATION = 30.467;
const ROOT = process.cwd();
const WORK_DIR = '/tmp/reel10';
const CHROME_BIN =
  '/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell';

const SRC_VIDEO = path.join(ROOT, 'public/assets/aistudio/out_e8cfe8a9.mp4');
const AUDIO_M4A = path.join(WORK_DIR, 'orig_audio.m4a');
const OUT_MP4 = path.join(ROOT, 'public/instagram/reels/reel-12-fregato-desk-3d.mp4');
const OUT_POSTER = path.join(ROOT, 'public/instagram/reels/reel-12-poster.jpg');

fs.mkdirSync(WORK_DIR, { recursive: true });
if (!fs.existsSync(AUDIO_M4A)) {
  console.log('[1/3] Extracting crisp original natural voice + SFX audio track...');
  execSync(`ffmpeg -y -i "${SRC_VIDEO}" -vn -c:a copy "${AUDIO_M4A}" -loglevel error`, { stdio: 'inherit' });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ttf': 'font/ttf',
};

const server = http.createServer((req, res) => {
  const urlPath = (req.url || '/').split('?')[0];
  if (urlPath === '/' || urlPath === '/scene.html') {
    res.writeHead(200, { 'Content-Type': MIME['.html'] });
    res.end(fs.readFileSync(path.join(ROOT, 'reel-studio-3d/templates/fregato-3d-template.html')));
    return;
  }
  if (urlPath.startsWith('/models/')) {
    const file = path.join(ROOT, 'reel-studio-3d/models', path.basename(urlPath));
    if (fs.existsSync(file)) {
      res.writeHead(200, { 'Content-Type': MIME['.js'] });
      res.end(fs.readFileSync(file));
      return;
    }
  }
  if (urlPath.startsWith('/three/')) {
    const file = path.join(ROOT, 'node_modules/three', urlPath.slice('/three/'.length));
    if (fs.existsSync(file)) {
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(fs.readFileSync(file));
      return;
    }
  }
  if (urlPath.startsWith('/fonts/')) {
    const name = path.basename(urlPath);
    for (const dir of [
      '/usr/share/fonts/truetype/jetbrains-mono',
      '/usr/share/fonts/truetype/liberation',
      '/usr/share/fonts/truetype/dejavu',
    ]) {
      const c = path.join(dir, name);
      if (fs.existsSync(c)) {
        res.writeHead(200, { 'Content-Type': MIME['.ttf'] });
        res.end(fs.readFileSync(c));
        return;
      }
    }
  }
  res.writeHead(404);
  res.end('Not found');
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;

async function runChromeWorker({ cdpPort, startFrame, endFrame, outPartMp4, previewDir }) {
  const chrome = spawn(
    CHROME_BIN,
    [
      `--remote-debugging-port=${cdpPort}`,
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu-sandbox',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--window-size=1080,1920',
      '--hide-scrollbars',
      '--mute-audio',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  let wsUrl = '';
  for (let i = 0; i < 45; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
      const p = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (p) { wsUrl = p.webSocketDebuggerUrl; break; }
    } catch {}
    await new Promise((r) => setTimeout(r, 150));
  }
  if (!wsUrl) throw new Error(`Chrome CDP failed on port ${cdpPort}`);

  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });

  let mid = 1;
  const pend = new Map();
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data.toString());
    if (m.method === 'Runtime.exceptionThrown') {
      console.error('PAGE ERR:', JSON.stringify(m.params.exceptionDetails));
    }
    if (m.id && pend.has(m.id)) {
      const { res, rej } = pend.get(m.id);
      pend.delete(m.id);
      m.error ? rej(new Error(m.error.message)) : res(m.result);
    }
  });
  const cdp = (method, params = {}) =>
    new Promise((res, rej) => {
      const id = mid++;
      pend.set(id, { res, rej });
      ws.send(JSON.stringify({ id, method, params }));
    });

  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await cdp('Emulation.setDeviceMetricsOverride', {
    width: 1080, height: 1920, deviceScaleFactor: 1, mobile: false,
  });
  await cdp('Page.navigate', { url: `http://127.0.0.1:${PORT}/scene.html` });

  let ready = false;
  for (let i = 0; i < 60; i++) {
    const r = await cdp('Runtime.evaluate', { expression: 'Boolean(window.__REEL_READY__)', returnByValue: true });
    if (r.result?.value === true) { ready = true; break; }
    await new Promise((r) => setTimeout(r, 150));
  }
  if (!ready) throw new Error('Scene not ready');
  await cdp('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true });

  if (previewDir) {
    const samples = [
      ['r10_a1_desk.png', 1.25],
      ['r10_a2_price.png', 9.65],
      ['r10_a4_rof.png', 23.15],
    ];
    for (const [name, t] of samples) {
      await cdp('Runtime.evaluate', { expression: `window.setReelTime(${t.toFixed(3)})` });
      await cdp('Runtime.evaluate', {
        expression: 'new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))',
        awaitPromise: true,
      });
      const shot = await cdp('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(previewDir, name), Buffer.from(shot.data, 'base64'));
      console.log('Preview saved:', name);
    }
  } else {
    const ff = spawn(
      'ffmpeg',
      [
        '-y', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-framerate', String(FPS), '-i', '-',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '22', '-pix_fmt', 'yuv420p', outPartMp4,
      ],
      { stdio: ['pipe', 'ignore', 'ignore'] }
    );
    const total = endFrame - startFrame;
    const t0 = Date.now();
    for (let f = startFrame; f < endFrame; f++) {
      const t = f / FPS;
      await cdp('Runtime.evaluate', { expression: `window.setReelTime(${t.toFixed(4)})` });
      const shot = await cdp('Page.captureScreenshot', { format: 'jpeg', quality: 88 });
      const buf = Buffer.from(shot.data, 'base64');
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      const done = f - startFrame + 1;
      if (done % 90 === 0 || done === total) {
        console.log(`[Worker ${cdpPort}] ${done}/${total} (${Math.round((done / total) * 100)}%) in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
      }
    }
    ff.stdin.end();
    await new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ff ' + c)))));
  }

  ws.close();
  chrome.kill();
}

const TOTAL_FRAMES = Math.ceil(DURATION * FPS);
const WORKERS = 4;
const chunk = Math.ceil(TOTAL_FRAMES / WORKERS);
const partJobs = [];
const parts = [];
for (let w = 0; w < WORKERS; w++) {
  const startFrame = w * chunk;
  const endFrame = Math.min(TOTAL_FRAMES, (w + 1) * chunk);
  if (startFrame >= endFrame) break;
  const outPartMp4 = `${WORK_DIR}/part_${w}.mp4`;
  parts.push(outPartMp4);
  partJobs.push({ cdpPort: 9251 + w, startFrame, endFrame, outPartMp4, idx: w });
}

if (MODE === 'preview') {
  const previewDir = path.join(ROOT, '.aistudio/artifacts/brain/56d61b0a-9543-482b-b670-7ced04631e08');
  await runChromeWorker({ cdpPort: 9251, previewDir });
} else if (MODE === 'batch1') {
  const todo = partJobs.slice(0, 2);
  console.log(`[Batch 1/2] Rendering parts 0..1 across ${todo.length} parallel 3D workers...`);
  await Promise.all(todo.map((j) => runChromeWorker(j)));
} else if (MODE === 'batch2') {
  const todo = partJobs.slice(2, 4);
  console.log(`[Batch 2/2] Rendering parts 2..3 across ${todo.length} parallel 3D workers...`);
  await Promise.all(todo.map((j) => runChromeWorker(j)));
  const concatList = `${WORK_DIR}/concat.txt`;
  fs.writeFileSync(concatList, parts.map((p) => `file '${p}'`).join('\n') + '\n');
  console.log('[3/3] Muxing 3D cinema stream with original natural audio...');
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatList}" -i "${AUDIO_M4A}" ` +
      `-map 0:v:0 -map 1:a:0 -c:v copy -c:a copy -shortest -movflags +faststart "${OUT_MP4}" -loglevel error`,
    { stdio: 'inherit' }
  );
  execSync(
    `ffmpeg -y -ss 1.25 -i "${OUT_MP4}" -frames:v 1 -q:v 2 "${OUT_POSTER}" -loglevel error`,
    { stdio: 'inherit' }
  );
  console.log('DONE! Output:', OUT_MP4, 'Poster:', OUT_POSTER);
} else if (MODE === 'mux') {
  const concatList = `${WORK_DIR}/concat.txt`;
  fs.writeFileSync(concatList, parts.map((p) => `file '${p}'`).join('\n') + '\n');
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatList}" -i "${AUDIO_M4A}" ` +
      `-map 0:v:0 -map 1:a:0 -c:v copy -c:a copy -shortest -movflags +faststart "${OUT_MP4}" -loglevel error`,
    { stdio: 'inherit' }
  );
  execSync(
    `ffmpeg -y -ss 1.25 -i "${OUT_MP4}" -frames:v 1 -q:v 2 "${OUT_POSTER}" -loglevel error`,
    { stdio: 'inherit' }
  );
  console.log('DONE! Output:', OUT_MP4, 'Poster:', OUT_POSTER);
} else {
  console.log(`[2/3] Rendering ${TOTAL_FRAMES} frames (${DURATION}s @ ${FPS}fps) in 2 waves of 2 workers...`);
  await Promise.all(partJobs.slice(0, 2).map((j) => runChromeWorker(j)));
  await Promise.all(partJobs.slice(2, 4).map((j) => runChromeWorker(j)));

  const concatList = `${WORK_DIR}/concat.txt`;
  fs.writeFileSync(concatList, parts.map((p) => `file '${p}'`).join('\n') + '\n');
  console.log('[3/3] Muxing 3D cinema stream with original natural audio...');
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatList}" -i "${AUDIO_M4A}" ` +
      `-map 0:v:0 -map 1:a:0 -c:v copy -c:a copy -shortest -movflags +faststart "${OUT_MP4}" -loglevel error`,
    { stdio: 'inherit' }
  );
  execSync(
    `ffmpeg -y -ss 1.25 -i "${OUT_MP4}" -frames:v 1 -q:v 2 "${OUT_POSTER}" -loglevel error`,
    { stdio: 'inherit' }
  );
  console.log('DONE! Output:', OUT_MP4, 'Poster:', OUT_POSTER);
}

server.close();
