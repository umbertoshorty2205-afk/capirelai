/**
 * Capire l'AI — Parallel 2-Worker 3D Cinema Renderer (@capirelai)
 * Usa i modelli 3D salvati in /reel-studio-3d/models/capirelai-3d-models.js,
 * voce maschile italiana naturale (it-IT-DiegoNeural, 0% atempo),
 * e safe-zone Instagram Reels (9:16 + copertina 3:4).
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn, execSync } from 'node:child_process';
import {
  synthesizeNaturalMaleVoice,
  buildCueSheetFromWords,
  buildSoundtrackAndMaster,
} from './audio/sound-engine.mjs';

const MODE = process.argv[2] || 'full'; // 'preview' | 'full'
const FPS = 24;
const ROOT = process.cwd();
const WORK_DIR = '/tmp/reel09_v2';
const CHROME_BIN =
  '/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell';

const OUT_MP4 = path.join(ROOT, 'public/instagram/reels/reel-09-spot-3d-chatgpt-rof.mp4');
const OUT_POSTER = path.join(ROOT, 'public/instagram/reels/reel-09-poster.jpg');

const SCRIPT_TEXT =
  'Lo spot che ChatGPT non avrà mai il coraggio di fare. ' +
  'Scrivi una parola in inglese: apple. Un solo token. ' +
  'La scrivi in italiano: fragola. Tre token. Paghi il triplo. ' +
  'E non finisce qui. Se fai una domanda secca come su Google, ti sputa fuori frasi da robot. ' +
  'La svolta? Tre lettere. R, O, F. Ruolo, Obiettivo, Formato. ' +
  'Meno token bruciati, risultati dieci volte più umani. ' +
  'Il kit completo è gratis su capirelai punto com. Link in bio.';

fs.mkdirSync(WORK_DIR, { recursive: true });

// 1. Synthesize (or reuse cached) Natural Male Italian Voice (it-IT-DiegoNeural, ZERO atempo distortion!)
const FRESH = process.argv.includes('--fresh');
const cachedMp3 = path.join(WORK_DIR, 'voice_raw.mp3');
const cachedJson = `${cachedMp3}.json`;
let rawMp3;
let words;

if (!FRESH && fs.existsSync(cachedMp3) && fs.existsSync(cachedJson)) {
  console.log('[1/4] Reusing cached natural Italian male voice (it-IT-DiegoNeural)...');
  rawMp3 = cachedMp3;
  words = JSON.parse(fs.readFileSync(cachedJson, 'utf8'));
} else {
  console.log('[1/4] Synthesizing natural Italian male voice (it-IT-DiegoNeural)...');
  const synth = await synthesizeNaturalMaleVoice({
    text: SCRIPT_TEXT,
    outDir: WORK_DIR,
    voice: 'it-IT-DiegoNeural',
    rate: '+7%',
    pitch: '-3Hz',
  });
  rawMp3 = synth.rawMp3;
  words = synth.words;
}

const cues = buildCueSheetFromWords(words);
console.log('[2/4] Cues synced to natural voice:', JSON.stringify(cues));

// Build clean sentence-aware word-synced subtitle chunks
const tokens = [];
for (let i = 0; i < words.length; i++) {
  const cur = words[i];
  const part = cur.part.trim();
  const next = words[i + 1]?.part?.trim() || '';
  const next2 = words[i + 2]?.part?.trim() || '';
  if (
    part.toLowerCase() === 'capirelai' &&
    next.toLowerCase() === 'punto' &&
    next2.toLowerCase().startsWith('com')
  ) {
    tokens.push({ text: 'capirelai.com', start: cur.start, end: words[i + 2].end });
    i += 2;
    continue;
  }
  tokens.push({ text: part, start: cur.start, end: cur.end });
}
const chunks = [];
let buf = [];
for (const tok of tokens) {
  buf.push(tok);
  const chars = buf.map((w) => w.text).join(' ').length;
  const endsSentence = /[.,?!:]$/.test(tok.text);
  if (buf.length >= 3 || chars >= 17 || endsSentence) {
    chunks.push({ start: buf[0].start, end: buf[buf.length - 1].end, words: buf });
    buf = [];
  }
}
if (buf.length) chunks.push({ start: buf[0].start, end: buf[buf.length - 1].end, words: buf });

// 2. Mix Voice + Minimal Dark-Tech Bed + Synced Cinema SFX (or reuse cached master)
const cachedMaster = path.join(WORK_DIR, 'audio_master.m4a');
let audioMaster;
if (!FRESH && fs.existsSync(cachedMaster)) {
  console.log('[3/4] Reusing cached mastered natural male voice + soundtrack + SFX...');
  audioMaster = cachedMaster;
} else {
  console.log('[3/4] Mastering warm male voice + soundtrack + synced SFX...');
  audioMaster = buildSoundtrackAndMaster({ rawMp3, cues, outDir: WORK_DIR });
}

// 3. Static Asset Server for 3D Models, Template, Three.js, Fonts, Subtitles & Cues
const PORT = 4211;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ttf': 'font/ttf',
};
const SUBS_JSON = JSON.stringify(chunks);
const CUES_JSON = JSON.stringify(cues);

const server = http.createServer((req, res) => {
  const urlPath = (req.url || '/').split('?')[0];
  if (urlPath === '/' || urlPath === '/scene.html') {
    res.writeHead(200, { 'Content-Type': MIME['.html'] });
    res.end(fs.readFileSync(path.join(ROOT, 'reel-studio-3d/templates/spot-3d-template.html')));
    return;
  }
  if (urlPath === '/subtitles.json') {
    res.writeHead(200, { 'Content-Type': MIME['.json'] });
    res.end(SUBS_JSON);
    return;
  }
  if (urlPath === '/cues.json') {
    res.writeHead(200, { 'Content-Type': MIME['.json'] });
    res.end(CUES_JSON);
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
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

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
      if (p) {
        wsUrl = p.webSocketDebuggerUrl;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 150));
  }
  if (!wsUrl) throw new Error(`Chrome CDP failed on port ${cdpPort}`);

  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => {
    ws.addEventListener('open', res);
    ws.addEventListener('error', rej);
  });

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
    width: 1080,
    height: 1920,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await cdp('Page.navigate', { url: `http://127.0.0.1:${PORT}/scene.html` });

  let ready = false;
  for (let i = 0; i < 60; i++) {
    const r = await cdp('Runtime.evaluate', {
      expression: 'Boolean(window.__REEL_READY__)',
      returnByValue: true,
    });
    if (r.result?.value === true) {
      ready = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  if (!ready) throw new Error('Scene not ready');
  await cdp('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true });

  if (previewDir) {
    const samples = [
      ['ig_s1_cover.png', 1.25],
      ['ig_s2b_fragola.png', cues.triploWord + 0.35],
      ['ig_s4_rof.png', cues.risultatiWord + 0.4],
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
        '-y',
        '-f', 'image2pipe',
        '-vcodec', 'mjpeg',
        '-framerate', String(FPS),
        '-i', '-',
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '22',
        '-pix_fmt', 'yuv420p',
        outPartMp4,
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
        console.log(
          `[Worker ${cdpPort}] ${done}/${total} (${Math.round((done / total) * 100)}%) in ${((Date.now() - t0) / 1000).toFixed(1)}s`
        );
      }
    }
    ff.stdin.end();
    await new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ff ' + c)))));
  }

  ws.close();
  chrome.kill();
}

if (MODE === 'preview') {
  const previewDir = path.join(ROOT, '.aistudio/artifacts/brain/56d61b0a-9543-482b-b670-7ced04631e08');
  await runChromeWorker({ cdpPort: 9241, previewDir });
} else {
  const TOTAL_FRAMES = Math.ceil(cues.duration * FPS);
  const MID = Math.floor(TOTAL_FRAMES / 2);
  const partA = `${WORK_DIR}/part_a.mp4`;
  const partB = `${WORK_DIR}/part_b.mp4`;
  console.log(`[4/4] Rendering ${TOTAL_FRAMES} frames (${cues.duration}s @ ${FPS}fps) across 2 parallel 3D workers...`);

  await Promise.all([
    runChromeWorker({ cdpPort: 9241, startFrame: 0, endFrame: MID, outPartMp4: partA }),
    runChromeWorker({ cdpPort: 9242, startFrame: MID, endFrame: TOTAL_FRAMES, outPartMp4: partB }),
  ]);

  // Assemble seamlessly with mastered natural male audio + extract crisp 3:4-safe IG cover poster!
  const concatList = `${WORK_DIR}/concat.txt`;
  fs.writeFileSync(concatList, `file '${partA}'\nfile '${partB}'\n`);

  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatList}" -i "${audioMaster}" ` +
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
