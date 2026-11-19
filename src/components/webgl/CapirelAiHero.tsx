import React, { useState, useEffect } from 'react';
import { AxonCanvas } from './AxonCanvas';
import { NewsletterSection } from '../NewsletterSection';
import { FounderNewsletterModal } from '../FounderNewsletterModal';
import { testFirestoreConnection, type InquiryKind } from '../../lib/firebase';

import initialArticles from '../../data/articles.json';

export interface FullArticleData {
  title: string;
  section: string;
  tag: string;
  readTime: string;
  author: string;
  date: string;
  summary: string;
  content: {
    heading: string;
    text: string;
    highlight?: string;
    codeSnippet?: string;
  }[];
  keyTakeaways: string[];
}

export const ARTICLES_DATABASE: Record<string, FullArticleData> = initialArticles as Record<string, FullArticleData>;

// ==========================================
// 2. MODALE CHI SONO (TESTO ESATTO AUTORE)
// ==========================================
function ChiSonoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(10px)',
        userSelect: 'text',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#09090c',
          border: '1px solid rgba(56, 189, 248, 0.5)',
          borderRadius: '6px',
          padding: '28px',
          boxShadow: '0 0 60px rgba(56, 189, 248, 0.25)',
          color: '#dddddd',
          fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid #222226' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ position: 'relative', width: '52px', height: '52px', borderRadius: '50%', overflow: 'hidden', border: '1.5px solid #38bdf8', boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)', backgroundColor: '#0a0a10', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <img
                src="/assets/aistudio/Black_Blue_and_White_Modern_Store_Logo__1__e6632dec.png"
                alt="Capire l'AI"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block', position: 'relative', zIndex: 1 }}
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  if (!target.dataset.tried) {
                    target.dataset.tried = 'true';
                    target.src = '/assets/logo.png';
                  } else {
                    target.style.display = 'none';
                  }
                }}
              />
              <span style={{ position: 'absolute', fontSize: '12px', fontWeight: 900, color: '#38bdf8', pointerEvents: 'none', zIndex: 0 }}>AI</span>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.03em' }}>
                Chi sono
              </h2>
              <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600, letterSpacing: '0.05em' }}>
                CAPIRE L&apos;AI • EST. 2026
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: '#8a8a8a', fontSize: '20px', cursor: 'pointer' }}
            title="Chiudi"
          >
            ✕
          </button>
        </div>

        <div style={{ paddingTop: '20px', fontSize: '13.5px', lineHeight: 1.75, color: '#cccccc' }}>
          <p style={{ textAlign: 'justify', margin: '0 0 16px 0' }}>
            Sono uno studente di ingegneria gestionale, con un forte interesse per la tecnologia e per il modo in cui le organizzazioni prendono decisioni, lavorano e creano valore. Da qui nasce la curiosità per l&apos;intelligenza artificiale, vista non come promessa astratta ma come strumento che cambia il lavoro di ogni giorno.
          </p>

          <p style={{ textAlign: 'justify', margin: '0 0 16px 0' }}>
            <strong>Capire l&apos;AI</strong> nasce da un&apos;osservazione semplice. Gli strumenti basati sull&apos;AI sono entrati nello studio, nel lavoro e nella vita quotidiana, spesso senza che le persone capiscano come funzionano, che cosa sanno fare davvero e dove sbagliano. Il sito serve a colmare questo divario: spiegare i concetti tecnici con un linguaggio chiaro, pubblicare guide pratiche testate e tenere i lettori aggiornati su ciò che cambia.
          </p>

          <p style={{ textAlign: 'justify', margin: '0 0 16px 0' }}>
            Il mio metodo è sperimentare prima di scrivere. Ogni guida nasce da un test che ho fatto io, con prompt, risultati ed errori annotati. Quando uno strumento non funziona, lo scrivo, perché i suoi limiti contano quanto le sue potenzialità. Gli esempi che trovi sul sito vengono dalla mia esperienza personale e non vanno intesi come casi universali.
          </p>

          <div style={{ padding: '14px', backgroundColor: '#111116', borderLeft: '3px solid #38bdf8', borderRadius: '0 4px 4px 0', fontSize: '13px', color: '#e0e0e0', lineHeight: 1.65, margin: '18px 0' }}>
            Non sono un esperto di AI in senso accademico, né un ricercatore. Sono una persona che studia, prova e spiega, e ti invito a verificare quello che leggi. Se trovi un errore, segnalamelo.
          </div>

          <div style={{ paddingTop: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.05em' }}>
              — Fondatore di Capire l&apos;AI
            </span>
          </div>
        </div>

        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #222226', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', fontSize: '11px', color: '#777777' }}>
          <span>Piattaforma: <strong style={{ color: '#cccccc', fontWeight: 500 }}>capirelai.com</strong></span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                const el = document.getElementById('newsletter');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{ background: 'none', border: 'none', color: '#38bdf8', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit' }}
            >
              Iscriviti alla Newsletter ↓
            </button>
            <a
              href="mailto:contact@capirelai.com"
              style={{ color: '#aaaaaa', textDecoration: 'none' }}
            >
              Segnala un errore o suggerimento ✉
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2B. MODALE INSTAGRAM STUDIO & GRAFICHE
// ==========================================
interface InstagramPostItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  filename: string;
  caption: string;
  aspectRatio: string;
}

interface InstagramReelItem {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  video: string;
  poster?: string;
  filename: string;
  duration: string;
  specs: string;
  caption: string;
  pinnedComment?: string;
}

const INSTAGRAM_REELS: InstagramReelItem[] = [
  {
    id: 'reel-spot-3d-chatgpt-rof',
    badge: '3D CINEMA ENGINE • THREE.JS + SFX',
    title: "Reel 09 // Lo Spot 3D che ChatGPT Non Farà Mai (Token 3× + R.O.F.)",
    subtitle: "Nuovo motore video 100% via codice (Three.js 3D + animazioni spring + musica dark-tech + SFX sincronizzati): monitor curvo 3D con dolly-in, cubi Token 3D apple vs fragola, glitch Google Trap, monoliti 3D R.O.F. e finale capirelai.com",
    video: "/instagram/reels/reel-09-spot-3d-chatgpt-rof.mp4",
    poster: "/instagram/reels/reel-09-poster.jpg",
    filename: "reel-09-spot-3d-chatgpt-rof.mp4",
    duration: "29.8 sec",
    specs: "1080×1920 24fps Cinema • 3D WebGL + Musica + SFX",
    caption: `Lo spot che ChatGPT non avrà mai il coraggio di fare. 🎬⚡

Scrivi una parola in inglese ("apple"): 1 solo token.
La scrivi in italiano ("fragola"): si spezza in 3 token (fra · go · la). Paghi il triplo e bruci la memoria 3× più in fretta.

E non finisce qui: se gli fai domande secche come su Google, ti sputa fuori frasi da robot aziendale.

La svolta sta in 3 lettere — la Regola R.O.F.:
1️⃣ R — RUOLO (chi deve essere il modello)
2️⃣ O — OBIETTIVO + CONTESTO (situazione reale)
3️⃣ F — FORMATO ESATTO (lunghezza, tono, zero cliché)

Meno token sprecati, risultati 10× più umani. ✅
(Ps: questo video è generato 100% via codice 3D — niente riprese, niente Blender, niente After Effects.)

🎁 Il Kit Operativo R.O.F. (.md) con 10 prompt pronti è gratis su capirelai.com (link in bio).
💬 Scrivi "SPOT" nei commenti se vuoi altri video così e salvati il Reel!

#CapirelAI #ChatGPTItalia #AIItalia #3DMotion #PromptEngineering #RegolaROF #TechItalia #IntelligenzaArtificiale`,
    pinnedComment: `📌 VUOI IL KIT OPERATIVO R.O.F. (.md) CITATO NELLO SPOT?

Dentro trovi i 10 prompt copia-incolla pronti per email, preventivi, documenti e analisi + la checklist anti-cliché per smettere di bruciare token in italiano.

👉 Lo sblocchi gratis appena ti iscrivi su https://www.capirelai.com/#newsletter (link in bio @capirelai)!
💬 Dimmi nei commenti: ti piace questo nuovo stile 3D rispetto ai Reel classici?`,
  },
  {
    id: 'reel-regola-rof-risposte-banali-jarvis',
    badge: 'JARVIS BRIEF • STUDIO CLEAN HD',
    title: "Reel 08 // Perché l'AI ti dà Risposte Banali (Usa la Regola R.O.F.)",
    subtitle: "Dal brief Jarvis (17 Nov): hook anti-ricerca Google, la regola pratica R.O.F. (Ruolo · Obiettivo + Contesto · Formato), esempio reale su mail commerciale da 3 righe, sottotitoli sincronizzati, PiP KAI-01 e CTA al Kit .md",
    video: "/instagram/reels/reel-08-regola-rof-risposte-banali-jarvis.mp4",
    filename: "reel-08-regola-rof-risposte-banali-jarvis.mp4",
    duration: "33.3 sec",
    specs: "1080×1920 MP4 • Voce HD + Studio Clean",
    caption: `Se chiedi qualcosa a ChatGPT e ti risponde con le solite frasi robotiche da manuale, non è colpa del modello: lo stai usando come se fosse Google. 👇

Una domanda secca genera sempre una risposta media, generica e dimenticabile.
Prima di premere Invio, applica sempre la Regola R.O.F.:

1️⃣ R — RUOLO: chi deve essere il modello (es. "Consulente commerciale senior B2B")
2️⃣ O — OBIETTIVO + CONTESTO: cosa vuoi ottenere e la situazione reale (es. "Cliente che ha ritenuto alto il preventivo e non risponde da 4 giorni")
3️⃣ F — FORMATO ESATTO: come vuoi il risultato (es. "Massimo 3 righe dirette, tono umano, zero frasi fatte e zero parole gonfiate")

Risultato? Smetti di correggere bozze infinite e ottieni testi utilizzabili al primo colpo. ✅

🎁 Ho inserito il Prompt R.O.F. completo e i template pronti nel Kit Operativo (.md) gratuito su capirelai.com (link in bio).
💬 Scrivi "ROF" nei commenti se vuoi ricevere altri esempi reali per il tuo lavoro e salvati il Reel!

#CapirelAI #RegolaROF #PromptEngineering #ChatGPTItalia #AIItalia #Produttivita #PMI #IntelligenzaArtificiale`,
    pinnedComment: `📌 COPIA-INCOLLA SUBITO IL PROMPT R.O.F. DI QUESTO REEL (salva il post!):

"Agisci come un consulente commerciale senior B2B (R). Scrivi un follow-up per recuperare un cliente che ha rifiutato il nostro preventivo 4 giorni fa per il prezzo senza chiudere la trattativa (O). Usa al massimo 3 righe dirette, tono calmo e umano, zero frasi fatte tipo 'nel caso cambiassi idea' o 'rimango a disposizione' (F)."

🎁 Vuoi il Kit Operativo R.O.F. (.md) con i 10 prompt pronti e la checklist PMI?
👉 Sbloccalo gratis appena ti iscrivi su https://www.capirelai.com/#newsletter (link in bio @capirelai)!`,
  },
  {
    id: 'reel-testi-anti-robot-jarvis',
    badge: 'JARVIS TOP PICK • STUDIO CLEAN HD',
    title: "Reel 07 // Basta Testi AI Robotici: Il Metodo Esempio + Divieto",
    subtitle: "Scelto dal brief Jarvis ad alto impatto (+5k–12k views, conversione newsletter): hook anti-robot, protocollo in 3 passi, sottotitoli sincronizzati, PiP KAI-01 e CTA verso il Kit .md su capirelai.com",
    video: "/instagram/reels/reel-07-testi-anti-robot-jarvis.mp4",
    filename: "reel-07-testi-anti-robot-jarvis.mp4",
    duration: "42.4 sec",
    specs: "1080×1920 MP4 • Voce HD + Studio Clean",
    caption: `Se i testi che generi con ChatGPT sembrano scritti da un robot aziendale ("Nel dinamico mondo di oggi..."), guarda questo trucco da 20 secondi. 👇

Il 99% delle persone chiede all'AI di scrivere da zero.
Fai invece questi 3 passaggi prima di chiedere qualsiasi email o post:

1️⃣ INCOLLA 2 TUOI TESTI REALI: scrivi "Analizza il mio tono, la lunghezza delle frasi e il ritmo"
2️⃣ AGGIUNGI PAROLE VIETATE: es. "Non usare mai: inoltre, rivoluzionario, nel panorama attuale, sinergia"
3️⃣ GENERA SOLO ALLA FINE: chiedi il testo applicando quella scheda di stile

Risultato? Sembra scritto da te al 100% ✅

🎁 Ho messo il prompt esatto copia-incolla e il Kit Operativo R.O.F. (.md) gratis nella newsletter su capirelai.com (link in bio).
💬 Scrivi "ROBOT" nei commenti e salvati il Reel prima di scrivere la prossima email!

#CapirelAI #ChatGPTItalia #AIItalia #PromptEngineering #Produttivita #MarketingDigitale #PMI #IntelligenzaArtificiale`,
    pinnedComment: `📌 ECCO IL PROMPT COPIA-INCOLLA DA USARE SUBITO (salva il post!):

"Analizza questi 2 miei testi reali [INCOLLA 2 EMAIL/POST] ed estrai una scheda stile su tono, lunghezza frasi e ritmo. Regola ferrea: non usare mai parole gonfiate o cliché come inoltre, rivoluzionario, sinergia, nel panorama attuale. Ora scrivi [IL TUO TESTO] applicando esattamente questa scheda stile."

🎁 Vuoi il Kit Operativo R.O.F. completo con i 5 prompt + checklist GDPR PMI (.md)?
👉 Lo scarichi gratis appena ti iscrivi su https://www.capirelai.com/#newsletter (link in bio @capirelai)!`,
  },
  {
    id: 'reel-chatbot-vs-agenti-jarvis',
    badge: 'JARVIS BRIEF • STUDIO CLEAN HD v2',
    title: "Reel 06 // Chatbot vs Agenti AI: Smetti di Fare Copia-Incolla",
    subtitle: "Versione ottimizzata (31.2s, Studio Clean HD): hook anti-copia-incolla, HUD ad alto contrasto, confronto Chatbot vs Agente AI con tool reali, controllo umano e CTA Follow + Commento",
    video: "/instagram/reels/reel-06-chatbot-vs-agenti-jarvis.mp4",
    filename: "reel-06-chatbot-vs-agenti-jarvis.mp4",
    duration: "31.2 sec",
    specs: "1080×1920 MP4 • Voce Naturale + Studio Clean HD",
    caption: `Usi ancora ChatGPT come un blocco note dove copi e incolli tutto a mano? Ecco perché perdi 2 ore al giorno. 👇

La differenza che quasi nessuno ti mostra sul serio:
❌ CHATBOT = aspetta ogni tuo prompt. Chiedi, copi, incolli, verifichi gli errori e ricominci da zero. Il "motore" sei ancora tu.
✅ AGENTE AI = riceve un obiettivo, decide i passaggi, interroga i tuoi tool (Docs, CRM, Web, fogli), incrocia i dati e ti consegna la bozza finale pronta da approvare.

⚠️ Regola d'oro dai nostri test su capirelai.com: non delegare l'invio cieco — delega ricerca, raccolta e prima bozza, poi tieni il controllo umano sull'ultimo click.

💬 Scrivi "AGENTE" nei commenti e salvati il Reel (ti lascio nel primo commento fissato i 3 stack gratuiti per iniziare subito).
➕ Seguimi se vuoi test AI reali ogni giorno senza fuffa.

#CapirelAI #AgentiAI #AIItalia #ChatGPTItalia #AutomazioneAI #Produttivita #TechItalia #IntelligenzaArtificiale`,
    pinnedComment: `📌 BONUS PROMESSO QUI SOTTO (salva e seguimi per i prossimi test reali):

Se vuoi passare oggi dal "copia-incolla" al primo flusso autonomo a costo zero, i 3 punti di partenza più affidabili dai nostri test sono:
1️⃣ Claude / ChatGPT con Connettori + Projects (per istruzioni fisse e file aziendali)
2️⃣ n8n Self-Hosted o Make Free Tier (per collegare Email, Drive, Slack e webhook)
3️⃣ Perplexity / Tavily API + controllo finale umano prima dell'invio

👇 Dimmi la verità nei commenti: oggi per cosa perdi più tempo a fare copia-incolla a mano? (Email, PDF, report o preventivi?)
💬 Scrivi "AGENTE" se vuoi vedere il prossimo Reel con un flusso costruito passo-passo da zero su capirelai.com — e premi Segui per non perderlo! 🚀`,
  },
  {
    id: 'reel-pdf-50-pagine-jarvis',
    badge: 'JARVIS BRIEF • KAI-01 HD',
    title: "Reel 05 // Contratti e PDF da 50 Pagine in 10 Secondi (Gratis)",
    subtitle: "Dal nodo editoriale Jarvis: hook anti-spreco su contratti e preventivi, protocollo gratuito con NotebookLM/AI, prompt esatto in 5 punti + rischi OCR e KAI-01 PiP",
    video: "/instagram/reels/reel-05-pdf-50-pagine-jarvis.mp4",
    filename: "reel-05-pdf-50-pagine-jarvis.mp4",
    duration: "35.8 sec",
    specs: "1080×1920 MP4 • Voce Naturale + Studio Clean HD",
    caption: `Se leggi ancora PDF, contratti o preventivi da 50 pagine riga per riga, stai buttando ore della tua settimana. 📄⏱️

Ecco il protocollo gratuito in 10 secondi (senza fuffa):
1️⃣ Carica il PDF su NotebookLM o un modello a contesto esteso
2️⃣ Incolla questo prompt esatto in 5 punti:
• Oggetto e obblighi reali
• Rischi e clausole asimmetriche
• Costi fissi o nascosti
• Scadenze di recesso e taciti rinnovi
• Passaggi ambigui da verificare a mano citando la pagina

⚠️ Regola anti-errore: sulle tabelle scansionate verifica sempre i numeri sul file originale prima di firmare.

👉 Commenta "GUIDA" o leggi il metodo completo su capirelai.com (link in bio)

#CapirelAI #AIItalia #PDF #NotebookLM #Produttivita #Contratti #TechItalia #AIPratica`,
  },
  {
    id: 'reel-automazioni-jarvis',
    badge: 'JARVIS BRIEF • KAI-01 HD',
    title: "Reel 04 // 3 Automazioni AI (6 Ore Risparmiate Senza Codice)",
    subtitle: "Dal nodo editoriale Jarvis: hook anti-spreco 6h/settimana, pipeline Email → Sintesi → Calendario, schede documenti auto, briefing settimanale con costi/limiti reali e KAI-01 PiP",
    video: "/instagram/reels/reel-04-automazioni-ai-jarvis.mp4",
    filename: "reel-04-automazioni-ai-jarvis.mp4",
    duration: "39.0 sec",
    specs: "1080×1920 MP4 • Voce Naturale + Studio Clean HD",
    caption: `Se usi ancora ChatGPT solo per fare riassunti, stai lasciando sul tavolo 6 ore ogni settimana. ⏱️⚡

Ecco 3 automazioni AI reali senza scrivere codice (con costi e limiti misurati):
1️⃣ Triage Email → sintesi in 3 righe → bozza slot su Calendario
2️⃣ Documenti lunghi → schede operative con citazione pagina
3️⃣ Monitoraggio fonti → briefing settimanale già filtrato

⚠️ Regola d'oro nei test: l'AI prepara bozze in JSON vincolato, ma la conferma verso l'esterno resta sempre umana.

👉 Commenta "GUIDA" o leggi l'analisi completa su capirelai.com (link in bio)

#CapirelAI #AutomazioniAI #AIItalia #Produttivita #NoCode #ChatGPT #WorkflowAI #TechItalia`,
  },
  {
    id: 'reel-cyborg-viral',
    badge: 'KAI-01 CYBORG HOOK • 60FPS B-ROLL',
    title: "Reel 03 // KAI-01 Mezzo Uomo Mezzo Robot + B-Roll Scorrevoli",
    subtitle: "Personaggio ibrido uomo/umanoide senza movimenti bocca innaturali (barra LED vocale reattiva a 60fps), pan B-Roll scorrevoli (apple vs fragola, matrice token, memoria 3x), PiP live e SFX",
    video: "/instagram/reels/reel-03-cyborg-token-viral.mp4",
    filename: "reel-03-cyborg-token-viral.mp4",
    duration: "26.6 sec",
    specs: "1080×1920 MP4 • 60fps Cyborg + Scrolling B-Roll + PiP",
    caption: `Aspetta… lo sai che ChatGPT e Claude non leggono davvero le tue parole? Vedono solo numeri: i Token. 🤖⚡

E c'è un problema enorme: quasi tutti i modelli AI ragionano nativamente in inglese.
Guarda la differenza reale:
• "apple" = 1 solo token
• "fragola" = 3 token (fra · go · la = +200% di costo!)

Risultato? In italiano paghi fino al triplo sulle API e riempi la memoria 3x più in fretta.

👉 Ho preparato il test live gratuito su capirelai.com (link in bio)

Secondo te quanti token consuma il tuo ultimo prompt in italiano? Provalo e dimmelo qui sotto! 👇

#CapirelAI #AIItalia #CyborgAI #ChatGPT #Token #IntelligenzaArtificiale #TechItalia #LLM #Claude #OpenAI`,
  },
  {
    id: 'reel-token-avatar',
    badge: 'EDIZIONE 60FPS PRO FX • VOCE HD',
    title: "Reel 02 // Avatar Parlato 60fps: Tassa Token sull'Italiano",
    subtitle: "Movimenti continui a 60fps con coarticolazione fonetica, testa/spalle/mani articolate, battiti di ciglia, glitch/zoom FX, SFX audio e voce naturale",
    video: "/instagram/reels/reel-02-token-parlato-avatar.mp4",
    filename: "reel-02-token-parlato-avatar.mp4",
    duration: "26.8 sec",
    specs: "1080×1920 MP4 • 60fps Fluid Motion + Voce HD + SFX",
    caption: `Aspetta… lo sai che ChatGPT e Claude non leggono davvero le tue parole? Vedono solo numeri: i Token. 🧠🎙️

E c'è un problema enorme: quasi tutti i modelli AI ragionano nativamente in inglese.
Guarda qua la differenza reale:
• "apple" = 1 solo token
• "fragola" = te ne brucia 3 (+200% di costo!)

Risultato? In italiano paghi fino al triplo sulle API e riempi subito la memoria del modello.

👉 Ho pubblicato il test completo gratis su capirelai.com (link in bio)

Te ne eri accorto quando le chat finiscono la memoria troppo presto? Scrivimelo nei commenti! 👇

#CapirelAI #AIItalia #ChatGPT #Token #IntelligenzaArtificiale #TechItalia #LLM #PromptEngineering #Claude #OpenAI`,
  },
  {
    id: 'reel-token-3d',
    badge: 'GRAFICA 3D CINETICA',
    title: "Reel 01 // La Tassa Nascosta sull'Italiano (Slide 3D)",
    subtitle: "Hook visivo ad alta ritenzione su sfondo neurale 3D per caroselli video o copertine",
    video: "/instagram/reels/reel-01-token-tassa-italiano.mp4",
    filename: "reel-01-token-tassa-italiano.mp4",
    duration: "14.0 sec",
    specs: "1080×1920 MP4 • H.264",
    caption: `Perché usare ChatGPT o Claude in italiano consuma fino al 300% di Token in più rispetto all'inglese? ⚡📊

I modelli non ragionano a parole, ma a frammenti statistici (Byte-Pair Encoding).
Meno una lingua è compressa nel vocabolario di training, più token servono per esprimere lo stesso concetto.

👉 Leggi l'analisi matematica completa su capirelai.com (link in bio)

#AI #Token #LLM #MachineLearning #CapirelAI #TechItalia #DataScience`,
  },
];

interface InstagramHighlightItem {
  id: string;
  label: string;
  title: string;
  cover: string;
  filename: string;
  slides: { heading: string; copy: string }[];
}

const INSTAGRAM_HIGHLIGHTS: InstagramHighlightItem[] = [
  {
    id: 'chi-sono',
    label: 'Chi Sono',
    title: 'Highlight 01 // Chi Sono & Metodo',
    cover: '/instagram/highlights/highlight-chi-sono.png',
    filename: 'highlight-chi-sono.png',
    slides: [
      {
        heading: 'SLIDE 1 — IDENTITÀ',
        copy: "Zero fuffa e zero '5 prompt magici'. Sono uno studente di ingegneria gestionale e questo è Capire l'AI: come funziona davvero l'AI sotto il cofano.",
      },
      {
        heading: 'SLIDE 2 — METODO',
        copy: 'Ogni guida nasce da un test reale con prompt, codice, latenza e limiti annotati. Se uno strumento sbaglia, te lo mostro.',
      },
    ],
  },
  {
    id: 'guide',
    label: 'Guide AI',
    title: 'Highlight 02 // Guide Tecniche AI',
    cover: '/instagram/highlights/highlight-guide.png',
    filename: 'highlight-guide.png',
    slides: [
      {
        heading: 'SLIDE 1 — FONDAMENTA',
        copy: 'Come ragionano Token, Attention, Embedding e Agenti Autonomi ReAct spiegati chiari su capirelai.com.',
      },
      {
        heading: 'SLIDE 2 — ARCHITETTURE',
        copy: 'Python puro, memoria di contesto e workflow reali senza framework pesanti.',
      },
    ],
  },
  {
    id: 'prove',
    label: 'Test & Prove',
    title: 'Highlight 03 // Benchmark & Prove Reali',
    cover: '/instagram/highlights/highlight-prove.png',
    filename: 'highlight-prove.png',
    slides: [
      {
        heading: 'SLIDE 1 — TOKEN & COSTI',
        copy: 'Confronti diretti italiano vs inglese, costi API reali e allucinazioni nei tool esterni.',
      },
      {
        heading: 'SLIDE 2 — FORUM',
        copy: 'Proponi un modello da testare sul forum aperto di capirelai.com.',
      },
    ],
  },
];

const INSTAGRAM_POSTS: InstagramPostItem[] = [
  {
    id: 'agents',
    title: "Post 03 // Agenti Autonomi & ReAct Loop",
    subtitle: "Architettura di ragionamento, Tool Calling e feedback loop ciclico",
    image: "/instagram/post-agenti-autonomi.png",
    filename: "post-agenti-autonomi.png",
    aspectRatio: "1:1 (1080x1080 PNG)",
    caption: `Un LLM risponde a una domanda. Un Agente AI risolve un problema. 🤖⚡

Qual è la differenza profonda tra una normale chat e un Autonomous Agent?
Il loop ReAct (Reasoning + Acting).

Un modello linguistico da solo è privo di strumenti: non può consultare il web in tempo reale, sbaglia i calcoli matematici complessi e non può interrogare un database.
Un agente autonomo invece ragiona a cicli iterativi:
1️⃣ THOUGHT: Il modello analizza l'obiettivo e progetta il prossimo micro-passo logico.
2️⃣ ACTION: Invoca un tool esterno con argomenti strutturati (es. Python REPL, Vector DB, Search API).
3️⃣ OBSERVATION: Il sistema esegue lo strumento ed inietta il risultato reale nel contesto dell'LLM.
4️⃣ DECISION: Se l'informazione è sufficiente formula la risposta finale, altrimenti ripete il loop.

Nella nuova guida tecnica sul sito analizziamo:
• Come implementare il loop ReAct da zero in Python puro senza framework bloatware
• Gestione della memoria a breve termine per non saturare la context window
• I veri rischi in produzione: loop infiniti e allucinazioni di tool calling

👉 Leggi la guida completa con codice testato su capirelai.com (link in bio)

Hai già provato a costruire un agente o usi solo chat standard? Parliamone nei commenti o sul forum! 💬

#AgentiAI #Python #MachineLearning #LLM #ToolCalling #ArtificialIntelligence #SoftwareEngineering #DataScience #CapirelAI #TechItalia #Coding`,
  },
  {
    id: 'tokens',
    title: "Post 02 // Token & Vocabolario",
    subtitle: "Grafica 1:1 per feed Instagram (BPE, matrici, compressione token)",
    image: "/instagram/post-token-vocabolario.png",
    filename: "post-token-vocabolario.png",
    aspectRatio: "1:1 (1080x1080 PNG)",
    caption: `Un LLM non legge parole. Non sa cosa sia una frase. Per un modello linguistico, l'intero universo testuale è ridotto a numeri interi: i Token. 🧠⚡

Come fa 'incredibile' a diventare [472, 891]?
Attraverso il Byte-Pair Encoding (BPE), l'algoritmo che scompone le parole in sillabe e frammenti statistici ricorrenti.

Nel nuovo articolo sul sito analizziamo:
1️⃣ Perché 'apple' è 1 token e 'fragola' sono 3 token (e perché l'italiano paga una 'tassa di tokenizzazione' rispetto all'inglese).
2️⃣ Come la grandezza del vocabolario (da 32k a 128k token) influisce su memoria, VRAM e calcolo della matrice di embedding.
3️⃣ L'impatto diretto sui costi API di OpenAI e Anthropic: perché prompt scritti male quadruplicano la spesa.

👉 Leggi l'approfondimento completo su capirelai.com (link in bio)

E tu misuri i token nei tuoi prompt o paghi alla cieca? Discutiamone nei commenti o sul nostro forum! 💬

#AI #MachineLearning #Token #LLM #DeepLearning #Python #DataScience #Informatica #TechItalia #CapirelAI #SoftwareEngineering`,
  },
  {
    id: 'manifesto',
    title: "Post 01 // Manifesto Capire l'AI",
    subtitle: "Grafica di lancio canale e annuncio portale",
    image: "/instagram/post-manifesto.png",
    filename: "post-manifesto.png",
    aspectRatio: "1:1 (1080x1080 PNG)",
    caption: `Zero Hype. Solo Ingegneria, Metodo e Test Reali. 🔬

Capire l'AI nasce da un'esigenza chiara: oggi tutti parlano di intelligenza artificiale, ma pochissimi spiegano come funziona veramente sotto il cofano.

Non siamo qui per venderti corsi o prometterti miracoli con '5 prompt magici'.
Siamo uno spazio indipendente di analisi tecnica, guide pratiche documentate e benchmark reali.

Cosa troverai su capirelai.com:
⚡ Architetture LLM spiegate matematicamente
🛠️ Guide passo-passo testate sul campo
📊 Prove comparative di inferenza, latenza e costi
💬 Forum aperto della community per confrontarsi

👉 Scopri il portale: link in bio su capirelai.com

#CapirelAI #IntelligenzaArtificiale #TechItalia #Ingegneria #LLM #OpenSource #Programmazione #Coding #DataEngineering`,
  },
];

function InstagramKitModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [section, setSection] = useState<'reels' | 'highlights' | 'posts'>('reels');
  const [selectedReelId, setSelectedReelId] = useState<string>('reel-spot-3d-chatgpt-rof');
  const [selectedHighlightId, setSelectedHighlightId] = useState<string>('chi-sono');
  const [selectedPostId, setSelectedPostId] = useState<string>('agents');
  const [copied, setCopied] = useState(false);
  const [copiedComment, setCopiedComment] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentReel = INSTAGRAM_REELS.find((r) => r.id === selectedReelId) || INSTAGRAM_REELS[0];
  const currentHighlight = INSTAGRAM_HIGHLIGHTS.find((h) => h.id === selectedHighlightId) || INSTAGRAM_HIGHLIGHTS[0];
  const currentPost = INSTAGRAM_POSTS.find((p) => p.id === selectedPostId) || INSTAGRAM_POSTS[0];

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyComment = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedComment(true);
    setTimeout(() => setCopiedComment(false), 2500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
        backdropFilter: 'blur(12px)',
        userSelect: 'text',
        pointerEvents: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          overflowY: 'auto',
          backgroundColor: '#0a0a0f',
          border: '1px solid rgba(244, 63, 94, 0.5)',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 0 60px rgba(244, 63, 94, 0.25)',
          color: '#dddddd',
          fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid #222228' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', padding: '3px 8px', backgroundColor: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '3px', fontWeight: 700, textTransform: 'uppercase' }}>
                INSTAGRAM ASSET STUDIO
              </span>
              <span style={{ fontSize: '11px', color: '#888888' }}>• Reel Parlati MP4, Storie in Evidenza &amp; Post Feed</span>
            </div>
            <h2 style={{ margin: '6px 0 0 0', fontSize: '19px', fontWeight: 700, color: '#ffffff' }}>
              Kit Lancio Completo Instagram — Capire l&apos;AI
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: '#888888', fontSize: '20px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Category Switcher */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '14px 0', borderBottom: '1px solid #1a1a22' }}>
          <button
            type="button"
            onClick={() => setSection('reels')}
            style={{
              padding: '9px 14px',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              fontFamily: 'inherit',
              cursor: 'pointer',
              borderRadius: '4px',
              border: section === 'reels' ? '1px solid #38bdf8' : '1px solid #252530',
              backgroundColor: section === 'reels' ? 'rgba(56, 189, 248, 0.16)' : '#121218',
              color: section === 'reels' ? '#ffffff' : '#888888',
            }}
          >
            🎬 Reel Virali MP4 (9:16)
          </button>
          <button
            type="button"
            onClick={() => setSection('highlights')}
            style={{
              padding: '9px 14px',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              fontFamily: 'inherit',
              cursor: 'pointer',
              borderRadius: '4px',
              border: section === 'highlights' ? '1px solid #f43f5e' : '1px solid #252530',
              backgroundColor: section === 'highlights' ? 'rgba(244, 63, 94, 0.16)' : '#121218',
              color: section === 'highlights' ? '#ffffff' : '#888888',
            }}
          >
            ⭐ Storie in Evidenza (3)
          </button>
          <button
            type="button"
            onClick={() => setSection('posts')}
            style={{
              padding: '9px 14px',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              fontFamily: 'inherit',
              cursor: 'pointer',
              borderRadius: '4px',
              border: section === 'posts' ? '1px solid #f43f5e' : '1px solid #252530',
              backgroundColor: section === 'posts' ? 'rgba(244, 63, 94, 0.16)' : '#121218',
              color: section === 'posts' ? '#ffffff' : '#888888',
            }}
          >
            📸 Post Feed PNG (3)
          </button>
        </div>

        {/* SECTION 1: REELS MP4 */}
        {section === 'reels' && (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '14px' }}>
              {INSTAGRAM_REELS.map((reel) => (
                <button
                  key={reel.id}
                  type="button"
                  onClick={() => setSelectedReelId(reel.id)}
                  style={{
                    padding: '7px 12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    border: selectedReelId === reel.id ? '1px solid #38bdf8' : '1px solid #252530',
                    backgroundColor: selectedReelId === reel.id ? 'rgba(56, 189, 248, 0.14)' : '#121218',
                    color: selectedReelId === reel.id ? '#ffffff' : '#999999',
                  }}
                >
                  {reel.id === 'reel-spot-3d-chatgpt-rof'
                    ? '🎬 Reel 09: Spot 3D ChatGPT (NEW)'
                    : reel.id === 'reel-regola-rof-risposte-banali-jarvis'
                      ? '⚡ Reel 08: Regola R.O.F.'
                      : reel.id === 'reel-testi-anti-robot-jarvis'
                        ? '🤖 Reel 07: Testi Anti-Robot'
                        : reel.id === 'reel-chatbot-vs-agenti-jarvis'
                          ? '🤖 Reel 06: Chatbot vs Agenti'
                          : reel.id === 'reel-pdf-50-pagine-jarvis'
                            ? '📄 Reel 05: PDF 50 Pag. 10s'
                            : reel.id === 'reel-automazioni-jarvis'
                              ? '⚡ Reel 04: 3 Automazioni AI'
                              : reel.id === 'reel-cyborg-viral'
                                ? '🤖 Reel 03: Cyborg + B-Roll'
                                : reel.id === 'reel-token-avatar'
                                  ? '🎙️ Reel 02: Avatar Parlato + Voce'
                                  : '⚡ Reel 01: Slide 3D Token'}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', paddingTop: '18px' }}>
              {/* Vertical 9:16 Video Player */}
              <div>
                <div style={{ fontSize: '11px', color: '#888888', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{currentReel.badge}</span>
                  <span style={{ color: '#38bdf8' }}>{currentReel.duration} • {currentReel.specs}</span>
                </div>

                <div style={{ position: 'relative', width: '100%', maxWidth: '340px', margin: '0 auto', aspectRatio: '9/16', backgroundColor: '#000000', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(56, 189, 248, 0.45)', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.8)' }}>
                  <video
                    key={currentReel.video}
                    src={currentReel.video}
                    poster={currentReel.poster}
                    controls
                    playsInline
                    preload="auto"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>

                <div style={{ marginTop: '12px', display: 'flex', gap: '10px', maxWidth: '340px', marginInline: 'auto' }}>
                  <a
                    href={currentReel.video}
                    download={currentReel.filename}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px 14px',
                      backgroundColor: '#38bdf8',
                      color: '#000000',
                      textDecoration: 'none',
                      fontSize: '11px',
                      fontWeight: 700,
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    ⬇ Scarica Reel MP4
                  </a>
                  <a
                    href={currentReel.video}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '10px 14px',
                      backgroundColor: '#16161f',
                      border: '1px solid #2a2a38',
                      color: '#cccccc',
                      textDecoration: 'none',
                      fontSize: '11px',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Apri ↗
                  </a>
                </div>
              </div>

              {/* Caption & Notes */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '12px' }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#ffffff' }}>{currentReel.title}</h3>
                  <p style={{ margin: 0, fontSize: '11.5px', color: '#999999', lineHeight: 1.5 }}>{currentReel.subtitle}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#888888' }}>DIDASCALIA REEL PRONTA</span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(currentReel.caption)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: copied ? '#22c55e' : '#f43f5e',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                    }}
                  >
                    {copied ? '✓ COPIATO!' : '📋 COPIA DIDASCALIA'}
                  </button>
                </div>

                <div
                  style={{
                    flex: 1,
                    padding: '14px',
                    backgroundColor: '#0e0e14',
                    border: '1px solid #242430',
                    borderRadius: '6px',
                    fontSize: '12px',
                    lineHeight: 1.6,
                    color: '#cccccc',
                    whiteSpace: 'pre-line',
                    overflowY: 'auto',
                    maxHeight: currentReel.pinnedComment ? '220px' : '360px',
                  }}
                >
                  {currentReel.caption}
                </div>

                {currentReel.pinnedComment && (
                  <div style={{ marginTop: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#38bdf8' }}>
                        📌 PRIMO COMMENTO DA PUBBLICARE SUBITO SOTTO (PER PRENDERE FOLLOWER)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyComment(currentReel.pinnedComment!)}
                        style={{
                          padding: '4px 10px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          backgroundColor: copiedComment ? '#22c55e' : '#0284c7',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                        }}
                      >
                        {copiedComment ? '✓ COMMENTO COPIATO!' : '📋 COPIA COMMENTO'}
                      </button>
                    </div>
                    <div
                      style={{
                        padding: '12px',
                        backgroundColor: 'rgba(56, 189, 248, 0.06)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        lineHeight: 1.55,
                        color: '#d8e9f5',
                        whiteSpace: 'pre-line',
                        overflowY: 'auto',
                        maxHeight: '190px',
                      }}
                    >
                      {currentReel.pinnedComment}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '14px', padding: '12px', backgroundColor: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '4px', fontSize: '11.5px', color: '#b0b0b8', lineHeight: 1.5 }}>
                  🔊 <strong style={{ color: '#ffffff' }}>Audio incluso:</strong> Premi Play sul video per ascoltare voce italiana + waveform live. Scarica il file MP4 e caricalo direttamente su Instagram Reels senza aggiungere altra musica sopra il parlato. Pubblica la didascalia e incolla subito il <strong style={{ color: '#38bdf8' }}>Primo Commento fissato in alto</strong> per spingere salvataggi e nuovi follower.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: HIGHLIGHTS */}
        {section === 'highlights' && (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '14px' }}>
              {INSTAGRAM_HIGHLIGHTS.map((hl) => (
                <button
                  key={hl.id}
                  type="button"
                  onClick={() => setSelectedHighlightId(hl.id)}
                  style={{
                    padding: '7px 12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    border: selectedHighlightId === hl.id ? '1px solid #f43f5e' : '1px solid #252530',
                    backgroundColor: selectedHighlightId === hl.id ? 'rgba(244, 63, 94, 0.14)' : '#121218',
                    color: selectedHighlightId === hl.id ? '#ffffff' : '#999999',
                  }}
                >
                  ⭐ {hl.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', paddingTop: '18px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#888888', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>COPERTINA HIGHLIGHT (CERCHIO IG)</span>
                  <span style={{ color: '#38bdf8' }}>1080×1080 PNG</span>
                </div>
                <div style={{ width: '260px', height: '260px', margin: '12px auto', borderRadius: '50%', overflow: 'hidden', border: '2px solid #38bdf8', boxShadow: '0 0 35px rgba(56, 189, 248, 0.3)', backgroundColor: '#000000' }}>
                  <img src={currentHighlight.cover} alt={currentHighlight.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'center' }}>
                  <a
                    href={currentHighlight.cover}
                    download={currentHighlight.filename}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '10px 18px',
                      backgroundColor: '#38bdf8',
                      color: '#000000',
                      textDecoration: 'none',
                      fontSize: '11px',
                      fontWeight: 700,
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    ⬇ Scarica Copertina PNG
                  </a>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', color: '#ffffff' }}>{currentHighlight.title}</h3>
                {currentHighlight.slides.map((sl, i) => (
                  <div key={i} style={{ padding: '14px', backgroundColor: '#0e0e14', border: '1px solid #242430', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>{sl.heading}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(sl.copy)}
                        style={{ padding: '3px 8px', fontSize: '10px', fontWeight: 700, backgroundColor: '#1b1b26', color: '#dddddd', border: '1px solid #2e2e3d', borderRadius: '3px', cursor: 'pointer' }}
                      >
                        📋 COPIA
                      </button>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.55, color: '#cccccc' }}>{sl.copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: FEED POSTS */}
        {section === 'posts' && (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '14px' }}>
              {INSTAGRAM_POSTS.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => setSelectedPostId(post.id)}
                  style={{
                    padding: '7px 12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    border: selectedPostId === post.id ? '1px solid #f43f5e' : '1px solid #252530',
                    backgroundColor: selectedPostId === post.id ? 'rgba(244, 63, 94, 0.15)' : '#121218',
                    color: selectedPostId === post.id ? '#ffffff' : '#888888',
                  }}
                >
                  {post.id === 'agents' ? '🤖 Agenti Autonomi' : post.id === 'tokens' ? '⚡ Token & Vocabolario' : '📖 Manifesto Lancio'}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', paddingTop: '20px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#888888', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>ANTEPRIMA GRAFICA ({currentPost.aspectRatio})</span>
                  <span style={{ color: '#38bdf8' }}>HD 1080x1080</span>
                </div>

                <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', backgroundColor: '#000000', borderRadius: '6px', overflow: 'hidden', border: '1px solid #2a2a35', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)' }}>
                  <img
                    src={currentPost.image}
                    alt={currentPost.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>

                <div style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
                  <a
                    href={currentPost.image}
                    download={currentPost.filename}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px 14px',
                      backgroundColor: '#38bdf8',
                      color: '#000000',
                      textDecoration: 'none',
                      fontSize: '11px',
                      fontWeight: 700,
                      borderRadius: '4px',
                      textAlign: 'center',
                      textTransform: 'uppercase',
                    }}
                  >
                    ⬇ Scarica PNG HD
                  </a>
                  <a
                    href={currentPost.image}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '10px 14px',
                      backgroundColor: '#16161f',
                      border: '1px solid #2a2a38',
                      color: '#cccccc',
                      textDecoration: 'none',
                      fontSize: '11px',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Apri PNG Full ↗
                  </a>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#888888' }}>DIDASCALIA &amp; HASHTAG PRONTI</span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(currentPost.caption)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: copied ? '#22c55e' : '#f43f5e',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                    }}
                  >
                    {copied ? '✓ COPIATO!' : '📋 COPIA DIDASCALIA'}
                  </button>
                </div>

                <div
                  style={{
                    flex: 1,
                    padding: '14px',
                    backgroundColor: '#0e0e14',
                    border: '1px solid #242430',
                    borderRadius: '6px',
                    fontSize: '12px',
                    lineHeight: 1.6,
                    color: '#cccccc',
                    whiteSpace: 'pre-line',
                    overflowY: 'auto',
                    maxHeight: '380px',
                  }}
                >
                  {currentPost.caption}
                </div>

                <div style={{ marginTop: '14px', padding: '12px', backgroundColor: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '4px', fontSize: '11.5px', color: '#b0b0b8', lineHeight: 1.5 }}>
                  💡 <strong style={{ color: '#ffffff' }}>Come pubblicare:</strong> Apri Instagram da smartphone o desktop, carica la grafica scaricata, incolla questa didascalia e assicurati che il link in bio punti a <strong style={{ color: '#38bdf8' }}>capirelai.com</strong>.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 3. LETTORE ARTICOLI MODALE
// ==========================================
function ArticleReaderModal({
  article,
  onClose,
  onGoNewsletter,
}: {
  article: FullArticleData | null;
  onClose: () => void;
  onGoNewsletter: (sourceTitle: string) => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (article) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [article, onClose]);

  if (!article) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(10px)',
        userSelect: 'text',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '760px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#09090c',
          border: '1px solid rgba(56, 189, 248, 0.5)',
          borderRadius: '6px',
          padding: '28px',
          boxShadow: '0 0 60px rgba(56, 189, 248, 0.25)',
          color: '#dddddd',
          fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid #222222' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', padding: '3px 8px', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '3px', textTransform: 'uppercase', fontWeight: 600 }}>
              {article.tag}
            </span>
            <span style={{ fontSize: '11px', color: '#777777' }}>
              {article.section} • {article.readTime}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: '#8a8a8a', fontSize: '20px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <div style={{ paddingTop: '20px', paddingBottom: '12px' }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '22px', fontWeight: 700, color: '#ffffff', lineHeight: 1.3 }}>
            {article.title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: '#888888' }}>
            <span>Autore: <strong style={{ color: '#ffffff' }}>{article.author}</strong></span>
            <span>•</span>
            <span>Data: {article.date}</span>
          </div>
        </div>

        <div style={{ padding: '14px', backgroundColor: '#111115', borderLeft: '3px solid #38bdf8', borderRadius: '0 4px 4px 0', fontSize: '13px', color: '#bbbbbb', lineHeight: 1.6, margin: '14px 0' }}>
          {article.summary}
        </div>

        <div style={{ paddingTop: '10px', fontSize: '13px', lineHeight: 1.7, color: '#cccccc' }}>
          {article.content.map((sec, idx) => (
            <div key={idx} style={{ marginBottom: '22px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.03em', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#38bdf8' }}>0{idx + 1}.</span> {sec.heading}
              </h2>
              <p style={{ textAlign: 'justify', margin: 0, color: '#cccccc' }}>{sec.text}</p>
              {sec.highlight && (
                <div style={{ padding: '10px 14px', backgroundColor: '#15151a', border: '1px solid #26262a', borderRadius: '4px', fontSize: '12px', color: '#38bdf8', fontWeight: 600, marginTop: '10px' }}>
                  💡 {sec.highlight}
                </div>
              )}
              {sec.codeSnippet && (
                <pre style={{ padding: '12px', backgroundColor: '#000000', border: '1px solid #2a2a2a', borderRadius: '4px', overflowX: 'auto', fontSize: '11px', color: '#e0e0e0', lineHeight: 1.5, marginTop: '10px' }}>
                  <code>{sec.codeSnippet}</code>
                </pre>
              )}
            </div>
          ))}

          <div style={{ padding: '16px', backgroundColor: '#0e0e12', border: '1px solid #222222', borderRadius: '4px', margin: '20px 0' }}>
            <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px 0' }}>
              [ PUNTI CHIAVE DA RICORDARE ]
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {article.keyTakeaways.map((point, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#bbbbbb', marginBottom: '6px' }}>
                  <span style={{ color: '#38bdf8' }}>▸</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div style={{ paddingTop: '16px', borderTop: '1px solid #222222', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            Vuoi ricevere i prossimi test AI e il Kit Operativo R.O.F. ogni settimana?
          </span>
          <button
            type="button"
            onClick={() => {
              const title = article.title;
              onClose();
              onGoNewsletter(title);
            }}
            style={{ padding: '10px 18px', fontSize: '12px', fontWeight: 700, backgroundColor: '#38bdf8', border: 'none', color: '#020617', borderRadius: '6px', cursor: 'pointer' }}
          >
            Scarica il Kit nella Newsletter ↓
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. FORUM COMMUNITY INTERATTIVO
// ==========================================
interface ThreadItem {
  id: string;
  category: string;
  categoryLabel: string;
  title: string;
  author: string;
  date: string;
  content: string;
  tags: string[];
  upvotes: number;
  replies: { author: string; date: string; content: string }[];
}

const SEED_THREADS: ThreadItem[] = [
  {
    id: 't-1',
    category: 'concetti',
    categoryLabel: 'CONCETTI',
    title: 'Benvenuti nel Forum Capire l\'AI: Linee guida per il confronto tecnico',
    author: 'Fondatore Capire l\'AI',
    date: 'Oggi',
    content: 'Capire l\'AI nasce per eliminare l\'hype e analizzare l\'intelligenza artificiale con rigore, trasparenza e prove sul campo.\n\nCondividi pure benchmark, workflow su RAG o dubbi sui Transformer!',
    tags: ['#community', '#linee-guida'],
    upvotes: 42,
    replies: [
      { author: 'Elena_AI', date: 'Oggi 10:15', content: 'Ottima iniziativa! Finalmente uno spazio focalizzato sulla sostanza tecnica senza clickbait.' },
    ],
  },
  {
    id: 't-2',
    category: 'guide',
    categoryLabel: 'GUIDE',
    title: 'RAG Ibrido: BM25 + Dense con Cross-Encoder. Esperienze?',
    author: 'Davide_ML',
    date: 'Ieri',
    content: 'Su 15.000 pagine di documenti contrattuali la ricerca vettoriale pura perdeva numeri di articoli specifici. Aggiungendo BM25 e Re-ranking le allucinazioni sono crollate.',
    tags: ['#rag', '#embeddings', '#rerank'],
    upvotes: 28,
    replies: [
      { author: 'Fondatore Capire l\'AI', date: 'Ieri 19:20', content: 'Confermo: per documenti tecnici BM25 abbinato a un dense embedding è fondamentale.' },
    ],
  },
  {
    id: 't-3',
    category: 'prove',
    categoryLabel: 'BENCHMARK',
    title: 'DeepSeek-R1 in locale con Ollama su Mac M3: Throughput e riflessioni',
    author: 'Matteo_Dev',
    date: '2 giorni fa',
    content: 'Testata la versione quantizzata a 4-bit: circa 18 token/sec su Apple Silicon con 64GB RAM. Capacità di Chain-of-Thought ottima su coding TypeScript.',
    tags: ['#deepseek', '#ollama', '#local-ai'],
    upvotes: 35,
    replies: [],
  },
];

function InteractiveForum() {
  const [threads, setThreads] = useState<ThreadItem[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const s = localStorage.getItem('capirelai_threads_v2');
        if (s) {
          const parsed = JSON.parse(s);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch {}
    return SEED_THREADS;
  });

  const [activeCat, setActiveCat] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedThread, setSelectedThread] = useState<ThreadItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [nTitle, setNTitle] = useState('');
  const [nCat, setNCat] = useState('concetti');
  const [nAuthor, setNAuthor] = useState('');
  const [nContent, setNContent] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyAuthor, setReplyAuthor] = useState('');

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('capirelai_threads_v2', JSON.stringify(threads));
      }
    } catch {}
  }, [threads]);

  const handleUpvote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, upvotes: (t.upvotes || 0) + 1 } : t))
    );
    if (selectedThread && selectedThread.id === id) {
      setSelectedThread({ ...selectedThread, upvotes: (selectedThread.upvotes || 0) + 1 });
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nTitle.trim() || !nContent.trim()) return;
    const catMap: Record<string, string> = {
      concetti: 'CONCETTI',
      guide: 'GUIDE',
      prove: 'BENCHMARK',
      news: 'NEWS & OPEN',
    };
    const newT: ThreadItem = {
      id: `t-${Date.now()}`,
      category: nCat,
      categoryLabel: catMap[nCat] || 'DISCUSSIONE',
      title: nTitle.trim(),
      author: nAuthor.trim() || 'Membro Community',
      date: 'Poco fa',
      content: nContent.trim(),
      tags: [`#${nCat}`],
      upvotes: 1,
      replies: [],
    };
    setThreads([newT, ...threads]);
    setIsModalOpen(false);
    setSelectedThread(newT);
    setNTitle('');
    setNAuthor('');
    setNContent('');
  };

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThread || !replyText.trim()) return;
    const newRep = {
      author: replyAuthor.trim() || 'Utente',
      date: 'Poco fa',
      content: replyText.trim(),
    };
    const currentReplies = Array.isArray(selectedThread.replies) ? selectedThread.replies : [];
    const updated = threads.map((t) =>
      t.id === selectedThread.id ? { ...t, replies: [...(Array.isArray(t.replies) ? t.replies : []), newRep] } : t
    );
    setThreads(updated);
    setSelectedThread({ ...selectedThread, replies: [...currentReplies, newRep] });
    setReplyText('');
  };

  const handleResetDefault = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('capirelai_threads_v2');
      }
    } catch {}
    setThreads(SEED_THREADS);
    setSelectedThread(null);
    setIsModalOpen(false);
    setActiveCat('all');
    setSearch('');
  };

  const filtered = (threads || []).filter((t) => {
    if (!t) return false;
    const matchCat = activeCat === 'all' || t.category === activeCat;
    const title = t.title || '';
    const content = t.content || '';
    const author = t.author || '';
    const q = search.trim().toLowerCase();
    const matchSearch =
      q === '' ||
      title.toLowerCase().includes(q) ||
      content.toLowerCase().includes(q) ||
      author.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <div style={{ backgroundColor: 'rgba(8, 8, 11, 0.95)', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '8px', padding: '28px', boxShadow: '0 0 50px rgba(56, 189, 248, 0.2)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', paddingBottom: '20px', borderBottom: '1px solid #222226' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38bdf8' }}></span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              CAPIRE L&apos;AI • FORUM DELLA COMMUNITY
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.03em' }}>
            Forum Tecnico &amp; Spazio di Confronto
          </h2>
          <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#999999', maxWidth: '650px', lineHeight: 1.5 }}>
            Uno spazio aperto dove confrontarsi, chiedere supporto, condividere prompt e verificare i modelli sul campo senza filtri di marketing.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          style={{ padding: '10px 18px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', backgroundColor: '#38bdf8', color: '#000000', border: 'none', borderRadius: '4px', cursor: 'pointer', boxShadow: '0 0 20px rgba(56, 189, 248, 0.35)', position: 'relative', zIndex: 5 }}
        >
          + NUOVA DISCUSSIONE
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto' }}>
          {[
            { id: 'all', label: 'TUTTI I TOPIC' },
            { id: 'concetti', label: 'CONCETTI' },
            { id: 'guide', label: 'GUIDE' },
            { id: 'prove', label: 'BENCHMARK' },
            { id: 'news', label: 'NEWS & OPEN' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCat(cat.id)}
              style={{
                padding: '6px 12px',
                fontSize: '11px',
                textTransform: 'uppercase',
                borderRadius: '3px',
                cursor: 'pointer',
                border: activeCat === cat.id ? '1px solid #38bdf8' : '1px solid #222226',
                backgroundColor: activeCat === cat.id ? '#38bdf8' : '#121216',
                color: activeCat === cat.id ? '#000000' : '#aaaaaa',
                fontWeight: activeCat === cat.id ? 700 : 400,
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="text"
            placeholder="Cerca discussione..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ backgroundColor: '#111116', border: '1px solid #222228', borderRadius: '4px', padding: '6px 12px', fontSize: '12px', color: '#ffffff', outline: 'none' }}
          />
          <button
            type="button"
            onClick={handleResetDefault}
            title="Ripristina discussioni iniziali"
            style={{ padding: '6px 10px', fontSize: '11px', backgroundColor: '#131318', border: '1px solid #2a2a35', borderRadius: '4px', color: '#888888', cursor: 'pointer' }}
          >
            ↺ Reset
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '8px' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', backgroundColor: '#0d0d12', border: '1px dashed #262630', borderRadius: '6px' }}>
            <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#888888' }}>
              Nessuna discussione trovata per la ricerca o categoria selezionata.
            </p>
            <button
              type="button"
              onClick={() => { setActiveCat('all'); setSearch(''); }}
              style={{ padding: '6px 14px', fontSize: '11px', textTransform: 'uppercase', color: '#38bdf8', backgroundColor: 'transparent', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '3px', cursor: 'pointer' }}
            >
              Mostra tutte le discussioni
            </button>
          </div>
        ) : (
          filtered.map((th) => (
            <div
              key={th.id}
              onClick={() => setSelectedThread(th)}
              style={{
                padding: '16px 20px',
                backgroundColor: 'rgba(14, 14, 19, 0.9)',
                border: '1px solid #1f1f26',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                transition: 'border 0.2s ease',
              }}
            >
              <div style={{ flex: '1 1 300px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ padding: '2px 6px', fontSize: '9px', textTransform: 'uppercase', fontWeight: 600, color: '#8a8a8a', backgroundColor: '#1a1a20', borderRadius: '2px', border: '1px solid #26262e' }}>
                    {th.categoryLabel || 'DISCUSSIONE'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#666666' }}>
                    di <strong style={{ color: '#cccccc', fontWeight: 500 }}>{th.author || 'Anonimo'}</strong> • {th.date || 'Recente'}
                  </span>
                </div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 700, color: '#ffffff', lineHeight: 1.35 }}>
                  {th.title}
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#888888', lineHeight: 1.5 }}>
                  {(th.content || '').length > 130 ? (th.content || '').substring(0, 130) + '...' : (th.content || '')}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', color: '#888888' }}>
                <button
                  type="button"
                  onClick={(e) => handleUpvote(e, th.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#171720', border: '1px solid #2a2a35', borderRadius: '4px', color: '#ffffff', cursor: 'pointer' }}
                >
                  <span style={{ color: '#38bdf8' }}>▲</span>
                  <span style={{ fontWeight: 700 }}>{th.upvotes || 0}</span>
                </button>
                <span>💬 {(th.replies || []).length}</span>
                <span style={{ color: '#38bdf8' }}>→</span>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedThread && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backgroundColor: 'rgba(0, 0, 0, 0.88)', backdropFilter: 'blur(10px)', userSelect: 'text', pointerEvents: 'auto' }}
          onClick={() => setSelectedThread(null)}
        >
          <div
            style={{ position: 'relative', width: '100%', maxWidth: '760px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#09090d', border: '1px solid rgba(56, 189, 248, 0.5)', borderRadius: '6px', padding: '28px', boxShadow: '0 0 60px rgba(56, 189, 248, 0.25)', color: '#dddddd', fontFamily: 'inherit' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '14px', borderBottom: '1px solid #222226' }}>
              <span style={{ fontSize: '10px', padding: '3px 8px', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '3px', textTransform: 'uppercase', fontWeight: 600 }}>
                {selectedThread.categoryLabel || 'DISCUSSIONE'}
              </span>
              <button type="button" onClick={() => setSelectedThread(null)} style={{ background: 'none', border: 'none', color: '#8a8a8a', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ paddingTop: '16px', paddingBottom: '12px' }}>
              <h1 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>{selectedThread.title}</h1>
              <div style={{ fontSize: '11px', color: '#888888', paddingBottom: '14px', borderBottom: '1px solid #1c1c22' }}>
                Postato da <strong style={{ color: '#ffffff' }}>{selectedThread.author || 'Anonimo'}</strong> • {selectedThread.date}
              </div>
            </div>

            <div style={{ padding: '14px 0', fontSize: '13px', lineHeight: 1.7, color: '#cccccc', whiteSpace: 'pre-line', borderBottom: '1px solid #222226' }}>
              {selectedThread.content}
            </div>

            <div style={{ paddingTop: '20px' }}>
              <h4 style={{ margin: '0 0 14px 0', fontSize: '13px', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase' }}>
                Risposte ({(selectedThread.replies || []).length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {(selectedThread.replies || []).length === 0 ? (
                  <p style={{ margin: 0, fontSize: '12px', color: '#777777', fontStyle: 'italic' }}>
                    Nessuna risposta ancora. Sii il primo a intervenire!
                  </p>
                ) : (
                  (selectedThread.replies || []).map((r, i) => (
                    <div key={i} style={{ padding: '12px', backgroundColor: '#111116', border: '1px solid #1e1e24', borderRadius: '4px', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888888', fontSize: '10px', marginBottom: '4px' }}>
                        <strong style={{ color: '#ffffff' }}>{r.author}</strong>
                        <span>{r.date}</span>
                      </div>
                      <p style={{ margin: 0, color: '#bbbbbb', lineHeight: 1.5 }}>{r.content}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleReply} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px', backgroundColor: '#0e0e13', border: '1px solid #222228', borderRadius: '4px' }}>
                <input
                  type="text"
                  placeholder="Il tuo nome / nickname"
                  value={replyAuthor}
                  onChange={(e) => setReplyAuthor(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#14141a', border: '1px solid #2a2a33', borderRadius: '3px', padding: '8px 12px', fontSize: '12px', color: '#ffffff', outline: 'none' }}
                />
                <textarea
                  rows={3}
                  placeholder="Scrivi qui la tua risposta..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#14141a', border: '1px solid #2a2a33', borderRadius: '3px', padding: '10px 12px', fontSize: '12px', color: '#ffffff', outline: 'none', resize: 'none' }}
                  required
                />
                <button
                  type="submit"
                  style={{ alignSelf: 'flex-start', padding: '8px 16px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', backgroundColor: '#38bdf8', color: '#000000', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                >
                  Pubblica Risposta -&gt;
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backgroundColor: 'rgba(0, 0, 0, 0.88)', backdropFilter: 'blur(10px)', userSelect: 'text', pointerEvents: 'auto' }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{ position: 'relative', width: '100%', maxWidth: '600px', backgroundColor: '#09090d', border: '1px solid rgba(56, 189, 248, 0.5)', borderRadius: '6px', padding: '24px', boxShadow: '0 0 60px rgba(56, 189, 248, 0.25)', color: '#dddddd', fontFamily: 'inherit' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #222226', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>Nuova Discussione nel Forum</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#8a8a8a', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#aaaaaa', display: 'block', marginBottom: '4px' }}>Categoria</label>
                <select
                  value={nCat}
                  onChange={(e) => setNCat(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#121217', border: '1px solid #2a2a33', borderRadius: '4px', padding: '8px 12px', fontSize: '12px', color: '#ffffff' }}
                >
                  <option value="concetti">CONCETTI &amp; ARCHITETTURE</option>
                  <option value="guide">GUIDE &amp; TUTORIAL</option>
                  <option value="prove">BENCHMARK &amp; TEST</option>
                  <option value="news">NEWS &amp; OPEN SOURCE</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#aaaaaa', display: 'block', marginBottom: '4px' }}>Titolo</label>
                <input
                  type="text"
                  placeholder="Es. Come ottimizzare RAG su documenti complessi?"
                  value={nTitle}
                  onChange={(e) => setNTitle(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#121217', border: '1px solid #2a2a33', borderRadius: '4px', padding: '8px 12px', fontSize: '12px', color: '#ffffff' }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#aaaaaa', display: 'block', marginBottom: '4px' }}>Nome / Nickname</label>
                <input
                  type="text"
                  placeholder="Il tuo nome"
                  value={nAuthor}
                  onChange={(e) => setNAuthor(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#121217', border: '1px solid #2a2a33', borderRadius: '4px', padding: '8px 12px', fontSize: '12px', color: '#ffffff' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#aaaaaa', display: 'block', marginBottom: '4px' }}>Messaggio</label>
                <textarea
                  rows={4}
                  placeholder="Descrivi l'argomento o la domanda..."
                  value={nContent}
                  onChange={(e) => setNContent(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#121217', border: '1px solid #2a2a33', borderRadius: '4px', padding: '10px 12px', fontSize: '12px', color: '#ffffff', resize: 'vertical' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#8a8a8a', fontSize: '12px', cursor: 'pointer' }}>Annulla</button>
                <button type="submit" style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', backgroundColor: '#38bdf8', color: '#000000', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Pubblica Topic -&gt;</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 5. COMPONENTE PRINCIPALE (CON STILI ROBUSTI)
// ==========================================
export default function CapirelAiHero() {
  const [isChiSonoOpen, setIsChiSonoOpen] = useState(false);
  const [isInstagramOpen, setIsInstagramOpen] = useState(false);
  const [isFounderOpen, setIsFounderOpen] = useState(false);
  const [isForumModalOpen, setIsForumModalOpen] = useState(false);
  const [activeArticle, setActiveArticle] = useState<FullArticleData | null>(null);
  const [newsletterSource, setNewsletterSource] = useState<string>('homepage');
  const [externalInquiry, setExternalInquiry] = useState<InquiryKind | null>(null);

  useEffect(() => {
    testFirestoreConnection();
  }, []);

  const scrollTo = (id: string, updateHash = true) => {
    const cleanId = id.replace(/^#/, '').trim();
    if (!cleanId) return;

    if (updateHash && typeof window !== 'undefined') {
      const targetHash = `#${cleanId}`;
      if (window.location.hash !== targetHash) {
        window.history.replaceState(null, '', targetHash);
      }
    }

    const attemptScroll = (behavior: ScrollBehavior) => {
      const el = document.getElementById(cleanId);
      if (!el) return false;
      const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 72);
      window.scrollTo({ top, behavior });
      return true;
    };

    if (!attemptScroll('smooth')) {
      setTimeout(() => attemptScroll('smooth'), 120);
    }
  };

  useEffect(() => {
    const KNOWN_SECTIONS = new Set(['hero', 'concetti', 'guide', 'prove', 'aggiornamenti', 'newsletter']);

    const resolveTargetFromUrl = (): string | null => {
      const hashTarget = window.location.hash.replace(/^#/, '').toLowerCase();
      if (KNOWN_SECTIONS.has(hashTarget)) return hashTarget;

      const pathSeg = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
      if (KNOWN_SECTIONS.has(pathSeg)) return pathSeg;
      return null;
    };

    const syncFromUrl = () => {
      const rawHash = window.location.hash.replace(/^#/, '').toLowerCase();
      if (rawHash === 'reel-09' || rawHash === 'instagram-studio' || rawHash === 'studio') {
        setIsInstagramOpen(true);
        return;
      }
      const target = resolveTargetFromUrl();
      if (!target) return;
      if (window.location.pathname !== '/' && target !== 'hero') {
        window.history.replaceState(null, '', `/#${target}`);
      }
      requestAnimationFrame(() => {
        const el = document.getElementById(target);
        if (el) {
          const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 72);
          window.scrollTo({ top, behavior: 'auto' });
        }
      });
      setTimeout(() => {
        const el = document.getElementById(target);
        if (el) {
          const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 72);
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }, 260);
    };

    syncFromUrl();
    window.addEventListener('hashchange', syncFromUrl);
    window.addEventListener('popstate', syncFromUrl);
    return () => {
      window.removeEventListener('hashchange', syncFromUrl);
      window.removeEventListener('popstate', syncFromUrl);
    };
  }, []);

  const handleGoNewsletter = (sourceLabel: string) => {
    setNewsletterSource(sourceLabel);
    setTimeout(() => scrollTo('newsletter'), 80);
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#050507',
        color: '#e2e8f0',
        overflowX: 'clip',
      }}
    >
      {/* Sfondo 3D WebGL Fisso */}
      <AxonCanvas />

      {/* Header Fisso 3-Zone Contract */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '68px',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          padding: '0 24px',
          backgroundColor: 'rgba(5, 5, 7, 0.88)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          boxSizing: 'border-box',
        }}
      >
        <button
          type="button"
          onClick={() => setIsChiSonoOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            textAlign: 'left',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
          title="Chi Sono e Metodo Capire l'AI"
        >
          <div
            style={{
              position: 'relative',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '1px solid rgba(56, 189, 248, 0.6)',
              backgroundColor: '#0a0a10',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
              flexShrink: 0,
            }}
          >
            <img
              src="/assets/aistudio/Black_Blue_and_White_Modern_Store_Logo__1__e6632dec.png"
              alt="Capire l'AI"
              referrerPolicy="no-referrer"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block', position: 'relative', zIndex: 1 }}
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                if (!target.dataset.tried1) {
                  target.dataset.tried1 = 'true';
                  target.src = '/assets/logo.png';
                } else if (!target.dataset.tried2) {
                  target.dataset.tried2 = 'true';
                  target.src = '/logo.png';
                } else {
                  target.style.display = 'none';
                }
              }}
            />
            <span style={{ position: 'absolute', fontSize: '11px', fontWeight: 800, color: '#38bdf8', pointerEvents: 'none', zIndex: 0 }}>
              AI
            </span>
          </div>
          <span style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
            Capire l&apos;AI
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-6">
          {[
            { id: 'concetti', label: 'Concetti' },
            { id: 'guide', label: 'Guide' },
            { id: 'prove', label: 'Prove' },
            { id: 'aggiornamenti', label: 'Aggiornamenti' },
          ].map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                scrollTo(item.id);
              }}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors no-underline whitespace-nowrap shrink-0"
            >
              {item.label}
            </a>
          ))}
          <button type="button" onClick={() => setIsChiSonoOpen(true)} className="text-sm font-medium text-slate-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer whitespace-nowrap shrink-0">Chi Sono</button>
        </nav>

        <div className="flex items-center shrink-0">
          <a
            href="#newsletter"
            onClick={(e) => {
              e.preventDefault();
              scrollTo('newsletter');
            }}
            className="inline-flex items-center justify-center px-4 h-10 bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs rounded-lg no-underline transition-colors whitespace-nowrap shrink-0"
          >
            Newsletter Gratis
          </a>
        </div>
      </header>

      {/* Barra Rapida Mobile per Concetti / Guide / Prove / Aggiornamenti / Newsletter */}
      <nav
        aria-label="Navigazione sezioni mobile"
        className="md:hidden fixed top-[68px] left-0 right-0 z-[95] flex items-center gap-4 px-4 h-10 bg-[#050507]/90 backdrop-blur-md border-b border-white/10 overflow-x-auto no-scrollbar"
      >
        {[
          { id: 'concetti', label: 'Concetti' },
          { id: 'guide', label: 'Guide' },
          { id: 'prove', label: 'Prove' },
          { id: 'aggiornamenti', label: 'Aggiornamenti' },
          { id: 'newsletter', label: 'Newsletter' },
        ].map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(e) => {
              e.preventDefault();
              scrollTo(item.id);
            }}
            className="text-xs font-medium text-slate-300 hover:text-sky-400 no-underline whitespace-nowrap shrink-0"
          >
            {item.label}
          </a>
        ))}
      </nav>

      {/* Contenuto della Pagina */}
      <main style={{ position: 'relative', width: '100%' }}>
        {/* HERO SECTION */}
        <section
          id="hero"
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            textAlign: 'center',
            padding: '120px 24px 48px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ paddingTop: '28px', maxWidth: '820px' }}>
            <div className="text-xs font-mono text-sky-400 tracking-wide mb-4">
              Divulgazione pratica e test empirici AI
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 'clamp(2.1rem, 4.4vw, 3.5rem)',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                textWrap: 'balance',
              }}
            >
              Comprendere e usare l&apos;AI{' '}
              <span style={{ color: '#38bdf8' }}>nel lavoro reale</span>
            </h1>
            <p style={{ margin: '18px auto 0', fontSize: '15px', color: '#94a3b8', maxWidth: '620px', lineHeight: 1.65 }}>
              Spiegazioni chiare, metodo R.O.F., analisi costi per PMI italiane e una newsletter settimanale con test verificati sul campo.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={() => scrollTo('newsletter')}
                style={{
                  padding: '13px 24px',
                  fontSize: '13px',
                  fontWeight: 700,
                  backgroundColor: '#38bdf8',
                  color: '#020617',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Newsletter + Kit R.O.F. Gratis
              </button>
              <button
                type="button"
                onClick={() => scrollTo('guide')}
                style={{
                  padding: '13px 22px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#e2e8f0',
                  backgroundColor: 'rgba(10, 11, 16, 0.78)',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Esplora le Guide PMI
              </button>
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Scorri per esplorare le guide · L&apos;anello 3D reagisce allo scorrimento
            </span>
          </div>
        </section>

        {/* SEZIONE 1: CONCETTI */}
        <section id="concetti" style={{ minHeight: '100vh', padding: '100px 24px', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}>
          <div style={{ marginBottom: '40px', borderBottom: '1px solid #222222', paddingBottom: '20px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', padding: '3px 8px', backgroundColor: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '3px' }}>
              01 // FONDAMENTI
            </span>
            <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#ffffff', margin: '12px 0 6px 0' }}>Concetti</h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#aaaaaa', maxWidth: '750px', lineHeight: 1.6 }}>
              Comprendere l&apos;architettura dei Transformer, i token, le finestre di contesto e l&apos;apprendimento supervisionato.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {Object.entries(ARTICLES_DATABASE).filter(([_, a]) => (a.section || '').toLowerCase() === 'concetti').map(([k, art]) => (
              <div
                key={k}
                onClick={() => setActiveArticle(art)}
                style={{ backgroundColor: 'rgba(12, 12, 15, 0.92)', border: '1px solid #222226', borderRadius: '6px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#777777', marginBottom: '12px' }}>
                    <span style={{ color: '#38bdf8', fontWeight: 700 }}>#{art.tag}</span>
                    <span>{art.readTime}</span>
                  </div>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 700, color: '#ffffff', lineHeight: 1.35 }}>{art.title}</h3>
                  <p style={{ margin: '0 0 20px 0', fontSize: '12px', color: '#999999', lineHeight: 1.5 }}>{art.summary}</p>
                </div>
                <div style={{ paddingTop: '16px', borderTop: '1px solid #1c1c20', display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: '#38bdf8' }}>
                  <span>LEGGI ARTICOLO</span>
                  <span>→</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SEZIONE 2: GUIDE */}
        <section id="guide" style={{ minHeight: '100vh', padding: '100px 24px', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}>
          <div style={{ marginBottom: '28px', borderBottom: '1px solid #222222', paddingBottom: '20px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', padding: '3px 8px', backgroundColor: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '3px' }}>
              02 // PRATICA &amp; HUB PMI
            </span>
            <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#ffffff', margin: '12px 0 6px 0' }}>Guide</h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#aaaaaa', maxWidth: '780px', lineHeight: 1.6 }}>
              Tutorial operativi, Metodo R.O.F., Hub strumenti per PMI e flussi reali per risparmiare fino a 5 ore a settimana.
            </p>
          </div>

          {/* Cluster Hub PMI Quick Bar */}
          <div
            style={{
              marginBottom: '28px',
              padding: '16px 18px',
              backgroundColor: 'rgba(10, 14, 22, 0.92)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '6px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '10px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              PERCORSO RAPIDO • HUB &quot;AI PER LAVORARE MEGLIO&quot; (PILLAR + SPOKE PMI)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {[
                { key: 'migliori-tool-ai-lavorare-meglio-pmi', label: '★ Pillar: Migliori Tool AI PMI' },
                { key: 'metodo-r-o-f-10-prompt-chatgpt-da-copiare-subito', label: '⚡ Metodo R.O.F. (10 Prompt)' },
                { key: 'alternative-chatgpt-privacy-aziende-gdpr', label: 'Spoke 1: GDPR & Privacy' },
                { key: 'ai-scrivere-preventivi-email-commerciali', label: 'Spoke 2: Preventivi & Email' },
                { key: 'automazione-excel-documenti-intelligenza-artificiale', label: 'Spoke 3: Excel & Fatture' },
                { key: 'quanto-costa-implementare-ai-piccola-azienda', label: 'Spoke 4: Costi Reali PMI' },
              ].map((item) => {
                const art = ARTICLES_DATABASE[item.key];
                if (!art) return null;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveArticle(art)}
                    style={{
                      padding: '7px 12px',
                      fontSize: '11px',
                      fontWeight: item.key === 'migliori-tool-ai-lavorare-meglio-pmi' ? 700 : 600,
                      fontFamily: 'inherit',
                      color: item.key === 'migliori-tool-ai-lavorare-meglio-pmi' ? '#000000' : '#d8e9f5',
                      backgroundColor: item.key === 'migliori-tool-ai-lavorare-meglio-pmi' ? '#38bdf8' : 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {Object.entries(ARTICLES_DATABASE).filter(([_, a]) => (a.section || '').toLowerCase() === 'guide').map(([k, art]) => (
              <div
                key={k}
                onClick={() => setActiveArticle(art)}
                style={{ backgroundColor: 'rgba(12, 12, 15, 0.92)', border: '1px solid #222226', borderRadius: '6px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#777777', marginBottom: '12px' }}>
                    <span style={{ color: '#38bdf8', fontWeight: 700 }}>#{art.tag}</span>
                    <span>{art.readTime}</span>
                  </div>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 700, color: '#ffffff', lineHeight: 1.35 }}>{art.title}</h3>
                  <p style={{ margin: '0 0 20px 0', fontSize: '12px', color: '#999999', lineHeight: 1.5 }}>{art.summary}</p>
                </div>
                <div style={{ paddingTop: '16px', borderTop: '1px solid #1c1c20', display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: '#38bdf8' }}>
                  <span>LEGGI TUTORIAL</span>
                  <span>→</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SEZIONE 3: PROVE */}
        <section id="prove" style={{ minHeight: '100vh', padding: '100px 24px', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}>
          <div style={{ marginBottom: '40px', borderBottom: '1px solid #222222', paddingBottom: '20px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', padding: '3px 8px', backgroundColor: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '3px' }}>
              03 // BENCHMARK
            </span>
            <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#ffffff', margin: '12px 0 6px 0' }}>Prove</h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#aaaaaa', maxWidth: '750px', lineHeight: 1.6 }}>
              Test comparativi rigorosi sui modelli di frontiera, metriche di inferenza e casi d&apos;uso concreti.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {Object.entries(ARTICLES_DATABASE).filter(([_, a]) => (a.section || '').toLowerCase() === 'prove').map(([k, art]) => (
              <div
                key={k}
                onClick={() => setActiveArticle(art)}
                style={{ backgroundColor: 'rgba(12, 12, 15, 0.92)', border: '1px solid #222226', borderRadius: '6px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#777777', marginBottom: '12px' }}>
                    <span style={{ color: '#38bdf8', fontWeight: 700 }}>#{art.tag}</span>
                    <span>{art.readTime}</span>
                  </div>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 700, color: '#ffffff', lineHeight: 1.35 }}>{art.title}</h3>
                  <p style={{ margin: '0 0 20px 0', fontSize: '12px', color: '#999999', lineHeight: 1.5 }}>{art.summary}</p>
                </div>
                <div style={{ paddingTop: '16px', borderTop: '1px solid #1c1c20', display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: '#38bdf8' }}>
                  <span>VEDI I DATI</span>
                  <span>→</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SEZIONE 4: AGGIORNAMENTI */}
        <section id="aggiornamenti" style={{ minHeight: '100vh', padding: '100px 24px', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}>
          <div style={{ marginBottom: '40px', borderBottom: '1px solid #222222', paddingBottom: '20px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', padding: '3px 8px', backgroundColor: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '3px' }}>
              04 // NEWS
            </span>
            <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#ffffff', margin: '12px 0 6px 0' }}>Aggiornamenti</h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#aaaaaa', maxWidth: '750px', lineHeight: 1.6 }}>
              Analisi critica dei nuovi rilasci da OpenAI, Anthropic, Google e dall&apos;open source senza hype.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {Object.entries(ARTICLES_DATABASE).filter(([_, a]) => {
              const s = (a.section || '').toLowerCase();
              return s === 'aggiornamenti' || s === 'news';
            }).map(([k, art]) => (
              <div
                key={k}
                onClick={() => setActiveArticle(art)}
                style={{ backgroundColor: 'rgba(12, 12, 15, 0.92)', border: '1px solid #222226', borderRadius: '6px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#777777', marginBottom: '12px' }}>
                    <span style={{ color: '#38bdf8', fontWeight: 700 }}>#{art.tag}</span>
                    <span>{art.readTime}</span>
                  </div>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 700, color: '#ffffff', lineHeight: 1.35 }}>{art.title}</h3>
                  <p style={{ margin: '0 0 20px 0', fontSize: '12px', color: '#999999', lineHeight: 1.5 }}>{art.summary}</p>
                </div>
                <div style={{ paddingTop: '16px', borderTop: '1px solid #1c1c20', display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: '#38bdf8' }}>
                  <span>LEGGI ANALISI</span>
                  <span>→</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SEZIONE 5: NEWSLETTER & MONETIZZAZIONE REALE (Ex Forum) */}
        <NewsletterSection
          leadSource={newsletterSource}
          externalInquiryOpen={externalInquiry}
          onCloseExternalInquiry={() => setExternalInquiry(null)}
        />
      </main>

      {/* Footer Pulito — Forum Spostato in Secondo Piano */}
      <footer className="relative z-10 border-t border-white/10 bg-[#050507]/95 py-10 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div>
              <strong className="text-white">Capire l&apos;AI</strong> · capirelai.com · Divulgazione pratica e test reali AI
            </div>

            <div className="flex flex-wrap items-center justify-center gap-5">
              <button
                type="button"
                onClick={() => scrollTo('newsletter')}
                className="text-sky-400 hover:text-sky-300 bg-transparent border-none cursor-pointer p-0 font-medium"
              >
                Newsletter &amp; Kit R.O.F.
              </button>
              <button
                type="button"
                onClick={() => {
                  scrollTo('newsletter');
                  setExternalInquiry('sponsor_newsletter');
                }}
                className="text-slate-300 hover:text-white bg-transparent border-none cursor-pointer p-0"
              >
                Sponsor &amp; Media Kit
              </button>
              <button
                type="button"
                onClick={() => setIsInstagramOpen(true)}
                className="text-slate-300 hover:text-white bg-transparent border-none cursor-pointer p-0"
              >
                Studio Instagram
              </button>
              <button
                type="button"
                onClick={() => setIsForumModalOpen(true)}
                className="text-slate-500 hover:text-slate-300 bg-transparent border-none cursor-pointer p-0"
                title="Spazio secondario domande e discussioni archiviate"
              >
                Archivio Forum (Q&amp;A)
              </button>
              <button
                type="button"
                onClick={() => setIsFounderOpen(true)}
                className="text-slate-400 hover:text-sky-400 bg-transparent border border-white/10 rounded px-2.5 py-1 cursor-pointer"
              >
                Area Fondatore
              </button>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <span className="text-slate-500">Contatti per collaborazioni, sponsorizzazioni e partnership:</span>
            <div className="flex flex-wrap items-center justify-center gap-5">
              <a
                href="mailto:infocapirelai@gmail.com"
                className="text-slate-200 hover:text-sky-400 no-underline font-medium transition-colors"
              >
                ✉ infocapirelai@gmail.com
              </a>
              <a
                href="https://www.instagram.com/capirelai/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 hover:text-sky-300 no-underline font-semibold transition-colors"
              >
                Instagram @capirelai ↗
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Modali */}
      <ChiSonoModal isOpen={isChiSonoOpen} onClose={() => setIsChiSonoOpen(false)} />
      <ArticleReaderModal
        article={activeArticle}
        onClose={() => setActiveArticle(null)}
        onGoNewsletter={handleGoNewsletter}
      />
      <InstagramKitModal isOpen={isInstagramOpen} onClose={() => setIsInstagramOpen(false)} />
      <FounderNewsletterModal isOpen={isFounderOpen} onClose={() => setIsFounderOpen(false)} />

      {/* Forum secondario su richiesta dal footer */}
      {isForumModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setIsForumModalOpen(false)}
        >
          <div
            className="w-full max-w-[960px] max-h-[90vh] overflow-y-auto bg-[#08090d] border border-white/15 rounded-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <span className="text-xs text-slate-400">
                Archivio Forum &amp; Q&amp;A Community (spazio secondario — per aggiornamenti settimanali iscriviti alla Newsletter)
              </span>
              <button
                type="button"
                onClick={() => setIsForumModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white bg-transparent border-none text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            <InteractiveForum />
          </div>
        </div>
      )}
    </div>
  );
}
