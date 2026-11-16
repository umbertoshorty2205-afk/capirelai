import { LEAD_MAGNET_MARKDOWN, verifyKitToken } from './_kitContent';

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
