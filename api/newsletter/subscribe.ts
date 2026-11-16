import crypto from 'node:crypto';

interface VercelReq {
  method?: string;
  body?: unknown;
}

interface VercelRes {
  status: (code: number) => VercelRes;
  json: (data: unknown) => void;
}

function getSigningSecret(): string {
  return (
    process.env.KIT_SIGNING_SECRET ||
    process.env.BREVO_API_KEY ||
    process.env.RESEND_API_KEY ||
    process.env.GITHUB_JARVIS_TOKEN ||
    'capirelai-kit-signing-fallback-2026'
  ).trim();
}

function toBase64Url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const body = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}) as {
    email?: string;
    name?: string;
    segment?: string;
    source?: string;
    returningSubscriber?: boolean;
  };

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 80) : 'Lettore';
  const segment = typeof body.segment === 'string' ? body.segment.trim().slice(0, 24) : 'pmi';
  const source = typeof body.source === 'string' ? body.source.trim().slice(0, 80) : 'homepage';
  const returningSubscriber = Boolean(body.returningSubscriber);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Email non valida' });
  }

  const kitToken = createKitToken(email);
  const directKitUrl = `https://www.capirelai.com/api/newsletter/kit?token=${encodeURIComponent(kitToken)}&download=1`;

  const brevoKey = (process.env.BREVO_API_KEY || '').trim();
  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  const brevoListId = Number(process.env.BREVO_LIST_ID || 0) || undefined;
  const fromEmail = (process.env.NEWSLETTER_FROM_EMAIL || 'newsletter@capirelai.com').trim();
  const fromName = (process.env.NEWSLETTER_FROM_NAME || "Capire l'AI — Radar Pratica").trim();

  if (!brevoKey && !resendKey) {
    return res.status(200).json({
      ok: true,
      emailDispatched: false,
      provider: 'kit-immediato',
      kitToken,
    });
  }

  const safeName = escapeHtml(name);
  const subject = 'Il tuo Kit Operativo R.O.F. (10 Prompt & Checklist PMI)';
  const textContent = `Ciao ${name},\n\nbenvenuto in Radar AI Pratica (https://www.capirelai.com).\n\nIl tuo Kit Operativo R.O.F. (Ruolo · Obiettivo · Formato) + Checklist GDPR PMI è già sbloccato:\nScarica direttamente il file .md qui -> ${directKitUrl}\nOppure accedi dalla sezione Newsletter: https://www.capirelai.com/#newsletter\n\nRispondi pure a questa email scrivendo in 1 riga su quale attività perdi più tempo oggi (email, documenti/PDF, preventivi o fogli Excel): leggo ogni risposta.\n\nA presto,\nFondatore di Capire l'AI`;
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111827; line-height: 1.6;">
      <h2 style="color: #0284c7;">Benvenuto in Radar AI Pratica, ${safeName}</h2>
      <p>Grazie per esserti iscritto su <strong>capirelai.com</strong>. Il tuo <strong>Kit Operativo R.O.F. + Checklist Tool &amp; GDPR PMI</strong> è sbloccato.</p>
      <p>Scarica direttamente il file <code>.md</code> riservato agli iscritti con il pulsante qui sotto:</p>
      <p><a href="${escapeHtml(directKitUrl)}" style="display:inline-block;padding:10px 18px;background:#0284c7;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Scarica Kit Operativo R.O.F. (.md)</a></p>
      <p style="font-size: 13px; color: #4b5563;"><strong>Domanda veloce:</strong> rispondi a questa mail dicendomi in una riga su cosa perdi più tempo oggi (email, preventivi, PDF o Excel). Calibrerò i prossimi test reali su questo.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />
      <p style="font-size: 12px; color: #6b7280;">Capire l&apos;AI — Test pratici, zero fuffa.</p>
    </div>`;

  try {
    if (brevoKey) {
      let existsInBrevo = false;
      if (returningSubscriber) {
        const checkRes = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
          headers: { 'api-key': brevoKey, Accept: 'application/json' },
        }).catch(() => null);
        existsInBrevo = Boolean(checkRes?.ok);
      }

      await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: { 'api-key': brevoKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          attributes: { NOME: name, SEGMENTO: segment, SOURCE: source },
          ...(brevoListId ? { listIds: [brevoListId] } : {}),
          updateEnabled: true,
        }),
      }).catch(() => {});

      if (returningSubscriber && existsInBrevo) {
        return res.status(200).json({ ok: true, emailDispatched: false, provider: 'brevo', kitToken });
      }

      const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender: { name: fromName, email: fromEmail },
          to: [{ email, name }],
          subject,
          htmlContent,
          textContent,
        }),
      });

      return res.status(200).json({ ok: true, emailDispatched: resp.ok, provider: 'brevo', kitToken });
    }

    if (returningSubscriber) {
      return res.status(200).json({ ok: true, emailDispatched: false, provider: 'resend', kitToken });
    }

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [email],
        subject,
        html: htmlContent,
        text: textContent,
      }),
    });

    return res.status(200).json({ ok: true, emailDispatched: resp.ok, provider: 'resend', kitToken });
  } catch {
    return res.status(200).json({ ok: true, emailDispatched: false, provider: brevoKey ? 'brevo' : 'resend', kitToken });
  }
}
