/**
 * Capire l'AI — Reel 13 Renderer (Jarvis Brief 25 Nov: "Smetti di usare ChatGPT come Google — Metodo R.O.F.")
 * - Estetica Warm Studio Macro (scrivania in noce, tastiera meccanica con keycap testurizzati, ottica 32° f/1.8)
 * - Piano sequenza continuo ZERO tagli lungo tutta la scrivania
 * - Voce ElevenLabs Alessandro (pvc v4) + sottotitoli word-by-word sincronizzati sulle pause reali + SFX tattili (-14 LUFS)
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn, execSync } from 'node:child_process';
import { buildCustomSoundtrackAndMaster } from './audio/sound-engine.mjs';

const MODE = process.argv[2] || 'full'; // 'preview' | 'full'
const FRESH = process.argv.includes('--fresh');
const FPS = 24;
const ROOT = process.cwd();
const WORK_DIR = '/tmp/reel13_elevenlabs';
const CHROME_BIN =
  '/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell';

const ELEVENLABS_VOICE_MP3 = path.join(
  ROOT,
  'public/assets/aistudio/ElevenLabs_2026-11-26T10_30_17_Alessandro_-_Stoic__Breathy___Steady_pvc_s50_sim75_v4_eaa1aef5.mp3'
);
const OUT_MP4 = path.join(ROOT, 'public/instagram/reels/reel-13-ferrari-chatgpt-rof-jarvis.mp4');
const OUT_POSTER = path.join(ROOT, 'public/instagram/reels/reel-13-poster.jpg');

if (!fs.existsSync(ELEVENLABS_VOICE_MP3)) {
  throw new Error(`Missing ElevenLabs voice file: ${ELEVENLABS_VOICE_MP3}`);
}

fs.mkdirSync(WORK_DIR, { recursive: true });

// Exact clause boundaries extracted from ElevenLabs Alessandro MP3 via ffmpeg silencedetect (-28dB / -34dB)
const CLAUSE_TIMINGS = [
  { start: 0.09, end: 1.15, cls: 'active', tokens: ['Se', 'scrivi', 'ancora'] },
  { start: 1.35, end: 3.40, cls: 'active', tokens: ['"scrivimi', 'una', 'mail"', 'su', 'ChatGPT,'] },
  { start: 3.56, end: 5.46, cls: 'active', tokens: ['guidi', 'una', 'Ferrari', 'in', 'prima', 'marcia!'] },
  { start: 5.82, end: 7.90, cls: 'active', tokens: ['Ti', 'sblocco', 'il', 'metodo', 'in', '30', 'secondi.'] },
  { start: 8.23, end: 10.49, cls: 'active-red', tokens: ['Il', '90%', 'chiede', 'risposte', 'generiche'] },
  { start: 10.74, end: 12.14, cls: 'active-red', tokens: ['e', 'ottiene', 'testi', 'da', 'robot.'] },
  { start: 12.45, end: 14.62, cls: 'active-red', tokens: ['Non', 'serve', 'pagare', '22€', 'al', 'mese,'] },
  { start: 14.91, end: 16.10, cls: 'active-red', tokens: ['basta', 'cambiare', 'tre', 'righe.'] },
  {
    start: 16.44,
    end: 18.57,
    cls: 'active',
    explicitWords: [
      { t: 'Usa', s: 16.44, e: 16.68 },
      { t: 'la', s: 16.68, e: 16.80 },
      { t: 'regola', s: 16.80, e: 17.16 },
      { t: 'R', s: 17.36, e: 17.73 },
      { t: '·', s: 17.73, e: 17.87 },
      { t: 'O', s: 17.87, e: 18.01 },
      { t: '·', s: 18.01, e: 18.21 },
      { t: 'F.', s: 18.21, e: 18.57 },
    ],
  },
  {
    start: 18.91,
    end: 20.54,
    cls: 'active',
    explicitWords: [
      { t: '1.', s: 18.91, e: 19.18 },
      { t: 'Ruolo:', s: 19.37, e: 19.75 },
      { t: 'digli', s: 19.98, e: 20.24 },
      { t: 'chi', s: 20.24, e: 20.40 },
      { t: 'è.', s: 20.40, e: 20.54 },
    ],
  },
  {
    start: 20.88,
    end: 22.87,
    cls: 'active',
    explicitWords: [
      { t: 'Sei', s: 20.88, e: 21.14 },
      { t: 'un', s: 21.14, e: 21.28 },
      { t: 'consulente', s: 21.28, e: 21.99 },
      { t: 'diretto', s: 22.12, e: 22.46 },
      { t: 'e', s: 22.46, e: 22.55 },
      { t: 'pratico.', s: 22.55, e: 22.87 },
    ],
  },
  {
    start: 23.18,
    end: 24.25,
    cls: 'active',
    explicitWords: [
      { t: '2.', s: 23.18, e: 23.46 },
      { t: 'Obiettivo:', s: 23.68, e: 24.25 },
    ],
  },
  { start: 24.48, end: 26.29, cls: 'active', tokens: ['rispondi', 'a', 'un', 'cliente', 'che', 'chiede', 'sconto,'] },
  { start: 26.45, end: 27.20, cls: 'active', tokens: ['tenendo', 'il', 'prezzo.'] },
  {
    start: 27.56,
    end: 28.52,
    cls: 'active',
    explicitWords: [
      { t: '3.', s: 27.56, e: 27.74 },
      { t: 'Formato:', s: 27.98, e: 28.52 },
    ],
  },
  { start: 28.73, end: 29.97, cls: 'active', tokens: ['massimo', 'quattro', 'righe,'] },
  {
    start: 30.07,
    end: 31.93,
    cls: 'active',
    explicitWords: [
      { t: 'zero', s: 30.07, e: 30.33 },
      { t: 'frasi', s: 30.33, e: 30.62 },
      { t: 'fatte,', s: 30.62, e: 30.91 },
      { t: 'tono', s: 31.14, e: 31.50 },
      { t: 'fermo.', s: 31.50, e: 31.93 },
    ],
  },
  { start: 32.20, end: 33.37, cls: 'active-green', tokens: ['Guarda', 'la', 'differenza:'] },
  { start: 33.58, end: 35.42, cls: 'active-green', tokens: ['risposta', 'pronta', 'da', 'copiare', 'subito!'] },
  { start: 35.69, end: 37.15, cls: 'active-green', tokens: ['I', '10', 'modelli', 'R', '·', 'O', '·', 'F'] },
  { start: 37.21, end: 39.27, cls: 'active-green', tokens: ['sono', 'gratis', 'su', 'capirelai.com.'] },
  {
    start: 39.50,
    end: 41.16,
    cls: 'active-green',
    explicitWords: [
      { t: 'Commenta', s: 39.50, e: 40.02 },
      { t: '"guida",', s: 40.02, e: 40.37 },
      { t: 'o', s: 40.55, e: 40.66 },
      { t: 'link', s: 40.66, e: 40.86 },
      { t: 'in', s: 40.86, e: 40.98 },
      { t: 'bio.', s: 40.98, e: 41.16 },
    ],
  },
];

function distributeWords(start, end, tokens) {
  const weights = tokens.map((tok) => {
    const clean = tok.replace(/[^a-zA-Z0-9àèéìòù€%]/g, '');
    return Math.max(1.5, clean.length + 1.2);
  });
  const sumW = weights.reduce((a, b) => a + b, 0);
  const span = end - start;
  let cur = start;
  return tokens.map((t, idx) => {
    const dur = (weights[idx] / sumW) * span;
    const s = Number(cur.toFixed(3));
    const e = Number((idx === tokens.length - 1 ? end : cur + dur).toFixed(3));
    cur += dur;
    return { t, s, e };
  });
}

const phrases = CLAUSE_TIMINGS.map((c) => ({
  start: c.start,
  end: c.end,
  cls: c.cls,
  words: c.explicitWords || distributeWords(c.start, c.end, c.tokens),
}));

const lastEndSec = 41.18;
const duration = 42.10;

const cues = {
  duration,
  lastEndSec,
  ferrariWord: 4.05,
  b2Start: 7.98,
  novantaWord: 8.40,
  ventidueWord: 13.25,
  b3Start: 16.25,
  ruoloWord: 19.37,
  obiettivoWord: 23.68,
  formatoWord: 27.98,
  b4Start: 32.05,
  b5Start: 35.52,
  urlWord: 38.05,
  phrases,
};

console.log('[1/4] Using ElevenLabs Alessandro voice:', path.basename(ELEVENLABS_VOICE_MP3));
console.log('[2/4] Reel 13 Cues synced:', JSON.stringify({ ...cues, phrases: `${phrases.length} phrases` }));

// Rich tactile SFX timeline synced to Alessandro's ElevenLabs delivery
const sfxEvents = [
  { type: 'boom', t: 0.03, amp: 0.36, dur: 0.60, startHz: 120, endHz: 38 },
  ...Array.from({ length: 12 }, (_, idx) => ({
    type: 'click',
    t: 0.22 + idx * 0.22,
    pitch: 0.92 + (idx % 4) * 0.06,
    amp: 0.14,
  })),
  { type: 'boom', t: cues.ferrariWord, amp: 0.44, dur: 0.56, startHz: 135, endHz: 38 },
  { type: 'whoosh', t: cues.b2Start - 0.18, dur: 0.50, panDir: 1, amp: 0.24 },
  { type: 'boom', t: cues.novantaWord, amp: 0.40, dur: 0.48, startHz: 125, endHz: 36 },
  { type: 'boom', t: cues.ventidueWord, amp: 0.40, dur: 0.48, startHz: 118, endHz: 34 },
  { type: 'whoosh', t: cues.b3Start - 0.18, dur: 0.50, panDir: -1, amp: 0.24 },
  { type: 'boom', t: cues.ruoloWord, amp: 0.34, dur: 0.34, startHz: 155, endHz: 50 },
  { type: 'chime', t: cues.ruoloWord, freqs: [523.25, 783.99], amp: 0.14, dur: 0.34 },
  { type: 'boom', t: cues.obiettivoWord, amp: 0.34, dur: 0.34, startHz: 175, endHz: 54 },
  { type: 'chime', t: cues.obiettivoWord, freqs: [587.33, 880.0], amp: 0.14, dur: 0.34 },
  { type: 'boom', t: cues.formatoWord, amp: 0.38, dur: 0.40, startHz: 195, endHz: 58 },
  { type: 'chime', t: cues.formatoWord, freqs: [659.25, 1046.5], amp: 0.16, dur: 0.42 },
  { type: 'whoosh', t: cues.b4Start - 0.16, dur: 0.46, panDir: 1, amp: 0.22 },
  { type: 'chime', t: cues.b4Start + 0.08, freqs: [440, 554.37, 659.25], amp: 0.16, dur: 0.62 },
  { type: 'whoosh', t: cues.b5Start - 0.18, dur: 0.52, panDir: -1, amp: 0.24 },
  { type: 'boom', t: cues.urlWord, amp: 0.40, dur: 0.68, startHz: 125, endHz: 36 },
  { type: 'chime', t: cues.urlWord + 0.04, freqs: [349.23, 523.25, 659.25, 1046.5], amp: 0.18, dur: 1.1 },
];

const cachedMaster = path.join(WORK_DIR, 'audio_master.m4a');
let audioMaster;
if (!FRESH && MODE === 'full' && fs.existsSync(cachedMaster)) {
  console.log('[3/4] Reusing cached ElevenLabs audio master...');
  audioMaster = cachedMaster;
} else {
  console.log('[3/4] Mastering ElevenLabs Alessandro + warm studio soundtrack + tactile SFX (-14 LUFS)...');
  audioMaster = buildCustomSoundtrackAndMaster({
    rawMp3: ELEVENLABS_VOICE_MP3,
    duration: cues.duration,
    lastEndSec: cues.lastEndSec,
    beatStartSec: cues.b2Start,
    sfxEvents,
    outDir: WORK_DIR,
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ttf': 'font/ttf',
};
const CUES_JSON = JSON.stringify(cues);

const server = http.createServer((req, res) => {
  const urlPath = (req.url || '/').split('?')[0];
  if (urlPath === '/' || urlPath === '/scene.html') {
    res.writeHead(200, { 'Content-Type': MIME['.html'] });
    res.end(fs.readFileSync(path.join(ROOT, 'reel-studio-3d/templates/ferrari-rof-macro-template.html')));
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
      ['r13_01_hook.png', cues.ferrariWord + 0.25],
      ['r13_02_problem.png', cues.ventidueWord + 0.35],
      ['r13_03_rof_r.png', cues.ruoloWord + 0.55],
      ['r13_04_rof_all.png', cues.formatoWord + 0.85],
      ['r13_05_email.png', cues.b4Start + 1.2],
      ['r13_06_outro.png', cues.urlWord + 0.45],
    ];
    for (const [name, t] of samples) {
      await cdp('Runtime.evaluate', { expression: `window.setReelTime(${t.toFixed(3)})` });
      await cdp('Runtime.evaluate', {
        expression: 'new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))',
        awaitPromise: true,
      });
      const shot = await cdp('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(previewDir, name), Buffer.from(shot.data, 'base64'));
      console.log('Control snapshot saved:', name);
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
        '-preset', 'veryfast',
        '-crf', '20',
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
      const shot = await cdp('Page.captureScreenshot', { format: 'jpeg', quality: 86, optimizeForSpeed: true });
      const buf = Buffer.from(shot.data, 'base64');
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      const done = f - startFrame + 1;
      if (done % 50 === 0 || done === total) {
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
  await runChromeWorker({ cdpPort: 9271, previewDir });
} else {
  const TOTAL_FRAMES = Math.ceil(cues.duration * FPS);
  const MID = Math.floor(TOTAL_FRAMES / 2);
  const partA = `${WORK_DIR}/part_a.mp4`;
  const partB = `${WORK_DIR}/part_b.mp4`;
  console.log(`[4/4] Rendering Reel 13 (ElevenLabs): ${TOTAL_FRAMES} frames (${cues.duration}s @ ${FPS}fps) across 2 parallel workers...`);

  await Promise.all([
    runChromeWorker({ cdpPort: 9271, startFrame: 0, endFrame: MID, outPartMp4: partA }),
    runChromeWorker({ cdpPort: 9272, startFrame: MID, endFrame: TOTAL_FRAMES, outPartMp4: partB }),
  ]);

  const concatList = `${WORK_DIR}/concat.txt`;
  fs.writeFileSync(concatList, `file '${partA}'\nfile '${partB}'\n`);

  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatList}" -i "${audioMaster}" ` +
      `-map 0:v:0 -map 1:a:0 -c:v copy -c:a copy -shortest -movflags +faststart "${OUT_MP4}" -loglevel error`,
    { stdio: 'inherit' }
  );
  execSync(
    `ffmpeg -y -ss ${(cues.ferrariWord + 0.25).toFixed(2)} -i "${OUT_MP4}" -frames:v 1 -q:v 2 "${OUT_POSTER}" -loglevel error`,
    { stdio: 'inherit' }
  );
  console.log('DONE REEL 13 (ELEVENLABS)! Output:', OUT_MP4, 'Poster:', OUT_POSTER);
}

server.closeAllConnections?.();
server.close();
process.exit(0);
