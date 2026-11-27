interface VercelReq {
  method?: string;
}

interface VercelRes {
  status: (code: number) => VercelRes;
  json: (data: unknown) => void;
}

export default function handler(req: VercelReq, res: VercelRes) {
  if (req.method && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const brevoKey = (process.env.BREVO_API_KEY || '').trim();
  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  const brevoListId = Number(process.env.BREVO_LIST_ID || 0) || null;
  const fromEmail = (process.env.NEWSLETTER_FROM_EMAIL || 'newsletter@capirelai.com').trim();
  const fromName = (process.env.NEWSLETTER_FROM_NAME || "Capire l'AI — Radar Pratica").trim();
  const replyToEmail = (process.env.NEWSLETTER_REPLY_TO || 'umbertoshorty2205@gmail.com').trim();
  const provider = brevoKey ? 'brevo' : resendKey ? 'resend' : 'none';

  return res.status(200).json({
    configured: Boolean(brevoKey || resendKey),
    provider,
    fromEmail,
    fromName,
    replyToEmail,
    brevoListId,
  });
}
