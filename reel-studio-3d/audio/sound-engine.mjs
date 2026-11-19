/**
 * Capire l'AI — Audio & Natural Male Voice Engine (@capirelai)
 * - Voce maschile italiana naturale (it-IT-DiegoNeural, 0% atempo distortion, warm broadcast EQ)
 * - Tappeto dark-tech minimal 120 BPM + SFX cinematografici sincronizzati ai cue del parlato
 */
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export async function synthesizeNaturalMaleVoice({
  text,
  outDir,
  voice = 'it-IT-DiegoNeural',
  rate = '+2%',
  pitch = '-3Hz',
  msEdgeTtsPath = '/tmp/tts-runtime/node_modules/msedge-tts',
}) {
  fs.mkdirSync(outDir, { recursive: true });
  const { MsEdgeTTS, OUTPUT_FORMAT } = require(msEdgeTtsPath);

  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3, {
    wordBoundaryEnabled: true,
  });

  const { audioFilePath, metadataFilePath } = await tts.toFile(outDir, text, {
    rate,
    pitch,
  });

  const rawMp3 = `${outDir}/voice_raw.mp3`;
  fs.renameSync(audioFilePath, rawMp3);

  const meta = JSON.parse(fs.readFileSync(metadataFilePath, 'utf8'));
  const words = (meta.Metadata || [])
    .filter((m) => m.Type === 'WordBoundary' && m.Data?.text?.Text)
    .map((m) => ({
      part: m.Data.text.Text,
      start: Math.round(m.Data.Offset / 10000),
      end: Math.round((m.Data.Offset + m.Data.Duration) / 10000),
    }));

  fs.writeFileSync(`${rawMp3}.json`, JSON.stringify(words, null, 2));
  try { fs.unlinkSync(metadataFilePath); } catch {}
  return { rawMp3, words };
}

export function buildCueSheetFromWords(words) {
  const findWordStartSec = (needle, afterSec = 0) => {
    const low = needle.toLowerCase();
    for (const w of words) {
      const s = w.start / 1000;
      if (s < afterSec) continue;
      if (w.part.toLowerCase().includes(low)) return Number(s.toFixed(3));
    }
    return afterSec;
  };

  const lastEndSec = Number(((words[words.length - 1]?.end || 30000) / 1000).toFixed(3));
  const duration = Number((lastEndSec + 0.85).toFixed(2));

  const s2aStart = findWordStartSec('scrivi', 2.0);
  const appleWord = findWordStartSec('apple', s2aStart);
  const oneToken = findWordStartSec('un', appleWord + 0.1);
  const s2bStart = findWordStartSec('la', oneToken + 0.3);
  const fragolaWord = findWordStartSec('fragola', s2bStart);
  const triploWord = findWordStartSec('paghi', fragolaWord);
  const s3Start = findWordStartSec('e', triploWord + 0.5);
  const robotWord = findWordStartSec('robot', s3Start);
  const s4Start = findWordStartSec('svolta', robotWord) - 0.28;
  const rWord = findWordStartSec('r,', s4Start);
  const oWord = findWordStartSec('o,', rWord + 0.1);
  const fWord = findWordStartSec('f.', oWord + 0.1);
  const ruoloWord = findWordStartSec('ruolo', fWord);
  const obiettivoWord = findWordStartSec('obiettivo', ruoloWord);
  const formatoWord = findWordStartSec('formato', obiettivoWord);
  const risultatiWord = findWordStartSec('risultati', formatoWord);
  const s5Start = findWordStartSec('kit', risultatiWord) - 0.25;

  return {
    duration,
    lastEndSec,
    s2aStart,
    appleWord,
    oneToken,
    s2bStart,
    fragolaWord,
    triploWord,
    s3Start,
    robotWord,
    s4Start: Math.max(robotWord + 0.35, Number(s4Start.toFixed(3))),
    rWord,
    oWord,
    fWord,
    ruoloWord,
    obiettivoWord,
    formatoWord,
    risultatiWord,
    s5Start: Math.max(risultatiWord + 0.9, Number(s5Start.toFixed(3))),
  };
}

