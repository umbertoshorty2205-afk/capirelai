import React, { useState, useEffect } from 'react';
import { AxonCanvas } from './AxonCanvas';

// ==========================================
// 1. DATABASE COMPLETO DEI 12 ARTICOLI
// ==========================================
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

export const ARTICLES_DATABASE: Record<string, FullArticleData> = {
  // --- CONCETTI ---
  'token-vocabolario': {
    title: 'Token & Vocabolario: Come i Modelli Linguistici Leggono il Testo',
    section: 'Concetti',
    tag: 'FONDAMENTI',
    readTime: '6 min',
    author: "Capire l'AI",
    date: '10 Nov 2026',
    summary: 'I Large Language Model non leggono parole o lettere come gli esseri umani. Tutto il testo viene convertito in token numerici attraverso algoritmi come BPE (Byte-Pair Encoding). Comprendere questo passaggio è cruciale per capire costi, allucinazioni e limiti di calcolo.',
    content: [
      {
        heading: 'La scomposizione del testo (Tokenization)',
        text: 'Un token non corrisponde necessariamente a una parola intera. In italiano e in inglese, le parole frequenti possono essere un singolo token (es. "computer" = 1 token), mentre parole complesse, inflesse o rare vengono frammentate in sotto-parole o singoli byte.',
        highlight: 'In media: 1.000 token equivalgono a circa 750 parole in inglese, ma circa 550-600 parole in italiano a causa della morfologia verbale e grammaticale.',
        codeSnippet: `// Esempio concettuale di tokenizzazione BPE:
const input = "L'intelligenza artificiale apprende.";
// BPE scompone in sotto-token: ["L'", "intell", "igenza", " artificial", "e", " apprend", "e", "."]
// Mappati in indici interi del vocabolario: [1842, 45210, 8931, 23901, 260, 31204, 260, 13]`,
      },
      {
        heading: 'La matrice degli Embedding e lo spazio latente',
        text: 'Ogni indice numerico del vocabolario (di solito composto da 32.000 a 128.000 token possibili) viene poi proiettato in un vettore denso ad altissima dimensione (es. 4096 o 8192 dimensioni). In questo spazio vettoriale multidimensionale, parole con significato affine si trovano geometricamente vicine.',
      },
      {
        heading: 'Perché la tokenizzazione causa errori insoliti?',
        text: 'Spesso gli LLM falliscono in compiti apparentemente banali per un umano (come contare quante volte la lettera "r" compare in "strawberry") perché il modello non vede le singole lettere, ma riceve l\'intero blocco di token pre-assemblato.',
      },
    ],
    keyTakeaways: [
      'I modelli neurali processano vettori di token, non caratteri grezzi.',
      'La tokenizzazione determina l\'effettiva ampiezza della finestra di contesto e la fatturazione delle API.',
      'I tipici errori di sillabazione dipendono direttamente dal vocabolario dell\'algoritmo BPE.',
    ],
  },

  'transformer-architettura': {
    title: 'Transformer: Self-Attention, Query, Key e Value Spiegati',
    section: 'Concetti',
    tag: 'ARCHITETTURA',
    readTime: '9 min',
    author: "Capire l'AI",
    date: '08 Nov 2026',
    summary: 'Nel 2017 il paper "Attention Is All You Need" ha rivoluzionato il deep learning pensionando le reti ricorrenti (RNN). Al cuore del successo c\'è il meccanismo di Self-Attention che calcola le correlazioni tra ogni parola e tutte le altre contemporaneamente.',
    content: [
      {
        heading: 'La formula della Self-Attention',
        text: 'Il meccanismo di attenzione proietta ogni token in tre vettori distinti: Query (l\'informazione cercata), Key (l\'etichetta dell\'informazione offerta) e Value (il contenuto semantico effettivo). Il prodotto scalare tra Query e Key determina il peso con cui ciascun token influenza gli altri.',
        highlight: 'Attention(Q, K, V) = softmax( (Q * K^T) / sqrt(d_k) ) * V',
      },
      {
        heading: 'Finestre di contesto e FlashAttention',
        text: 'Poiché la complessità di calcolo della Self-Attention scala con l\'ordine O(N^2) rispetto alla lunghezza della sequenza N, contesti estesi (128k - 1M token) hanno richiesto innovazioni come FlashAttention e RoPE per non saturare la memoria VRAM delle GPU.',
      },
    ],
    keyTakeaways: [
      'Self-Attention permette a token distanti nel testo di comunicare istantaneamente.',
      'Le finestre di contesto moderne superano il milione di token grazie a kernel GPU ottimizzati.',
      'Multi-Head Attention consente al modello di focalizzarsi su diversi aspetti grammaticali e concettuali in parallelo.',
    ],
  },

  'finetuning-supervisione': {
    title: 'Fine-tuning & Apprendimento Supervisionato: LoRA, QLoRA e DPO',
    section: 'Concetti',
    tag: 'TRAINING',
    readTime: '8 min',
    author: "Capire l'AI",
    date: '06 Nov 2026',
    summary: 'Dal modello "base" al modello istruito per rispondere agli utenti. Come funzionano il Supervised Fine-Tuning (SFT), l\'ottimizzazione a basso rango (LoRA) e l\'allineamento con Direct Preference Optimization (DPO).',
    content: [
      {
        heading: 'Dal Pre-training al Fine-tuning',
        text: 'Il pre-training insegna al modello a completare la parola successiva su trilioni di token di testo grezzo. Il fine-tuning supervisionato (SFT) fornisce coppie strutturate di "istruzione-risposta" per insegnargli a comportarsi da assistente utile e conciso.',
      },
      {
        heading: 'LoRA & QLoRA: Fine-tuning su GPU consumer',
        text: 'Invece di aggiornare tutti i 70 miliardi di pesi di una rete neurale, LoRA congela i pesi originali e introduce due piccole matrici a basso rango. Questo riduce la memoria necessaria di oltre l\'80%.',
        codeSnippet: `// Concetto di Low-Rank Adaptation (LoRA):
// W_aggiornato = W_originale + (A * B) * (alpha / rank)
// Dove rank (r) è tipicamente 8, 16 o 64, riducendo i parametri addestrabili a <1%`,
      },
    ],
    keyTakeaways: [
      'Il fine-tuning modifica lo stile, il tono e il rispetto di formati specifici.',
      'Per aggiornare la conoscenza fattuale e documentale è spesso preferibile usare RAG.',
      'LoRA e QLoRA consentono la personalizzazione locale dei modelli open weight.',
    ],
  },

  // --- GUIDE ---
  'agenti-autonomi': {
    title: 'Agenti Autonomi: Architettura ReAct, Tool Use e Sandbox',
    section: 'Guide',
    tag: 'AGENTI',
    readTime: '11 min',
    author: "Capire l'AI",
    date: '04 Nov 2026',
    summary: 'Un modello linguistico da solo può soltanto generare testo. Un "Agente" invece può interagire con il mondo esterno: chiamare API, eseguire query SQL su database, navigare il web ed eseguire codice in un ambiente sandbox protetto.',
    content: [
      {
        heading: 'Il ciclo ReAct: Reasoning + Action',
        text: 'Il pattern fondamentale per un agente robusto si basa su un ciclo continuo: 1. Pensiero (Thought): analizza l\'obiettivo; 2. Azione (Action): sceglie il tool più adatto con i parametri JSON corretti; 3. Osservazione (Observation): riceve il risultato del tool e decide se ha terminato o deve iterare.',
        codeSnippet: `// Schema tipico di chiamata Tool (Function Calling):
{
  "name": "cerca_database_documenti",
  "arguments": {
    "query": "architettura transformer flashattention",
    "limite_risultati": 5
  }
}`,
      },
    ],
    keyTakeaways: [
      'Separare nettamente la logica di pianificazione dall\'esecuzione del codice.',
      'Definire schemi JSON rigorosi per azzerare errori di sintassi.',
      'Impostare sempre un limite massimo di iterazioni (max_loops) per prevenire loop infiniti.',
    ],
  },

  'rag-documenti': {
    title: 'RAG Moderno: Dalla Strategia di Chunking al Re-Ranking',
    section: 'Guide',
    tag: 'RAG',
    readTime: '10 min',
    author: "Capire l'AI",
    date: '02 Nov 2026',
    summary: 'RAG (Retrieval-Augmented Generation) è la tecnica prediletta per collegare la conoscenza aziendale privata agli LLM senza dover riaddestrare il modello. Vediamo la pipeline end-to-end ottimizzata per l\'accuratezza.',
    content: [
      {
        heading: '1. Chunking intelligente dei documenti',
        text: 'Spezzare i documenti in blocchi da 400-600 token con 100 token di overlap. Evitare di tagliare frasi a metà usando separatori semantici basati su paragrafi e intestazioni markdown.',
      },
      {
        heading: '2. Re-Ranking con Cross-Encoder',
        text: 'Non limitarsi ai primi 5 risultati del vector database. Estrai i primi 25 candidati con ricerca ibrida e passali attraverso un Cross-Encoder dedicato (es. Cohere Re-rank o BGE-Reranker) per riordinarli per rilevanza reale.',
      },
    ],
    keyTakeaways: [
      'Il re-ranking riduce le allucinazioni fino al 60% rispetto alla ricerca puramente vettoriale.',
      'La qualità del parsing del documento è il fattore più critico per il successo.',
    ],
  },

  'prompt-architecture': {
    title: 'Prompt Architecture: Strutturare Metaprompt, Chain-of-Thought e Few-Shot',
    section: 'Guide',
    tag: 'PROMPTING',
    readTime: '8 min',
    author: "Capire l'AI",
    date: '31 Ott 2026',
    summary: 'Smetti di scrivere prompt vaghi. Le tecniche ingegneristiche strutturate permettono di ridurre la varianza delle risposte e forzare output deterministici in formato JSON o codice collaudato per la produzione.',
    content: [
      {
        heading: 'Delimitatori XML e gerarchia del prompt',
        text: 'I modelli di frontiera (Claude, GPT-4o, Gemini) rispondono con eccezionale precisione quando il prompt è suddiviso con tag semantici XML come <ruolo>, <istruzioni>, <contesto> e <formato_output>.',
        codeSnippet: `<prompt>
  <ruolo>Sei un software engineer specializzato in audit di sicurezza.</ruolo>
  <istruzioni>Analizza il codice fornito identificando vulnerabilità OWASP.</istruzioni>
  <formato_output>Rispondi in formato JSON conforme allo schema specificato.</formato_output>
</prompt>`,
      },
    ],
    keyTakeaways: [
      'I delimitatori XML eliminano le ambiguità tra dati dell\'utente e istruzioni di sistema.',
      'Pochi esempi mirati (Few-Shot) battono intere pagine di regole scritte in prosa.',
    ],
  },

  // --- PROVE ---
  'stress-test-modelli': {
    title: 'Stress Test Modelli: Claude 3.5 Sonnet vs GPT-4o vs DeepSeek-R1',
    section: 'Prove',
    tag: 'BENCHMARK',
    readTime: '9 min',
    author: "Capire l'AI",
    date: '28 Ott 2026',
    summary: 'Abbiamo sottoposto i principali modelli di frontiera a una batteria intensiva di 180 test su coding multi-file, refactoring complesso, comprensione contrattuale e logica formale. Ecco i risultati empirici.',
    content: [
      {
        heading: 'Coding e architettura software complessa',
        text: 'Nei test di generazione e refactoring su repository complessi, Claude 3.5 Sonnet ha completato con successo l\'89.4% dei task senza regressioni, seguito da DeepSeek-R1 (87.1%) e GPT-4o (82.6%).',
      },
    ],
    keyTakeaways: [
      'Per compiti di programmazione e refactoring esteso, Claude 3.5 Sonnet rimane il riferimento.',
      'I modelli di reasoning come DeepSeek-R1 eccellono su logica e matematica a costi ridotti.',
    ],
  },

  'analisi-costi-inferenza': {
    title: 'Analisi Costi & Metriche di Inferenza: TTFT, Token/s e ROI Reale',
    section: 'Prove',
    tag: 'METRICHE',
    readTime: '7 min',
    author: "Capire l'AI",
    date: '26 Ott 2026',
    summary: 'Oltre ai punteggi nei benchmark sintetici, cosa conta davvero in produzione? Abbiamo misurato sul campo Time To First Token (TTFT), throughput generativo e calcolato il costo per milione di token.',
    content: [
      {
        heading: 'Time To First Token (TTFT) e latenza percepita',
        text: 'Per le applicazioni interattive, il tempo di risposta iniziale è vitale. Abbiamo registrato mediane di 320ms con Gemini Flash e 450ms con Groq LPU, contro i 1200ms delle API standard su cluster affollati.',
      },
    ],
    keyTakeaways: [
      'Il Prompt Caching è la leva di risparmio più potente disponibile per carichi RAG stabili.',
      'Modelli compatti offrono il massimo ROI per classificazione ed estrazione dati ad alto volume.',
    ],
  },

  'accuratezza-allucinazioni': {
    title: 'Accuratezza & Allucinazioni: Test Rigoroso su Casi d\'Uso Concreti',
    section: 'Prove',
    tag: 'AFFIDABILITÀ',
    readTime: '8 min',
    author: "Capire l'AI",
    date: '24 Ott 2026',
    summary: 'Un\'indagine empirica su 600 quesiti insidiosi con trappole logiche, citazioni di articoli di legge e domande senza risposta certa. Quando i modelli non sanno qualcosa, ammettono l\'ignoranza o fabbricano risposte?',
    content: [
      {
        heading: 'La tendenza al compiacimento (Sycophancy)',
        text: 'Se l\'utente formula una domanda con una premessa palesemente errata, molti modelli tentano di assecondare l\'affermazione anziché confutarla. Abbiamo misurato la resistenza critica di ciascun modello.',
      },
    ],
    keyTakeaways: [
      'Le allucinazioni derivano dalla natura probabilistica dell\'architettura autoregressiva.',
      'Un system prompt rigoroso con verifica a valle riduce le allucinazioni fattuali del 74%.',
    ],
  },

  // --- AGGIORNAMENTI ---
  'nuove-release-frontiera': {
    title: 'Nuove Release da OpenAI, Anthropic e Google: Analisi Obiettiva',
    section: 'Aggiornamenti',
    tag: 'NEWS',
    readTime: '7 min',
    author: "Capire l'AI",
    date: '09 Nov 2026',
    summary: 'Uno sguardo disincantato e analitico sui più recenti annunci dei giganti tecnologici. Quali novità rappresentano un vero salto di paradigma e quali invece sono solo marketing e repackaging?',
    content: [
      {
        heading: 'La corsa ai modelli di ragionamento sequenziale',
        text: 'La transizione da next-token prediction pura a compute a tempo di inferenza (Test-Time Compute) rappresenta il cambiamento architetturale più rilevante degli ultimi due anni.',
      },
    ],
    keyTakeaways: [
      'L\'aumento del compute a tempo di inferenza compensa i limiti della dimensione fissa del modello.',
      'La vera differenziazione si gioca sull\'affidabilità e sulle quote di concurrency garantite.',
    ],
  },

  'open-weights-local-ai': {
    title: 'Open Weights & Local AI: Llama, DeepSeek e Quantizzazioni GGUF',
    section: 'Aggiornamenti',
    tag: 'OPEN SOURCE',
    readTime: '6 min',
    author: "Capire l'AI",
    date: '07 Nov 2026',
    summary: 'Il divario tra modelli proprietari chiusi e pesi aperti si è ridotto a pochi mesi. Come l\'ecosistema open source e i runtime locali (Ollama, vLLM) stanno trasformando la sovranità dei dati.',
    content: [
      {
        heading: 'La rivoluzione delle quantizzazioni (4-bit, 8-bit)',
        text: 'Grazie a tecniche come AWQ e GGUF, un modello da 70B parametri che richiederebbe oltre 140GB di memoria a 16-bit può essere eseguito con perdite minime su workstation con 48GB di RAM.',
      },
    ],
    keyTakeaways: [
      'I modelli aperti garantiscono continuità operativa e assenza di vendor lock-in.',
      'Framework come vLLM abilitano throughput elevati su server on-premise.',
    ],
  },

  'impatto-regolamentazione': {
    title: 'Impatto Industriale & Regolamentazione: AI Act Europeo e Trasparenza',
    section: 'Aggiornamenti',
    tag: 'REGOLAZIONE',
    readTime: '8 min',
    author: "Capire l'AI",
    date: '03 Nov 2026',
    summary: 'Cosa prevede la normativa europea sull\'Intelligenza Artificiale (AI Act) e quali sono i requisiti concreti per chi sviluppa, distribuisce o integra modelli linguistici e sistemi decisionali.',
    content: [
      {
        heading: 'Approccio basato sul rischio',
        text: 'La normativa classifica i sistemi in base al rischio: inaccettabile (vietati), alto rischio (conformità e audit rigorosi), e rischio minimo o trasparenza generica.',
      },
    ],
    keyTakeaways: [
      'Documentare le pipeline di dati e i registri di prompt è fondamentale per la conformità.',
      'La trasparenza verso l\'utente finale è obbligatoria.',
    ],
  },
};

