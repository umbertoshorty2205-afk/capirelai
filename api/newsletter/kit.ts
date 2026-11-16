import crypto from 'node:crypto';

export const LEAD_MAGNET_MARKDOWN = `# Kit Operativo Capire l'AI (Edizione 2026)
# Metodo R.O.F., 10 Prompt Pronti e Checklist Strumenti per PMI

Grazie per esserti iscritto alla newsletter settimanale **Radar AI Pratica** su https://capirelai.com.

## 1. La Formula del Metodo R.O.F. (Ruolo · Obiettivo · Formato)
Prima di incollare qualsiasi richiesta su ChatGPT, Claude o un modello locale, struttura sempre questi 3 blocchi:

- **R — Ruolo + Contesto Reale**: chi deve impersonare il modello, settore e tono (es. "Sei il responsabile commerciale di una PMI B2B italiana, tono chiaro e diretto, zero formalismi inutili").
- **O — Obiettivo + Vincoli**: azione esatta + cosa NON deve inventare ("Se manca un dato tecnico, segnalalo tra parentesi quadre [DA VERIFICARE]").
- **F — Formato di Uscita**: tabella, email max 120 parole, elenco puntato o JSON.

---

## 2. I 5 Prompt R.O.F. ad Alto Impatto Immediato

### Prompt 1 — Risposta rapida a cliente o fornitore
\`\`\`
Ruolo: Sei il mio assistente operativo in una PMI italiana.
Obiettivo: Rispondi a questa email accettando la call per giovedì alle 15:00 e chiedendo in anticipo il listino aggiornato 2026. Non inventare sconti o condizioni non citate.
Formato: Email pronta in italiano naturale, max 90 parole, oggetto incluso.
Testo email ricevuta: [INCOLLA QUI]
\`\`\`

### Prompt 2 — Estrazione dati e clausole critiche da PDF / preventivi
\`\`\`
Ruolo: Analista contrattuale e amministrativo per PMI.
Obiettivo: Analizza questo documento e individua costi nascosti, taciti rinnovi, penali di recesso e tempi di consegna reali. Se un passaggio è ambiguo, cita il paragrafo esatto.
Formato: Elenco in 5 punti con semaforo di attenzione [BASSO / MEDIO / ALTO].
Documento: [INCOLLA TESTO O ALLEGA PDF]
\`\`\`

### Prompt 3 — Trasformare note vocali o appunti disordinati in piano d'azione
\`\`\`
Ruolo: Project manager pragmatico.
Obiettivo: Ordina questi appunti di riunione distinguendo decisioni prese, attività da fare e dubbi aperti.
Formato: Tabella a 3 colonne (Attività | Responsabile | Scadenza da confermare).
Appunti: [INCOLLA QUI]
\`\`\`

### Prompt 4 — Preventivo commerciale chiaro (senza linguaggio robotico)
\`\`\`
Ruolo: Consulente commerciale B2B esperto, stile concreto e trasparente.
Obiettivo: Redigi una proposta per [SERVIZIO/PRODOTTO] rivolta a [TIPO CLIENTE], evidenziando 3 benefici misurabili, tempi certi e condizioni di pagamento chiare. Divieto di usare aggettivi gonfiati come "rivoluzionario", "leader" o "sinergia".
Formato: Documento breve diviso in Contesto, Proposta Operativa, Investimento e Prossimo Passo.
\`\`\`

### Prompt 5 — Pulizia e formula Excel / Google Sheets in 10 secondi
\`\`\`
Ruolo: Specialista Excel e automazione fogli di calcolo.
Obiettivo: Ho un foglio con colonna A (Data), B (Cliente), C (Importo lordo). Dimmi la formula esatta (con sintassi italiana con punto e virgola) per sommare solo i clienti di fascia "PMI" dell'ultimo trimestre.
Formato: Formula pronta da copiare + spiegazione in 3 righe.
\`\`\`

---

## 3. Checklist Rapida: Cloud vs AI Locale (GDPR PMI)
1. **Dati anonimizzabili** (bozze marketing, formule Excel vuote, riassunti generici) -> ChatGPT Plus / Claude Pro (ricordati di disattivare l'addestramento sui tuoi dati nelle impostazioni Privacy).
2. **Contratti con dati personali, bilanci o codice proprietario** -> Valuta API Enterprise Zero-Data-Retention oppure modello locale (Ollama + Llama / Qwen) su macchina dedicata.
3. **Regola di controllo umano** -> L'AI genera la bozza o estrae i dati, ma la conferma finale verso clienti, banche o fornitori resta sempre umana.

---
Leggi le guide complete e i test empirici su https://capirelai.com
`;