export function buildSoundtrackAndMaster({ rawMp3, cues, outDir }) {
  const SR = 48000;
  const DURATION = cues.duration;
  const TOTAL_SAMPLES = Math.floor(SR * DURATION);
  const L = new Float32Array(TOTAL_SAMPLES);
  const R = new Float32Array(TOTAL_SAMPLES);

  let seed = 421337;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return (seed / 0xffffffff) * 2 - 1;
  };
  const addStereo = (idx, vl, vr) => {
    if (idx >= 0 && idx < TOTAL_SAMPLES) {
      L[idx] += vl;
      R[idx] += vr;
    }
  };

  // Minimal Dark-Tech / Studio Commercial Bed (120 BPM, subtle under natural male voice)
  const bassNotes = [43.65, 43.65, 34.65, 38.89];
  const arpNotes = [
    [174.61, 207.65, 261.63, 349.23],
    [174.61, 207.65, 261.63, 311.13],
    [138.59, 174.61, 207.65, 277.18],
    [155.56, 196.0, 233.08, 311.13],
  ];

  let lpNoise = 0;
  let subPhase = 0;
  let arpPhase = 0;

  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    const t = i / SR;
    const barIdx = Math.floor(t / 2.0) % 4;
    const beatPos = (t % 0.5) / 0.5;
    const sixteenthIdx = Math.floor(t / 0.125);
    const sixteenthPos = (t % 0.125) / 0.125;

    let masterEnv = 1.0;
    if (t < 0.7) masterEnv = t / 0.7;
    if (t > DURATION - 1.3) masterEnv = Math.max(0, (DURATION - t) / 1.3);

    const sidechain = Math.min(1.0, Math.pow(beatPos, 0.45));
    const fBass = bassNotes[barIdx];
    subPhase += (2 * Math.PI * fBass) / SR;
    const sub = (Math.sin(subPhase) * 0.75 + Math.sin(subPhase * 2) * 0.25) * 0.14 * sidechain;

    let kick = 0;
    if (t >= cues.s2aStart && t < DURATION - 1.2) {
      const kT = (t - cues.s2aStart) % 0.5;
      if (kT < 0.13) {
        const kFreq = 45 + 105 * Math.exp(-kT * 38);
        kick = Math.sin(2 * Math.PI * kFreq * kT) * Math.exp(-kT * 25) * 0.18;
      }
    }

    let hat = 0;
    if (t >= cues.s2aStart && t < DURATION - 1.5 && sixteenthIdx % 2 === 1) {
      const n = rand();
      lpNoise = lpNoise * 0.35 + n * 0.65;
      hat = (n - lpNoise) * Math.exp(-sixteenthPos * 16) * 0.036;
    }

    let arp = 0;
    let arpPan = 0;
    if (t >= cues.s2aStart && t < DURATION - 1.0) {
      const chord = arpNotes[barIdx];
      arpPhase += (2 * Math.PI * chord[sixteenthIdx % 4]) / SR;
      arp = (Math.sin(arpPhase) * 0.7 + Math.sin(arpPhase * 2) * 0.2) * Math.exp(-sixteenthPos * 7.5) * 0.058;
      arpPan = Math.sin(sixteenthIdx * 1.1) * 0.45;
    }

    const pad =
      (Math.sin(2 * Math.PI * 174.61 * t) * 0.35 +
        Math.sin(2 * Math.PI * 261.63 * t + 0.7) * 0.3 +
        Math.sin(2 * Math.PI * 311.13 * t + 1.4) * 0.2) *
      0.025 *
      (0.7 + 0.3 * Math.sin(t * 0.9));

    const voiceDuck = t > 0.25 && t < cues.lastEndSec ? 0.62 : 1.0;
    const g = masterEnv * voiceDuck;

    L[i] += (sub + kick + pad + hat * 0.8 + arp * (1 - arpPan)) * g;
    R[i] += (sub + kick + pad + hat * 1.2 + arp * (1 + arpPan)) * g;
  }

  // Procedural Cinema SFX
  const addBoom = (t0, amp = 0.48, dur = 0.72, startHz = 128, endHz = 36) => {
    const s0 = Math.floor(t0 * SR);
    const len = Math.floor(dur * SR);
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const p = i / len;
      phase += (2 * Math.PI * (endHz + (startHz - endHz) * Math.exp(-p * 9))) / SR;
      const env = Math.sin(Math.min(1, p * 40) * Math.PI * 0.5) * Math.exp(-p * 4.2);
      const v = Math.tanh(Math.sin(phase) * 1.55) * env * amp;
      addStereo(s0 + i, v, v);
    }
  };
  const addWhoosh = (t0, dur = 0.42, amp = 0.25, panDir = 1) => {
    const s0 = Math.floor(t0 * SR);
    const len = Math.floor(dur * SR);
    let lp1 = 0, lp2 = 0;
    for (let i = 0; i < len; i++) {
      const p = i / len;
      const env = Math.sin(p * Math.PI);
      const cut = 0.04 + 0.28 * Math.sin(p * Math.PI);
      const n = rand();
      lp1 += cut * (n - lp1);
      lp2 += cut * (lp1 - lp2);
      const v = lp2 * env * amp * 2.1;
      const pan = (p * 2 - 1) * 0.45 * panDir;
      addStereo(s0 + i, v * (1 - pan), v * (1 + pan));
    }
  };
  const addKeyClick = (t0, amp = 0.20, pitch = 1.0) => {
    const s0 = Math.floor(t0 * SR);
    const len = Math.floor(0.03 * SR);
    for (let i = 0; i < len; i++) {
      const t = i / SR;
      const c = (Math.sin(2 * Math.PI * 1950 * pitch * t) * 0.55 + rand() * 0.45) * Math.exp(-t * 170) * amp;
      addStereo(s0 + i, c, c * 0.95);
    }
  };
  const addChime = (t0, freqs = [523.25, 659.25, 783.99], amp = 0.20, dur = 0.65) => {
    const s0 = Math.floor(t0 * SR);
    const len = Math.floor(dur * SR);
    for (let i = 0; i < len; i++) {
      const t = i / SR;
      const env = Math.min(1, t / 0.008) * Math.exp(-t * 5.2);
      let v = 0;
      for (const f of freqs) v += Math.sin(2 * Math.PI * f * t) / freqs.length;
      const s = v * env * amp;
      addStereo(s0 + i, s * 1.04, s * 0.96);
    }
  };
  const addPop = (t0, baseHz = 420, amp = 0.28) => {
    const s0 = Math.floor(t0 * SR);
    const len = Math.floor(0.11 * SR);
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / SR;
      phase += (2 * Math.PI * baseHz * Math.exp(t * 14)) / SR;
      const v = Math.sin(phase) * Math.exp(-t * 36) * amp;
      addStereo(s0 + i, v, v);
    }
  };
  const addGlitch = (t0, dur = 0.34, amp = 0.22) => {
    const s0 = Math.floor(t0 * SR);
    const len = Math.floor(dur * SR);
    for (let i = 0; i < len; i++) {
      const t = i / SR;
      const gate = Math.floor(t * 36) % 2 === 0 ? 1 : 0.25;
      const saw = ((t * 145) % 1) * 2 - 1;
      const v = (saw * 0.55 + rand() * 0.45) * Math.exp(-t * 6.5) * gate * amp;
      addStereo(s0 + i, v, -v * 0.85);
    }
  };

  // Sync SFX directly to Diego's natural voice timestamps!
  addBoom(0.05, 0.50, 0.82, 130, 38);
  addWhoosh(Math.max(0.5, cues.s2aStart - 0.55), 0.60, 0.28, 1);

  for (let k = 0; k < 5; k++) addKeyClick(cues.appleWord - 0.55 + k * 0.1, 0.19, 0.95 + k * 0.04);
  addChime(cues.appleWord, [587.33, 880, 1174.66], 0.21, 0.6);

  addWhoosh(cues.s2bStart - 0.15, 0.36, 0.26, -1);
  for (let k = 0; k < 7; k++) addKeyClick(cues.fragolaWord - 0.62 + k * 0.08, 0.19, 0.92 + k * 0.03);
  addPop(cues.fragolaWord + 0.02, 320, 0.27);
  addPop(cues.fragolaWord + 0.26, 420, 0.27);
  addPop(cues.fragolaWord + 0.50, 540, 0.29);
  addBoom(cues.triploWord, 0.48, 0.62, 115, 34);

  addWhoosh(cues.s3Start - 0.12, 0.38, 0.24, 1);
  for (let k = 0; k < 8; k++) addKeyClick(cues.s3Start + 0.75 + k * 0.075, 0.16, 1.04);
  addGlitch(cues.robotWord - 0.12, 0.36, 0.22);

  addWhoosh(cues.s4Start - 0.25, 0.42, 0.24, -1);
  addBoom(cues.rWord, 0.40, 0.38, 155, 50);
  addChime(cues.rWord, [523.25, 783.99], 0.16, 0.32);
  addBoom(cues.oWord, 0.40, 0.38, 175, 54);
  addChime(cues.oWord, [587.33, 880.0], 0.16, 0.32);
  addBoom(cues.fWord, 0.44, 0.44, 195, 58);
  addChime(cues.fWord, [659.25, 1046.5], 0.19, 0.5);

  addWhoosh(cues.s5Start - 0.18, 0.42, 0.24, 1);
  addBoom(cues.s5Start, 0.44, 0.68, 125, 38);
  addChime(cues.s5Start + 0.05, [349.23, 523.25, 659.25, 1046.5], 0.21, 1.15);

  // Write WAV
  const numChannels = 2;
  const dataBytes = TOTAL_SAMPLES * numChannels * 2;
  const wav = Buffer.alloc(44 + dataBytes);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(36 + dataBytes, 4);
  wav.write('WAVE', 8);
  wav.write('fmt ', 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(numChannels, 22);
  wav.writeUInt32LE(SR, 24);
  wav.writeUInt32LE(SR * numChannels * 2, 28);
  wav.writeUInt16LE(numChannels * 2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(dataBytes, 40);

  let offset = 44;
  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    const sl = Math.max(-0.98, Math.min(0.98, Math.tanh(L[i])));
    const sr = Math.max(-0.98, Math.min(0.98, Math.tanh(R[i])));
    wav.writeInt16LE(Math.round(sl * 32767), offset);
    wav.writeInt16LE(Math.round(sr * 32767), offset + 2);
    offset += 4;
  }
  const bedWav = `${outDir}/bed_sfx.wav`;
  fs.writeFileSync(bedWav, wav);

  const outM4a = `${outDir}/audio_master.m4a`;
  // ZERO atempo distortion! Warm natural male broadcast EQ + subtle studio room presence
  execSync(
    `ffmpeg -y -i "${rawMp3}" -i "${bedWav}" ` +
      `-filter_complex "` +
      `[0:a]apad=whole_dur=${DURATION},highpass=f=70,` +
      `equalizer=f=135:width_type=o:width=1.4:g=2.4,` +
      `equalizer=f=2900:width_type=o:width=1.4:g=1.0,` +
      `equalizer=f=6500:width_type=o:width=1.6:g=-2.2,` +
      `acompressor=threshold=-18dB:ratio=2.2:attack=14:release=110,` +
      `aecho=0.82:0.88:18:0.06,` +
      `aresample=48000,aformat=channel_layouts=stereo,volume=1.42[v];` +
      `[1:a]volume=0.62[m];` +
      `[v][m]amix=inputs=2:duration=shortest:dropout_transition=0,loudnorm=I=-14:TP=-1.2:LRA=8[out]" ` +
      `-map "[out]" -t ${DURATION} -ar 48000 -c:a aac -b:a 192k "${outM4a}" -loglevel error`,
    { stdio: 'inherit' }
  );

  return outM4a;
}

