---

titolo: "Come riassumere un documento lungo con l'AI"

descrizione: "Un metodo in quattro passi per ottenere riassunti affidabili da documenti lunghi, con un test confrontato su due prompt"

data: 2026-11-07

autore: "Capire l'AI"

---



Riassumere un documento lungo è uno dei compiti più utili per un modello linguistico, ma anche uno dei più facili da fare male. Il risultato sembra ordinato e convincente anche quando salta un passaggio importante o introduce un dettaglio che nel testo non c'è. Questa guida propone un metodo semplice per ottenere riassunti più affidabili, con un test reale per verificarlo.



\## Passo 1: controlla che il documento entri nel contesto



Il modello può considerare solo una quantità limitata di testo per volta, misurata in token. Se non sei sicuro di quanto sia lungo il tuo documento, leggi la pagina sui \[token](/concetti/token/). Se il testo è molto lungo, dividilo in sezioni logiche, per esempio capitoli o paragrafi tematici, e riassumi ogni parte separatamente.



\## Passo 2: scrivi un prompt con quattro elementi



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





\## Passo 3: chiedi di segnalare i dubbi



La sezione finale dei dubbi è la parte più utile del prompt. Un modello che segnala ciò che non è chiaro ti aiuta a capire dove controllare. Non è però una garanzia: anche i dubbi possono essere sbagliati, quindi vanno verificati come il resto.



\## Passo 4: verifica prima di fidarti



Prima di usare un riassunto, controlla almeno tre cose: numeri, date e nomi propri. Sono gli elementi che il modello riformula più spesso. Scegli due o tre punti e cercali nel documento originale. Se non li trovi, il riassunto non è affidabile su quel punto.



\## Il mio test



Ho provato il metodo su un testo reale: la voce di Wikipedia in italiano dedicata all'apprendimento automatico, lunga circa 2.000 parole dopo aver tolto i riferimenti tra parentesi quadre. Wikipedia è rilasciata con licenza CC BY-SA, quindi il testo può essere usato con citazione della fonte.



Ho usato due prompt, in conversazioni separate. Il prompt A era semplice: "Riassumi questo documento". Il prompt B era quello della guida, con compito, pubblico, formato, regole e sezione finale "Dubbi".



**Risultati**

Il prompt A ha prodotto un riassunto discorsivo e fedele nei fatti principali, come la definizione di Mitchell e la storia del campo. Non segnalava nulla di incerto, perché non glielo avevo chiesto. Il prompt B ha prodotto cinque punti brevi e chiari, più facili da scorrere per un lettore che non conosce il tema, e una sezione "Dubbi" con tre osservazioni.



**Verifica dei dubbi**

Due dubbi su tre erano fondati. Il teorema del 2022 sui computer quantistici non indica autori o fonte nel testo. Anche l'ipotesi dei 30 qubit e del miliardo di punti-dato è presentata senza indicare chi l'ha formulata. Il terzo dubbio ha colto un problema reale nella mia copia del testo: la parola "self-organization" risultava tagliata in "self-organizatio". Il riferimento a Mitchell, invece, non ha trovato conferma: nel testo è citato correttamente.



**Cosa ho imparato**

Il prompt B è più utile per un lettore, ma non è più affidabile di per sé. Ha segnalato un difetto reale, però ne ha anche proposto uno che nel testo non c'era. Per questo ogni dubbio va verificato sul documento, e lo stesso vale per ogni affermazione del riassunto.



**Conclusione**

Per un lettore che non conosce il tema, consiglio il prompt B. Per usarlo in sicurezza, però, serve il controllo del Passo 4: senza verifica, il riassunto e i suoi dubbi restano semplici ipotesi.



Fonte del testo: Wikipedia in italiano, voce "Apprendimento automatico".

