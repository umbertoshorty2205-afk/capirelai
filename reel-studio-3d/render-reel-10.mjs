/**
 * Capire l'AI — Reel 10 Renderer: "Gli Agenti AI che Usano il PC al Posto Tuo" (Jarvis Brief 19 Nov)
 * Usa i modelli 3D salvati, voce maschile naturale (it-IT-DiegoNeural, 0% atempo),
 * safe-zone Instagram Reels (9:16 + cover 3:4) e 2 worker Chromium paralleli.
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn, execSync } from 'node:child_process';
import {
  synthesizeNaturalMaleVoice,
  buildCustomSoundtrackAndMaster,
} from './audio/sound-engine.mjs';

const MODE = process.argv[2] || 'full'; // 'preview' | 'full'
const FRESH = process.argv.includes('--fresh');
const FPS = 24;
const ROOT = process.cwd();
const WORK_DIR = '/tmp/reel10_v1';
const CHROME_BIN =
  '/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell';

const OUT_MP4 = path.join(ROOT, 'public/instagram/reels/reel-10-agenti-ai-usano-pc.mp4');
const OUT_POSTER = path.join(ROOT, 'public/instagram/reels/reel-10-poster.jpg');

const SCRIPT_TEXT =
  'Smetti di cliccare: i nuovi agenti AI ora usano il computer al posto tuo. ' +
  'Non parliamo più di chat, ma di azioni reali: prenotano voli, compilano fogli Excel, gestiscono ordini online. ' +
  'L’AI non è più solo un assistente che scrive: è diventata il tuo impiegato digitale mentre bevi un caffè. ' +
  'Tre fasi: navigazione, analisi, esecuzione. Chi la comanda vince, chi la subisce resta indietro. ' +
  'Guida completa e cinque prompt gratis su capirelai punto com. Link in bio.';

fs.mkdirSync(WORK_DIR, { recursive: true });

const cachedMp3 = path.join(WORK_DIR, 'voice_raw.mp3');
const cachedJson = `${cachedMp3}.json`;
let rawMp3;
let words;

if (!FRESH && fs.existsSync(cachedMp3) && fs.existsSync(cachedJson) && fs.statSync(cachedMp3).size > 1000) {
  console.log('[1/4] Reusing cached Diego voice for Reel 10...');
  rawMp3 = cachedMp3;
  words = JSON.parse(fs.readFileSync(cachedJson, 'utf8'));
} else {
  console.log('[1/4] Synthesizing natural Italian male voice (it-IT-DiegoNeural) for Reel 10...');
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

const findSec = (needle, afterSec = 0) => {
  const low = needle.toLowerCase();
  for (const w of words) {
    const s = w.start / 1000;
    if (s < afterSec) continue;
    if (w.part.toLowerCase().includes(low)) return Number(s.toFixed(3));
  }
  return afterSec;
};

const lastEndSec = Number(((words[words.length - 1]?.end || 26000) / 1000).toFixed(3));
const duration = Number((lastEndSec + 0.85).toFixed(2));

const s2Start = findSec('non', 2.2);
const azioniWord = findSec('azioni', s2Start);
const voliWord = findSec('voli', azioniWord);
const excelWord = findSec('excel', voliWord);
const acquistaWord = findSec('ordini', excelWord);
const s3Start = findSec('assistente', acquistaWord) - 1.3;
const impiegatoWord = findSec('impiegato', s3Start);
const s4Start = findSec('tre', impiegatoWord) - 0.15;
const navWord = findSec('navigazione', s4Start);
const analisiWord = findSec('analisi', navWord);
const esecWord = findSec('esecuzione', analisiWord);
const comandaWord = findSec('comanda', esecWord);
const s5Start = findSec('guida', comandaWord) - 0.2;

const cues = {
  duration,
  lastEndSec,
  s2Start,
  azioniWord,
  voliWord,
  excelWord,
  acquistaWord,
  s3Start: Math.max(acquistaWord + 0.8, Number(s3Start.toFixed(3))),
  impiegatoWord,
  s4Start: Math.max(impiegatoWord + 1.1, Number(s4Start.toFixed(3))),
  navWord,
  analisiWord,
  esecWord,
  comandaWord,
  s5Start: Math.max(comandaWord + 1.2, Number(s5Start.toFixed(3))),
};
console.log('[2/4] Reel 10 Cues synced to Diego:', JSON.stringify(cues));

// Build sentence-aware kinetic subtitles
const tokens = [];
for (let i = 0; i < words.length; i++) {
  const cur = words[i];
  const part = cur.part.trim();
  const next = words[i + 1]?.part?.trim() || '';
  const next2 = words[i + 2]?.part?.trim() || '';
  if (part.toLowerCase() === 'capirelai' && next.toLowerCase() === 'punto' && next2.toLowerCase().startsWith('com')) {
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
  if (buf.length >= 3 || chars >= 17 || /[.,?!:]$/.test(tok.text)) {
    chunks.push({ start: buf[0].start, end: buf[buf.length - 1].end, words: buf });
    buf = [];
  }
}
if (buf.length) chunks.push({ start: buf[0].start, end: buf[buf.length - 1].end, words: buf });

const sfxEvents = [
  { type: 'boom', t: 0.05, amp: 0.48, dur: 0.78 },
  { type: 'whoosh', t: cues.s2Start - 0.35, panDir: 1 },
  { type: 'pop', t: cues.voliWord, baseHz: 360 },
  { type: 'pop', t: cues.excelWord, baseHz: 460 },
  { type: 'pop', t: cues.acquistaWord, baseHz: 560 },
  { type: 'whoosh', t: cues.s3Start - 0.15, panDir: -1 },
  { type: 'chime', t: cues.impiegatoWord, freqs: [523.25, 659.25, 783.99] },
  { type: 'whoosh', t: cues.s4Start - 0.18, panDir: 1 },
  { type: 'boom', t: cues.navWord, amp: 0.38, dur: 0.36, startHz: 155, endHz: 50 },
  { type: 'boom', t: cues.analisiWord, amp: 0.38, dur: 0.36, startHz: 175, endHz: 54 },
  { type: 'boom', t: cues.esecWord, amp: 0.42, dur: 0.42, startHz: 195, endHz: 58 },
  { type: 'whoosh', t: cues.s5Start - 0.18, panDir: 1 },
  { type: 'boom', t: cues.s5Start, amp: 0.44, dur: 0.65 },
  { type: 'chime', t: cues.s5Start + 0.06, freqs: [349.23, 523.25, 659.25, 1046.5], dur: 1.1 },
];

const cachedMaster = path.join(WORK_DIR, 'audio_master.m4a');
let audioMaster;
if (!FRESH && fs.existsSync(cachedMaster)) {
  console.log('[3/4] Reusing cached Reel 10 audio master...');
  audioMaster = cachedMaster;
} else {
  console.log('[3/4] Mastering Diego voice + dark-tech soundtrack + SFX...');
  audioMaster = buildCustomSoundtrackAndMaster({
    rawMp3,
    duration: cues.duration,
    lastEndSec: cues.lastEndSec,
    beatStartSec: cues.s2Start,
    sfxEvents,
    outDir: WORK_DIR,
  });
}

const PORT = 4212;
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
    res.end(fs.readFileSync(path.join(ROOT, 'reel-studio-3d/templates/agenti-3d-template.html')));
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
      ['r10_s1_cover.png', 1.25],
      ['r10_s2_cubes.png', cues.acquistaWord + 0.55],
      ['r10_s4_phases.png', cues.comandaWord + 0.35],
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
  await runChromeWorker({ cdpPort: 9251, previewDir });
} else {
  const TOTAL_FRAMES = Math.ceil(cues.duration * FPS);
  const MID = Math.floor(TOTAL_FRAMES / 2);
  const partA = `${WORK_DIR}/part_a.mp4`;
  const partB = `${WORK_DIR}/part_b.mp4`;
  console.log(`[4/4] Rendering Reel 10: ${TOTAL_FRAMES} frames (${cues.duration}s @ ${FPS}fps) across 2 parallel workers...`);

  await Promise.all([
    runChromeWorker({ cdpPort: 9251, startFrame: 0, endFrame: MID, outPartMp4: partA }),
    runChromeWorker({ cdpPort: 9252, startFrame: MID, endFrame: TOTAL_FRAMES, outPartMp4: partB }),
  ]);

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
  console.log('DONE REEL 10! Output:', OUT_MP4, 'Poster:', OUT_POSTER);
}

server.close();
