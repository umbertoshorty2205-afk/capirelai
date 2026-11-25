# Automazione Reel 3D Macro (Stile `@leomarighetti.mov`) su Siti Terzi

Questa cartella contiene la pipeline pronta per automatizzare ogni nuovo brief di **Jarvis** (`content/jarvis/*.md`) in un Reel verticale Instagram (`1080×1920`) con estetica macro cinematografica (legno caldo, tastiera meccanica, f/1.8 shallow DoF, luce studio calda + rim light fredda, animazioni camera fluide e sottotitoli sincronizzati).

---

## 1. Dove registrarti (4 servizi)

1. **n8n** (`n8n.io` — Cloud o self-hosted gratuito con Docker) → il cervello che collega tutto.
2. **fal.ai** (`fal.ai`) → una sola API key (`FAL_KEY`) ti dà insieme:
   - **FLUX.1 Pro** (keyframe fotorealistici)
   - **Kling v3 Pro Image-to-Video** (movimento camera macro cinematografico)
   - **ElevenLabs TTS v3 con Timestamps** (voce italiana naturale)
   *(Opzionale: se vuoi usare la **tua voce clonata**, crea un account diretto su `elevenlabs.io`, clona la tua voce e sostituisci il nodo `7a` con `POST https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}/with-timestamps`).*
3. **Google AI Studio / Gemini API** (`aistudio.google.com`) → trasforma il Markdown di Jarvis nello storyboard JSON bloccato sullo stile visivo.
4. **Creatomate** (`creatomate.com`) → unisce le 5 clip di Kling, la voce, i sottotitoli automatici sincronizzati e il banner `capirelai.com` dentro alle safe-zone Instagram.

*(Opzionale per auto-pubblicazione: **Blotato**, **Postiz** o **Metricool** collegati alla fine del nodo `13`.)*

---

## 2. Configurazione in 5 minuti

### Step A — Crea il Template in Creatomate
1. Su **creatomate.com** crea un nuovo template **Vertical 9:16 (`1080×1920`, 24fps)**.
2. Apri il pannello **Source Editor** (JSON) e incolla tutto il contenuto di `automation/creatomate-template-blueprint.json`.
3. Aggiungi (opzionale ma consigliato) una traccia audio con 4–5 **SFX tattili reali** (click tastiera meccanica, *whoosh* morbido, *sub-boom*) presi da Epidemic Sound / Freesound, oppure un sottofondo minimal a `-24dB`.
4. Copia il **Template ID** (dalle impostazioni del template / Use API) e la tua **API Key** (da Account → API).

### Step B — Importa il Workflow in n8n
1. In **n8n** crea un nuovo workflow, clicca in alto a destra su **`...` → Import from File...**
2. Seleziona il file `automation/n8n-jarvis-leo-reel-workflow.json`.
3. Fai doppio click sul nodo **`0. Inserisci Chiavi API`** (il secondo nodo a sinistra) e sostituisci i segnaposto con le tue 5 chiavi reali:
   - `github_token`: il tuo token GitHub in lettura su `umbertoshorty2205-afk/capirelai`
   - `gemini_api_key`: chiave da `aistudio.google.com`
   - `fal_key`: chiave da `fal.ai/dashboard/keys`
   - `creatomate_api_key`: API key di Creatomate
   - `creatomate_template_id`: ID del template creato nello Step A
4. Salva e clicca **Test Workflow**: leggerà in automatico l'ultimo file da Jarvis, genererà voce, 5 immagini FLUX, 5 clip video Kling e lancerà il render finale su Creatomate (troverai l'URL del video `.mp4` nell'output dell'ultimo nodo `13. Render Finale (Creatomate)`).

---

## 3. Pacchetto Prompt Già Pronto per il Brief di Oggi (25 Nov — Metodo R.O.F.)

Se vuoi testare subito a mano su `fal.ai` / `Runway` prima ancora di collegare n8n, ecco le 5 scene già scritte con lo **Style Lock** tratto da `leo_ref.jpg`:

- **Scena 1 — Hook ("Guidi una Ferrari in prima marcia")**
  - *Keyframe (FLUX 9:16):* Extreme macro close-up of matte charcoal mechanical keyboard keys on a warm walnut wood desk, shallow depth of field f/1.8, soft creamy bokeh, warm tungsten side key light, subtle cool blue rim light, 35mm film grain, upper and lower third uncluttered dark moody negative space, photorealistic CGI studio render.
  - *Motion (Kling):* Ultra smooth slow macro dolly push-in across the mechanical keycaps with subtle rack focus onto a single centered key.
- **Scena 2 — Il Problema ("Il 90% chiede risposte generiche")**
  - *Keyframe:* Low-angle shallow depth of field shot of a minimal dark aluminum laptop edge and blurred glowing search bar reflection on a warm wooden desk, moody studio lighting, soft contact shadows, 85mm prime lens f/1.8, photorealistic.
  - *Motion:* Smooth slow lateral camera glide left-to-right with gentle depth-of-field breathing.
- **Scena 3 — R.O.F. Step 1 & 2 (Ruolo + Obiettivo)**
  - *Keyframe:* Macro overhead 45-degree shot of a sleek dark matte glass notepad and brass pen beside a mechanical keyboard on warm oak wood, soft amber desk lamp glow, shallow f/2.0 bokeh, ultra realistic textures.
  - *Motion:* Smooth slow downward crane tilt settling smoothly on the desk surface.
- **Scena 4 — R.O.F. Step 3 (Formato e Risultato Pulito)**
  - *Keyframe:* Close-up cinematic shot of a crisp frameless dark glass monitor edge glowing softly in warm amber and sky blue light on an oak studio desk, blurred keyboard foreground bokeh, 35mm film aesthetic.
  - *Motion:* Slow deliberate camera pull-back revealing the clean minimalist workspace.
- **Scena 5 — Bridge Newsletter & CTA (`capirelai.com`)**
  - *Keyframe:* Moody minimalist studio desk scene at golden hour artificial lamp light, smartphone resting face-up beside a mechanical keyboard on dark walnut wood, creamy bokeh background, 85mm f/1.8 macro photography.
  - *Motion:* Smooth slow arc orbit around the smartphone and keyboard edge.

*(Nota: mantieni anche `Title-2..5` e `Sub-2..5` nel template Creatomate se vuoi i titoli per tutte le 5 scene oltre alla prima.)*
