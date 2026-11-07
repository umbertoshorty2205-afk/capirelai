---
titolo: "Token"
descrizione: "Cos'è un token e perché conta per costi e limiti di contesto"
data: 2026-11-07
autore: "Capire l'AI"
---

I **token** sono l'unità di base con cui i modelli linguistici (LLM) leggono, elaborano e generano testo. Non coincidono esattamente con le parole: un token può essere una parola intera, parte di una parola, un segno di punteggiatura o anche solo uno spazio.

## Perché i token contano

Quando usi un modello IA, due fattori dipendono direttamente dai token:

1. **Costo** — Le API fatturano per token (input + output). Più token usi, più paghi. Conoscere la relazione tra parole e token ti aiuta a stimare i costi prima di lanciare una richiesta.
2. **Limite di contesto** — Ogni modello ha una "finestra di contesto" massima espressa in token. Se la tua conversazione + il prompt superano quel limite, il modello tronca l'inizio (o restituisce un errore). Gestire i token ti permette di restare dentro i limiti.

## Regola pratica

In italiano (e nelle lingue romanze), **1 parola ≈ 1,3–1,5 token**. In inglese è più vicino a 1:1. Un paragrafo di 500 parole può richiedere 700–800 token.

## Cosa puoi fare

- Usa i *tokenizer* ufficiali (es. `tiktoken` di OpenAI) per contare i token prima di inviare una richiesta.
- Spezza i documenti lunghi in chunk più piccoli se superi il limite di contesto.
- Monitora l'uso token nelle risposte API per ottimizzare prompt e costi.

Il prossimo articolo approfondirà come il contesto influenza la qualità delle risposte e come strutturare i prompt per massimizzare l'efficienza.