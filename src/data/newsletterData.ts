export interface AutomationEmailTemplate {
  step: number;
  delayLabel: string;
  subject: string;
  previewText: string;
  goal: string;
  bodyText: string;
}

export interface AffiliateToolItem {
  id: string;
  name: string;
  category: string;
  useCase: string;
  costLabel: string;
  affiliateCommissionNote: string;
  defaultUrl: string;
}

export interface SponsorTier {
  id: string;
  name: string;
  priceLabel: string;
  deliverables: string;
  bestFor: string;
}

export const LEAD_MAGNET_ID = 'kit-rof-pmi-2026';

export const AUTOMATION_SEQUENCE: AutomationEmailTemplate[] = [
  {
    step: 1,
    delayLabel: 'Giorno 0 (Invio Automatico Immediato)',
    subject: 'Il tuo Kit Operativo R.O.F. (10 Prompt & Checklist PMI)',
    previewText: 'Dentro: la formula R.O.F., 5 prompt anti-robot e la checklist GDPR per lavorare con l’AI.',
    goal: 'Consegna del Lead Magnet + primo contatto autentico + segmentazione',
    bodyText: `Ciao {{NOME}},

benvenuto in Radar AI Pratica (capirelai.com).

Qui sotto trovi l'accesso immediato al Kit Operativo promesso: niente teoria astratta, solo prompt testati e regole pratiche per risparmiare ore ogni settimana.

--- COSA TROVI NEL KIT ---
1. La formula R.O.F. (Ruolo · Obiettivo · Formato) per smettere di ottenere risposte generiche
2. I 5 prompt ad alto impatto (email, PDF/contratti, preventivi, riunioni, Excel)
3. La checklist rapida Cloud vs AI Locale per non esporre dati aziendali

Scarica o leggi il Kit completo qui:
https://capirelai.com/#newsletter

Domanda veloce per calibrare le prossime uscite: rispondi a questa email scrivendo in 1 riga su quale attività perdi più tempo oggi (email, documenti/PDF, preventivi o fogli Excel). Leggo ogni risposta personalmente.

A presto,
Fondatore di Capire l'AI
https://capirelai.com`,
  },
  {
    step: 2,
    delayLabel: 'Giorno +3 (Follow-up Caso Pratico)',
    subject: 'Il test reale: come tagliare 4 ore/settimana su preventivi e PDF',
    previewText: 'Il flusso esatto senza codice che abbiamo misurato su documenti e offerte commerciali.',
    goal: 'Dimostrazione valore pratico + traffico sugli articoli Spoke del sito',
    bodyText: `Ciao {{NOME}},

nei nostri test recenti sulle PMI italiane abbiamo notato un dato chiaro: l'AI non fa risparmiare tempo quando la usi per "chattare", ma quando sostituisce il copia-incolla ripetitivo.

Abbiamo documentato due casi pratici passo-passo sul sito:
- Scrivere preventivi ed email commerciali con il tuo tono reale (zero frasi da robot)
- Analizzare contratti e PDF lunghi estraendo clausole, costi e scadenze in 10 secondi

Trovi entrambe le guide testate nella sezione Guide su https://capirelai.com/#guide.

Nella prossima uscita ti mostro i pochi strumenti che hanno superato i nostri test sul campo (e quelli che puoi evitare tranquillamente).

Un saluto,
Fondatore di Capire l'AI`,
  },
  {
    step: 3,
    delayLabel: 'Giorno +6 (Stack Tool Verificati + Monetizzazione)',
    subject: 'I 4 tool AI che usiamo davvero (e quando ha senso farsi aiutare)',
    previewText: 'Stack essenziale a basso costo, costi API reali e possibilità di Audit per la tua attività.',
    goal: 'Conversione trasparente (Affiliazioni verificate + Richieste Audit PMI / Sponsor)',
    bodyText: `Ciao {{NOME}},

dopo decine di test su tool che promettono miracoli, il nostro stack essenziale si è ridotto a 4 componenti reali:
1. Modello di ragionamento + Projects per istruzioni fisse
2. Automazione flussi no-code (Make o n8n self-hosted) per collegare Email, PDF e fogli di lavoro
3. Ricerca verificata con fonti (Perplexity Pro) al posto della ricerca manuale
4. Infrastruttura locale (Ollama) quando i documenti sono riservati e soggetti a GDPR

Se gestisci una PMI o uno studio e vuoi capire quale flusso conviene automatizzare per primo senza buttare budget in abbonamenti inutili, puoi richiedere un Audit Workflow AI direttamente da https://capirelai.com/#newsletter.

Alla prossima analisi,
Fondatore di Capire l'AI`,
  },
];

