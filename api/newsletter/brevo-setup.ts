import fs from 'node:fs';
import path from 'node:path';
import { createKitToken } from './subscribe';

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

async function verifyFounderBearer(authHeader: string | string[] | undefined): Promise<{ ok: boolean; email?: string }> {
  const raw = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (!raw || !raw.startsWith('Bearer ')) return { ok: false };
  const idToken = raw.slice(7).trim();
  const apiKey = getFirebaseWebApiKey();
  if (!idToken || !apiKey) return { ok: false };

  const verifyRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }
  );
  if (!verifyRes.ok) return { ok: false };
  const data = (await verifyRes.json()) as {
    users?: Array<{ email?: string; emailVerified?: boolean }>;
  };
  const user = data.users?.[0];
  if (!user?.email || !user.emailVerified || user.email.toLowerCase() !== 'umbertoshorty2205@gmail.com') {
    return { ok: false };
  }
  return { ok: true, email: user.email };
}

async function brevoFetch(brevoKey: string, endpoint: string, init: RequestInit = {}) {
  const resp = await fetch(`https://api.brevo.com/v3${endpoint}`, {
    ...init,
    headers: {
      'api-key': brevoKey,
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
  });
  const text = await resp.text().catch(() => '');
  let data: Record<string, unknown> = {};
  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    data = { raw: text };
  }
  return { ok: resp.ok, status: resp.status, data };
}

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const authCheck = await verifyFounderBearer(req.headers.authorization);
  if (!authCheck.ok || !authCheck.email) {
    return res.status(401).json({ ok: false, error: 'Non autorizzato: accesso consentito solo al fondatore.' });
  }

  const brevoKey = (process.env.BREVO_API_KEY || '').trim();
  if (!brevoKey) {
    return res.status(400).json({
      ok: false,
      error: 'BREVO_API_KEY non configurata nei Secrets di ambiente.',
    });
  }

  const body = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}) as {
    action?: string;
  };
  const action = typeof body.action === 'string' ? body.action.trim() : '';
  if (!['verify', 'bootstrap', 'test-email'].includes(action)) {
    return res.status(400).json({ ok: false, error: 'Azione non valida.' });
  }

  const fromEmail = (process.env.NEWSLETTER_FROM_EMAIL || 'newsletter@capirelai.com').trim();
  const fromName = (process.env.NEWSLETTER_FROM_NAME || "Capire l'AI — Radar Pratica").trim();
  const replyToEmail = (process.env.NEWSLETTER_REPLY_TO || 'umbertoshorty2205@gmail.com').trim();
  const envListId = Number(process.env.BREVO_LIST_ID || 0) || undefined;

  try {
    if (action === 'verify') {
      const [accRes, sendersRes, listsRes, attrsRes] = await Promise.all([
        brevoFetch(brevoKey, '/account'),
        brevoFetch(brevoKey, '/senders'),
        brevoFetch(brevoKey, '/contacts/lists?limit=50&offset=0'),
        brevoFetch(brevoKey, '/contacts/attributes'),
      ]);

      if (!accRes.ok) {
        return res.status(400).json({
          ok: false,
          error: `Chiave Brevo rifiutata (${accRes.status}): verifica BREVO_API_KEY v3.`,
        });
      }

      const sendersRaw = Array.isArray(sendersRes.data.senders)
        ? (sendersRes.data.senders as Array<{ email?: string; name?: string; active?: boolean }>)
        : [];
      const listsRaw = Array.isArray(listsRes.data.lists)
        ? (listsRes.data.lists as Array<{ id?: number; name?: string; totalSubscribers?: number }>)
        : [];
      const attrsRaw = Array.isArray(attrsRes.data.attributes)
        ? (attrsRes.data.attributes as Array<{ name?: string; category?: string }>)
        : [];
      const attrNames = new Set(attrsRaw.map((a) => String(a.name || '').toUpperCase()));

      return res.status(200).json({
        ok: true,
        action: 'verify',
        account: {
          email: String(accRes.data.email || ''),
          companyName: String(accRes.data.companyName || ''),
        },
        senders: sendersRaw.map((s) => ({
          email: String(s.email || ''),
          name: String(s.name || ''),
          active: Boolean(s.active),
        })),
        senderMatchesConfigured: sendersRaw.some(
          (s) => s.active && String(s.email || '').toLowerCase() === fromEmail.toLowerCase()
        ),
        configuredFromEmail: fromEmail,
        configuredListId: envListId || null,
        lists: listsRaw.map((l) => ({
          id: Number(l.id || 0),
          name: String(l.name || ''),
          totalSubscribers: Number(l.totalSubscribers || 0),
        })),
        attributesReady: ['NOME', 'SEGMENTO', 'SOURCE'].every((k) => attrNames.has(k)),
        missingAttributes: ['NOME', 'SEGMENTO', 'SOURCE'].filter((k) => !attrNames.has(k)),
      });
    }

    if (action === 'bootstrap') {
      const attrsRes = await brevoFetch(brevoKey, '/contacts/attributes');
      const existing = new Set(
        (Array.isArray(attrsRes.data.attributes)
          ? (attrsRes.data.attributes as Array<{ name?: string }>)
          : []
        ).map((a) => String(a.name || '').toUpperCase())
      );

      const createdAttributes: string[] = [];
      for (const attr of ['NOME', 'SEGMENTO', 'SOURCE']) {
        if (!existing.has(attr)) {
          const r = await brevoFetch(brevoKey, `/contacts/attributes/normal/${encodeURIComponent(attr)}`, {
            method: 'POST',
            body: JSON.stringify({ type: 'text' }),
          });
          if (r.ok || r.status === 201 || r.status === 204) {
            createdAttributes.push(attr);
          }
        }
      }

      const listsRes = await brevoFetch(brevoKey, '/contacts/lists?limit=50&offset=0');
      const listsRaw = Array.isArray(listsRes.data.lists)
        ? (listsRes.data.lists as Array<{ id?: number; name?: string }>)
        : [];
      let targetList = listsRaw.find(
        (l) =>
          (envListId && Number(l.id) === envListId) ||
          String(l.name || '').toLowerCase().includes('capire') ||
          String(l.name || '').toLowerCase().includes('radar')
      );

      let createdListId: number | null = null;
      if (!targetList) {
        const foldersRes = await brevoFetch(brevoKey, '/contacts/folders?limit=10&offset=0');
        const folders = Array.isArray(foldersRes.data.folders)
          ? (foldersRes.data.folders as Array<{ id?: number }>)
          : [];
        let folderId = folders[0]?.id ? Number(folders[0].id) : 0;
        if (!folderId) {
          const newFolder = await brevoFetch(brevoKey, '/contacts/folders', {
            method: 'POST',
            body: JSON.stringify({ name: "Capire l'AI" }),
          });
          folderId = Number(newFolder.data.id || 1);
        }
        const createList = await brevoFetch(brevoKey, '/contacts/lists', {
          method: 'POST',
          body: JSON.stringify({ name: "Capire l'AI — Radar Pratica", folderId }),
        });
        if (createList.ok && createList.data.id) {
          createdListId = Number(createList.data.id);
          targetList = { id: createdListId, name: "Capire l'AI — Radar Pratica" };
        }
      }

      return res.status(200).json({
        ok: true,
        action: 'bootstrap',
        createdAttributes,
        createdListId,
        listId: targetList?.id ? Number(targetList.id) : envListId || null,
        listName: targetList?.name || null,
      });
    }

    // action === 'test-email'
    const testEmail = authCheck.email.toLowerCase();
    const kitToken = createKitToken(testEmail);
    const directKitUrl = `https://www.capirelai.com/api/newsletter/kit?token=${encodeURIComponent(kitToken)}&download=1`;

    const sendRes = await brevoFetch(brevoKey, '/smtp/email', {
      method: 'POST',
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        replyTo: { email: replyToEmail, name: fromName },
        to: [{ email: testEmail, name: 'Fondatore Capire l’AI' }],
        subject: '[TEST BREVO] Il tuo Kit Operativo R.O.F. (10 Prompt & Checklist PMI)',
        textContent: `Test di consegna Brevo riuscito!\n\nMittente configurato: ${fromEmail}\nLink diretto Kit Operativo (.md): ${directKitUrl}\n\nCapire l'AI — Radar AI Pratica`,
        htmlContent: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111827;line-height:1.6;">
            <h2 style="color:#0284c7;">Test Brevo Completato</h2>
            <p>Questa è un'email di prova inviata dal pannello fondatore di <strong>capirelai.com</strong> tramite <strong>Brevo API v3</strong>.</p>
            <p><a href="${directKitUrl}" style="display:inline-block;padding:10px 18px;background:#0284c7;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Verifica Download Kit R.O.F. (.md)</a></p>
            <p style="font-size:12px;color:#6b7280;">Mittente: ${fromEmail} • Reply-To: ${replyToEmail}</p>
          </div>`,
      }),
    });

    if (!sendRes.ok) {
      return res.status(400).json({
        ok: false,
        error: `Brevo ha rifiutato l'invio (${sendRes.status}): ${String(sendRes.data.message || sendRes.data.raw || 'Verifica che il mittente sia autenticato su Brevo')}`,
      });
    }

    return res.status(200).json({
      ok: true,
      action: 'test-email',
      to: testEmail,
      messageId: String(sendRes.data.messageId || ''),
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : 'Errore comunicazione con Brevo API',
    });
  }
}
