import React, { useState, useEffect } from 'react';
import {
  subscribeToNewsletter,
  submitMonetizationInquiry,
  fetchPublicMonetizationCatalog,
  type SubscriberSegment,
  type InquiryKind,
  type PublicCatalogData,
} from '../lib/firebase';
import {
  LEAD_MAGNET_ID,
  LEAD_MAGNET_MARKDOWN,
  VERIFIED_AFFILIATE_STACK,
  SPONSOR_TIERS,
} from '../data/newsletterData';

interface NewsletterSectionProps {
  leadSource?: string;
  onResetLeadSource?: () => void;
  externalInquiryOpen?: InquiryKind | null;
  onCloseExternalInquiry?: () => void;
}

export const NewsletterSection: React.FC<NewsletterSectionProps> = ({
  leadSource = 'homepage',
  externalInquiryOpen = null,
  onCloseExternalInquiry,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [segment, setSegment] = useState<SubscriberSegment>('pmi');
  const [gdprConsent, setGdprConsent] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successInfo, setSuccessInfo] = useState<{
    alreadySubscribed: boolean;
    emailDispatched: boolean;
    provider: string;
    email: string;
  } | null>(null);
  const [isKitPreviewOpen, setIsKitPreviewOpen] = useState(false);
  const [kitCopied, setKitCopied] = useState(false);

  const [catalog, setCatalog] = useState<PublicCatalogData>({
    sponsorStatus: 'Slot Aperti · Novembre / Dicembre',
    sponsorPriceLabel: 'Da €90 / uscita newsletter',
    recommendedToolsSummary: 'Make · Brevo · n8n · Perplexity Pro',
  });

  // B2B Monetization Modal (Sponsor / Audit PMI)
  const [inquiryModalKind, setInquiryModalKind] = useState<InquiryKind | null>(null);
  const [inqName, setInqName] = useState('');
  const [inqEmail, setInqEmail] = useState('');
  const [inqCompany, setInqCompany] = useState('');
  const [inqBudget, setInqBudget] = useState('€90 — Slot Singolo Newsletter');
  const [inqNotes, setInqNotes] = useState('');
  const [inqSubmitting, setInqSubmitting] = useState(false);
  const [inqError, setInqError] = useState('');
  const [inqSuccess, setInqSuccess] = useState(false);

  useEffect(() => {
    fetchPublicMonetizationCatalog().then(setCatalog);
  }, []);

  useEffect(() => {
    if (externalInquiryOpen) {
      openInquiryModal(externalInquiryOpen);
    }
  }, [externalInquiryOpen]);

  const openInquiryModal = (kind: InquiryKind) => {
    setInquiryModalKind(kind);
    setInqError('');
    setInqSuccess(false);
    setInqBudget(
      kind === 'sponsor_newsletter'
        ? '€90 — Slot Singolo Newsletter'
        : kind === 'audit_pmi'
          ? 'Audit Workflow PMI (Preventivo)'
          : 'Partnership Affiliazione / SaaS'
    );
  };

  const closeInquiryModal = () => {
    setInquiryModalKind(null);
    onCloseExternalInquiry?.();
  };

  const handleDownloadKit = () => {
    const blob = new Blob([LEAD_MAGNET_MARKDOWN], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kit-operativo-capirelai-rof-2026.md';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleCopyKit = () => {
    navigator.clipboard.writeText(LEAD_MAGNET_MARKDOWN);
    setKitCopied(true);
    setTimeout(() => setKitCopied(false), 2200);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setFormError('Inserisci un indirizzo email valido.');
      return;
    }
    if (!name.trim()) {
      setFormError('Inserisci il tuo nome o come preferisci essere chiamato.');
      return;
    }
    if (!gdprConsent) {
      setFormError('Conferma il consenso per ricevere la newsletter e il Kit R.O.F.');
      return;
    }

    setSubmitting(true);
    try {
      const outcome = await subscribeToNewsletter({
        email: cleanEmail,
        name: name.trim(),
        segment,
        source: leadSource,
        leadMagnet: LEAD_MAGNET_ID,
        gdprConsent: true,
      });

      setSuccessInfo({
        alreadySubscribed: outcome.alreadySubscribed,
        emailDispatched: outcome.emailDispatched,
        provider: outcome.provider,
        email: cleanEmail,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore durante la registrazione.';
      if (message.includes('Missing or insufficient permissions')) {
        setFormError('Verifica di aver inserito un indirizzo email valido e accettato il consenso privacy.');
      } else {
        setFormError('Impossibile completare l’iscrizione in questo momento. Riprova tra poco.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryModalKind) return;
    setInqError('');

    const cleanEmail = inqEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setInqError('Inserisci un indirizzo email aziendale valido.');
      return;
    }
    if (inqName.trim().length < 2 || inqCompany.trim().length < 1 || inqNotes.trim().length < 5) {
      setInqError('Compila nome, azienda/progetto e una breve descrizione della richiesta.');
      return;
    }

    setInqSubmitting(true);
    try {
      await submitMonetizationInquiry({
        kind: inquiryModalKind,
        contactName: inqName.trim(),
        contactEmail: cleanEmail,
        company: inqCompany.trim(),
        budgetRange: inqBudget,
        notes: inqNotes.trim(),
      });
      setInqSuccess(true);
      setInqName('');
      setInqEmail('');
      setInqCompany('');
      setInqNotes('');
    } catch {
      setInqError('Errore nel salvataggio della richiesta. Controlla i campi e riprova.');
    } finally {
      setInqSubmitting(false);
    }
  };

  return (
    <section
      id="newsletter"
      className="min-h-screen py-24 px-6 max-w-[1200px] mx-auto box-border"
    >
      {/* Header di Sezione */}
      <div className="mb-10 pb-6 border-b border-white/10">
        <div className="text-xs font-mono text-sky-400 tracking-wider mb-2">
          05. Newsletter &amp; Kit Operativo
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight text-balance">
          Radar AI Pratica — una mail a settimana, solo ciò che funziona
        </h2>
        <p className="text-slate-400 text-[15px] max-w-[760px] mt-3 leading-relaxed">
          Niente rumore quotidiano né notizie riciclate. Ogni settimana ricevi un test reale su modelli o automazioni,
          costi API verificati e prompt pronti per professionisti e PMI italiane.
        </p>
      </div>

      {/* Blocco Principale Split: Valore + Form Reale */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Colonna Sinistra: Cosa ricevi */}
        <div className="lg:col-span-7 bg-[#0c0d12]/90 border border-white/10 rounded-xl p-7 sm:p-9 flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono text-sky-400 mb-3">
              Incluso gratuitamente all&apos;iscrizione
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug mb-4">
              Kit Operativo R.O.F. + Checklist Tool &amp; Privacy PMI (Edizione 2026)
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              Subito dopo la conferma sblocchi il file completo da scaricare e ricevi la sequenza iniziale via email
              con i casi pratici più utili per il tuo profilo.
            </p>

            <div className="space-y-4 border-t border-white/10 pt-6">
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs text-sky-400 pt-0.5 shrink-0">01.</span>
                <div>
                  <div className="text-sm font-semibold text-white">
                    Formula R.O.F. (Ruolo · Obiettivo · Formato)
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    5 prompt anti-robot copiabili per email commerciali, preventivi, analisi PDF e formule Excel.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="font-mono text-xs text-sky-400 pt-0.5 shrink-0">02.</span>
                <div>
                  <div className="text-sm font-semibold text-white">
                    Mappa Decisionale GDPR: Cloud vs AI Locale (Ollama)
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Quando puoi usare ChatGPT/Claude in sicurezza e quando conviene un modello locale in azienda.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="font-mono text-xs text-sky-400 pt-0.5 shrink-0">03.</span>
                <div>
                  <div className="text-sm font-semibold text-white">
                    Sequenza automatica in 3 puntate + Radar settimanale
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Giorno 0 Kit completo · Giorno +3 Flussi senza codice · Giorno +6 Stack tool e costi reali. Cancellazione in 1 click.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <span>Frequenza: 1 email / settimana · Zero spam</span>
            <button
              type="button"
              onClick={() => setIsKitPreviewOpen(true)}
              className="text-sky-400 hover:text-sky-300 underline underline-offset-4 cursor-pointer bg-transparent border-none p-0 font-medium"
            >
              Vedi anteprima del Kit ↓
            </button>
          </div>
        </div>

        {/* Colonna Destra: Form Iscrizione Reale */}
        <div className="lg:col-span-5 bg-[#0e1017]/95 border border-sky-400/35 rounded-xl p-7 sm:p-8 flex flex-col justify-between">
          {!successInfo ? (
            <form onSubmit={handleSubscribe} className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Iscriviti e sblocca il Kit R.O.F.
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Scegli il tuo profilo per ricevere esempi calibrati sul tuo lavoro reale.
                </p>
              </div>

              {leadSource !== 'homepage' && (
                <div className="px-3 py-2 bg-sky-500/10 border border-sky-400/25 rounded-md text-xs text-sky-200">
                  Provenienza guida: <strong className="font-semibold">{leadSource}</strong>
                </div>
              )}

              <div>
                <label htmlFor="nl-name" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nome o Nickname *
                </label>
                <input
                  id="nl-name"
                  type="text"
                  required
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Es. Marco"
                  className="w-full h-11 px-3.5 bg-[#07080c] border border-white/15 focus:border-sky-400 rounded-lg text-sm text-white placeholder-slate-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label htmlFor="nl-email" className="block text-xs font-medium text-slate-300 mb-1.5">
                  La tua Email migliore *
                </label>
                <input
                  id="nl-email"
                  type="email"
                  required
                  maxLength={160}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@azienda.it"
                  className="w-full h-11 px-3.5 bg-[#07080c] border border-white/15 focus:border-sky-400 rounded-lg text-sm text-white placeholder-slate-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label htmlFor="nl-segment" className="block text-xs font-medium text-slate-300 mb-1.5">
                  In quale ruolo lavori oggi?
                </label>
                <select
                  id="nl-segment"
                  value={segment}
                  onChange={(e) => setSegment(e.target.value as SubscriberSegment)}
                  className="w-full h-11 px-3.5 bg-[#07080c] border border-white/15 focus:border-sky-400 rounded-lg text-sm text-white outline-none transition-colors cursor-pointer"
                >
                  <option value="pmi">Titolare o Manager di PMI</option>
                  <option value="professionista">Professionista / Consulente / Freelance</option>
                  <option value="sviluppatore">Sviluppatore / Profilo Tech</option>
                  <option value="curioso">Studente / Apprendimento pratico</option>
                </select>
              </div>

              <label className="flex items-start gap-2.5 text-xs text-slate-400 leading-relaxed cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={gdprConsent}
                  onChange={(e) => setGdprConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-sky-400 rounded cursor-pointer shrink-0"
                />
                <span>
                  Accetto di ricevere il Kit R.O.F. e la newsletter settimanale di Capire l&apos;AI (GDPR). Posso disiscrivermi in qualsiasi momento.
                </span>
              </label>

              {formError && (
                <div role="alert" className="p-3 bg-rose-500/10 border border-rose-500/35 rounded-lg text-xs text-rose-200">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 px-5 bg-sky-400 hover:bg-sky-300 disabled:opacity-60 text-slate-950 font-bold text-sm rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                {submitting ? 'Registrazione in corso...' : 'Ricevi il Kit e Iscriviti Gratis'}
              </button>
            </form>
          ) : (
            <div className="space-y-4 py-2">
              <div className="inline-block px-2.5 py-1 bg-emerald-500/15 border border-emerald-400/35 rounded text-xs font-semibold text-emerald-300">
                {successInfo.alreadySubscribed ? 'Iscrizione già attiva' : 'Iscrizione confermata'}
              </div>
              <h3 className="text-xl font-bold text-white">
                {successInfo.alreadySubscribed
                  ? 'Bentornato, il tuo Kit è pronto qui sotto'
                  : 'Benvenuto in Radar AI Pratica'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {successInfo.emailDispatched
                  ? `Abbiamo inviato l'email di benvenuto a ${successInfo.email} tramite ${successInfo.provider.toUpperCase()}. Nel frattempo puoi scaricare subito il Kit da qui.`
                  : `Abbiamo salvato in sicurezza ${successInfo.email}. Puoi scaricare o copiare subito il tuo Kit Operativo R.O.F. completo qui sotto.`}
              </p>

              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadKit}
                  className="w-full h-11 px-4 bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  ⬇ Scarica Kit Operativo R.O.F. (.md)
                </button>
                <button
                  type="button"
                  onClick={() => setIsKitPreviewOpen(true)}
                  className="w-full h-11 px-4 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Leggi o copia i prompt nel browser
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sezione Monetizzazione Reale e Partnership Trasparenti */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Sponsor Newsletter */}
        <div className="bg-[#0c0d12]/90 border border-white/10 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono text-sky-400 mb-2">
              {catalog.sponsorStatus}
            </div>
            <h4 className="text-base font-bold text-white mb-2">
              Sponsorizza la Newsletter
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Raggiungi professionisti e titolari di PMI italiane con un box editoriale trasparente dedicato al tuo software o servizio AI.
            </p>
            <div className="text-xs font-mono text-slate-200 mb-4 tabular-nums">
              Tariffa lancio: {catalog.sponsorPriceLabel}
            </div>
          </div>
          <button
            type="button"
            onClick={() => openInquiryModal('sponsor_newsletter')}
            className="w-full h-10 px-4 bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            Apri Media Kit &amp; Prenota Slot
          </button>
        </div>

        {/* Card 2: Audit PMI */}
        <div className="bg-[#0c0d12]/90 border border-white/10 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono text-sky-400 mb-2">
              Consulenza Applicata · PMI
            </div>
            <h4 className="text-base font-bold text-white mb-2">
              Audit Workflow AI su Misura
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Analizziamo un processo reale della tua attività (preventivi, lettura PDF, triage email o AI locale GDPR) e costruiamo un prototipo funzionante.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openInquiryModal('audit_pmi')}
            className="w-full h-10 px-4 bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            Richiedi Valutazione PMI
          </button>
        </div>

        {/* Card 3: Stack Tool Verificati (Affiliazioni Trasparenti) */}
        <div className="bg-[#0c0d12]/90 border border-white/10 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono text-slate-400 mb-2">
              Stack Consigliato · Link Trasparenti
            </div>
            <h4 className="text-base font-bold text-white mb-2">
              Strumenti Verificati sul Campo
            </h4>
            <div className="space-y-2.5 mt-3">
              {VERIFIED_AFFILIATE_STACK.map((tool) => (
                <a
                  key={tool.id}
                  href={tool.defaultUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-lg transition-colors no-underline"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-white">
                    <span>{tool.name}</span>
                    <span className="text-sky-400 font-mono text-[11px]">{tool.costLabel} ↗</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                    {tool.useCase}
                  </div>
                </a>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 mb-0">
            Nota trasparenza: alcuni link possono riconoscere una commissione partner senza costi extra per te.
          </p>
        </div>
      </div>

      {/* Modale Anteprima Kit R.O.F. */}
      {isKitPreviewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={() => setIsKitPreviewOpen(false)}
        >
          <div
            className="w-full max-w-[760px] max-h-[88vh] overflow-y-auto bg-[#0a0b0f] border border-sky-400/40 rounded-xl p-6 text-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div>
                <div className="text-xs font-mono text-sky-400">Lead Magnet Capire l&apos;AI</div>
                <h3 className="text-lg font-bold text-white m-0">
                  Kit Operativo R.O.F. &amp; Checklist PMI
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsKitPreviewOpen(false)}
                className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white bg-transparent border-none text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <button
                type="button"
                onClick={handleDownloadKit}
                className="px-4 py-2 bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs rounded-lg cursor-pointer border-none"
              >
                ⬇ Scarica File (.md)
              </button>
              <button
                type="button"
                onClick={handleCopyKit}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs rounded-lg cursor-pointer border border-white/15"
              >
                {kitCopied ? '✓ Contenuto Copiato!' : '📋 Copia Tutto'}
              </button>
            </div>

            <pre className="p-4 bg-black/70 border border-white/10 rounded-lg text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed overflow-x-auto">
              {LEAD_MAGNET_MARKDOWN}
            </pre>
          </div>
        </div>
      )}

      {/* Modale Richiesta Sponsor / Audit PMI */}
      {inquiryModalKind && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={closeInquiryModal}
        >
          <div
            className="w-full max-w-[660px] max-h-[90vh] overflow-y-auto bg-[#0a0b0f] border border-sky-400/45 rounded-xl p-6 sm:p-7 text-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-4 border-b border-white/10 mb-5">
              <div>
                <div className="text-xs font-mono text-sky-400">
                  {inquiryModalKind === 'sponsor_newsletter'
                    ? 'Media Kit & Sponsorizzazioni'
                    : 'Consulenza Operativa PMI'}
                </div>
                <h3 className="text-xl font-bold text-white mt-1">
                  {inquiryModalKind === 'sponsor_newsletter'
                    ? 'Prenota uno slot Partner su Capire l’AI'
                    : 'Richiedi un Audit Workflow AI per la tua PMI'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeInquiryModal}
                className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white bg-transparent border-none text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Opzioni Trasparenti */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {SPONSOR_TIERS.map((tier) => (
                <div key={tier.id} className="p-3.5 bg-white/[0.03] border border-white/10 rounded-lg">
                  <div className="text-xs font-bold text-white">{tier.name}</div>
                  <div className="text-xs font-mono text-sky-400 mt-1">{tier.priceLabel}</div>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-snug mb-0">
                    {tier.deliverables}
                  </p>
                </div>
              ))}
            </div>

            {inqSuccess ? (
              <div className="p-5 bg-emerald-500/10 border border-emerald-400/35 rounded-lg text-sm text-emerald-200">
                Richiesta salvata con successo. Ti risponderemo via email entro 24–48 ore lavorative con le date disponibili o una proposta concreta.
              </div>
            ) : (
              <form onSubmit={handleSubmitInquiry} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Tipo Richiesta</label>
                    <select
                      value={inquiryModalKind}
                      onChange={(e) => setInquiryModalKind(e.target.value as InquiryKind)}
                      className="w-full h-10 px-3 bg-[#06070a] border border-white/15 rounded-lg text-xs text-white outline-none"
                    >
                      <option value="sponsor_newsletter">Sponsorizzazione Newsletter</option>
                      <option value="audit_pmi">Audit Workflow AI per PMI</option>
                      <option value="affiliate_partner">Partnership SaaS / Affiliazione</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Fascia / Pacchetto</label>
                    <input
                      type="text"
                      required
                      maxLength={40}
                      value={inqBudget}
                      onChange={(e) => setInqBudget(e.target.value)}
                      className="w-full h-10 px-3 bg-[#06070a] border border-white/15 rounded-lg text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Nome e Cognome *</label>
                    <input
                      type="text"
                      required
                      maxLength={80}
                      value={inqName}
                      onChange={(e) => setInqName(e.target.value)}
                      placeholder="Es. Laura Verdi"
                      className="w-full h-10 px-3 bg-[#06070a] border border-white/15 rounded-lg text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Email Aziendale *</label>
                    <input
                      type="email"
                      required
                      maxLength={160}
                      value={inqEmail}
                      onChange={(e) => setInqEmail(e.target.value)}
                      placeholder="nome@azienda.com"
                      className="w-full h-10 px-3 bg-[#06070a] border border-white/15 rounded-lg text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Azienda / Prodotto SaaS *</label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={inqCompany}
                    onChange={(e) => setInqCompany(e.target.value)}
                    placeholder="Nome azienda o URL prodotto"
                    className="w-full h-10 px-3 bg-[#06070a] border border-white/15 rounded-lg text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Dettagli (obiettivo, tool, processo) *</label>
                  <textarea
                    rows={3}
                    required
                    maxLength={1500}
                    value={inqNotes}
                    onChange={(e) => setInqNotes(e.target.value)}
                    placeholder="Descrivi brevemente cosa vuoi promuovere o quale processo aziendale vuoi automatizzare..."
                    className="w-full p-3 bg-[#06070a] border border-white/15 rounded-lg text-xs text-white outline-none resize-y"
                  />
                </div>

                {inqError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/35 rounded-lg text-xs text-rose-200">
                    {inqError}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeInquiryModal}
                    className="px-4 h-10 text-xs text-slate-400 hover:text-white bg-transparent border-none cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={inqSubmitting}
                    className="px-5 h-10 bg-sky-400 hover:bg-sky-300 disabled:opacity-60 text-slate-950 font-bold text-xs rounded-lg cursor-pointer border-none"
                  >
                    {inqSubmitting ? 'Invio...' : 'Invia Richiesta'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
