---
titolo: "Modelli di Ragionamento (o1 & Chain of Thought): Guida Pratica API e Costi Reali"
descrizione: "Come integrare i modelli di ragionamento via API con reasoning_effort, architettura ibrida veloce/logica e gestione di latenza e hidden reasoning tokens."
data: 2026-11-14
autore: "Capire l'AI"
---

I modelli di ragionamento (serie `o1` / `o3` e equivalenti con *Chain of Thought* interna) non iniziano a scrivere subito la risposta come i modelli conversazionali tradizionali: prima allocano token di pensiero nascosti per pianificare, verificare vincoli e individuare contraddizioni.

## 1. Quando servono davvero (e quando no)

Nei test comparativi su flussi aziendali, i modelli di ragionamento mostrano un vantaggio netto solo in compiti ad alta densità logica:

- verifica di regole contrattuali o listini con eccezioni incrociate;
- debugging architetturale e refactoring con vincoli stretti;
- pianificazione multi-step prima dell'esecuzione di chiamate verso tool esterni.

Per classificare email, sintetizzare note o rispondere a FAQ in tempo reale, un modello compatto e veloce resta superiore per costi e reattività.

## 2. Controllo pratico via API: `reasoning_effort`

Nelle chiamate API è fondamentale bilanciare precisione e tempi di risposta impostando `reasoning_effort` (`low`, `medium`, `high`):

- **`low` / `medium`:** latenza gestibile (spesso 6–14 secondi) per pipeline strutturate che richiedono comunque controllo logico.
- **`high`:** utile solo per analisi asincrone in background dove 25–40 secondi di attesa sono accettabili.

```ts
const response = await client.responses.create({
  model: "o3-mini",
  reasoning: { effort: "medium" },
  input: [
    { role: "developer", content: "Restituisci solo JSON valido." },
    { role: "user", content: "Verifica i vincoli di sconto sul listino." }
  ]
});
```

## Limiti e costi nascosti da monitorare

Tutti i *reasoning tokens* generati internamente prima della risposta finale vengono conteggiati e fatturati come token di output. Se imposti un `max_output_tokens` troppo basso, il modello può esaurire l'intero budget nella fase di ragionamento interna restituendo una stringa vuota. Inoltre, senza grounding sui documenti o accesso a tool, anche il miglior modello logico può ragionare in modo coerente su premesse fattuali sbagliate.
