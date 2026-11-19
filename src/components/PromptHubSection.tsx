import React, { useState } from 'react';
import { Check, Copy, ArrowRight, BookOpen, Clock } from 'lucide-react';

type PromptCategory = 'tutti' | 'vendite' | 'documenti' | 'riunioni' | 'dati';

interface HubPromptItem {
  id: string;
  number: string;
  category: Exclude<PromptCategory, 'tutti'>;
  categoryLabel: string;
  title: string;
  timeSaved: string;
  recommendedTool: string;
  useCase: string;
  promptText: string;
}

const HUB_PROMPTS: HubPromptItem[] = [
  {
    id: 'email-followup',
    number: '01',
    category: 'vendite',
    categoryLabel: 'Email & Vendite',
    title: 'Follow-up commerciale senza frasi da robot',
    timeSaved: '2,5 h/sett',
    recommendedTool: 'ChatGPT / Claude',
    useCase: 'Riprendi un preventivo o una call B2B in 110 parole asciutte, zero cliché e domanda finale chiara.',
    promptText: `Ruolo: Consulente B2B italiano con stile asciutto, diretto e credibile.
Obiettivo: Scrivi un'email di follow-up al cliente [NOME] sul preventivo inviato il [DATA] per [SERVIZIO]. Riprendi il bisogno principale ([BISOGNO]) senza offrire sconti non richiesti e proponi una call di 10 minuti o due opzioni chiare.
Vincoli: Vietato usare "spero che questa email ti trovi bene", "inoltre", "soluzione rivoluzionaria", "sinergia", "non esitare". Se manca un dato reale scrivi [DATO MANCANTE].
Formato: Oggetto concreto (max 7 parole) + testo massimo 110 parole in 3 brevi paragrafi + chiusura con domanda binaria semplice.`,
  },
  {
    id: 'audit-pdf',
    number: '02',
    category: 'documenti',
    categoryLabel: 'Documenti & PDF',
    title: 'Audit rapido di contratti e PDF da 50 pagine',
    timeSaved: '2,5 h/sett',
    recommendedTool: 'NotebookLM / Claude',
    useCase: 'Isola penali, rinnovi taciti, costi nascosti e clausole sbilanciate citando sempre pagina e articolo.',
    promptText: `Ruolo: Analista documentale rigoroso (supporto operativo, non parere legale).
Obiettivo: Analizza esclusivamente il documento allegato ed evidenzia rischi, vincoli nascosti e scadenze critiche citando sempre pagina e articolo esatto.
Vincoli: Non inferire clausole non scritte. Se una tabella o una cifra scansionata è ambigua segnalala come [DA VERIFICARE SU ORIGINALE].
Formato: 5 sezioni numerate — (1) Oggetto e obblighi, (2) Penali e clausole sbilanciate, (3) Costi fissi/variabili/nascosti, (4) Termini di recesso e rinnovo tacito, (5) 4 domande esatte da porre prima della firma.`,
  },
  {
    id: 'preventivo-chiaro',
    number: '03',
    category: 'vendite',
    categoryLabel: 'Email & Vendite',
    title: 'Preventivo ordinato da appunti grezzi o vocali',
    timeSaved: '2,0 h/sett',
    recommendedTool: 'ChatGPT / Gemini',
    useCase: 'Trasforma note prese al volo in una proposta chiara con perimetro, tempi di consegna ed esclusioni.',
    promptText: `Ruolo: Responsabile tecnico-commerciale per PMI e freelance italiani.
Obiettivo: Trasforma questi appunti grezzi ([INCOLLA APPUNTI]) in una proposta commerciale chiara che prevenga incomprensioni su perimetro, tempi e consegne.
Vincoli: Usa solo i dati forniti. Esplicita sempre cosa è incluso e cosa resta escluso. Zero aggettivi promozionali vuoti.
Formato: 4 blocchi — (1) Situazione e obiettivo in 3 righe, (2) Cosa consegniamo + tempistiche, (3) Esclusioni chiare, (4) Investimento e prossimo passo operativo.`,
  },
  {
    id: 'verbale-riunione',
    number: '04',
    category: 'riunioni',
    categoryLabel: 'Riunioni',
    title: 'Verbale operativo e tabella azioni post-call',
    timeSaved: '1,5 h/sett',
    recommendedTool: 'Claude / Gemini',
    useCase: 'Estrae solo decisioni confermate, responsabili e scadenze dalla trascrizione, senza inventare nulla.',
    promptText: `Ruolo: Project manager operativo.
Obiettivo: Trasforma la trascrizione allegata in un verbale azionabile eliminando chiacchiere, ripetizioni e opinioni non confermate.
Vincoli: Non assegnare mai un responsabile o una data se non sono stati dichiarati esplicitamente nella riunione (usa [DA ASSEGNARE]).
Formato: (1) Decisioni approvate (max 5 punti), (2) Tabella [Azione | Responsabile | Scadenza], (3) Dubbi o blocchi aperti da chiarire nella prossima call.`,
  },
  {
    id: 'pulizia-excel',
    number: '05',
    category: 'dati',
    categoryLabel: 'Excel & Dati',
    title: 'Pulizia CSV, formule Excel ITA e quadratura',
    timeSaved: '1,5 h/sett',
    recommendedTool: 'ChatGPT / Claude',
    useCase: 'Standardizza date e tabelle sporche, segnala anomalie e genera la formula corretta per Excel italiano.',
    promptText: `Ruolo: Data analyst specializzato in Excel (versione italiana) e Google Sheets.
Obiettivo: Analizza questi dati grezzi ([INCOLLA TABELLA/CSV]), standardizza date in YYYY-MM-DD, formati numerici e nomi azienda, e scrivi la formula Excel pronta per il riepilogo richiesto ([DESCRIVI CALCOLO]).
Vincoli: Non stimare né completare righe vuote. Segnala duplicati, formati incoerenti o scarti di quadratura anche di 0,01€ in un blocco separato.
Formato: (1) Tabella pulita, (2) Elenco righe anomale, (3) Formula copiabile + breve spiegazione in 2 righe.`,
  },
];