export const VERIFIED_AFFILIATE_STACK: AffiliateToolItem[] = [
  {
    id: 'make',
    name: 'Make.com',
    category: 'Automazione No-Code',
    useCase: 'Collega Gmail, moduli sito, Google Sheets e modelli AI con trigger visuali.',
    costLabel: 'Piano Free · Pro da €9/mese',
    affiliateCommissionNote: 'Partner ricorrente (20% sulle sottoscrizioni)',
    defaultUrl: 'https://www.make.com/en/register',
  },
  {
    id: 'brevo',
    name: 'Brevo',
    category: 'Email Automation & GDPR',
    useCase: 'Invio email transazionali, sequenze automatiche di benvenuto e liste segmentate in UE.',
    costLabel: 'Gratis fino a 300 email/giorno',
    affiliateCommissionNote: 'Programma partner B2B europeo',
    defaultUrl: 'https://www.brevo.com/',
  },
  {
    id: 'n8n',
    name: 'n8n Cloud / Self-Hosted',
    category: 'Agenti & Webhook Avanzati',
    useCase: 'Orchestrazione agenti AI e webhook aziendali con pieno controllo dei dati.',
    costLabel: 'Self-hosted gratuito · Cloud da €20/mese',
    affiliateCommissionNote: 'Consigliato nei flussi tecnici avanzati',
    defaultUrl: 'https://n8n.io/',
  },
  {
    id: 'perplexity',
    name: 'Perplexity Pro',
    category: 'Ricerca con Fonti',
    useCase: 'Analisi mercato, normative e benchmark con citazione diretta delle fonti.',
    costLabel: 'Piano base gratis · Pro $20/mese',
    affiliateCommissionNote: 'Referral verificato su tool testati',
    defaultUrl: 'https://www.perplexity.ai/',
  },
];

export const SPONSOR_TIERS: SponsorTier[] = [
  {
    id: 'slot-singolo',
    name: 'Partner Singolo nella Newsletter',
    priceLabel: '€90 / uscita (lancio)',
    deliverables: '1 box dedicato "Partner della Settimana" (titolo, descrizione onesta 45 parole, CTA tracciata UTM) + menzione nel riepilogo.',
    bestFor: 'Tool SaaS AI, software B2B e startup tech che cercano professionisti e PMI italiane.',
  },
  {
    id: 'bundle-mensile',
    name: 'Pacchetto 4 Uscite + Recensione Test',
    priceLabel: '€290 / mese',
    deliverables: '4 uscite settimanali consecutive + 1 prova indipendente documentata nella sezione Prove di capirelai.com.',
    bestFor: 'Piattaforme AI, cloud provider o tool produttività in fase di espansione in Italia.',
  },
  {
    id: 'audit-pmi',
    name: 'Audit Workflow AI per PMI',
    priceLabel: 'Preventivo su misura',
    deliverables: 'Analisi di 1–3 processi aziendali (preventivi, PDF, email, fogli Excel) con prototipo R.O.F. o automazione testata.',
    bestFor: 'Titolari di PMI, studi professionali e team operativi che vogliono ROI rapido.',
  },
];
