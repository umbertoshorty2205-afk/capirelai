import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const articlesPath = path.join(projectRoot, 'src', 'data', 'articles.json');

// 1. Carica gli articoli esistenti per non duplicare argomenti
if (!fs.existsSync(articlesPath)) {
  console.error(`File non trovato: ${articlesPath}`);
  process.exit(1);
}

const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
const existingTitles = Object.values(articles).map((a) => a.title);

const categories = ['Concetti', 'Guide', 'Prove', 'Aggiornamenti'];
const randomCategory = categories[Math.floor(Math.random() * categories.length)];

// Formattazione data italiana: es. "17 Nov 2026"
const now = new Date();
const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
const formattedDate = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

const systemPrompt = `Sei l'autore di "Capire l'AI" (capirelai.com), uno studente di ingegneria gestionale che analizza l'intelligenza artificiale con rigore tecnico, trasparenza e prove pratiche senza hype o sensazionalismo.
Scrivi in prima persona singolare ("ho testato", "ho misurato", "nei miei test").
I limiti, gli errori e i costi dell'AI contano quanto le potenzialità.
L'autore è anonimo, non citare mai nomi propri.

Devi generare un nuovo articolo per la sezione "${randomCategory}".
Non ripetere nessuno di questi argomenti già trattati:
${existingTitles.map((t) => `- ${t}`).join('\n')}

Restituisci ESCLUSIVAMENTE un oggetto JSON valido (senza testo introduttivo, senza blocchi di codice markdown, solo JSON puro) con questa struttura esatta:
{
  "slug": "stringa-kebab-case-univoca-senza-spazi",
  "article": {
    "title": "Titolo tecnico sobrio ed esplicito (max 75 caratteri)",
    "section": "${randomCategory}",
    "tag": "TAG_IN_MAIUSCOLO (es. BENCHMARK, RAG, TOKEN, ARCHITETTURA, REASONING)",
    "readTime": "7 min",
    "author": "Capire l'AI",
    "date": "${formattedDate}",
    "summary": "Riassunto analitico di 2-3 frasi con focus empirico.",
    "content": [
      {
        "heading": "Titolo del primo capitolo tecnico",
        "text": "Paragrafo dettagliato con spiegazione tecnica, metodologia ed evidenze emerse.",
        "highlight": "Breve frase chiave con dato o insight pratico."
      },
      {
        "heading": "Titolo del secondo capitolo",
        "text": "Approfondimento sul codice, prompt testato o limiti riscontrati.",
        "codeSnippet": "// Snippet o prompt testato significativo"
      },
      {
        "heading": "Limiti riscontrati e implicazioni pratiche",
        "text": "Cosa non ha funzionato, quando evitare questa soluzione e consigli per la produzione."
      }
    ],
    "keyTakeaways": [
      "Primo punto chiave verificato",
      "Secondo punto chiave sul trade-off costi/accuratezza",
      "Terzo punto operativo per gli sviluppatori"
    ]
  }
}`;

async function generateWithAnthropic(apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 3000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Genera il nuovo articolo settimanale di Capire l\'AI nel formato JSON richiesto.' }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}

async function generateWithGemini(apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${systemPrompt}\n\nGenera il nuovo articolo settimanale nel formato JSON richiesto.` }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function main() {
  console.log(`[Capire l'AI] Avvio generazione articolo per la sezione: ${randomCategory}`);

  let rawJson = '';
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (geminiKey) {
    console.log('[Capire l\'AI] Utilizzo Google Gemini API...');
    rawJson = await generateWithGemini(geminiKey);
  } else if (anthropicKey) {
    console.log('[Capire l\'AI] Utilizzo Anthropic Claude API...');
    rawJson = await generateWithAnthropic(anthropicKey);
  } else {
    console.error('ERRORE: Nessuna API key trovata. Imposta GEMINI_API_KEY o ANTHROPIC_API_KEY nei Secrets di GitHub.');
    process.exit(1);
  }

  let cleanJson = rawJson.trim();
  if (cleanJson.startsWith('```json')) cleanJson = cleanJson.replace(/^```json/, '');
  if (cleanJson.startsWith('```')) cleanJson = cleanJson.replace(/^```/, '');
  if (cleanJson.endsWith('```')) cleanJson = cleanJson.replace(/```$/, '');
  cleanJson = cleanJson.trim();

  let parsed;
  try {
    parsed = JSON.parse(cleanJson);
  } catch (err) {
    console.error('Errore nel parsing del JSON generato:', err);
    process.exit(1);
  }

  if (!parsed.slug || !parsed.article) {
    console.error('Il JSON generato non ha i campi richiesti slug/article:', parsed);
    process.exit(1);
  }

  const slug = parsed.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const newArticle = parsed.article;

  console.log(`[Capire l'AI] Articolo generato con successo: "${newArticle.title}" (slug: ${slug})`);

  // Inserisce il nuovo articolo in cima al file articles.json
  const updatedArticles = {
    [slug]: newArticle,
    ...articles,
  };

  fs.writeFileSync(articlesPath, JSON.stringify(updatedArticles, null, 2), 'utf8');
  console.log(`[Capire l'AI] File src/data/articles.json aggiornato! Totale articoli: ${Object.keys(updatedArticles).length}`);
}

main().catch((err) => {
  console.error('[Capire l\'AI] Errore imprevisto durante l\'esecuzione:', err);
  process.exit(1);
});
