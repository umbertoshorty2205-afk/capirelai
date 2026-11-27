import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LEAD_MAGNET_MARKDOWN, verifyKitToken } from './api/newsletter/kit';
import { createKitToken } from './api/newsletter/subscribe';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_JARVIS_REPO = process.env.JARVIS_REPO || 'umbertoshorty2205-afk/capirelai';
const ALLOWED_REPOS = new Set([
  DEFAULT_JARVIS_REPO,
  'umbertoshorty2205-afk/jarvis',
  'umbertoshorty2205-afk/capirelai',
]);

function resolveTargetRepo(req: Request): string {
  const requested = typeof req.query.repo === 'string' ? req.query.repo.trim() : '';
  if (requested === 'capirelai') return 'umbertoshorty2205-afk/capirelai';
  if (requested === 'jarvis') return 'umbertoshorty2205-afk/jarvis';
  if (requested && ALLOWED_REPOS.has(requested)) return requested;
  return DEFAULT_JARVIS_REPO;
}

function getGitHubToken(): string {
  return (
    process.env.GITHUB_JARVIS_TOKEN ||
    process.env.GITHUB_TOKEN ||
    ''
  ).trim();
}

async function githubFetch(
  apiPath: string,
  init: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const token = getGitHubToken();
  if (!token) {
    return {
      ok: false,
      status: 401,
      data: { error: 'GITHUB_JARVIS_TOKEN non configurato nei Secrets' },
    };
  }

  const response = await fetch(`https://api.github.com${apiPath}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'capirelai-jarvis-bridge',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
  });

  const text = await response.text();
  let data: unknown = text;
  try {
    data = JSON.parse(text);
  } catch {
    // plain text fallback
  }

  return { ok: response.ok, status: response.status, data };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/jarvis/status', async (req: Request, res: Response) => {
    const targetRepo = resolveTargetRepo(req);
    try {
      const repoRes = await githubFetch(`/repos/${targetRepo}`);
      if (!repoRes.ok) {
        const userRes = await githubFetch('/user');
        let accessibleRepos: string[] = [];
        if (userRes.ok) {
          const reposRes = await githubFetch('/user/repos?per_page=30&affiliation=owner,collaborator,organization_member');
          if (reposRes.ok && Array.isArray(reposRes.data)) {
            accessibleRepos = reposRes.data
              .map((r: Record<string, unknown>) => String(r.full_name || ''))
              .filter(Boolean);
          }
        }
        return res.status(repoRes.status).json({
          connected: false,
          repo: targetRepo,
          status: repoRes.status,
          tokenLoaded: Boolean(getGitHubToken()),
          tokenAuthStatus: userRes.status,
          githubUser: userRes.ok ? (userRes.data as { login?: string }).login || null : null,
          accessibleRepos,
          details: repoRes.data,
        });
      }

      const repoData = repoRes.data as {
        full_name?: string;
        private?: boolean;
        default_branch?: string;
        pushed_at?: string;
        updated_at?: string;
        description?: string | null;
        permissions?: Record<string, boolean>;
      };
      const branch = repoData.default_branch || 'main';

      const [commitsRes, treeRes, branchesRes] = await Promise.all([
        githubFetch(`/repos/${targetRepo}/commits?sha=${encodeURIComponent(branch)}&per_page=10`),
        githubFetch(`/repos/${targetRepo}/git/trees/${encodeURIComponent(branch)}?recursive=1`),
        githubFetch(`/repos/${targetRepo}/branches?per_page=20`),
      ]);

      const commits = Array.isArray(commitsRes.data)
        ? commitsRes.data.map((c: Record<string, unknown>) => {
            const commitObj = (c.commit || {}) as Record<string, unknown>;
            const authorObj = (commitObj.author || {}) as Record<string, unknown>;
            return {
              sha: typeof c.sha === 'string' ? c.sha.slice(0, 7) : '',
              message: commitObj.message || '',
              date: authorObj.date || '',
              author: authorObj.name || '',
            };
          })
        : [];

      const branches = Array.isArray(branchesRes.data)
        ? branchesRes.data.map((b: Record<string, unknown>) => String(b.name || '')).filter(Boolean)
        : [];

      const treeData = (treeRes.data || {}) as {
        truncated?: boolean;
        tree?: Array<{ path?: string; type?: string; size?: number }>;
      };
      const files = Array.isArray(treeData.tree)
        ? treeData.tree
            .filter((item) => item.type === 'blob')
            .map((item) => ({ path: item.path || '', size: item.size || 0 }))
        : [];

      return res.json({
        connected: true,
        repo: repoData.full_name || targetRepo,
        private: Boolean(repoData.private),
        permissions: repoData.permissions || null,
        defaultBranch: branch,
        branches,
        pushedAt: repoData.pushed_at || null,
        description: repoData.description || null,
        commits,
        fileCount: files.length,
        truncated: Boolean(treeData.truncated),
        files,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore interno connessione GitHub';
      return res.status(500).json({ connected: false, error: message });
    }
  });

  app.get('/api/jarvis/file', async (req: Request, res: Response) => {
    const targetRepo = resolveTargetRepo(req);
    const rawPath = typeof req.query.path === 'string' ? req.query.path.trim() : '';
    const ref = typeof req.query.ref === 'string' ? req.query.ref.trim() : '';

    if (!rawPath || rawPath.startsWith('/') || rawPath.includes('..')) {
      return res.status(400).json({ error: 'Parametro path non valido' });
    }

    try {
      const encodedPath = rawPath
        .split('/')
        .map((segment) => encodeURIComponent(segment))
        .join('/');
      const query = ref ? `?ref=${encodeURIComponent(ref)}` : '';
      const fileRes = await githubFetch(`/repos/${targetRepo}/contents/${encodedPath}${query}`);

      if (!fileRes.ok) {
        return res.status(fileRes.status).json({ error: 'Impossibile leggere il file', details: fileRes.data });
      }

      const fileObj = fileRes.data as {
        name?: string;
        path?: string;
        sha?: string;
        size?: number;
        encoding?: string;
        content?: string;
      };

      let decodedContent = '';
      if (fileObj.encoding === 'base64' && typeof fileObj.content === 'string') {
        decodedContent = Buffer.from(fileObj.content.replace(/\n/g, ''), 'base64').toString('utf8');
      }

      return res.json({
        path: fileObj.path || rawPath,
        sha: fileObj.sha || '',
        size: fileObj.size || 0,
        content: decodedContent,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore lettura file da GitHub';
      return res.status(500).json({ error: message });
    }
  });

  app.get('/api/jarvis/inbox', async (req: Request, res: Response) => {
    const targetRepo = resolveTargetRepo(req);
    try {
      const dirRes = await githubFetch(`/repos/${targetRepo}/contents/content/jarvis`);
      if (!dirRes.ok) {
        return res.status(dirRes.status).json({
          repo: targetRepo,
          items: [],
          error: dirRes.status === 404 ? 'Cartella content/jarvis non trovata' : 'Errore lettura inbox Jarvis',
        });
      }

      const entries = Array.isArray(dirRes.data)
        ? (dirRes.data as Array<{ name?: string; path?: string; type?: string; sha?: string }>)
        : [];
      const mdFiles = entries.filter((e) => e.type === 'file' && typeof e.path === 'string' && e.path.endsWith('.md'));

      const items = await Promise.all(
        mdFiles.map(async (entry) => {
          const filePath = entry.path as string;
          const encodedPath = filePath.split('/').map((s) => encodeURIComponent(s)).join('/');
          const fRes = await githubFetch(`/repos/${targetRepo}/contents/${encodedPath}`);
          if (!fRes.ok) return null;

          const fObj = fRes.data as { encoding?: string; content?: string; sha?: string };
          const raw =
            fObj.encoding === 'base64' && typeof fObj.content === 'string'
              ? Buffer.from(fObj.content.replace(/\n/g, ''), 'base64').toString('utf8')
              : '';

          const frontmatter: Record<string, unknown> = {};
          let bodyText = raw;
          const fmMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
          if (fmMatch) {
            bodyText = fmMatch[2] || '';
            for (const line of fmMatch[1].split('\n')) {
              const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
              if (!kv) continue;
              const valRaw = kv[2].trim();
              try {
                frontmatter[kv[1]] = JSON.parse(valRaw);
              } catch {
                frontmatter[kv[1]] = valRaw.replace(/^["']|["']$/g, '');
              }
            }
          }

          let jarvisPayload: Record<string, unknown> | null = null;
          const jsonMatch = bodyText.match(/<<<JARVIS_JSON>>>([\s\S]*?)<<<END_JARVIS_JSON>>>/);
          if (jsonMatch) {
            try {
              jarvisPayload = JSON.parse(jsonMatch[1].trim()) as Record<string, unknown>;
            } catch {
              jarvisPayload = null;
            }
          }

          return {
            path: filePath,
            sha: fObj.sha || entry.sha || '',
            frontmatter,
            payload: jarvisPayload,
            markdown: bodyText.trim(),
          };
        })
      );

      return res.json({
        connected: true,
        repo: targetRepo,
        count: items.filter(Boolean).length,
        items: items.filter(Boolean),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore lettura inbox Jarvis';
      return res.status(500).json({ error: message });
    }
  });

  app.post('/api/github/publish', async (req: Request, res: Response) => {
    const targetRepo = 'umbertoshorty2205-afk/capirelai';
    const body = (req.body || {}) as { commitMessage?: string; files?: string[]; deleteFiles?: string[] };
    const commitMessage =
      typeof body.commitMessage === 'string' && body.commitMessage.trim()
        ? body.commitMessage.trim()
        : "Aggiornamento Capire l'AI: nuovo articolo Jarvis & Reel 03/04 KAI-01";
    const deleteSet = new Set(
      (Array.isArray(body.deleteFiles) ? body.deleteFiles : [])
        .filter((p): p is string => typeof p === 'string' && Boolean(p) && !p.startsWith('/') && !p.includes('..'))
    );

    const requestedFiles = Array.isArray(body.files) && body.files.length > 0
      ? body.files
      : [
          'index.html',
          'package.json',
          'tsconfig.json',
          'vite.config.ts',
          'vercel.json',
          '.npmrc',
          'api/newsletter/status.ts',
          'api/newsletter/subscribe.ts',
          'api/newsletter/send-campaign.ts',
          'api/newsletter/kit.ts',
          'api/newsletter/brevo-setup.ts',
          'firebase-applet-config.json',
          'firebase-blueprint.json',
          'firestore.rules',
          'src/main.tsx',
          'src/App.tsx',
          'src/index.css',
          'src/lib/firebase.ts',
          'src/data/newsletterData.ts',
          'src/components/NewsletterSection.tsx',
          'src/components/FounderNewsletterModal.tsx',
          'src/components/PromptHubSection.tsx',
          'src/components/webgl/CapirelAiHero.tsx',
          'src/data/articles.json',
          'src/content/guide/come-usare-ai-lavorare-meno-5-prompt-salvano-10-ore.md',
          'src/content/guide/metodo-r-o-f-10-prompt-chatgpt-da-copiare-subito.md',
          'src/content/guide/migliori-tool-ai-lavorare-meglio-pmi.md',
          'src/content/guide/alternative-chatgpt-privacy-aziende-gdpr.md',
          'src/content/guide/ai-scrivere-preventivi-email-commerciali.md',
          'src/content/guide/automazione-excel-documenti-intelligenza-artificiale.md',
          'src/content/guide/quanto-costa-implementare-ai-piccola-azienda.md',
          'src/content/guide/3-automazioni-ai-senza-codice.md',
          'src/content/guide/leggi-contratti-pdf-50-pagine-10-secondi.md',
          'src/content/guide/modelli-ragionamento-o1-api-guida-pratica.md',
          'src/content/guide/sistemi-multi-agente-orchestrazione.md',
          'src/content/prove/testo-in-video-workflow-ai.md',
          'public/instagram/highlights/highlight-chi-sono.png',
          'public/instagram/highlights/highlight-guide.png',
          'public/instagram/highlights/highlight-prove.png',
          'public/instagram/reels/reel-01-token-tassa-italiano.mp4',
          'public/instagram/reels/reel-02-token-parlato-avatar.mp4',
          'public/instagram/reels/reel-03-cyborg-token-viral.mp4',
          'public/instagram/reels/reel-04-automazioni-ai-jarvis.mp4',
          'public/instagram/reels/reel-05-pdf-50-pagine-jarvis.mp4',
          'public/instagram/reels/reel-06-chatbot-vs-agenti-jarvis.mp4',
          'public/instagram/reels/reel-07-testi-anti-robot-jarvis.mp4',
          'public/instagram/reels/reel-08-regola-rof-risposte-banali-jarvis.mp4',
          'public/instagram/reels/reel-09-spot-3d-chatgpt-rof.mp4',
          'public/instagram/reels/reel-09-poster.jpg',
          'public/instagram/reels/reel-10-agenti-ai-usano-pc.mp4',
          'public/instagram/reels/reel-10-poster.jpg',
          'public/instagram/reels/reel-11-onetake-3d-spot-chatgpt.mp4',
          'public/instagram/reels/reel-11-poster.jpg',
          'public/instagram/reels/reel-12-fregato-desk-3d.mp4',
          'public/instagram/reels/reel-12-poster.jpg',
          'public/instagram/reels/reel-13-ferrari-chatgpt-rof-jarvis.mp4',
          'public/instagram/reels/reel-13-poster.jpg',
          'public/instagram/reels/reel-14-voice-cloning-neural-space.mp4',
          'public/instagram/reels/reel-14-poster.jpg',
          'reel-studio-3d/README.md',
          'reel-studio-3d/skills/CAPIRELAI_VIDEO_SKILLS.md',
          'reel-studio-3d/presets/ig-safe-zones.json',
          'reel-studio-3d/models/capirelai-3d-models.js',
          'reel-studio-3d/models/onetake-3d-engine.js',
          'reel-studio-3d/audio/sound-engine.mjs',
          'reel-studio-3d/templates/spot-3d-template.html',
          'reel-studio-3d/templates/agenti-3d-template.html',
          'reel-studio-3d/templates/onetake-spot-template.html',
          'reel-studio-3d/templates/fregato-3d-template.html',
          'reel-studio-3d/templates/ferrari-rof-macro-template.html',
          'reel-studio-3d/templates/neural-space-voice-template.html',
          'reel-studio-3d/render-reel.mjs',
          'reel-studio-3d/render-reel-10.mjs',
          'reel-studio-3d/render-reel-11.mjs',
          'reel-studio-3d/render-fregato.mjs',
          'reel-studio-3d/render-reel-13.mjs',
          'reel-studio-3d/render-reel-14.mjs',
          'automation/n8n-jarvis-leo-reel-workflow.json',
          'automation/creatomate-template-blueprint.json',
          'automation/README-AUTOMAZIONE-REEL.md',
        ];

    try {
      const refRes = await githubFetch(`/repos/${targetRepo}/git/ref/heads/main`);
      if (!refRes.ok) {
        return res.status(refRes.status).json({ published: false, step: 'get-ref', details: refRes.data });
      }
      const headSha = ((refRes.data as { object?: { sha?: string } }).object?.sha) || '';
      if (!headSha) {
        return res.status(500).json({ published: false, error: 'Impossibile leggere HEAD SHA su main' });
      }

      const commitRes = await githubFetch(`/repos/${targetRepo}/git/commits/${headSha}`);
      if (!commitRes.ok) {
        return res.status(commitRes.status).json({ published: false, step: 'get-commit', details: commitRes.data });
      }
      const baseTreeSha = ((commitRes.data as { tree?: { sha?: string } }).tree?.sha) || '';

      const treeEntries: Array<{ path: string; mode: string; type: string; sha: string }> = [];
      for (const relPath of requestedFiles) {
        if (!relPath || relPath.startsWith('/') || relPath.includes('..')) continue;
        const absPath = path.join(__dirname, relPath);
        if (!fs.existsSync(absPath)) continue;

        const base64Content = fs.readFileSync(absPath).toString('base64');
        const blobRes = await githubFetch(`/repos/${targetRepo}/git/blobs`, {
          method: 'POST',
          body: JSON.stringify({ content: base64Content, encoding: 'base64' }),
        });

        if (!blobRes.ok) {
          return res.status(blobRes.status).json({
            published: false,
            step: `create-blob:${relPath}`,
            details: blobRes.data,
          });
        }
        const blobSha = (blobRes.data as { sha?: string }).sha || '';
        treeEntries.push({ path: relPath, mode: '100644', type: 'blob', sha: blobSha });
      }

      if (treeEntries.length === 0 && deleteSet.size === 0) {
        return res.status(400).json({ published: false, error: 'Nessun file valido da pubblicare' });
      }

      let treePayload: { base_tree?: string; tree: Array<{ path: string; mode: string; type: string; sha: string }> } = {
        base_tree: baseTreeSha,
        tree: treeEntries,
      };

      if (deleteSet.size > 0) {
        const fullTreeRes = await githubFetch(`/repos/${targetRepo}/git/trees/${baseTreeSha}?recursive=1`);
        if (!fullTreeRes.ok) {
          return res.status(fullTreeRes.status).json({ published: false, step: 'get-full-tree', details: fullTreeRes.data });
        }
        const fullTreeData = fullTreeRes.data as {
          truncated?: boolean;
          tree?: Array<{ path?: string; mode?: string; type?: string; sha?: string }>;
        };
        if (fullTreeData.truncated || !Array.isArray(fullTreeData.tree)) {
          return res.status(500).json({ published: false, error: 'Albero repository troncato: impossibile eliminare file in sicurezza' });
        }
        const updatedPaths = new Set(treeEntries.map((t) => t.path));
        const keptEntries = fullTreeData.tree
          .filter(
            (item) =>
              item.type === 'blob' &&
              item.path &&
              item.sha &&
              !deleteSet.has(item.path) &&
              !updatedPaths.has(item.path)
          )
          .map((item) => ({
            path: item.path as string,
            mode: item.mode || '100644',
            type: 'blob',
            sha: item.sha as string,
          }));
        treePayload = { tree: [...keptEntries, ...treeEntries] };
      }

      const newTreeRes = await githubFetch(`/repos/${targetRepo}/git/trees`, {
        method: 'POST',
        body: JSON.stringify(treePayload),
      });
      if (!newTreeRes.ok) {
        return res.status(newTreeRes.status).json({ published: false, step: 'create-tree', details: newTreeRes.data });
      }
      const newTreeSha = (newTreeRes.data as { sha?: string }).sha || '';

      const newCommitRes = await githubFetch(`/repos/${targetRepo}/git/commits`, {
        method: 'POST',
        body: JSON.stringify({
          message: commitMessage,
          tree: newTreeSha,
          parents: [headSha],
        }),
      });
      if (!newCommitRes.ok) {
        return res.status(newCommitRes.status).json({ published: false, step: 'create-commit', details: newCommitRes.data });
      }
      const newCommitSha = (newCommitRes.data as { sha?: string }).sha || '';

      const updateRefRes = await githubFetch(`/repos/${targetRepo}/git/refs/heads/main`, {
        method: 'PATCH',
        body: JSON.stringify({ sha: newCommitSha }),
      });
      if (!updateRefRes.ok) {
        return res.status(updateRefRes.status).json({ published: false, step: 'update-ref', details: updateRefRes.data });
      }

      return res.json({
        published: true,
        repo: targetRepo,
        branch: 'main',
        commitSha: newCommitSha,
        filesCount: treeEntries.length,
        files: treeEntries.map((t) => t.path),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore pubblicazione su GitHub';
      return res.status(500).json({ published: false, error: message });
    }
  });

  function getNewsletterConfig() {
    const brevoKey = (process.env.BREVO_API_KEY || '').trim();
    const resendKey = (process.env.RESEND_API_KEY || '').trim();
    const brevoListId = Number(process.env.BREVO_LIST_ID || 0) || undefined;
    const fromEmail = (process.env.NEWSLETTER_FROM_EMAIL || 'newsletter@capirelai.com').trim();
    const fromName = (process.env.NEWSLETTER_FROM_NAME || "Capire l'AI — Radar Pratica").trim();
    const replyToEmail = (process.env.NEWSLETTER_REPLY_TO || 'umbertoshorty2205@gmail.com').trim();
    const provider = brevoKey ? 'brevo' : resendKey ? 'resend' : 'none';
    return {
      configured: Boolean(brevoKey || resendKey),
      provider,
      brevoKey,
      brevoListId,
      resendKey,
      fromEmail,
      fromName,
      replyToEmail,
    };
  }

  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function sendEmailViaProvider(params: {
    toEmail: string;
    toName: string;
    subject: string;
    textContent: string;
    htmlContent: string;
  }): Promise<{ ok: boolean; provider: string; error?: string }> {
    const cfg = getNewsletterConfig();
    if (!cfg.configured) {
      return { ok: false, provider: 'none', error: 'Nessun provider email configurato' };
    }

    if (cfg.provider === 'brevo') {
      const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': cfg.brevoKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender: { name: cfg.fromName, email: cfg.fromEmail },
          replyTo: { email: cfg.replyToEmail, name: cfg.fromName },
          to: [{ email: params.toEmail, name: params.toName }],
          subject: params.subject,
          htmlContent: params.htmlContent,
          textContent: params.textContent,
        }),
      });
      if (!resp.ok) {
        const errTxt = await resp.text().catch(() => 'Brevo error');
        return { ok: false, provider: 'brevo', error: errTxt };
      }
      return { ok: true, provider: 'brevo' };
    }

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${cfg.fromName} <${cfg.fromEmail}>`,
        to: [params.toEmail],
        subject: params.subject,
        html: params.htmlContent,
        text: params.textContent,
      }),
    });
    if (!resp.ok) {
      const errTxt = await resp.text().catch(() => 'Resend error');
      return { ok: false, provider: 'resend', error: errTxt };
    }
    return { ok: true, provider: 'resend' };
  }

  async function verifyFounderIdToken(bearerHeader: string | undefined): Promise<{ ok: boolean; email?: string }> {
    if (!bearerHeader || !bearerHeader.startsWith('Bearer ')) return { ok: false };
    const idToken = bearerHeader.slice(7).trim();
    if (!idToken) return { ok: false };

    const cfgPath = path.join(__dirname, 'firebase-applet-config.json');
    if (!fs.existsSync(cfgPath)) return { ok: false };
    const fbCfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')) as { apiKey?: string };
    if (!fbCfg.apiKey) return { ok: false };

    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(fbCfg.apiKey)}`,
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
    if (!user?.email || !user.emailVerified) return { ok: false };
    if (user.email.toLowerCase() !== 'umbertoshorty2205@gmail.com') return { ok: false };
    return { ok: true, email: user.email };
  }

  app.get('/api/newsletter/status', (_req: Request, res: Response) => {
    const cfg = getNewsletterConfig();
    return res.json({
      configured: cfg.configured,
      provider: cfg.provider,
      fromEmail: cfg.fromEmail,
      fromName: cfg.fromName,
      replyToEmail: cfg.replyToEmail,
      brevoListId: cfg.brevoListId || null,
    });
  });

  app.get('/api/newsletter/kit', (req: Request, res: Response) => {
    const queryToken = typeof req.query.token === 'string' ? req.query.token : '';
    const headerToken = typeof req.headers['x-kit-token'] === 'string' ? req.headers['x-kit-token'] : '';
    const authHeader = typeof req.headers.authorization === 'string' ? req.headers.authorization : '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

    const token = (queryToken || headerToken || bearerToken).trim();
    const check = verifyKitToken(token);
    if (!check.valid) {
      return res.status(403).json({
        ok: false,
        locked: true,
        error: 'Accesso negato: iscriviti alla newsletter per sbloccare e scaricare il Kit Operativo (.md).',
      });
    }

    res.setHeader('Cache-Control', 'no-store');
    if (req.query.format === 'json') {
      return res.json({
        ok: true,
        email: check.email,
        filename: 'kit-operativo-capirelai-rof-2026.md',
        markdown: LEAD_MAGNET_MARKDOWN,
      });
    }

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    if (req.query.download === '1' || req.query.download === 'true') {
      res.setHeader('Content-Disposition', 'attachment; filename="kit-operativo-capirelai-rof-2026.md"');
    }
    return res.send(LEAD_MAGNET_MARKDOWN);
  });

  app.post('/api/newsletter/subscribe', async (req: Request, res: Response) => {
    const body = (req.body || {}) as {
      email?: string;
      name?: string;
      segment?: string;
      source?: string;
      leadMagnet?: string;
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

    const cfg = getNewsletterConfig();
    if (!cfg.configured) {
      return res.json({
        ok: true,
        emailDispatched: false,
        provider: 'kit-immediato',
        kitToken,
      });
    }

    try {
      if (cfg.provider === 'brevo') {
        let existsInBrevo = false;
        if (returningSubscriber) {
          const checkRes = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
            headers: { 'api-key': cfg.brevoKey, Accept: 'application/json' },
          }).catch(() => null);
          existsInBrevo = Boolean(checkRes?.ok);
        }

        await fetch('https://api.brevo.com/v3/contacts', {
          method: 'POST',
          headers: {
            'api-key': cfg.brevoKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            attributes: { FIRSTNAME: name, NOME: name, SEGMENTO: segment, SOURCE: source },
            ...(cfg.brevoListId ? { listIds: [cfg.brevoListId] } : {}),
            updateEnabled: true,
          }),
        }).catch(() => {});

        if (returningSubscriber && existsInBrevo) {
          return res.json({ ok: true, emailDispatched: false, provider: 'brevo', kitToken });
        }
      } else if (returningSubscriber) {
        return res.json({ ok: true, emailDispatched: false, provider: cfg.provider, kitToken });
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

      const sent = await sendEmailViaProvider({
        toEmail: email,
        toName: name,
        subject,
        textContent,
        htmlContent,
      });

      return res.json({
        ok: true,
        emailDispatched: sent.ok,
        provider: sent.provider,
        kitToken,
      });
    } catch {
      return res.json({ ok: true, emailDispatched: false, provider: cfg.provider, kitToken });
    }
  });

  app.post('/api/newsletter/send-campaign', async (req: Request, res: Response) => {
    const authCheck = await verifyFounderIdToken(req.headers.authorization);
    if (!authCheck.ok) {
      return res.status(401).json({ sent: false, error: 'Non autorizzato: accesso consentito solo al fondatore.' });
    }

    const cfg = getNewsletterConfig();
    if (!cfg.configured) {
      return res.status(400).json({
        sent: false,
        provider: 'none',
        error: 'Configura BREVO_API_KEY o RESEND_API_KEY nei Secrets per inviare campagne email reali.',
      });
    }

    const body = (req.body || {}) as {
      subject?: string;
      previewText?: string;
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

      const out = await sendEmailViaProvider({
        toEmail,
        toName,
        subject,
        textContent: personalized,
        htmlContent,
      });
      if (out.ok) dispatchedCount += 1;
    }

    return res.json({
      sent: dispatchedCount > 0,
      provider: cfg.provider,
      dispatchedCount,
    });
  });

  app.post('/api/newsletter/brevo-setup', async (req: Request, res: Response) => {
    const authCheck = await verifyFounderIdToken(req.headers.authorization);
    if (!authCheck.ok || !authCheck.email) {
      return res.status(401).json({ ok: false, error: 'Non autorizzato: accesso consentito solo al fondatore.' });
    }

    const cfg = getNewsletterConfig();
    if (!cfg.brevoKey) {
      return res.status(400).json({
        ok: false,
        error: 'BREVO_API_KEY non configurata nei Secrets di ambiente.',
      });
    }

    const body = (req.body || {}) as { action?: string };
    const action = typeof body.action === 'string' ? body.action.trim() : '';
    if (!['verify', 'bootstrap', 'test-email'].includes(action)) {
      return res.status(400).json({ ok: false, error: 'Azione non valida.' });
    }

    const brevoCall = async (endpoint: string, init: RequestInit = {}) => {
      const resp = await fetch(`https://api.brevo.com/v3${endpoint}`, {
        ...init,
        headers: {
          'api-key': cfg.brevoKey,
          Accept: 'application/json',
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
          ...(init.headers || {}),
        },
      });
      const txt = await resp.text().catch(() => '');
      let data: Record<string, unknown> = {};
      try {
        data = txt ? (JSON.parse(txt) as Record<string, unknown>) : {};
      } catch {
        data = { raw: txt };
      }
      return { ok: resp.ok, status: resp.status, data };
    };

    try {
      if (action === 'verify') {
        const [accRes, sendersRes, listsRes, attrsRes] = await Promise.all([
          brevoCall('/account'),
          brevoCall('/senders'),
          brevoCall('/contacts/lists?limit=50&offset=0'),
          brevoCall('/contacts/attributes'),
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
          ? (attrsRes.data.attributes as Array<{ name?: string }>)
          : [];
        const attrNames = new Set(attrsRaw.map((a) => String(a.name || '').toUpperCase()));

        return res.json({
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
            (s) => s.active && String(s.email || '').toLowerCase() === cfg.fromEmail.toLowerCase()
          ),
          configuredFromEmail: cfg.fromEmail,
          configuredListId: cfg.brevoListId || null,
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
        const attrsRes = await brevoCall('/contacts/attributes');
        const existing = new Set(
          (Array.isArray(attrsRes.data.attributes)
            ? (attrsRes.data.attributes as Array<{ name?: string }>)
            : []
          ).map((a) => String(a.name || '').toUpperCase())
        );

        const createdAttributes: string[] = [];
        for (const attr of ['NOME', 'SEGMENTO', 'SOURCE']) {
          if (!existing.has(attr)) {
            const r = await brevoCall(`/contacts/attributes/normal/${encodeURIComponent(attr)}`, {
              method: 'POST',
              body: JSON.stringify({ type: 'text' }),
            });
            if (r.ok || r.status === 201 || r.status === 204) {
              createdAttributes.push(attr);
            }
          }
        }

        const listsRes = await brevoCall('/contacts/lists?limit=50&offset=0');
        const listsRaw = Array.isArray(listsRes.data.lists)
          ? (listsRes.data.lists as Array<{ id?: number; name?: string }>)
          : [];
        let targetList = listsRaw.find(
          (l) =>
            (cfg.brevoListId && Number(l.id) === cfg.brevoListId) ||
            String(l.name || '').toLowerCase().includes('capire') ||
            String(l.name || '').toLowerCase().includes('radar')
        );

        let createdListId: number | null = null;
        if (!targetList) {
          const foldersRes = await brevoCall('/contacts/folders?limit=10&offset=0');
          const folders = Array.isArray(foldersRes.data.folders)
            ? (foldersRes.data.folders as Array<{ id?: number }>)
            : [];
          let folderId = folders[0]?.id ? Number(folders[0].id) : 0;
          if (!folderId) {
            const newFolder = await brevoCall('/contacts/folders', {
              method: 'POST',
              body: JSON.stringify({ name: "Capire l'AI" }),
            });
            folderId = Number(newFolder.data.id || 1);
          }
          const createList = await brevoCall('/contacts/lists', {
            method: 'POST',
            body: JSON.stringify({ name: "Capire l'AI — Radar Pratica", folderId }),
          });
          if (createList.ok && createList.data.id) {
            createdListId = Number(createList.data.id);
            targetList = { id: createdListId, name: "Capire l'AI — Radar Pratica" };
          }
        }

        return res.json({
          ok: true,
          action: 'bootstrap',
          createdAttributes,
          createdListId,
          listId: targetList?.id ? Number(targetList.id) : cfg.brevoListId || null,
          listName: targetList?.name || null,
        });
      }

      // action === 'test-email'
      const testEmail = authCheck.email.toLowerCase();
      const kitToken = createKitToken(testEmail);
      const directKitUrl = `https://www.capirelai.com/api/newsletter/kit?token=${encodeURIComponent(kitToken)}&download=1`;

      const sendRes = await brevoCall('/smtp/email', {
        method: 'POST',
        body: JSON.stringify({
          sender: { name: cfg.fromName, email: cfg.fromEmail },
          replyTo: { email: cfg.replyToEmail, name: cfg.fromName },
          to: [{ email: testEmail, name: 'Fondatore Capire l’AI' }],
          subject: '[TEST BREVO] Il tuo Kit Operativo R.O.F. (10 Prompt & Checklist PMI)',
          textContent: `Test di consegna Brevo riuscito!\n\nMittente configurato: ${cfg.fromEmail}\nLink diretto Kit Operativo (.md): ${directKitUrl}\n\nCapire l'AI — Radar AI Pratica`,
          htmlContent: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111827;line-height:1.6;">
              <h2 style="color:#0284c7;">Test Brevo Completato</h2>
              <p>Questa è un'email di prova inviata dal pannello fondatore di <strong>capirelai.com</strong> tramite <strong>Brevo API v3</strong>.</p>
              <p><a href="${escapeHtml(directKitUrl)}" style="display:inline-block;padding:10px 18px;background:#0284c7;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Verifica Download Kit R.O.F. (.md)</a></p>
              <p style="font-size:12px;color:#6b7280;">Mittente: ${escapeHtml(cfg.fromEmail)} • Reply-To: ${escapeHtml(cfg.replyToEmail)}</p>
            </div>`,
        }),
      });

      if (!sendRes.ok) {
        return res.status(400).json({
          ok: false,
          error: `Brevo ha rifiutato l'invio (${sendRes.status}): ${String(sendRes.data.message || sendRes.data.raw || 'Verifica che il mittente sia autenticato su Brevo')}`,
        });
      }

      return res.json({
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
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        return res.sendFile(indexFile);
      }
      return res.status(404).send('Build not found');
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`[Server] Capire l'AI attivo su http://0.0.0.0:${port}`);
  });
}

startServer();