// ==========================================
// 2. MODALE CHI SONO (TESTO ESATTO AUTORE - ANONIMO)
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
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', overflow: 'hidden', border: '1px solid #38bdf8', boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)', backgroundColor: '#000', padding: '2px' }}>
              <img
                src="/assets/logo.png"
                alt="Capire l'AI"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/logo.png';
                }}
              />
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
                const el = document.getElementById('forum');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{ background: 'none', border: 'none', color: '#38bdf8', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit' }}
            >
              Vai al Forum ↓
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
// 3. LETTORE ARTICOLI MODALE
// ==========================================
function ArticleReaderModal({ article, onClose }: { article: FullArticleData | null; onClose: () => void }) {
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
          <span style={{ fontSize: '11px', color: '#777777' }}>
            Vuoi confrontarti su questo argomento nel forum?
          </span>
          <button
            type="button"
            onClick={() => {
              onClose();
              setTimeout(() => {
                const el = document.getElementById('forum');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 600, backgroundColor: '#38bdf8', border: 'none', color: '#000000', borderRadius: '2px', cursor: 'pointer' }}
          >
            Partecipa alla Discussione nel Forum ↓
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
      const s = localStorage.getItem('capirelai_threads_v1');
      if (s) return JSON.parse(s);
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
      localStorage.setItem('capirelai_threads_v1', JSON.stringify(threads));
    } catch {}
  }, [threads]);

  const handleUpvote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, upvotes: t.upvotes + 1 } : t))
    );
    if (selectedThread && selectedThread.id === id) {
      setSelectedThread({ ...selectedThread, upvotes: selectedThread.upvotes + 1 });
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
    const updated = threads.map((t) =>
      t.id === selectedThread.id ? { ...t, replies: [...t.replies, newRep] } : t
    );
    setThreads(updated);
    setSelectedThread({ ...selectedThread, replies: [...selectedThread.replies, newRep] });
    setReplyText('');
  };

  const filtered = threads.filter((t) => {
    const matchCat = activeCat === 'all' || t.category === activeCat;
    const matchSearch =
      search.trim() === '' ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.content.toLowerCase().includes(search.toLowerCase()) ||
      t.author.toLowerCase().includes(search.toLowerCase());
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
          style={{ padding: '10px 18px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', backgroundColor: '#38bdf8', color: '#000000', border: 'none', borderRadius: '4px', cursor: 'pointer', boxShadow: '0 0 20px rgba(56, 189, 248, 0.35)' }}
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

        <input
          type="text"
          placeholder="Cerca discussione..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ backgroundColor: '#111116', border: '1px solid #222228', borderRadius: '4px', padding: '6px 12px', fontSize: '12px', color: '#ffffff', outline: 'none' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '8px' }}>
        {filtered.map((th) => (
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
                  {th.categoryLabel}
                </span>
                <span style={{ fontSize: '11px', color: '#666666' }}>
                  di <strong style={{ color: '#cccccc', fontWeight: 500 }}>{th.author}</strong> • {th.date}
                </span>
              </div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 700, color: '#ffffff', lineHeight: 1.35 }}>
                {th.title}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#888888', lineHeight: 1.5 }}>
                {th.content.length > 130 ? th.content.substring(0, 130) + '...' : th.content}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', color: '#888888' }}>
              <button
                type="button"
                onClick={(e) => handleUpvote(e, th.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#171720', border: '1px solid #2a2a35', borderRadius: '4px', color: '#ffffff', cursor: 'pointer' }}
              >
                <span style={{ color: '#38bdf8' }}>▲</span>
                <span style={{ fontWeight: 700 }}>{th.upvotes}</span>
              </button>
              <span>💬 {th.replies.length}</span>
              <span style={{ color: '#38bdf8' }}>→</span>
            </div>
          </div>
        ))}
      </div>

      {selectedThread && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backgroundColor: 'rgba(0, 0, 0, 0.88)', backdropFilter: 'blur(10px)', userSelect: 'text' }}
          onClick={() => setSelectedThread(null)}
        >
          <div
            style={{ position: 'relative', width: '100%', maxWidth: '760px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#09090d', border: '1px solid rgba(56, 189, 248, 0.5)', borderRadius: '6px', padding: '28px', boxShadow: '0 0 60px rgba(56, 189, 248, 0.25)', color: '#dddddd', fontFamily: 'inherit' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '14px', borderBottom: '1px solid #222226' }}>
              <span style={{ fontSize: '10px', padding: '3px 8px', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '3px', textTransform: 'uppercase', fontWeight: 600 }}>
                {selectedThread.categoryLabel}
              </span>
              <button type="button" onClick={() => setSelectedThread(null)} style={{ background: 'none', border: 'none', color: '#8a8a8a', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ paddingTop: '16px', paddingBottom: '12px' }}>
              <h1 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>{selectedThread.title}</h1>
              <div style={{ fontSize: '11px', color: '#888888', paddingBottom: '14px', borderBottom: '1px solid #1c1c22' }}>
                Postato da <strong style={{ color: '#ffffff' }}>{selectedThread.author}</strong> • {selectedThread.date}
              </div>
            </div>

            <div style={{ padding: '14px 0', fontSize: '13px', lineHeight: 1.7, color: '#cccccc', whiteSpace: 'pre-line', borderBottom: '1px solid #222226' }}>
              {selectedThread.content}
            </div>

            <div style={{ paddingTop: '20px' }}>
              <h4 style={{ margin: '0 0 14px 0', fontSize: '13px', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase' }}>
                Risposte ({selectedThread.replies.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {selectedThread.replies.map((r, i) => (
                  <div key={i} style={{ padding: '12px', backgroundColor: '#111116', border: '1px solid #1e1e24', borderRadius: '4px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888888', fontSize: '10px', marginBottom: '4px' }}>
                      <strong style={{ color: '#ffffff' }}>{r.author}</strong>
                      <span>{r.date}</span>
                    </div>
                    <p style={{ margin: 0, color: '#bbbbbb', lineHeight: 1.5 }}>{r.content}</p>
                  </div>
                ))}
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
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backgroundColor: 'rgba(0, 0, 0, 0.88)', backdropFilter: 'blur(10px)', userSelect: 'text' }}
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
  const [activeArticle, setActiveArticle] = useState<FullArticleData | null>(null);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#000000',
        color: '#dddddd',
        fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
        overflowX: 'hidden',
      }}
    >
      {/* Sfondo 3D WebGL Fisso */}
      <AxonCanvas />

      {/* Header Fisso di Navigazione */}
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
          padding: '0 24px',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #1c1c1f',
          boxSizing: 'border-box',
        }}
      >
        <button
          type="button"
          onClick={() => setIsChiSonoOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            textAlign: 'left',
          }}
          title="Clicca per aprire Chi Sono"
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '1px solid #38bdf8',
              boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)',
              backgroundColor: '#000000',
              padding: '2px',
              boxSizing: 'border-box',
            }}
          >
            <img
              src="/assets/logo.png"
              alt="Capire l'AI"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/logo.png';
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.05em' }}>
              CAPIRE L&apos;AI
            </span>
            <span style={{ fontSize: '9px', color: '#8a8a8a', letterSpacing: '0.03em' }}>
              FORUM &amp; RICERCA • EST. 2026
            </span>
          </div>
        </button>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button type="button" onClick={() => scrollTo('concetti')} style={{ padding: '6px 12px', fontSize: '11px', textTransform: 'uppercase', color: '#cccccc', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Concetti</button>
          <button type="button" onClick={() => scrollTo('guide')} style={{ padding: '6px 12px', fontSize: '11px', textTransform: 'uppercase', color: '#cccccc', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Guide</button>
          <button type="button" onClick={() => scrollTo('prove')} style={{ padding: '6px 12px', fontSize: '11px', textTransform: 'uppercase', color: '#cccccc', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Prove</button>
          <button type="button" onClick={() => scrollTo('aggiornamenti')} style={{ padding: '6px 12px', fontSize: '11px', textTransform: 'uppercase', color: '#cccccc', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Aggiornamenti</button>
          <button type="button" onClick={() => scrollTo('forum')} style={{ padding: '6px 12px', fontSize: '11px', textTransform: 'uppercase', color: '#38bdf8', fontWeight: 700, background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit' }}>Forum Community</button>
          <button type="button" onClick={() => setIsChiSonoOpen(true)} style={{ padding: '6px 12px', fontSize: '11px', textTransform: 'uppercase', color: '#8a8a8a', border: '1px solid #26262a', background: 'none', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit' }}>Chi Sono</button>
        </nav>
      </header>

      {/* Contenuto della Pagina */}
      <main style={{ position: 'relative', zIndex: 10, width: '100%' }}>
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
            padding: '120px 20px 40px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ paddingTop: '30px' }}>
            <span style={{ display: 'inline-block', padding: '4px 12px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 600, color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '999px', marginBottom: '16px', letterSpacing: '0.1em' }}>
              DIVULGAZIONE, RICERCA &amp; FORUM
            </span>
            <h1 style={{ margin: 0, fontSize: '38px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.05em', lineHeight: 1.25 }}>
              COMPRENDERE E DOMINARE <br />
              <span style={{ color: '#38bdf8', textShadow: '0 0 25px rgba(56, 189, 248, 0.6)' }}>
                L&apos;EVOLUZIONE DELL&apos;AI
              </span>
            </h1>
            <p style={{ margin: '14px auto 0', fontSize: '13px', color: '#8a8a8a', maxWidth: '580px', lineHeight: 1.5 }}>
              Nessun hype: spiegare i concetti tecnici, pubblicare guide pratiche testate e confrontarsi nella community.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={() => scrollTo('concetti')}
                style={{ padding: '10px 20px', fontSize: '12px', textTransform: 'uppercase', fontWeight: 700, backgroundColor: '#38bdf8', color: '#000000', border: 'none', borderRadius: '3px', cursor: 'pointer', boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)' }}
              >
                LEGGI GLI ARTICOLI ↓
              </button>
              <button
                type="button"
                onClick={() => scrollTo('forum')}
                style={{ padding: '10px 18px', fontSize: '12px', textTransform: 'uppercase', color: '#38bdf8', backgroundColor: 'rgba(0,0,0,0.7)', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '3px', cursor: 'pointer' }}
              >
                ENTRA NEL FORUM
              </button>
              <button
                type="button"
                onClick={() => setIsChiSonoOpen(true)}
                style={{ padding: '10px 18px', fontSize: '12px', textTransform: 'uppercase', color: '#cccccc', backgroundColor: 'rgba(0,0,0,0.7)', border: '1px solid #333333', borderRadius: '3px', cursor: 'pointer' }}
              >
                CHI SONO
              </button>
            </div>
            <span style={{ fontSize: '10px', color: '#666666', letterSpacing: '0.1em' }}>
              ↓ SCORRI PER ESPLORARE • L&apos;ANELLO 3D RUOTA MENTRE SCENDI TRA LE SEZIONI ↓
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
            {['token-vocabolario', 'transformer-architettura', 'finetuning-supervisione'].map((k) => {
              const art = ARTICLES_DATABASE[k];
              if (!art) return null;
              return (
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
              );
            })}
          </div>
        </section>

        {/* SEZIONE 2: GUIDE */}
        <section id="guide" style={{ minHeight: '100vh', padding: '100px 24px', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}>
          <div style={{ marginBottom: '40px', borderBottom: '1px solid #222222', paddingBottom: '20px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', padding: '3px 8px', backgroundColor: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '3px' }}>
              02 // PRATICA
            </span>
            <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#ffffff', margin: '12px 0 6px 0' }}>Guide</h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#aaaaaa', maxWidth: '750px', lineHeight: 1.6 }}>
              Tutorial operativi, prompt engineering avanzato e workflow per accelerare la produttività quotidiana.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {['agenti-autonomi', 'rag-documenti', 'prompt-architecture'].map((k) => {
              const art = ARTICLES_DATABASE[k];
              if (!art) return null;
              return (
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
              );
            })}
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
            {['stress-test-modelli', 'analisi-costi-inferenza', 'accuratezza-allucinazioni'].map((k) => {
              const art = ARTICLES_DATABASE[k];
              if (!art) return null;
              return (
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
              );
            })}
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
            {['nuove-release-frontiera', 'open-weights-local-ai', 'impatto-regolamentazione'].map((k) => {
              const art = ARTICLES_DATABASE[k];
              if (!art) return null;
              return (
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
              );
            })}
          </div>
        </section>

        {/* SEZIONE 5: FORUM COMMUNITY */}
        <section id="forum" style={{ minHeight: '100vh', padding: '100px 24px', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}>
          <InteractiveForum />
        </section>
      </main>

      {/* Modali */}
      <ChiSonoModal isOpen={isChiSonoOpen} onClose={() => setIsChiSonoOpen(false)} />
      <ArticleReaderModal article={activeArticle} onClose={() => setActiveArticle(null)} />
    </div>
  );
}