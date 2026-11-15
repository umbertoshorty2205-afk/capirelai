import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
    const body = (req.body || {}) as { commitMessage?: string; files?: string[] };
    const commitMessage =
      typeof body.commitMessage === 'string' && body.commitMessage.trim()
        ? body.commitMessage.trim()
        : "Aggiornamento Capire l'AI: nuovo articolo Jarvis & Reel 03/04 KAI-01";

    const requestedFiles = Array.isArray(body.files) && body.files.length > 0
      ? body.files
      : [
          'index.html',
          'src/components/webgl/CapirelAiHero.tsx',
          'src/data/articles.json',
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

      if (treeEntries.length === 0) {
        return res.status(400).json({ published: false, error: 'Nessun file valido da pubblicare' });
      }

      const newTreeRes = await githubFetch(`/repos/${targetRepo}/git/trees`, {
        method: 'POST',
        body: JSON.stringify({ base_tree: baseTreeSha, tree: treeEntries }),
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
