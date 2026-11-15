---
titolo: "Metodo R.O.F.: 10 Prompt ChatGPT e Claude da Copiare Subito (Ruolo, Obiettivo, Formato)"
descrizione: "Come smettere di usare l'AI come un motore di ricerca generico usando la struttura R.O.F. (Ruolo, Obiettivo, Formato) con 10 prompt operativi pronti per il lavoro quotidiano."
data: 2026-11-15
autore: "Capire l'AI"
---

Se scrivi a ChatGPT o Claude domande da una riga (*"Scrivimi una email per un cliente in ritardo"*), ottieni risposte generiche, prolisse e inutilizzabili senza riscriverle da capo. Il problema non è il modello: manca una struttura minima d'ingresso.

Il **Metodo R.O.F.** risolve il problema in 15 secondi fissando tre blocchi obbligatori prima di premere Invio: **Ruolo**, **Obiettivo** e **Formato** (più una clausola anti-invenzione quando lavori su dati aziendali).

## Cos'è la struttura R.O.F.

1. **R — Ruolo:** definisce il punto di vista tecnico e il registro (es. *"Agisci come un controller di gestione per PMI"* invece di nessun ruolo).
2. **O — Obiettivo e Contesto:** chiarisce cosa ottenere, per quale destinatario e con quali vincoli reali (budget, tono, lunghezze, divieti).
3. **F — Formato di Output:** impone la forma esatta della risposta (tabella, 3 punti, JSON, oggetto + testo sotto le 120 parole), evitando muri di testo.

> Regola pratica: aggiungi sempre alla fine *"Se manca un dato necessario, non inventarlo: segnalalo con [DATO MANCANTE]"*.

---

## I 10 Prompt R.O.F. pronti da copiare

### 1. Email di sollecito pagamento cortese ma ferma
```text
Ruolo: Agisci come responsabile amministrativo di una PMI B2B italiana.
Obiettivo: Scrivi un primo sollecito per la fattura [NUMERO] di [IMPORTO] scaduta il [DATA] verso il cliente [NOME CLIENTE], mantenendo un rapporto cordiale ma chiedendo una data certa di bonifico.
Formato: Oggetto email + corpo massimo 90 parole + chiusura con richiesta conferma entro 48 ore.
```

### 2. Risposta a un cliente indeciso dopo un preventivo
```text
Ruolo: Consulente commerciale B2B esperto in trattative consultive senza pressione aggressiva.
Obiettivo: Riprendi il preventivo inviato il [DATA] per [SERVIZIO/PRODOTTO] chiarendo il valore pratico ed evitando sconti non richiesti. Proponi una call breve di 10 minuti o due alternative modulari.
Formato: 1 oggetto chiaro + testo da max 120 parole diviso in 3 paragrafi brevi + 2 opzioni di risposta rapida.
```

### 3. Sintesi operativa di una riunione lunga (o trascrizione)
```text
Ruolo: Project manager tecnico.
Obiettivo: Analizza la trascrizione allegata ed estrai solo decisioni prese, attività aperte e punti rimasti bloccati. Non riassumere le chiacchiere introduttive e non inventare responsabili non citati.
Formato: 3 elenchi puntati — (1) Decisioni confermate, (2) Tabella Azione | Responsabile | Scadenza, (3) Questioni aperte.
```

### 4. Confronto rapido tra due preventivi di fornitori
```text
Ruolo: Responsabile acquisti e controllo costi.
Obiettivo: Confronta i due preventivi incollati sotto evidenziando costi ricorrenti, spese di setup, vincoli di rinnovo, penali e voci escluse dall'offerta B rispetto alla A.
Formato: Tabella comparativa con colonne [Voce | Fornitore A | Fornitore B | Rischio o Nota] + 3 domande critiche da fare prima della firma.
```

### 5. Trasformare appunti disordinati in procedura aziendale (SOP)
```text
Ruolo: Operations manager per micro-imprese.
Obiettivo: Trasforma questi appunti vocali grezzi in una procedura ripetibile che un nuovo collaboratore possa eseguire senza chiedere chiarimenti ogni passo.
Formato: Titolo procedura + Prerequisiti (max 3 righe) + Passaggi numerati in ordine cronologico + Checklist finale di controllo qualità.
```

### 6. Audit critico di un contratto o accordo di fornitura
```text
Ruolo: Analista documentale attento ai rischi operativi (supporto preliminare, non parere legale).
Obiettivo: Leggi il testo allegato e individua solo clausole asimmetriche, taciti rinnovi, limitazioni di responsabilità sbilanciate e tempi di preavviso critici, citando numero articolo o pagina.
Formato: Lista numerata ordinata per gravità [Alta / Media] + 4 punti esatti da verificare con il proprio legale.
```

### 7. Pulizia e ristrutturazione dati da tabella o CSV disordinato
```text
Ruolo: Data analyst specializzato in normalizzazione fogli Excel/CSV.
Obiettivo: Standardizza date (YYYY-MM-DD), importi numerici e nomi aziende dai dati incollati qui sotto segnalando righe incomplete o duplicate senza correggere arbitrariamente i numeri.
Formato: Tabella pulita pronta per copia-incolla in Excel + elenco separato delle righe anomale.
```

### 8. Piano editoriale pratico B2B basato sulle domande dei clienti
```text
Ruolo: Stratega contenuti per PMI e professionisti tecnici.
Obiettivo: Partendo da queste 5 obiezioni reali che riceviamo dai clienti ([ELENCO]), genera idee concrete che dimostrino competenza reale senza frasi fatte motivazionali.
Formato: Tabella con 5 righe [Obiezione cliente | Titolo guida o Reel | Hook primi 3 secondi | Esempio pratico da mostrare].
```

### 9. Debug guidato di una formula Excel / Google Sheets o script
```text
Ruolo: Sviluppatore senior e specialista fogli di calcolo.
Obiettivo: Spiega perché questa formula/funzione restituisce errore o dato errato sullo scenario descritto, proponi la versione corretta e indica un test per verificarla.
Formato: (1) Causa esatta in 2 righe, (2) Formula/codice corretto in blocco copiabile, (3) Caso di test con input e output atteso.
```

### 10. Auto-revisione critica (Red Team) prima di pubblicare o inviare
```text
Ruolo: Revisore severo e scettico nel settore [SETTORE].
Obiettivo: Leggi la bozza qui sotto e individua affermazioni vaghe, promesse non dimostrate, passaggi ambigui o toni artificiali. Non riscrivere tutto: indica cosa tagliare o precisare.
Formato: Massima 5 critiche numerate con [Frase originale -> Problema -> Correzione concreta proposta].
```

## Limite reale da ricordare

Anche il prompt R.O.F. più preciso non sostituisce la verifica umana su **numeri contabili, clausole contrattuali vincolanti e dati clienti aggiornati** se non hai collegato fonti o documenti verificati. Usa sempre questi prompt per risparmiare l'80% del tempo di stesura e tieni l'ultimo controllo prima dell'invio.
