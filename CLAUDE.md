# Capire l'AI — Configurazione per Claude Code

Benvenuto nel repository di **Capire l'AI** (`capirelai.com`).
Questo file definisce l'identità editoriale, la struttura del codice e le istruzioni operative per Claude Code.

---

## 1. Identità Editoriale & Tono di Voce

- **Missione**: Divulgazione scientifica e tecnica sull'Intelligenza Artificiale senza filtri di marketing, senza hype e senza sensazionalismo.
- **Autore**: Studente di ingegneria gestionale, sperimentatore pratico. L'autore scrive in prima persona singolare (*"ho testato"*, *"ho misurato"*, *"nei miei test"*).
- **Anonimato**: L'autore è rigorosamente anonimo. La firma deve essere sempre e solo `— Fondatore di Capire l'AI`. Non inserire mai nomi personali.
- **Metodo**: Sperimentale ed empirico. Ogni articolo o guida deve mettere in luce sia i punti di forza sia i limiti, gli errori e i casi di fallimento del modello o della tecnica analizzata.

---

## 2. Architettura del Progetto

- **Framework**: Astro (con integrazione React SPA per la parte interattiva).
- **Componente Principale**: `src/components/webgl/CapirelAiHero.tsx`
  - Contiene lo sfondo WebGL Three.js (`AxonCanvas`), l'header, il database degli articoli, il modale di lettura, il modale "Chi sono" e il Forum della community.
- **Regola sugli Stili**: In `CapirelAiHero.tsx`, tutti gli elementi utilizzano **stili inline espliciti** (`style={{ ... }}`) per garantire immunità totale da eventuali problemi di compilazione CSS di Tailwind. Mantenere sempre gli stili inline.

---

## 3. Struttura del Database Articoli (`ARTICLES_DATABASE`)

Gli articoli si trovano all'interno dell'oggetto `ARTICLES_DATABASE` in `src/components/webgl/CapirelAiHero.tsx`.
Ogni articolo segue questa interfaccia TypeScript:

```ts
interface FullArticleData {
  title: string;
  section: 'Concetti' | 'Guide' | 'Prove' | 'Aggiornamenti';
  tag: string;         // es. 'BENCHMARK', 'RAG', 'ARCHITETTURA', 'TRAINING', 'NEWS'
  readTime: string;    // es. '7 min'
  author: "Capire l'AI";
  date: string;        // es. '15 Nov 2026'
  summary: string;     // Riassunto analitico di 2-3 frasi
  content: {
    heading: string;
    text: string;
    highlight?: string;   // Consiglio o dato chiave (facoltativo)
    codeSnippet?: string; // Snippet codice o prompt (facoltativo)
  }[];
  keyTakeaways: string[]; // 2-3 punti chiave sintetici
}
```

---

## 4. Workflow per la Creazione e Pubblicazione di un Articolo

Quando l'utente chiede di creare o pubblicare un articolo:

1. **Scrittura dell'Articolo**:
   - Genera una chiave slug univoca (es. `'deepseek-v3-benchmark'`).
   - Scrivi i capitoli dell'articolo rispettando rigorosamente il tono di voce empirico.
   - Aggiungi l'oggetto dentro `ARTICLES_DATABASE` in `src/components/webgl/CapirelAiHero.tsx`.

2. **Registrazione nella Homepage**:
   - Nella sezione corrispondente della homepage (`concetti`, `guide`, `prove` o `aggiornamenti`), inserisci la nuova chiave all'inizio dell'array mappato, in modo che compaia come primo articolo visibile.

3. **Verifica della Build**:
   - Esegui `npm run build` nel terminale.
   - Se ci sono errori TypeScript o di sintassi, correggili prima di procedere.

4. **Deploy su Netlify**:
   - Se l'utente richiede la pubblicazione online, esegui:
     ```bash
     git add .
     git commit -m "Nuovo articolo: [titolo dell'articolo]"
     git push origin main
     ```
   - Netlify rileverà il commit e pubblicherà automaticamente la nuova versione su `capirelai.com`.