const CATEGORY_TABS: Array<{ id: PromptCategory; label: string }> = [
  { id: 'tutti', label: 'Tutti (5)' },
  { id: 'vendite', label: 'Email & Vendite' },
  { id: 'documenti', label: 'Documenti & PDF' },
  { id: 'riunioni', label: 'Riunioni' },
  { id: 'dati', label: 'Excel & Dati' },
];

interface PromptHubSectionProps {
  onOpenPillarArticle: () => void;
  onScrollToNewsletter: () => void;
}

export const PromptHubSection: React.FC<PromptHubSectionProps> = ({
  onOpenPillarArticle,
  onScrollToNewsletter,
}) => {
  const [activeCategory, setActiveCategory] = useState<PromptCategory>('tutti');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string>('email-followup');

  const filteredPrompts =
    activeCategory === 'tutti'
      ? HUB_PROMPTS
      : HUB_PROMPTS.filter((item) => item.category === activeCategory);

  const handleCopyPrompt = async (item: HubPromptItem) => {
    try {
      await navigator.clipboard.writeText(item.promptText);
      setCopiedId(item.id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === item.id ? null : current));
      }, 2200);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = item.promptText;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedId(item.id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === item.id ? null : current));
      }, 2200);
    }
  };

  return (
    <section
      id="hub-prompt"
      className="relative z-20 mx-auto max-w-6xl px-5 py-20 sm:px-8 border-t border-white/10"
      aria-labelledby="hub-prompt-heading"
    >
      {/* Header Row */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-medium tracking-widest uppercase text-sky-400">
            Hub AI per lavorare · Metodo R.O.F.
          </p>
          <h2
            id="hub-prompt-heading"
            className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-white [text-wrap:balance]"
          >
            I 5 prompt pronti che ti salvano fino a 10 ore a settimana
          </h2>
          <p className="mt-3 text-base text-slate-300 leading-relaxed">
            Copia il testo, sostituisci i campi tra parentesi quadre e ottieni bozze pulite al primo colpo su ChatGPT, Claude o Gemini.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenPillarArticle}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-100 hover:bg-white/[0.08] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <BookOpen className="h-4 w-4 text-sky-400" aria-hidden="true" />
            <span>Leggi la guida completa</span>
          </button>
        </div>
      </div>

      {/* Category Filter Segmented Control + Aggregate Metric */}
      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-5">
        <div
          className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-white/[0.04] p-1 border border-white/10"
          role="tablist"
          aria-label="Filtra i 5 prompt per area lavorativa"
        >
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-sky-500 text-slate-950'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 font-mono tabular-nums">
          <Clock className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
          <span>Risparmio stimato cumulativo: 10,0 h/sett</span>
        </div>
      </div>

      {/* Prompt List — Clean Single-Elevation Editorial Cards */}
      <div className="mt-8 space-y-4">
        {filteredPrompts.map((item) => {
          const isExpanded = expandedId === item.id;
          const isCopied = copiedId === item.id;

          return (
            <article
              key={item.id}
              className="rounded-xl border border-white/10 bg-[#0b101b]/90 p-5 sm:p-6 transition-colors hover:border-white/20"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
                    <span className="text-sky-400 font-semibold">{item.number}.</span>
                    <span>{item.categoryLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-400">Risparmio ~{item.timeSaved}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.recommendedTool}</span>
                  </div>
                  <h3 className="mt-2 text-lg sm:text-xl font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-300 leading-relaxed max-w-3xl">
                    {item.useCase}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? '' : item.id)}
                    className="rounded-lg border border-white/15 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-200 hover:bg-white/[0.06] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {isExpanded ? 'Nascondi testo' : 'Mostra prompt'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyPrompt(item)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isCopied
                        ? 'bg-emerald-400 text-slate-950'
                        : 'bg-sky-400 text-slate-950 hover:bg-sky-300'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-4 w-4" aria-hidden="true" />
                        <span>Copiato</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" aria-hidden="true" />
                        <span>Copia prompt</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-5 pt-4 border-t border-white/10">
                  <pre className="overflow-x-auto rounded-lg bg-[#05080f] p-4 text-xs sm:text-sm leading-relaxed text-slate-200 font-mono whitespace-pre-wrap border border-white/5">
                    {item.promptText}
                  </pre>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Lead Magnet Conversion Strip (Jarvis UX Fix) */}
      <div className="mt-10 rounded-xl border border-sky-400/25 bg-[#0a1322] p-6 sm:p-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-medium tracking-widest uppercase text-emerald-400">
            Lead Magnet Gratuito · Download immediato
          </p>
          <h3 className="mt-2 text-xl sm:text-2xl font-semibold text-white">
            Vuoi il Kit AI 2026 completo (15 prompt pronti + 5 tool testati in italiano)?
          </h3>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Iscriviti alla newsletter gratuita di Capire l&apos;AI: sblocchi subito il file operativo `.md` scaricabile e ricevi un solo workflow pratico testato a settimana. Zero spam.
          </p>
        </div>

        <button
          type="button"
          onClick={onScrollToNewsletter}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-sky-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>Scarica il Kit gratis</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
};
