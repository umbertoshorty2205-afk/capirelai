---
titolo: "Alternative a ChatGPT per Aziende: Privacy, Dati Clienti e Conformità GDPR"
descrizione: "Come usare l'AI in una PMI italiana senza esporre dati sensibili di clienti, buste paga o contratti: differenza tra piani Free, Team/Enterprise, API Zero Data Retention e opzioni self-hosted."
data: 2026-11-15
autore: "Capire l'AI"
---

Uno degli errori più comuni nelle piccole aziende italiane è incollare preventivi nominativi, bilanci o dati sanitari/fiscali di clienti dentro un account AI consumer gratuito con la spunta di addestramento attiva.

Per lavorare in regola con il **GDPR** non serve rinunciare all'AI: basta separare gli account personali dagli ambienti aziendali e conoscere quattro livelli tecnici di protezione.

## 1. Piano Free/Plus vs Piani Business/API (la differenza reale)

| Livello di utilizzo | Addestramento sui dati | Conservazione log & controlli | Adatto a dati clienti PMI? |
| :--- | :--- | :--- | :--- |
| Account Free / Plus standard | Spesso attivo di default (serve opt-out manuale) | Minori garanzie contrattuali B2B (DPA) | **Solo testi anonimizzati** |
| ChatGPT Team / Enterprise / Claude Team / Google Workspace Gemini | Escluso per contratto dai piani business | DPA firmato, gestione accessi team | **Sì, con policy interna** |
| Chiamate API dirette / Cloud UE (Azure, Vertex AI, Bedrock) | Escluso di default + opzioni Zero Data Retention | Hosting in regione UE (Francoforte/Belgio/Milano) | **Consigliato per flussi automatizzati** |
| Modelli Open-Weights locali (Ollama / vLLM su server proprio) | Zero invio esterno | Tutto resta su server aziendale o VPS UE | **Massima riservatezza** |

## 2. Regola pratica prima di incollare qualsiasi documento

Anche con un piano Business o API configurato in Europa, applica sempre una **minimizzazione preventiva**:

1. Sostituisci nomi, cognomi, codici fiscali e IBAN con etichette (`[CLIENTE_A]`, `[FORNITORE_B]`) prima del prompt.
2. Disattiva la cronologia condivisa o verifica nelle impostazioni del workspace che *"Improve the model for everyone"* sia spento.
3. Conserva l'elenco dei fornitori AI usati nell'informativa e nel registro trattamenti aziendale con il consulente privacy/DPO.

## 3. Quando valutare un modello locale Open-Weights

Ha senso installare modelli locali (come Llama o Qwen quantizzati su workstation con 24–48 GB VRAM o server dedicato UE) solo se tratti documenti altamente classificati offline o volumi enormi ripetitivi. Per il 90% delle PMI, un piano Business UE con DPA o un endpoint API europeo con anonimizzazione preliminare offre qualità superiore a costi minori.
