/**
 * Capire l'AI — Reel 14 Renderer ("Voice Cloning AI in 60s" — Deep Space & Neural Network Edition)
 * - Estetica Spaziale & Rete Neurale identica all'hero Axon WebGL di capirelai.com
 * - Piano sequenza cosmico continuo (ZERO tagli) tra 5 stazioni 3D collegate da sinapsi animate
 * - Voce ElevenLabs Alessandro + sottotitoli word-by-word sincronizzati sulle pause reali + SFX spaziali (-14 LUFS)
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
const WORK_DIR = '/tmp/reel14_neural_voice';
const CHROME_BIN =
  '/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell';

const ELEVENLABS_VOICE_MP3 = path.join(
  ROOT,
  'public/assets/aistudio/ElevenLabs_2026-11-27T16_24_35_Alessandro_-_Stoic__Breathy___Steady_pvc_s50_sim75_v4_25f56e6f.mp3'
);
const OUT_MP4 = path.join(ROOT, 'public/instagram/reels/reel-14-voice-cloning-neural-space.mp4');
const OUT_POSTER = path.join(ROOT, 'public/instagram/reels/reel-14-poster.jpg');

if (!fs.existsSync(ELEVENLABS_VOICE_MP3)) {
  throw new Error(`Missing ElevenLabs voice file: ${ELEVENLABS_VOICE_MP3}`);
}

fs.mkdirSync(WORK_DIR, { recursive: true });

// Exact clause boundaries extracted from ElevenLabs Alessandro MP3 via ffmpeg silencedetect
const CLAUSE_TIMINGS = [
  { start: 0.09, end: 1.55, cls: 'active', tokens: ['Questa', 'voce', 'che', 'stai', 'sentendo'] },
  {
    start: 1.88,
    end: 3.86,
    cls: 'active-red',
    explicitWords: [
      { t: 'non', s: 1.88, e: 2.08 },
      { t: "l'ho", s: 2.08, e: 2.26 },
      { t: 'registrata', s: 2.26, e: 2.94 },
      { t: 'oggi', s: 2.94, e: 3.22 },
      { t: 'al', s: 3.22, e: 3.36 },
      { t: 'microfono.', s: 3.36, e: 3.86 },
    ],
  },
  { start: 4.15, end: 7.07, cls: 'active', tokens: ["L'ho", 'clonata', 'con', "l'AI", 'in', 'meno', 'di', '60', 'secondi'] },
  { start: 7.40, end: 9.22, cls: 'active-amber', tokens: ['e', 'ti', 'mostro', 'come', 'fare', 'in', '3', 'passaggi.'] },
  {
    start: 9.58,
    end: 12.31,
    cls: 'active',
    explicitWords: [
      { t: '1.', s: 9.58, e: 9.86 },
      { t: 'Prendi', s: 10.19, e: 10.52 },
      { t: 'un', s: 10.52, e: 10.65 },
      { t: 'tuo', s: 10.65, e: 10.82 },
      { t: 'audio', s: 10.82, e: 11.16 },
      { t: 'pulito', s: 11.16, e: 11.58 },
      { t: 'da', s: 11.58, e: 11.72 },
      { t: '30', s: 11.72, e: 11.96 },
      { t: 'secondi,', s: 11.96, e: 12.31 },
    ],
  },
  { start: 12.52, end: 14.58, cls: 'active-amber', tokens: ['ma', 'senza', 'eco', 'della', 'stanza', 'o', 'musica', 'sotto,'] },
  { start: 14.69, end: 16.49, cls: 'active-red', tokens: ['altrimenti', 'il', 'clone', 'esce', 'metallico.'] },
  {
    start: 16.83,
    end: 18.73,
    cls: 'active',
    explicitWords: [
      { t: '2.', s: 16.83, e: 17.12 },
      { t: 'Caricalo', s: 17.46, e: 17.98 },
      { t: 'su', s: 17.98, e: 18.14 },
      { t: 'ElevenLabs', s: 18.14, e: 18.73 },
    ],
  },
  { start: 18.81, end: 20.28, cls: 'active', tokens: ['per', 'creare', 'il', 'tuo', 'profilo', 'vocale.'] },
  {
    start: 20.60,
    end: 21.95,
    cls: 'active',
    explicitWords: [
      { t: '3.', s: 20.60, e: 20.76 },
      { t: 'Incolla', s: 21.08, e: 21.48 },
      { t: 'il', s: 21.48, e: 21.58 },
      { t: 'testo,', s: 21.61, e: 21.95 },
    ],
  },
  { start: 22.05, end: 23.67, cls: 'active', tokens: ['aggiungi', 'pause', 'e', 'punteggiatura,'] },
  { start: 23.90, end: 25.32, cls: 'active-green', tokens: ['e', 'lui', 'legge', 'col', 'tuo', 'timbro'] },
  { start: 25.40, end: 26.30, cls: 'active-green', tokens: ['e', 'le', 'tue', 'inflessioni.'] },
  { start: 26.64, end: 28.10, cls: 'active-green', tokens: ['Nei', 'miei', 'test', 'produco', 'i', 'video'] },
  { start: 28.10, end: 29.31, cls: 'active-green', tokens: ['5×', 'più', 'velocemente,'] },
  { start: 29.52, end: 30.95, cls: 'active-amber', tokens: ['senza', 'rifare', '20', 'registrazioni'] },
  { start: 30.95, end: 32.33, cls: 'active-amber', tokens: ['per', 'una', 'parola', 'sbagliata.'] },
  { start: 32.65, end: 33.68, cls: 'active', tokens: ['Ho', 'messo', 'i', 'settaggi', 'esatti'] },
  { start: 33.78, end: 34.58, cls: 'active', tokens: ['e', 'i', 'prompt', 'per', "l'espressività"] },
  { start: 34.65, end: 35.89, cls: 'active-green', tokens: ['nella', 'guida', 'gratis'] },
  { start: 35.94, end: 37.37, cls: 'active-green', tokens: ['su', 'capirelai.com.'] },
  {
    start: 37.68,
    end: 39.38,
    cls: 'active-green',
    explicitWords: [
      { t: 'Commenta', s: 37.68, e: 38.18 },
      { t: '"voce",', s: 38.18, e: 38.54 },
      { t: 'o', s: 38.76, e: 38.86 },
      { t: 'link', s: 38.86, e: 39.06 },
      { t: 'in', s: 39.06, e: 39.18 },
      { t: 'bio.', s: 39.18, e: 39.38 },
    ],
  },
];

function distributeWords(start, end, tokens) {
  const weights = tokens.map((tok) => {
    const clean = tok.replace(/[^a-zA-Z0-9àèéìòù×€%]/g, '');
    return Math.max(1.5, clean.length + 1.1);
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

const lastEndSec = 39.42;
const duration = 40.35;

const cues = {
  duration,
  lastEndSec,
  nonRegWord: 1.88,
  clonataWord: 4.35,
  b2Start: 9.35,
  metallicoWord: 15.65,
  b3Start: 16.65,
  dueWord: 16.83,
  treWord: 20.60,
  b4Start: 26.45,
  cinqueWord: 28.10,
  ventiWord: 29.95,
  b5Start: 32.48,
  urlWord: 36.15,
  phrases,
};

console.log('[1/4] Using ElevenLabs Alessandro voice:', path.basename(ELEVENLABS_VOICE_MP3));
console.log('[2/4] Reel 14 Neural Space Cues:', JSON.stringify({ ...cues, phrases: `${phrases.length} phrases` }));

// Spatial SFX timeline synced to Alessandro's delivery
const sfxEvents = [
  { type: 'boom', t: 0.04, amp: 0.36, dur: 0.65, startHz: 110, endHz: 34 },
  { type: 'boom', t: cues.nonRegWord, amp: 0.48, dur: 0.58, startHz: 140, endHz: 36 },
  { type: 'chime', t: cues.nonRegWord + 0.06, freqs: [659.25, 987.77], amp: 0.14, dur: 0.36 },
  { type: 'whoosh', t: cues.clonataWord - 0.15, dur: 0.45, panDir: 1, amp: 0.24 },
  { type: 'chime', t: cues.clonataWord + 0.05, freqs: [523.25, 783.99, 1046.5], amp: 0.16, dur: 0.50 },
  { type: 'whoosh', t: cues.b2Start - 0.22, dur: 0.55, panDir: -1, amp: 0.26 },
  { type: 'boom', t: 9.58, amp: 0.36, dur: 0.36, startHz: 150, endHz: 48 },
  { type: 'pop', t: 10.19, baseHz: 460, amp: 0.22 },
  { type: 'boom', t: cues.metallicoWord - 0.12, amp: 0.44, dur: 0.52, startHz: 120, endHz: 34 },
  { type: 'whoosh', t: cues.b3Start - 0.20, dur: 0.52, panDir: 1, amp: 0.26 },
  { type: 'boom', t: cues.dueWord, amp: 0.36, dur: 0.34, startHz: 170, endHz: 52 },
  { type: 'chime', t: cues.dueWord, freqs: [587.33, 880.0], amp: 0.15, dur: 0.36 },
  { type: 'boom', t: cues.treWord, amp: 0.36, dur: 0.34, startHz: 190, endHz: 58 },
  { type: 'chime', t: cues.treWord, freqs: [659.25, 987.77], amp: 0.16, dur: 0.38 },
  ...Array.from({ length: 6 }, (_, i) => ({
    type: 'click',
    t: 21.1 + i * 0.24,
    pitch: 0.95 + i * 0.05,
    amp: 0.13,
  })),
  { type: 'whoosh', t: cues.b4Start - 0.20, dur: 0.54, panDir: -1, amp: 0.26 },
  { type: 'boom', t: cues.cinqueWord, amp: 0.45, dur: 0.55, startHz: 145, endHz: 38 },
  { type: 'chime', t: cues.cinqueWord + 0.04, freqs: [523.25, 659.25, 1046.5], amp: 0.18, dur: 0.62 },
  { type: 'pop', t: cues.ventiWord, baseHz: 340, amp: 0.24 },
  { type: 'whoosh', t: cues.b5Start - 0.22, dur: 0.58, panDir: 1, amp: 0.26 },
  { type: 'boom', t: cues.urlWord, amp: 0.44, dur: 0.72, startHz: 120, endHz: 34 },
  { type: 'chime', t: cues.urlWord + 0.04, freqs: [349.23, 523.25, 659.25, 1046.5], amp: 0.20, dur: 1.25 },
];

const cachedMaster = path.join(WORK_DIR, 'audio_master.m4a');
let audioMaster;
if (!FRESH && MODE === 'full' && fs.existsSync(cachedMaster)) {
  console.log('[3/4] Reusing cached Reel 14 audio master...');
  audioMaster = cachedMaster;
} else {
  console.log('[3/4] Mastering Reel 14 ElevenLabs + Cosmic Dark-Tech Bed + Spatial SFX (-14 LUFS)...');
  audioMaster = buildCustomSoundtrackAndMaster({
    rawMp3: ELEVENLABS_VOICE_MP3,
    duration: cues.duration,
    lastEndSec: cues.lastEndSec,
    beatStartSec: cues.clonataWord,
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
    res.end(fs.readFileSync(path.join(ROOT, 'reel-studio-3d/templates/neural-space-voice-template.html')));
    return;
  }
  if (urlPath === '/cues.json') {
    res.writeHead(200, { 'Content-Type': MIME['.json'] });
    res.end(CUES_JSON);
    return;
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
      ['r14_01_mic_hook.png', cues.nonRegWord + 0.55],
      ['r14_02_scope_echo.png', cues.metallicoWord - 0.15],
      ['r14_03_eleven_nodes.png', cues.treWord + 0.75],
      ['r14_04_speed_5x.png', cues.cinqueWord + 0.35],
      ['r14_05_axon_outro.png', cues.urlWord + 0.45],
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
  await runChromeWorker({ cdpPort: 9281, previewDir });
} else {
  const TOTAL_FRAMES = Math.ceil(cues.duration * FPS);
  const MID = Math.floor(TOTAL_FRAMES / 2);
  const partA = `${WORK_DIR}/part_a.mp4`;
  const partB = `${WORK_DIR}/part_b.mp4`;
  console.log(`[4/4] Rendering Reel 14 (Neural Space): ${TOTAL_FRAMES} frames (${cues.duration}s @ ${FPS}fps) across 2 parallel workers...`);

  await Promise.all([
    runChromeWorker({ cdpPort: 9281, startFrame: 0, endFrame: MID, outPartMp4: partA }),
    runChromeWorker({ cdpPort: 9282, startFrame: MID, endFrame: TOTAL_FRAMES, outPartMp4: partB }),
  ]);

  const concatList = `${WORK_DIR}/concat.txt`;
  fs.writeFileSync(concatList, `file '${partA}'\nfile '${partB}'\n`);

  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatList}" -i "${audioMaster}" ` +
      `-map 0:v:0 -map 1:a:0 -c:v copy -c:a copy -shortest -movflags +faststart "${OUT_MP4}" -loglevel error`,
    { stdio: 'inherit' }
  );
  execSync(
    `ffmpeg -y -ss ${(cues.nonRegWord + 0.55).toFixed(2)} -i "${OUT_MP4}" -frames:v 1 -q:v 2 "${OUT_POSTER}" -loglevel error`,
    { stdio: 'inherit' }
  );
  console.log('DONE REEL 14! Output:', OUT_MP4, 'Poster:', OUT_POSTER);
}

server.closeAllConnections?.();
server.close();
process.exit(0);
