import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  auth,
  isFounderAdmin,
  signInFounderWithGoogle,
  signOutFounder,
  fetchSubscribersAdmin,
  fetchInquiriesAdmin,
  fetchCampaignsAdmin,
  fetchPublicMonetizationCatalog,
  savePublicMonetizationCatalog,
  saveCampaignRecordAdmin,
  updateInquiryStatusAdmin,
  updateSubscriberAdmin,
  type SubscriberRecord,
  type MonetizationInquiryRecord,
  type CampaignRecord,
  type SubscriberSegment,
} from '../lib/firebase';
import { AUTOMATION_SEQUENCE } from '../data/newsletterData';

interface FounderNewsletterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FounderNewsletterModal: React.FC<FounderNewsletterModalProps> = ({ isOpen, onClose }) => {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const [tab, setTab] = useState<'subscribers' | 'automation' | 'monetization'>('subscribers');
  const [subscribers, setSubscribers] = useState<SubscriberRecord[]>([]);
  const [inquiries, setInquiries] = useState<MonetizationInquiryRecord[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState('');

  const [segmentFilter, setSegmentFilter] = useState<'all' | SubscriberSegment>('all');
  const [espStatus, setEspStatus] = useState<{
    configured: boolean;
    provider: string;
    fromEmail: string;
  }>({ configured: false, provider: 'none', fromEmail: 'newsletter@capirelai.com' });

  // Campaign Composer
  const [campSubject, setCampSubject] = useState('Radar AI Pratica: il test della settimana + flusso pronto');
  const [campPreview, setCampPreview] = useState('Prompt testati, costi reali e un caso pratico applicabile oggi.');
  const [campSegment, setCampSegment] = useState<'all' | SubscriberSegment>('all');
  const [campBody, setCampBody] = useState(
    `Ciao {{NOME}},\n\necco l'uscita settimanale di Capire l'AI:\n\n1. Test della settimana:\n[Inserisci il risultato misurato]\n\n2. Prompt o workflow pronto:\n[Inserisci passaggi pratici]\n\n3. Partner della settimana (se presente):\n[Box sponsor trasparente]\n\nA presto,\nFondatore di Capire l'AI\nhttps://capirelai.com`
  );
  const [sendingCamp, setSendingCamp] = useState(false);
  const [campNotice, setCampNotice] = useState('');

  // Public Catalog editor
  const [catSponsorStatus, setCatSponsorStatus] = useState('Slot Aperti · Novembre / Dicembre');
  const [catSponsorPrice, setCatSponsorPrice] = useState('Da €90 / uscita newsletter');
  const [catToolsSummary, setCatToolsSummary] = useState('Make · Brevo · n8n · Perplexity Pro');
  const [catSaved, setCatSaved] = useState(false);
  const [copiedSeq, setCopiedSeq] = useState<number | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/newsletter/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setEspStatus({
            configured: Boolean(d.configured),
            provider: String(d.provider || 'none'),
            fromEmail: String(d.fromEmail || 'newsletter@capirelai.com'),
          });
        }
      })
      .catch(() => {});
  }, [isOpen]);

  const loadFounderData = async () => {
    if (!isFounderAdmin(user)) return;
    setLoadingData(true);
    setDataError('');
    try {
      const [subs, inqs, camps, cat] = await Promise.all([
        fetchSubscribersAdmin(),
        fetchInquiriesAdmin(),
        fetchCampaignsAdmin(),
        fetchPublicMonetizationCatalog(),
      ]);
      setSubscribers(subs);
      setInquiries(inqs);
      setCampaigns(camps);
      setCatSponsorStatus(cat.sponsorStatus);
      setCatSponsorPrice(cat.sponsorPriceLabel);
      setCatToolsSummary(cat.recommendedToolsSummary);
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'Errore caricamento dati Firestore.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isOpen && isFounderAdmin(user)) {
      loadFounderData();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const isAdmin = isFounderAdmin(user);

  const handleLogin = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const signed = await signInFounderWithGoogle();
      if (!isFounderAdmin(signed)) {
        setAuthError(`Accesso riservato al fondatore (account connesso: ${signed.email || 'sconosciuto'}).`);
      }
    } catch {
      setAuthError('Accesso Google annullato o bloccato dal browser.');
    } finally {
      setAuthLoading(false);
    }
  };

  const filteredSubs = subscribers.filter((s) =>
    segmentFilter === 'all' ? true : s.segment === segmentFilter
  );

  const activeSubscribers = subscribers.filter((s) => s.status === 'active');

  const handleExportCsv = () => {
    const header = 'email,name,segment,source,status,welcomeSent,createdAt\n';
    const rows = filteredSubs
      .map((s) =>
        [s.email, s.name, s.segment, s.source, s.status, s.welcomeSent, s.createdAtLabel]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `capirelai-subscribers-${segmentFilter}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) return;
    setCampNotice('');

    const targets = activeSubscribers.filter((s) =>
      campSegment === 'all' ? true : s.segment === campSegment
    );

    if (targets.length === 0) {
      setCampNotice('Nessun iscritto attivo trovato per il segmento selezionato.');
      return;
    }

    setSendingCamp(true);
    try {
      const idToken = await user.getIdToken();
      const resp = await fetch('/api/newsletter/send-campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          subject: campSubject,
          previewText: campPreview,
          bodyText: campBody,
          recipients: targets.map((t) => ({ email: t.email, name: t.name })),
        }),
      });

      const result = (await resp.json().catch(() => ({}))) as {
        sent?: boolean;
        provider?: string;
        dispatchedCount?: number;
        error?: string;
      };

      const status = resp.ok && result.sent ? 'sent' : 'draft';
      await saveCampaignRecordAdmin({
        subject: campSubject,
        previewText: campPreview,
        segmentTarget: campSegment,
        bodyHtml: campBody,
        recipientCount: targets.length,
        provider: result.provider || espStatus.provider || 'draft',
        status,
        ownerEmail: user.email || 'umbertoshorty2205@gmail.com',
      });

      if (resp.ok && result.sent) {
        setCampNotice(
          `Campagna inviata a ${result.dispatchedCount || targets.length} iscritti reali tramite ${result.provider?.toUpperCase()}.`
        );
      } else {
        setCampNotice(
          result.error ||
            'Provider email (BREVO_API_KEY o RESEND_API_KEY) non ancora configurato: bozza salvata su Firestore e pronta per l’invio appena aggiungi la chiave.'
        );
      }
      await loadFounderData();
    } catch (err) {
      setCampNotice(err instanceof Error ? err.message : 'Errore invio campagna.');
    } finally {
      setSendingCamp(false);
    }
  };

  const handleSaveCatalog = async (e: React.FormEvent) => {
    e.preventDefault();
    await savePublicMonetizationCatalog({
      sponsorStatus: catSponsorStatus,
      sponsorPriceLabel: catSponsorPrice,
      recommendedToolsSummary: catToolsSummary,
    });
    setCatSaved(true);
    setTimeout(() => setCatSaved(false), 2200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[960px] max-h-[92vh] overflow-y-auto bg-[#090a0f] border border-sky-400/40 rounded-xl p-6 sm:p-7 text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-4 border-b border-white/10 mb-5">
          <div>
            <div className="text-xs font-mono text-sky-400">Console Riservata Fondatore</div>
            <h2 className="text-xl font-bold text-white m-0">
              Newsletter, Automazione Email &amp; Monetizzazione
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <button
                type="button"
                onClick={() => signOutFounder()}
                className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/15 rounded-lg text-slate-300 cursor-pointer"
              >
                Esci ({user.email})
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white bg-transparent border-none text-lg cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {!isAdmin ? (
          <div className="py-10 text-center max-w-[460px] mx-auto space-y-4">
            <h3 className="text-lg font-bold text-white">Accesso Fondatore Richiesto</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Per proteggere le email degli iscritti reali (GDPR) e i lead B2B, questa dashboard è accessibile esclusivamente con il tuo account Google verificato.
            </p>
            {authError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/35 rounded-lg text-xs text-rose-200">
                {authError}
              </div>
            )}
            <button
              type="button"
              disabled={authLoading}
              onClick={handleLogin}
              className="px-6 h-11 bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs rounded-lg cursor-pointer border-none"
            >
              {authLoading ? 'Autenticazione...' : 'Accedi con Google Fondatore'}
            </button>
          </div>
        ) : (
          <div>
            {/* Metriche sintetiche reali */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-4 bg-white/[0.03] border border-white/10 rounded-lg">
                <div className="text-[11px] text-slate-400">Iscritti Totali</div>
                <div className="text-2xl font-bold text-white font-mono tabular-nums mt-1">
                  {subscribers.length}
                </div>
              </div>
              <div className="p-4 bg-white/[0.03] border border-white/10 rounded-lg">
                <div className="text-[11px] text-slate-400">Segmento PMI</div>
                <div className="text-2xl font-bold text-sky-400 font-mono tabular-nums mt-1">
                  {subscribers.filter((s) => s.segment === 'pmi').length}
                </div>
              </div>
              <div className="p-4 bg-white/[0.03] border border-white/10 rounded-lg">
                <div className="text-[11px] text-slate-400">Richieste Sponsor / Audit</div>
                <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums mt-1">
                  {inquiries.length}
                </div>
              </div>
              <div className="p-4 bg-white/[0.03] border border-white/10 rounded-lg">
                <div className="text-[11px] text-slate-400">Motore Invio Email</div>
                <div className="text-sm font-bold text-white font-mono mt-2">
                  {espStatus.configured ? `ATTIVO (${espStatus.provider.toUpperCase()})` : 'DA COLLEGARE (Brevo/Resend)'}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 pb-4 border-b border-white/10 mb-5">
              {[
                { id: 'subscribers', label: `Iscritti Reali (${subscribers.length})` },
                { id: 'automation', label: 'Automazione & Invio Email' },
                { id: 'monetization', label: `Monetizzazione & Lead (${inquiries.length})` },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id as typeof tab)}
                  className={`px-4 h-9 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                    tab === t.id
                      ? 'bg-sky-400 text-slate-950 border-none'
                      : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {t.label}
                </button>
              ))}
              <button
                type="button"
                onClick={loadFounderData}
                className="ml-auto px-3 h-9 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 cursor-pointer"
              >
                {loadingData ? 'Aggiorno...' : '↻ Aggiorna'}
              </button>
            </div>

            {dataError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/35 rounded-lg text-xs text-rose-200">
                {dataError}
              </div>
            )}

            {/* TAB 1: SUBSCRIBERS */}
            {tab === 'subscribers' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {(['all', 'pmi', 'professionista', 'sviluppatore', 'curioso'] as const).map((seg) => (
                      <button
                        key={seg}
                        type="button"
                        onClick={() => setSegmentFilter(seg)}
                        className={`px-3 h-8 text-xs rounded-md cursor-pointer ${
                          segmentFilter === seg
                            ? 'bg-sky-400/20 border border-sky-400 text-sky-300 font-semibold'
                            : 'bg-white/5 border border-white/10 text-slate-400'
                        }`}
                      >
                        {seg === 'all' ? 'Tutti' : seg.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="px-4 h-8 bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white rounded-md cursor-pointer"
                  >
                    ⬇ Esporta CSV ({filteredSubs.length})
                  </button>
                </div>

                {filteredSubs.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-white/15 rounded-lg text-xs text-slate-400">
                    Nessun iscritto ancora in questa vista. Ogni nuova iscrizione reale dal sito comparirà qui in tempo reale.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-white/10 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/[0.04] text-slate-300">
                        <tr>
                          <th className="p-3 font-semibold">Email</th>
                          <th className="p-3 font-semibold">Nome</th>
                          <th className="p-3 font-semibold">Profilo</th>
                          <th className="p-3 font-semibold">Origine</th>
                          <th className="p-3 font-semibold">Stato</th>
                          <th className="p-3 font-semibold">Data</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {filteredSubs.map((sub) => (
                          <tr key={sub.id} className="hover:bg-white/[0.02]">
                            <td className="p-3 font-mono text-white">{sub.email}</td>
                            <td className="p-3 text-slate-300">{sub.name}</td>
                            <td className="p-3 font-mono text-sky-400">{sub.segment}</td>
                            <td className="p-3 text-slate-400">{sub.source}</td>
                            <td className="p-3">
                              <select
                                value={sub.status}
                                onChange={async (e) => {
                                  await updateSubscriberAdmin(sub.id, {
                                    status: e.target.value as SubscriberRecord['status'],
                                  });
                                  loadFounderData();
                                }}
                                className="bg-[#06070a] border border-white/15 rounded px-2 py-1 text-xs text-slate-200"
                              >
                                <option value="active">active</option>
                                <option value="unsubscribed">unsubscribed</option>
                                <option value="bounced">bounced</option>
                              </select>
                            </td>
                            <td className="p-3 text-slate-400 tabular-nums">{sub.createdAtLabel}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: EMAIL AUTOMATION & CAMPAIGN COMPOSER */}
            {tab === 'automation' && (
              <div className="space-y-6">
                <div className="p-4 bg-white/[0.03] border border-white/10 rounded-lg text-xs text-slate-300 leading-relaxed">
                  <strong className="text-white">Stato Automazione Server:</strong>{' '}
                  {espStatus.configured ? (
                    <span className="text-emerald-300">
                      Collegato a {espStatus.provider.toUpperCase()} ({espStatus.fromEmail}). Ogni nuova iscrizione invia automaticamente Email #1 di benvenuto.
                    </span>
                  ) : (
                    <span>
                      Per far partire le email vere in automatico: imposta <code className="font-mono text-sky-400">BREVO_API_KEY</code> (consigliato: piano gratuito 300 email/giorno + automazione sequenza) oppure <code className="font-mono text-sky-400">RESEND_API_KEY</code> nei Secrets di ambiente.
                    </span>
                  )}
                </div>

                {/* Broadcast Composer */}
                <form onSubmit={handleSendCampaign} className="p-5 bg-white/[0.02] border border-white/10 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white m-0">Invia Nuova Uscita Newsletter</h3>
                    <span className="text-xs font-mono text-slate-400">
                      Destinatari attivi: {activeSubscribers.filter((s) => campSegment === 'all' || s.segment === campSegment).length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-slate-400 mb-1">Oggetto Email</label>
                      <input
                        type="text"
                        required
                        value={campSubject}
                        onChange={(e) => setCampSubject(e.target.value)}
                        className="w-full h-9 px-3 bg-[#06070a] border border-white/15 rounded-md text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Segmento</label>
                      <select
                        value={campSegment}
                        onChange={(e) => setCampSegment(e.target.value as typeof campSegment)}
                        className="w-full h-9 px-3 bg-[#06070a] border border-white/15 rounded-md text-xs text-white"
                      >
                        <option value="all">Tutti gli iscritti attivi</option>
                        <option value="pmi">Solo Titolari / PMI</option>
                        <option value="professionista">Solo Professionisti</option>
                        <option value="sviluppatore">Solo Sviluppatori</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Preheader (anteprima in inbox)</label>
                    <input
                      type="text"
                      required
                      value={campPreview}
                      onChange={(e) => setCampPreview(e.target.value)}
                      className="w-full h-9 px-3 bg-[#06070a] border border-white/15 rounded-md text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Testo Campagna (supporta {'{{NOME}}'})</label>
                    <textarea
                      rows={6}
                      required
                      value={campBody}
                      onChange={(e) => setCampBody(e.target.value)}
                      className="w-full p-3 bg-[#06070a] border border-white/15 rounded-md text-xs font-mono text-slate-200 resize-y"
                    />
                  </div>

                  {campNotice && (
                    <div className="p-3 bg-sky-500/10 border border-sky-400/30 rounded-md text-xs text-sky-200">
                      {campNotice}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={sendingCamp}
                      className="px-5 h-10 bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs rounded-lg cursor-pointer border-none"
                    >
                      {sendingCamp ? 'Invio in corso...' : 'Invia / Salva Campagna'}
                    </button>
                  </div>
                </form>

                {/* Sequenza Automatica 3 Email */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white">Sequenza Automatica a 3 Tappe (Brevo / Resend)</h3>
                  {AUTOMATION_SEQUENCE.map((step) => (
                    <div key={step.step} className="p-4 bg-white/[0.02] border border-white/10 rounded-lg">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-mono text-sky-400">
                          Email 0{step.step} · {step.delayLabel}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`Oggetto: ${step.subject}\n\n${step.bodyText}`);
                            setCopiedSeq(step.step);
                            setTimeout(() => setCopiedSeq(null), 2000);
                          }}
                          className="px-3 py-1 bg-white/10 hover:bg-white/15 text-xs text-white rounded cursor-pointer border-none"
                        >
                          {copiedSeq === step.step ? '✓ Copiata!' : 'Copia Testo'}
                        </button>
                      </div>
                      <div className="text-sm font-semibold text-white mb-1">{step.subject}</div>
                      <div className="text-xs text-slate-400 mb-2">Obiettivo: {step.goal}</div>
                      <pre className="p-3 bg-black/50 border border-white/10 rounded text-[11px] font-mono text-slate-300 whitespace-pre-wrap">
                        {step.bodyText}
                      </pre>
                    </div>
                  ))}
                </div>

                {campaigns.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-300 uppercase">Storico Campagne ({campaigns.length})</h4>
                    {campaigns.map((c) => (
                      <div key={c.id} className="p-3 bg-white/[0.02] border border-white/10 rounded-lg flex flex-wrap justify-between text-xs gap-2">
                        <span className="text-white font-semibold">{c.subject}</span>
                        <span className="font-mono text-slate-400">
                          {c.segmentTarget} · {c.recipientCount} invii · {c.status.toUpperCase()} ({c.createdAtLabel})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: MONETIZATION LEADS & PUBLIC CATALOG */}
            {tab === 'monetization' && (
              <div className="space-y-6">
                <form onSubmit={handleSaveCatalog} className="p-5 bg-white/[0.02] border border-white/10 rounded-xl space-y-3">
                  <h3 className="text-sm font-bold text-white m-0">Vetrina Sponsor Pubblica sul Sito</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Stato Disponibilità Slot</label>
                      <input
                        type="text"
                        maxLength={60}
                        value={catSponsorStatus}
                        onChange={(e) => setCatSponsorStatus(e.target.value)}
                        className="w-full h-9 px-3 bg-[#06070a] border border-white/15 rounded-md text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Prezzo Visibile</label>
                      <input
                        type="text"
                        maxLength={60}
                        value={catSponsorPrice}
                        onChange={(e) => setCatSponsorPrice(e.target.value)}
                        className="w-full h-9 px-3 bg-[#06070a] border border-white/15 rounded-md text-xs text-white"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-emerald-300">{catSaved ? '✓ Aggiornato su capirelai.com' : ''}</span>
                    <button
                      type="submit"
                      className="px-4 h-9 bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs rounded-lg cursor-pointer border-none"
                    >
                      Salva Vetrina
                    </button>
                  </div>
                </form>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white">Richieste Commerciali &amp; Audit PMI ({inquiries.length})</h3>
                  {inquiries.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-white/15 rounded-lg text-xs text-slate-400">
                      Nessuna richiesta commerciale ancora ricevuta.
                    </div>
                  ) : (
                    inquiries.map((inq) => (
                      <div key={inq.id} className="p-4 bg-white/[0.03] border border-white/10 rounded-lg space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-xs font-mono text-sky-400">
                            {inq.kind} · {inq.budgetRange}
                          </div>
                          <select
                            value={inq.status}
                            onChange={async (e) => {
                              await updateInquiryStatusAdmin(
                                inq.id,
                                e.target.value as MonetizationInquiryRecord['status']
                              );
                              loadFounderData();
                            }}
                            className="bg-[#06070a] border border-white/15 rounded px-2 py-1 text-xs text-white"
                          >
                            <option value="new">new</option>
                            <option value="contacted">contacted</option>
                            <option value="booked">booked</option>
                            <option value="archived">archived</option>
                          </select>
                        </div>
                        <div className="text-sm font-bold text-white">
                          {inq.company} — {inq.contactName} ({inq.contactEmail})
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed m-0">{inq.notes}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
