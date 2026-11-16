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
  const secret = (
    process.env.KIT_SIGNING_SECRET ||
    process.env.BREVO_API_KEY ||
    process.env.RESEND_API_KEY ||
    process.env.GITHUB_JARVIS_TOKEN ||
    'capirelai-kit-signing-fallback-2026'
  ).trim();
  return secret;
}

function toBase64Url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(input: string): Buffer {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (input.length % 4)) % 4);
  return Buffer.from(padded, 'base64');
}

export function createKitToken(email: string): string {
  const cleanEmail = email.trim().toLowerCase();
  const payloadObj = {
    email: cleanEmail,
    exp: Date.now() + 180 * 24 * 60 * 60 * 1000,
  };
  const payloadB64 = toBase64Url(JSON.stringify(payloadObj));
  const sig = crypto.createHmac('sha256', getSigningSecret()).update(payloadB64).digest();
  const sigB64 = toBase64Url(sig);
  return `${payloadB64}.${sigB64}`;
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
