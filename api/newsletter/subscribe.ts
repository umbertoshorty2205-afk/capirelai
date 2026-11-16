interface VercelReq {
  method?: string;
  body?: unknown;
}

interface VercelRes {
  status: (code: number) => VercelRes;
  json: (data: unknown) => void;
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
  };

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 80) : 'Lettore';
  const segment = typeof body.segment === 'string' ? body.segment.trim().slice(0, 24) : 'pmi';
  const source = typeof body.source === 'string' ? body.source.trim().slice(0, 80) : 'homepage';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Email non valida' });
  }

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
    });
  }

  const safeName = escapeHtml(name);
  const subject = 'Il tuo Kit Operativo R.O.F. (10 Prompt & Checklist PMI)';
  const textContent = `Ciao ${name},\n\nbenvenuto in Radar AI Pratica (https://capirelai.com).\n\nIl tuo Kit Operativo R.O.F. (Ruolo · Obiettivo · Formato) + Checklist GDPR PMI è già sbloccato su https://capirelai.com/#newsletter.\n\nRispondi pure a questa email scrivendo in 1 riga su quale attività perdi più tempo oggi (email, documenti/PDF, preventivi o fogli Excel): leggo ogni risposta.\n\nA presto,\nFondatore di Capire l'AI`;
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111827; line-height: 1.6;">
      <h2 style="color: #0284c7;">Benvenuto in Radar AI Pratica, ${safeName}</h2>
      <p>Grazie per esserti iscritto su <strong>capirelai.com</strong>. Il tuo <strong>Kit Operativo R.O.F. + Checklist Tool &amp; GDPR PMI</strong> è attivo.</p>
      <p>Trovi sempre l&apos;accesso diretto e le guide operative nella sezione Newsletter:</p>
      <p><a href="https://capirelai.com/#newsletter" style="display:inline-block;padding:10px 18px;background:#0284c7;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Apri Kit Operativo R.O.F.</a></p>
      <p style="font-size: 13px; color: #4b5563;"><strong>Domanda veloce:</strong> rispondi a questa mail dicendomi in una riga su cosa perdi più tempo oggi (email, preventivi, PDF o Excel). Calibrerò i prossimi test reali su questo.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />
      <p style="font-size: 12px; color: #6b7280;">Capire l&apos;AI — Test pratici, zero fuffa.</p>
    </div>`;

  try {
    if (brevoKey) {
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

      return res.status(200).json({ ok: true, emailDispatched: resp.ok, provider: 'brevo' });
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

    return res.status(200).json({ ok: true, emailDispatched: resp.ok, provider: 'resend' });
  } catch {
    return res.status(200).json({ ok: true, emailDispatched: false, provider: brevoKey ? 'brevo' : 'resend' });
  }
}