function getSigningSecret(): string {
  return (
    process.env.KIT_SIGNING_SECRET ||
    process.env.BREVO_API_KEY ||
    process.env.RESEND_API_KEY ||
    process.env.GITHUB_JARVIS_TOKEN ||
    'capirelai-kit-signing-fallback-2026'
  ).trim();
}

function fromBase64Url(input: string): Buffer {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (input.length % 4)) % 4);
  return Buffer.from(padded, 'base64');
}

export function verifyKitToken(token: string): { valid: boolean; email?: string } {
  const raw = typeof token === 'string' ? token.trim() : '';
  const parts = raw.split('.');
  if (parts.length !== 2) return { valid: false };

  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return { valid: false };

  try {
    const expectedSig = crypto.createHmac('sha256', getSigningSecret()).update(payloadB64).digest();
    const providedSig = fromBase64Url(sigB64);
    if (expectedSig.length !== providedSig.length) return { valid: false };
    if (!crypto.timingSafeEqual(expectedSig, providedSig)) return { valid: false };

    const parsed = JSON.parse(fromBase64Url(payloadB64).toString('utf8')) as {
      email?: string;
      exp?: number;
    };
    if (!parsed.email || typeof parsed.exp !== 'number' || parsed.exp < Date.now()) {
      return { valid: false };
    }
    return { valid: true, email: parsed.email };
  } catch {
    return { valid: false };
  }
}

interface VercelReq {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  headers?: Record<string, string | string[] | undefined>;
}

interface VercelRes {
  status: (code: number) => VercelRes;
  setHeader: (name: string, value: string) => void;
  json: (data: unknown) => void;
  send: (body: string) => void;
}

export default function handler(req: VercelReq, res: VercelRes) {
  if (req.method && req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const queryTokenRaw = req.query?.token;
  const queryToken = Array.isArray(queryTokenRaw) ? queryTokenRaw[0] : queryTokenRaw;

  const headerTokenRaw = req.headers?.['x-kit-token'];
  const headerToken = Array.isArray(headerTokenRaw) ? headerTokenRaw[0] : headerTokenRaw;

  const authRaw = req.headers?.authorization;
  const authHeader = Array.isArray(authRaw) ? authRaw[0] : authRaw;
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  const token = (queryToken || headerToken || bearerToken || '').trim();
  const check = verifyKitToken(token);

  if (!check.valid) {
    return res.status(403).json({
      ok: false,
      locked: true,
      error: 'Accesso negato: iscriviti alla newsletter per sbloccare e scaricare il Kit Operativo (.md).',
    });
  }

  const formatRaw = req.query?.format;
  const format = Array.isArray(formatRaw) ? formatRaw[0] : formatRaw;
  const downloadRaw = req.query?.download;
  const download = Array.isArray(downloadRaw) ? downloadRaw[0] : downloadRaw;

  res.setHeader('Cache-Control', 'no-store');

  if (format === 'json') {
    return res.status(200).json({
      ok: true,
      email: check.email,
      filename: 'kit-operativo-capirelai-rof-2026.md',
      markdown: LEAD_MAGNET_MARKDOWN,
    });
  }

  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  if (download === '1' || download === 'true') {
    res.setHeader('Content-Disposition', 'attachment; filename="kit-operativo-capirelai-rof-2026.md"');
  }
  return res.status(200).send(LEAD_MAGNET_MARKDOWN);
}
