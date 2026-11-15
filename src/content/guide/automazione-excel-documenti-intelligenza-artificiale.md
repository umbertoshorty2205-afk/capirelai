---
titolo: "Automazione Excel, Fatture e Documenti con l'AI: Estrazione Strutturata e Controlli Anti-Errore"
descrizione: "Come usare l'AI per generare formule Excel/Sheets affidabili, normalizzare CSV sporchi ed estrarre campi da fatture o DDT PDF senza far passare errori di calcolo."
data: 2026-11-15
autore: "Capire l'AI"
---

Una delle applicazioni più concrete dell'AI in amministrazione e back-office non è scrivere testi creativi, ma **riordinare dati sporchi e debuggare formule Excel/Google Sheets**. Allo stesso tempo, è l'area dove un errore silenzioso su una virgola decimale costa caro.

## 1. Cosa automatizzare subito su Excel e Google Sheets

- **Scrittura e correzione formule complesse (`CERCA.X`, `MATR.SOMMA.PRODOTTO`, `QUERY`):** descrivendo nomi colonne esatti, lingua di Excel (italiano vs inglese) e due righe di esempio ottieni subito la formula corretta senza perdere un'ora.
- **Pulizia elenchi CSV e anagrafiche:** uniformare formati date, separare CAP/Città/Provincia e segnalare righe duplicate o PARTITA IVA malformate.
- **Triage prima registrazione fatture/DDT PDF:** estrarre fornitore, numero documento, data, imponibile e aliquote in formato JSON/tabella per accelerare il caricamento.

## 2. Prompt per estrazione sicura con controllo di quadratura

```text
Ruolo: Assistente contabile rigoroso.
Obiettivo: Estrai i campi dal testo/tabella del documento allegato. Se un campo è illeggibile scrivi "DA_VERIFICARE".
Verifica matematica: somma gli imponibili e l'IVA estratti e confrontali con il Totale Documento; se c'è anche 0,01€ di differenza segnalalo esplicitamente in "anomalia_quadratura".
Formato: Solo tabella con [Campo | Valore | Stato verifica].
```

## Regola di sicurezza sui numeri

Non usare mai un modello linguistico testuale per *calcolare a mente* totali su decine di righe: fagli **generare la formula Excel o lo script Python/Apps Script**, poi lascia che sia il foglio di calcolo deterministico a eseguire la somma esatta.
