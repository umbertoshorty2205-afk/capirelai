---

titolo: "Come riassumere un documento lungo con l'AI"

descrizione: "Un metodo in quattro passi per ottenere riassunti affidabili da documenti lunghi, con un test confrontato su due prompt"

data: 2026-11-07

autore: "Capire l'AI"

---



Riassumere un documento lungo è uno dei compiti più utili per un modello linguistico, ma anche uno dei più facili da fare male. Il risultato sembra ordinato e convincente anche quando salta un passaggio importante o introduce un dettaglio che nel testo non c'è. Questa guida propone un metodo semplice per ottenere riassunti più affidabili, con un test reale per verificarlo.



## Passo 1: controlla che il documento entri nel contesto



Il modello può considerare solo una quantità limitata di testo per volta, misurata in token. Se non sei sicuro di quanto sia lungo il tuo documento, leggi la pagina sui \[token](/concetti/token/). Se il testo è molto lungo, dividilo in sezioni logiche, per esempio capitoli o paragrafi tematici, e riassumi ogni parte separatamente.



## Passo 2: scrivi un prompt con quattro elementi



Un buon prompt di riassunto dice al modello cosa fare, per chi, in quale formato e con quali limiti. Gli elementi essenziali sono:



\- **il compito**, cioè cosa vuoi ottenere;

\- **il pubblico**, per calibrare il livello di dettaglio;

\- **il formato**, per esempio cinque punti o un paragrafo;

\- **le regole**, in particolare l'obbligo di usare solo il testo fornito e di segnalare ciò che manca o non è chiaro.



Ecco un esempio:



Riassumi il documento allegato per un lettore che non lo conosce.

Usa al massimo cinque punti, ciascuno con una frase.

Usa solo informazioni presenti nel testo.

Se un’informazione importante non è chiara o manca, segnalalo

in una sezione finale intitolata “Dubbi”.





## Passo 3: chiedi di segnalare i dubbi



La sezione finale dei dubbi è la parte più utile del prompt. Un modello che segnala ciò che non è chiaro ti aiuta a capire dove controllare. Non è però una garanzia: anche i dubbi possono essere sbagliati, quindi vanno verificati come il resto.



## Passo 4: verifica prima di fidarti



Prima di usare un riassunto, controlla almeno tre cose: numeri, date e nomi propri. Sono gli elementi che il modello riformula più spesso. Scegli due o tre punti e cercali nel documento originale. Se non li trovi, il riassunto non è affidabile su quel punto.



## Il mio test

Ho provato il metodo su un'unica voce di Wikipedia in italiano sull'apprendimento automatico, lunga circa 2.000 parole, con i riferimenti tra parentesi quadre rimossi. Ho eseguito una sola volta ciascun prompt: il prompt A era semplice, "Riassumi questo documento"; il prompt B era quello della guida, con compito, pubblico, formato, regole e sezione "Dubbi".

Il prompt A ha prodotto un riassunto discorsivo e fedele nei punti principali, senza segnalare nulla di incerto. Il prompt B ha prodotto cinque punti chiari e una sezione "Dubbi" con tre osservazioni. Una riguardava un difetto reale nella mia copia del testo, una frase con la parola "self-organization" tagliata. Le altre due segnalavano fonti mancanti, cioè informazioni senza autore o riferimento: osservazioni vere, ma non errori.

**Limiti del test.** È una sola prova, su un solo testo, senza ripetizioni. Non so quanti dubbi falsi il prompt produca su un testo corretto, né quanti errori reali riesca a trovare su più esempi. Il risultato va letto come un'indicazione da verificare, non come una misura. Il punto che regge è questo: la sezione "Dubbi" può essere utile, ma non sostituisce il controllo sul documento originale.
Fonte del testo: Wikipedia in italiano, voce "Apprendimento automatico".

