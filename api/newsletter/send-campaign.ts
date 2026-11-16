import fs from 'node:fs';
import path from 'node:path';

interface VercelReq {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface VercelRes {
  status: (code: number) => VercelRes;
  json: (data: unknown) => void;
}

function getFirebaseWebApiKey(): string {
  const fromEnv = (process.env.FIREBASE_WEB_API_KEY || process.env.VITE_FIREBASE_API_KEY || '').trim();
  if (fromEnv) return fromEnv;
  try {
    const cfgPath = path.join(process.cwd(), 'firebase-applet-config.json');
    const parsed = JSON.parse(fs.readFileSync(cfgPath, 'utf8')) as { apiKey?: string };
    return (parsed.apiKey || '').trim();
  } catch {
    return '';
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function verifyFounderBearer(authHeader: string | string[] | undefined): Promise<boolean> {
  const raw = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (!raw || !raw.startsWith('Bearer ')) return false;
  const idToken = raw.slice(7).trim();
  const apiKey = getFirebaseWebApiKey();
  if (!idToken || !apiKey) return false;

  const verifyRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }
  );
  if (!verifyRes.ok) return false;
  const data = (await verifyRes.json()) as {
    users?: Array<{ email?: string; emailVerified?: boolean }>;
  };
  const user = data.users?.[0];
  return Boolean(
    user?.email &&
      user.emailVerified &&
      user.email.toLowerCase() === 'umbertoshorty2205@gmail.com'
  );
}

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== 'POST') {
    return res.status(405).json({ sent: false, error: 'Method not allowed' });
  }

  const authorized = await verifyFounderBearer(req.headers.authorization);
  if (!authorized) {
    return res.status(401).json({ sent: false, error: 'Non autorizzato: accesso consentito solo al fondatore.' });
  }

  const brevoKey = (process.env.BREVO_API_KEY || '').trim();
  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  const fromEmail = (process.env.NEWSLETTER_FROM_EMAIL || 'newsletter@capirelai.com').trim();
  const fromName = (process.env.NEWSLETTER_FROM_NAME || "Capire l'AI — Radar Pratica").trim();

  if (!brevoKey && !resendKey) {
    return res.status(400).json({
      sent: false,
      provider: 'none',
      error: 'Configura BREVO_API_KEY o RESEND_API_KEY nelle Environment Variables di Vercel.',
    });
  }

  const body = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}) as {
    subject?: string;
    bodyText?: string;
    recipients?: Array<{ email?: string; name?: string }>;
  };

  const subject = typeof body.subject === 'string' ? body.subject.trim().slice(0, 160) : '';
  const rawBody = typeof body.bodyText === 'string' ? body.bodyText.trim() : '';
  const recipients = Array.isArray(body.recipients) ? body.recipients : [];

  if (!subject || !rawBody || recipients.length === 0) {
    return res.status(400).json({ sent: false, error: 'Oggetto, testo o destinatari mancanti.' });
  }

  let dispatchedCount = 0;
  for (const r of recipients) {
    const toEmail = typeof r.email === 'string' ? r.email.trim().toLowerCase() : '';
    const toName = typeof r.name === 'string' && r.name.trim() ? r.name.trim() : 'Lettore';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) continue;

    const personalized = rawBody.replace(/\{\{NOME\}\}/g, toName);
    const htmlContent = `<div style="font-family:sans-serif;max-width:620px;margin:0 auto;color:#111827;line-height:1.65;">${escapeHtml(personalized).replace(/\n/g, '<br/>')}<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/><p style="font-size:12px;color:#6b7280;">Capire l&apos;AI • https://capirelai.com</p></div>`;

    if (brevoKey) {
      const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender: { name: fromName, email: fromEmail },
          to: [{ email: toEmail, name: toName }],
          subject,
          htmlContent,
          textContent: personalized,
        }),
      });
      if (resp.ok) dispatchedCount += 1;
    } else {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: [toEmail],
          subject,
          html: htmlContent,
          text: personalized,
        }),
      });
      if (resp.ok) dispatchedCount += 1;
    }
  }

  return res.status(200).json({
    sent: dispatchedCount > 0,
    provider: brevoKey ? 'brevo' : 'resend',
    dispatchedCount,
  });
}
