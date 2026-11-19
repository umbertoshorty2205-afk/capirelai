# Capire l'AI — 3D Instagram Reels Studio (`@capirelai`)

Libreria permanente di **modelli 3D Three.js**, **preset audio/voce maschile naturale** e **safe-zone Instagram Reels** per produrre ogni futuro Reel di `@capirelai` in formato coerente e pronto per il feed/profilo.

## Modelli 3D Salvati (`models/capirelai-3d-models.js`)
1. **`createCurvedStudioMonitor`** — Monitor OLED curvo 3D su scrivania scura con barra ambilight ciano e silhouette tastiera (opener con carrellata dolly-in nello schermo).
2. **`createBeveledTokenCube`** — Cubo 3D smussato PBR (`ExtrudeGeometry`) con bordi luminosi e doppia piastra `CanvasTexture` ad alta nitidezza (ideale per confronti Token, Costi, Metriche, Tool).
3. **`createMonolithPillar`** — Monoliti metallici 3D con anello posteriore luminoso (ideali per framework in 3 passi: `R · O · F`, `1 · 2 · 3`, checklist).
4. **`createNeuralTorusOrb`** — Sfera/toroide neurale 3D con particelle sinaptiche e anello orbitante (identità visiva `capirelai.com` per outro e sfondi tech).
5. **`createStudioLightingRig` / `createFloatingDustField` / `createCyberGridFloor`** — Illuminazione studio 3 punti + `RoomEnvironment` PBR + griglia e polvere volumetrica.

## Formato & Safe-Zone Instagram (`presets/ig-safe-zones.json`)
- **Risoluzione:** `1080×1920` (`9:16`), `24fps` Cinema, H.264 High (`yuv420p`, `+faststart`), Audio Stereo AAC `48kHz / 192kbps / -14 LUFS`.
- **Margine superiore (`>= 215px`):** libero da icona fotocamera e barra Reels.
- **Fascia destra (`>= 136px` nella metà inferiore):** libera dai pulsanti Mi piace / Commenti / Condividi / Audio.
- **Sottotitoli cinetici (`bottom: 385px`):** sempre sopra nome account, caption e barra audio di Instagram.
- **Copertina Griglia Profilo (`3:4` centrata `1080×1440`, `y: 240..1680`):** il monitor curvo e il titolo principale rientrano integralmente nel ritaglio del profilo `@capirelai`.

## Voce Maschile Naturale & Sound Design (`audio/sound-engine.mjs`)
- **Voce predefinita:** `it-IT-DiegoNeural` (voce maschile nativa italiana, `rate: +2%`, `pitch: -3Hz`, **zero stretching `atempo`** per eliminare l'effetto metallico/robotico) + mastering caldo da studio podcast (`135Hz` calore, de-esser `6.5kHz`, micro-riverbero stanza trattata).
- **Soundtrack + SFX:** tappeto elettronico *dark-tech* minimal 120 BPM dosato sotto la voce + SFX sincronizzati ai frame (*boom*, *whoosh*, *click*, *pop*, *glitch*, *chime*).
