import React, { useState, useEffect } from 'react';
import { AxonCanvas } from './AxonCanvas';

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

const INSTAGRAM_POSTS: InstagramPostItem[] = [
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
  const [selectedPostId, setSelectedPostId] = useState<string>('tokens');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentPost = INSTAGRAM_POSTS.find((p) => p.id === selectedPostId) || INSTAGRAM_POSTS[0];

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(currentPost.caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
          maxWidth: '880px',
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
              <span style={{ fontSize: '11px', color: '#888888' }}>• Grafiche &amp; Copy Pronti</span>
            </div>
            <h2 style={{ margin: '6px 0 0 0', fontSize: '19px', fontWeight: 700, color: '#ffffff' }}>
              Post Grafici per Canale Instagram
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

        {/* Tab Selector */}
        <div style={{ display: 'flex', gap: '8px', padding: '16px 0', borderBottom: '1px solid #1a1a22' }}>
          {INSTAGRAM_POSTS.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => setSelectedPostId(post.id)}
              style={{
                padding: '8px 14px',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                fontFamily: 'inherit',
                cursor: 'pointer',
                borderRadius: '4px',
                border: selectedPostId === post.id ? '1px solid #f43f5e' : '1px solid #252530',
                backgroundColor: selectedPostId === post.id ? 'rgba(244, 63, 94, 0.15)' : '#121218',
                color: selectedPostId === post.id ? '#ffffff' : '#888888',
                transition: 'all 0.15s ease',
              }}
            >
              {post.id === 'tokens' ? '⚡ Token & Vocabolario' : '📖 Manifesto Lancio'}
            </button>
          ))}
        </div>

        {/* Post Grid View */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', paddingTop: '20px' }}>
          {/* Visual Column */}
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

            <div style={{ marginTop: '14px', padding: '10px 12px', backgroundColor: '#101016', border: '1px solid #1f1f2a', borderRadius: '4px', fontSize: '11px', color: '#777777', lineHeight: 1.5 }}>
              <strong style={{ color: '#aaaaaa' }}>Percorso file locale:</strong><br />
              <code style={{ color: '#38bdf8', fontSize: '10px', wordBreak: 'break-all' }}>
                public/instagram/{currentPost.filename}
              </code>
            </div>
          </div>

          {/* Caption & Copy Column */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', color: '#888888' }}>DIDASCALIA &amp; HASHTAG PRONTI</span>
              <button
                type="button"
                onClick={handleCopyCaption}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: copied ? '#22c55e' : '#f43f5e',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
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
              position: 'relative',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '1.5px solid #38bdf8',
              boxShadow: '0 0 18px rgba(56, 189, 248, 0.45)',
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
            {/* Fallback grafico nel caso il file immagine non sia ancora presente nella cartella locale */}
            <span
              style={{
                position: 'absolute',
                fontSize: '11px',
                fontWeight: 900,
                color: '#38bdf8',
                letterSpacing: '0.05em',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            >
              AI
            </span>
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
          <button type="button" onClick={() => setIsInstagramOpen(true)} style={{ padding: '6px 12px', fontSize: '11px', textTransform: 'uppercase', color: '#f43f5e', fontWeight: 700, background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.4)', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit' }}>📸 Instagram</button>
          <button type="button" onClick={() => setIsChiSonoOpen(true)} style={{ padding: '6px 12px', fontSize: '11px', textTransform: 'uppercase', color: '#8a8a8a', border: '1px solid #26262a', background: 'none', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit' }}>Chi Sono</button>
        </nav>
      </header>

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

        {/* SEZIONE 5: FORUM COMMUNITY */}
        <section id="forum" style={{ minHeight: '100vh', padding: '100px 24px', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}>
          <InteractiveForum />
        </section>
      </main>

      {/* Modali */}
      <ChiSonoModal isOpen={isChiSonoOpen} onClose={() => setIsChiSonoOpen(false)} />
      <ArticleReaderModal article={activeArticle} onClose={() => setActiveArticle(null)} />
      <InstagramKitModal isOpen={isInstagramOpen} onClose={() => setIsInstagramOpen(false)} />
    </div>
  );
}