/**
 * Reusable Soundtrack + SFX Master Builder for ANY @capirelai 3D Reel.
 * sfxEvents: Array of { type: 'boom'|'whoosh'|'click'|'pop'|'glitch'|'chime', t: number, ...opts }
 */
export function buildCustomSoundtrackAndMaster({
  rawMp3,
  duration,
  lastEndSec,
  beatStartSec = 3.2,
  sfxEvents = [],
  outDir,
}) {
  const SR = 48000;
  const DURATION = duration;
  const TOTAL_SAMPLES = Math.floor(SR * DURATION);
  const L = new Float32Array(TOTAL_SAMPLES);
  const R = new Float32Array(TOTAL_SAMPLES);

  let seed = 889911;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return (seed / 0xffffffff) * 2 - 1;
  };
  const addStereo = (idx, vl, vr) => {
    if (idx >= 0 && idx < TOTAL_SAMPLES) {
      L[idx] += vl;
      R[idx] += vr;
    }
  };

  const bassNotes = [43.65, 43.65, 34.65, 38.89];
  const arpNotes = [
    [174.61, 207.65, 261.63, 349.23],
    [174.61, 207.65, 261.63, 311.13],
    [138.59, 174.61, 207.65, 277.18],
    [155.56, 196.0, 233.08, 311.13],
  ];

  let lpNoise = 0;
  let subPhase = 0;
  let arpPhase = 0;

  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    const t = i / SR;
    const barIdx = Math.floor(t / 2.0) % 4;
    const beatPos = (t % 0.5) / 0.5;
    const sixteenthIdx = Math.floor(t / 0.125);
    const sixteenthPos = (t % 0.125) / 0.125;

    let masterEnv = 1.0;
    if (t < 0.65) masterEnv = t / 0.65;
    if (t > DURATION - 1.2) masterEnv = Math.max(0, (DURATION - t) / 1.2);

    const sidechain = Math.min(1.0, Math.pow(beatPos, 0.45));
    const fBass = bassNotes[barIdx];
    subPhase += (2 * Math.PI * fBass) / SR;
    const sub = (Math.sin(subPhase) * 0.75 + Math.sin(subPhase * 2) * 0.25) * 0.14 * sidechain;

    let kick = 0;
    if (t >= beatStartSec && t < DURATION - 1.1) {
      const kT = (t - beatStartSec) % 0.5;
      if (kT < 0.13) {
        const kFreq = 45 + 105 * Math.exp(-kT * 38);
        kick = Math.sin(2 * Math.PI * kFreq * kT) * Math.exp(-kT * 25) * 0.18;
      }
    }

    let hat = 0;
    if (t >= beatStartSec && t < DURATION - 1.3 && sixteenthIdx % 2 === 1) {
      const n = rand();
      lpNoise = lpNoise * 0.35 + n * 0.65;
      hat = (n - lpNoise) * Math.exp(-sixteenthPos * 16) * 0.036;
    }

    let arp = 0;
    let arpPan = 0;
    if (t >= beatStartSec && t < DURATION - 1.0) {
      const chord = arpNotes[barIdx];
      arpPhase += (2 * Math.PI * chord[sixteenthIdx % 4]) / SR;
      arp = (Math.sin(arpPhase) * 0.7 + Math.sin(arpPhase * 2) * 0.2) * Math.exp(-sixteenthPos * 7.5) * 0.056;
      arpPan = Math.sin(sixteenthIdx * 1.1) * 0.45;
    }

    const pad =
      (Math.sin(2 * Math.PI * 174.61 * t) * 0.35 +
        Math.sin(2 * Math.PI * 261.63 * t + 0.7) * 0.3 +
        Math.sin(2 * Math.PI * 311.13 * t + 1.4) * 0.2) *
      0.024 *
      (0.7 + 0.3 * Math.sin(t * 0.9));

    const voiceDuck = t > 0.2 && t < lastEndSec ? 0.62 : 1.0;
    const g = masterEnv * voiceDuck;

    L[i] += (sub + kick + pad + hat * 0.8 + arp * (1 - arpPan)) * g;
    R[i] += (sub + kick + pad + hat * 1.2 + arp * (1 + arpPan)) * g;
  }

  for (const ev of sfxEvents) {
    const s0 = Math.floor(Math.max(0, ev.t) * SR);
    if (ev.type === 'boom') {
      const dur = ev.dur ?? 0.68;
      const amp = ev.amp ?? 0.46;
      const startHz = ev.startHz ?? 130;
      const endHz = ev.endHz ?? 38;
      const len = Math.floor(dur * SR);
      let phase = 0;
      for (let i = 0; i < len; i++) {
        const p = i / len;
        phase += (2 * Math.PI * (endHz + (startHz - endHz) * Math.exp(-p * 9))) / SR;
        const env = Math.sin(Math.min(1, p * 40) * Math.PI * 0.5) * Math.exp(-p * 4.2);
        const v = Math.tanh(Math.sin(phase) * 1.55) * env * amp;
        addStereo(s0 + i, v, v);
      }
    } else if (ev.type === 'whoosh') {
      const dur = ev.dur ?? 0.42;
      const amp = ev.amp ?? 0.25;
      const panDir = ev.panDir ?? 1;
      const len = Math.floor(dur * SR);
      let lp1 = 0, lp2 = 0;
      for (let i = 0; i < len; i++) {
        const p = i / len;
        const env = Math.sin(p * Math.PI);
        const cut = 0.04 + 0.28 * Math.sin(p * Math.PI);
        const n = rand();
        lp1 += cut * (n - lp1);
        lp2 += cut * (lp1 - lp2);
        const v = lp2 * env * amp * 2.1;
        const pan = (p * 2 - 1) * 0.45 * panDir;
        addStereo(s0 + i, v * (1 - pan), v * (1 + pan));
      }
    } else if (ev.type === 'click') {
      const amp = ev.amp ?? 0.20;
      const pitch = ev.pitch ?? 1.0;
      const len = Math.floor(0.03 * SR);
      for (let i = 0; i < len; i++) {
        const t = i / SR;
        const c = (Math.sin(2 * Math.PI * 1950 * pitch * t) * 0.55 + rand() * 0.45) * Math.exp(-t * 170) * amp;
        addStereo(s0 + i, c, c * 0.95);
      }
    } else if (ev.type === 'pop') {
      const baseHz = ev.baseHz ?? 420;
      const amp = ev.amp ?? 0.28;
      const len = Math.floor(0.11 * SR);
      let phase = 0;
      for (let i = 0; i < len; i++) {
        const t = i / SR;
        phase += (2 * Math.PI * baseHz * Math.exp(t * 14)) / SR;
        const v = Math.sin(phase) * Math.exp(-t * 36) * amp;
        addStereo(s0 + i, v, v);
      }
    } else if (ev.type === 'chime') {
      const freqs = ev.freqs ?? [523.25, 659.25, 783.99];
      const amp = ev.amp ?? 0.20;
      const dur = ev.dur ?? 0.65;
      const len = Math.floor(dur * SR);
      for (let i = 0; i < len; i++) {
        const t = i / SR;
        const env = Math.min(1, t / 0.008) * Math.exp(-t * 5.2);
        let v = 0;
        for (const f of freqs) v += Math.sin(2 * Math.PI * f * t) / freqs.length;
        const s = v * env * amp;
        addStereo(s0 + i, s * 1.04, s * 0.96);
      }
    }
  }

  const numChannels = 2;
  const dataBytes = TOTAL_SAMPLES * numChannels * 2;
  const wav = Buffer.alloc(44 + dataBytes);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(36 + dataBytes, 4);
  wav.write('WAVE', 8);
  wav.write('fmt ', 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(numChannels, 22);
  wav.writeUInt32LE(SR, 24);
  wav.writeUInt32LE(SR * numChannels * 2, 28);
  wav.writeUInt16LE(numChannels * 2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(dataBytes, 40);

  let offset = 44;
  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    const sl = Math.max(-0.98, Math.min(0.98, Math.tanh(L[i])));
    const sr = Math.max(-0.98, Math.min(0.98, Math.tanh(R[i])));
    wav.writeInt16LE(Math.round(sl * 32767), offset);
    wav.writeInt16LE(Math.round(sr * 32767), offset + 2);
    offset += 4;
  }
  const bedWav = `${outDir}/bed_sfx.wav`;
  fs.writeFileSync(bedWav, wav);

  const outM4a = `${outDir}/audio_master.m4a`;
  execSync(
    `ffmpeg -y -i "${rawMp3}" -i "${bedWav}" ` +
      `-filter_complex "` +
      `[0:a]apad=whole_dur=${DURATION},highpass=f=70,` +
      `equalizer=f=135:width_type=o:width=1.4:g=2.4,` +
      `equalizer=f=2900:width_type=o:width=1.4:g=1.0,` +
      `equalizer=f=6500:width_type=o:width=1.6:g=-2.2,` +
      `acompressor=threshold=-18dB:ratio=2.2:attack=14:release=110,` +
      `aecho=0.82:0.88:18:0.06,` +
      `aresample=48000,aformat=channel_layouts=stereo,volume=1.42[v];` +
      `[1:a]volume=0.62[m];` +
      `[v][m]amix=inputs=2:duration=shortest:dropout_transition=0,loudnorm=I=-14:TP=-1.2:LRA=8[out]" ` +
      `-map "[out]" -t ${DURATION} -ar 48000 -c:a aac -b:a 192k "${outM4a}" -loglevel error`,
    { stdio: 'inherit' }
  );

  return outM4a;
}
