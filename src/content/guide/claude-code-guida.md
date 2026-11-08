---
titolo: "Claude Code: come iniziare a usarlo nel tuo progetto"
descrizione: "Cos'è Claude Code, come installarlo e come farlo lavorare su un progetto reale, con un test pratico e le verifiche da fare sempre"
data: 2026-11-08
autore: "Capire l'AI"
---

Claude Code è uno strumento di Anthropic che porta Claude direttamente nel terminale, dove lavorano già molte persone che sviluppano software. Non si limita a rispondere a una domanda: legge i file di un progetto, propone modifiche, esegue comandi e può controllare il risultato. Ogni azione importante richiede la tua autorizzazione.

## Cos'è, in pratica

Claude Code è un agente. Riceve un obiettivo in linguaggio naturale, per esempio "aggiungi una pagina di contatto" o "perché questo test fallisce?", e lavora sui file del progetto per raggiungerlo. La differenza rispetto a una chat è il contesto: vede la struttura del progetto, i file coinvolti e il risultato dei comandi che esegue.

## Installazione

L'installazione cambia a seconda del sistema operativo e della versione, quindi conviene seguire la documentazione ufficiale su code.claude.com. Su Windows è possibile installarlo in modo nativo da PowerShell o dal prompt dei comandi, senza diritti di amministratore. Git for Windows è consigliato: se è presente, Claude Code può usare lo strumento Bash, altrimenti usa PowerShell.

Dopo l'installazione, verifica che funzioni con:

claude --version


Se compare un errore, il comando `claude doctor` mostra una diagnosi dell'installazione e delle impostazioni, con suggerimenti per risolvere i problemi.

## Primo utilizzo

Apri il terminale nella cartella del progetto e lancia:

claude


Al primo avvio ti chiede di accedere con il tuo account Claude. Poi puoi scrivere le richieste in italiano, come in una chat. Quando Claude propone una modifica, leggila prima di accettarla: è il controllo più importante.

## Un test da fare su un progetto piccolo

Per capire come lavora lo strumento, prova con un progetto di prova, non con quello importante:

1. Crea una cartella con un file di testo o una pagina HTML semplice.
2. Apri Claude Code nella cartella e chiedi una modifica precisa, per esempio "aggiungi un titolo e un paragrafo di introduzione".
3. Prima di accettare, leggi cosa cambia nei file.
4. Chiedi una seconda modifica, per esempio "cambia il titolo in un altro testo".
5. Annota quanto tempo ha richiesto ciascuna modifica e se ha fatto esattamente quello che hai chiesto, o qualcosa in più.

Il test serve a vedere la differenza tra ciò che chiedi e ciò che lo strumento fa davvero. È la stessa verifica che vale per qualsiasi riassunto o risposta di un modello.

## Perché è utile

Il vantaggio principale è lavorare su più file in una sola richiesta, senza copiare e incollare codice tra chat ed editor. È utile per le attività ripetitive, come aggiornare la stessa informazione in più pagine, correggere un errore segnalato da un test o preparare una modifica che tocca più parti del progetto.

Serve anche a chi programma da poco: può farsi spiegare il codice che produce, passo per passo. Ma non sostituisce la comprensione. Il codice proposto va letto, e le modifiche vanno verificate eseguendo il progetto.

## Limiti da ricordare

Claude Code può sbagliare, come qualsiasi modello. Per questo conviene lavorare con Git, che salva le versioni del progetto: così ogni modifica può essere annullata. Prima di usarlo su un progetto importante, provalo su uno di prova.

Anche i comandi e le opzioni cambiano nel tempo. Quando qualcosa non corrisponde a quanto descritto qui, la documentazione ufficiale è la fonte da seguire.