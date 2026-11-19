# Capire l'AI — Libreria Ufficiale Skill Video Virali (`@capirelai`)

Queste 4 skill permanenti trasformano qualsiasi idea o brief di Jarvis in un Reel verticale Instagram (`1080×1920`, safe-zone IG `9:16` + cover griglia `3:4`, voce naturale italiana maschile `Diego`, mix `-14 LUFS`) ispirato ai formati più virali su Instagram/TikTok — **100% riproducibili via codice senza abbonamenti esterni obbligatori**.

---

## SKILL 1 — `ONE-TAKE 3D SPOT` *(Ispirato a Ryanair / HyperFrames + Three.js)*
**Quando usarla:** Spot provocatori, debunking AI, lanci di guide/kit, confronti costi/token, hook virali da 25–30 secondi.

### Regole Ferree (Non Negoziabili)
1. **Un solo piano sequenza — ZERO tagli:** un'unica scena 3D continua con 4+ ambienti fisici collegati lungo un percorso Z continuo. Nessuna dissolvenza al nero, nessuno stacco secco.
2. **Un solo oggetto eroe ("Il Filo"):** un oggetto 3D iconico (es. la Valigetta/Capsula rossa `PROMPT` di `@capirelai`) resta sempre in scena e guida fisicamente la camera da un ambiente all'altro (scende, rotola sul nastro, entra nel tunnel scanner laser, esce sul piazzale di decollo).
3. **Parole 3D fisiche dentro la scena (non sottotitoli piatti):**
   - Le parole di passaggio sono piccole e **bianche**.
   - Le parole forti/numeri sono giganti in **giallo elettrico `#facc15`** o **ciano `#38bdf8`**.
   - Il **rosso `#ef4444`** si usa SOLO su 2–3 parole shock in tutto lo spot (es. `"FREGATO"`, `"SCHERZO."`).
   - Ogni parola è già atterrata nell'istante esatto in cui la voce la pronuncia (`t_land <= t_word`).
   - Interazione fisica: l'oggetto eroe spezza una parola in due; la parola `"SCHERZO."` fa esplodere in schegge 3D la falsa promessa.
4. **Copione che fila + zero silenzi (`<= 0.1s`):** italiano parlato diretto, gancio al fotogramma zero col logo `@CAPIRELAI`, pausa massima 0,1s tra le frasi (taglio silenzi automatico in FFmpeg), dato reale verificato, colpo di scena a metà video.
5. **Micro-SFX unici + Mix `-14 LUFS`:** almeno 35–50 eventi sonori procedurali diversi (impatto, rottura, rullo nastro, laser scanner, bip cassa, fruscio tendine, decollo), mai lo stesso suono ripetuto identico, tutto sotto la voce naturale di `Diego`.
6. **Check fotogrammi obbligatorio prima del render completo:** generare sempre fotogrammi di controllo (minimo 6–8 punti chiave) e verificare che **nessuna scritta 3D o logo sia tagliato** e che tutto resti dentro le safe-zone IG (`top >= 210px`, `right >= 120px`, `bottom >= 340px`).

- **Motore salvato:** `/reel-studio-3d/models/onetake-3d-engine.js`
- **Template di riferimento:** `/reel-studio-3d/templates/onetake-spot-template.html`
- **Renderer:** `/reel-studio-3d/render-reel-11.mjs`

---

## SKILL 2 — `VOX PAPER-CUTOUT EXPLAINER` *(Ispirato a Vox Animated Ad)*
**Quando usarla:** Spiegazioni editoriali di concetti AI (*Come funziona un Transformer*, *Perché l'AI allucina*, *Storia dei modelli LLM*, *Confronto tool*).

### Workflow Nativo `@capirelai` (0€ API esterne)
1. **Palette bloccata su tutto il video:** carta avorio/kraft tattile (`#efe7d6`), inchiostro grafite (`#1a1d24`), evidenziazioni editoriali giallo ocra (`#eab308`) e blu editoriale (`#1d4ed8`), font serif editoriale + sans geometrico.
2. **Asset coerenti:** 5–6 tavole generate in batch con lo stesso stile *torn paper collage / editorial cutout illustration* (stessa grana carta e ombre di ritaglio).
3. **Animazione continua a codice:** ogni scena scorre nella successiva via transizione fisica a foglio strappato/scorrimento su scrivania + frecce disegnate SVG progressive + voce calma narrativa (`Diego`, ritmo `+3%`) + foley carta/forbici/pennarello.

---

## SKILL 3 — `CLAYMATION OFFICE AD` *(Ispirato a Claymation Ad / Novoads)*
**Quando usarla:** Storytelling ironico su PMI, freelance e lavoro d'ufficio (*"L'impiegato sommerso da 50 PDF finché non usa il Prompt #2"*).

### Workflow Nativo `@capirelai` (0€ API esterne)
1. **Storia fissa in 4 atti (30–40s):** (1) Giornata grigia dell'impiegato in plastilina con maglione di lana e PC beige sommerso di carta → (2) Scoperta dello strumento/prompt Capire l'AI → (3) Trasformazione luminosa e veloce → (4) Finale ironico + logo `capirelai.com`.
2. **Estetica stop-motion autentica:** miniature in plastilina con impronte digitali visibili, luci calde da lampada da tavolo, animazione a **12fps autentici** con micro-jitter stop-motion + foley da ufficio (tastiera meccanica, tazzina, fogli) + voce `Diego`.

---

## SKILL 4 — `CURIOSITÀ 3D VERTICALE` *(Ispirato a Zack D Films)*
**Quando usarla:** Domande magnetiche ad altissima retention (*"Cosa succede DENTRO ChatGPT quando premi Invio?"*, *"Come fa un agente AI a vedere il tuo schermo?"*).

### Workflow Nativo `@capirelai`
1. **Struttura a ciclo di curiosità (25–30s):** Domanda secca nei primi 2 secondi → zoom fisico dentro il meccanismo (token, strati di attenzione, scanner visivo) → rivelazione sorprendente → chiusura con CTA al sito.
2. **Stile visivo:** 3D pulito ad alto contrasto con camera che attraversa l'interno della macchina in prima persona, sezioni anatomiche/tecniche illuminate, SFX meccanici/organici sincronizzati.
