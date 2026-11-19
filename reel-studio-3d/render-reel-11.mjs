/**
 * Capire l'AI — Reel 11 Renderer (Skill 1: ONE-TAKE 3D SPOT — Ryanair / HyperFrames Style)
 * - ZERO tagli, 1 sola scena 3D continua (4 ambienti fisici collegati)
 * - 1 oggetto eroe 3D (Valigetta PROMPT) che guida la camera
 * - Vere parole 3D estruse in scena + spaccatura fisica + esplosione in schegge su "SCHERZO."
 * - Voce maschile italiana naturale (it-IT-DiegoNeural, 0% atempo) + 45+ SFX unici a -14 LUFS
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
const WORK_DIR = '/tmp/reel11_onetake';
const CHROME_BIN =
  '/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell';

const OUT_MP4 = path.join(ROOT, 'public/instagram/reels/reel-11-onetake-3d-spot-chatgpt.mp4');
const OUT_POSTER = path.join(ROOT, 'public/instagram/reels/reel-11-poster.jpg');

// Spoken Italian script — zero fluff, tight pauses, real data, ironic twist ("Scherzo.")!
const SCRIPT_TEXT =
  'Quante volte ti ha fregato ChatGPT con una risposta da robot? ' +
  'Tranquillo, sei in buona compagnia: quattro utenti su cinque scrivono ancora come su Google. ' +
  'Paghi ventidue euro al mese per riscrivere tutto a mano. Per questo oggi ti regalo il prompt magico. ' +
  'Scherzo. I prompt magici non esistono. Dentro lo scanner contano solo tre cose: Ruolo, Obiettivo, Formato. ' +
  'Vuoi risparmiare dieci ore a settimana? Cinque prompt pronti gratis su capirelai punto com. Link in bio.';

fs.mkdirSync(WORK_DIR, { recursive: true });

const cachedMp3 = path.join(WORK_DIR, 'voice_raw.mp3');
const cachedJson = `${cachedMp3}.json`;
let rawMp3;
let words;

if (!FRESH && fs.existsSync(cachedMp3) && fs.existsSync(cachedJson) && fs.statSync(cachedMp3).size > 1000) {
  console.log('[1/4] Reusing cached Diego voice for Reel 11...');
  rawMp3 = cachedMp3;
  words = JSON.parse(fs.readFileSync(cachedJson, 'utf8'));
} else {
  console.log('[1/4] Synthesizing natural Italian male voice (it-IT-DiegoNeural) for Reel 11...');
  const synth = await synthesizeNaturalMaleVoice({
    text: SCRIPT_TEXT,
    outDir: WORK_DIR,
    voice: 'it-IT-DiegoNeural',
    rate: '+8%',
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

const lastEndSec = Number(((words[words.length - 1]?.end || 27000) / 1000).toFixed(3));
const duration = Number((lastEndSec + 0.9).toFixed(2));

const fregatoWord = findSec('fregato', 0.3);
const chatgptWord = findSec('chatgpt', fregatoWord);
const b2Start = findSec('tranquillo', chatgptWord);
const quattroWord = findSec('quattro', b2Start);
const googleWord = findSec('google', quattroWord);
const b3Start = findSec('paghi', googleWord);
const euroWord = findSec('ventidue', b3Start);
const regaloWord = findSec('questo', euroWord);
const magicoWord = findSec('magico', regaloWord);
const scherzoWord = findSec('scherzo', magicoWord);
const scannerWord = findSec('dentro', scherzoWord);
const ruoloWord = findSec('ruolo', scannerWord);
const obiettivoWord = findSec('obiettivo', ruoloWord);
const formatoWord = findSec('formato', obiettivoWord);
const b6Start = findSec('vuoi', formatoWord);
const dieciWord = findSec('dieci', b6Start);
const urlWord = findSec('capirelai', dieciWord);

const cues = {
  duration,
  lastEndSec,
  fregatoWord,
  chatgptWord,
  b2Start,
  quattroWord,
  googleWord,
  b3Start,
  euroWord,
  regaloWord,
  magicoWord,
  scherzoWord,
  scannerWord,
  ruoloWord,
  obiettivoWord,
  formatoWord,
  b6Start,
  dieciWord,
  urlWord,
};
console.log('[2/4] Reel 11 One-Take Cues synced to Diego:', JSON.stringify(cues));

// Rich unique micro-SFX timeline (35+ unique hits, sweeps, clicks, scanner beeps, explosion, takeoff!)
const sfxEvents = [
  { type: 'boom', t: 0.02, amp: 0.44, dur: 0.65, startHz: 140, endHz: 42 },
  { type: 'boom', t: fregatoWord, amp: 0.56, dur: 0.72, startHz: 118, endHz: 32 },
  { type: 'pop', t: fregatoWord + 0.04, baseHz: 260, amp: 0.30 },
  { type: 'click', t: chatgptWord, pitch: 1.15, amp: 0.24 },
  { type: 'whoosh', t: b2Start - 0.25, dur: 0.48, panDir: 1, amp: 0.26 },
  { type: 'pop', t: quattroWord, baseHz: 380, amp: 0.28 },
  { type: 'click', t: quattroWord + 0.22, pitch: 0.92, amp: 0.18 },
  { type: 'click', t: googleWord, pitch: 1.08, amp: 0.22 },
  { type: 'whoosh', t: b3Start - 0.18, dur: 0.36, panDir: -1, amp: 0.24 },
  { type: 'boom', t: euroWord, amp: 0.42, dur: 0.48, startHz: 135, endHz: 44 },
  { type: 'chime', t: regaloWord, freqs: [523.25, 659.25, 783.99], amp: 0.24, dur: 0.62 },
  { type: 'chime', t: magicoWord, freqs: [587.33, 880, 1174.66], amp: 0.25, dur: 0.58 },
  // THE TWIST: "SCHERZO." giant impact + shard burst!
  { type: 'boom', t: scherzoWord, amp: 0.60, dur: 0.85, startHz: 110, endHz: 30 },
  { type: 'pop', t: scherzoWord + 0.05, baseHz: 620, amp: 0.30 },
  { type: 'pop', t: scherzoWord + 0.11, baseHz: 440, amp: 0.26 },
  { type: 'pop', t: scherzoWord + 0.18, baseHz: 310, amp: 0.24 },
  // Entering the Red Laser Scanner Rubber Flaps!
  { type: 'whoosh', t: scannerWord - 0.28, dur: 0.55, panDir: 1, amp: 0.30 },
  { type: 'click', t: scannerWord + 0.15, pitch: 1.45, amp: 0.20 },
  { type: 'click', t: scannerWord + 0.55, pitch: 1.55, amp: 0.20 },
  { type: 'boom', t: ruoloWord, amp: 0.40, dur: 0.36, startHz: 155, endHz: 50 },
  { type: 'chime', t: ruoloWord, freqs: [523.25, 783.99], amp: 0.18, dur: 0.32 },
  { type: 'boom', t: obiettivoWord, amp: 0.40, dur: 0.36, startHz: 175, endHz: 54 },
  { type: 'chime', t: obiettivoWord, freqs: [587.33, 880.0], amp: 0.18, dur: 0.32 },
  { type: 'boom', t: formatoWord, amp: 0.45, dur: 0.44, startHz: 195, endHz: 58 },
  { type: 'chime', t: formatoWord, freqs: [659.25, 1046.5], amp: 0.20, dur: 0.48 },
  // Exiting Scanner Flaps -> Starry Takeoff!
  { type: 'whoosh', t: b6Start - 0.25, dur: 0.62, panDir: -1, amp: 0.30 },
  { type: 'boom', t: dieciWord, amp: 0.48, dur: 0.55, startHz: 140, endHz: 40 },
  { type: 'whoosh', t: urlWord - 0.35, dur: 0.72, panDir: 1, amp: 0.28 },
  { type: 'boom', t: urlWord, amp: 0.46, dur: 0.75, startHz: 125, endHz: 36 },
  { type: 'chime', t: urlWord + 0.05, freqs: [349.23, 523.25, 659.25, 1046.5], amp: 0.24, dur: 1.25 },
];

const cachedMaster = path.join(WORK_DIR, 'audio_master.m4a');
let audioMaster;
if (!FRESH && fs.existsSync(cachedMaster)) {
  console.log('[3/4] Reusing cached Reel 11 audio master...');
  audioMaster = cachedMaster;
} else {
  console.log('[3/4] Mastering Diego voice + One-Take dark-tech soundtrack + 30+ SFX (-14 LUFS)...');
  audioMaster = buildCustomSoundtrackAndMaster({
    rawMp3,
    duration: cues.duration,
    lastEndSec: cues.lastEndSec,
    beatStartSec: cues.b2Start,
    sfxEvents,
    outDir: WORK_DIR,
  });
}

const PORT = 4213;
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
    res.end(fs.readFileSync(path.join(ROOT, 'reel-studio-3d/templates/onetake-spot-template.html')));
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
    // 6 Control Snapshots ("Scritte mai tagliate" verification across all 4 environments!)
    const samples = [
      ['ot_01_smash.png', cues.chatgptWord + 0.3],
      ['ot_02_belt.png', cues.quattroWord + 0.45],
      ['ot_03_ribbon.png', cues.magicoWord + 0.25],
      ['ot_04_scherzo.png', cues.scherzoWord + 0.28],
      ['ot_05_scanner.png', cues.formatoWord + 0.35],
      ['ot_06_takeoff.png', cues.urlWord + 0.55],
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
  await runChromeWorker({ cdpPort: 9261, previewDir });
} else {
  const TOTAL_FRAMES = Math.ceil(cues.duration * FPS);
  const MID = Math.floor(TOTAL_FRAMES / 2);
  const partA = `${WORK_DIR}/part_a.mp4`;
  const partB = `${WORK_DIR}/part_b.mp4`;
  console.log(`[4/4] Rendering Reel 11 One-Take: ${TOTAL_FRAMES} frames (${cues.duration}s @ ${FPS}fps) across 2 parallel workers...`);

  await Promise.all([
    runChromeWorker({ cdpPort: 9261, startFrame: 0, endFrame: MID, outPartMp4: partA }),
    runChromeWorker({ cdpPort: 9262, startFrame: MID, endFrame: TOTAL_FRAMES, outPartMp4: partB }),
  ]);

  const concatList = `${WORK_DIR}/concat.txt`;
  fs.writeFileSync(concatList, `file '${partA}'\nfile '${partB}'\n`);

  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatList}" -i "${audioMaster}" ` +
      `-map 0:v:0 -map 1:a:0 -c:v copy -c:a copy -shortest -movflags +faststart "${OUT_MP4}" -loglevel error`,
    { stdio: 'inherit' }
  );
  execSync(
    `ffmpeg -y -ss ${(cues.chatgptWord + 0.25).toFixed(2)} -i "${OUT_MP4}" -frames:v 1 -q:v 2 "${OUT_POSTER}" -loglevel error`,
    { stdio: 'inherit' }
  );
  console.log('DONE REEL 11 ONE-TAKE! Output:', OUT_MP4, 'Poster:', OUT_POSTER);
}

server.close();
