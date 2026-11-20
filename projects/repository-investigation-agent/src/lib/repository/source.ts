import { InvestigationError, type SourceAdapter, type TreeEntry } from './types';

const segment = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38}[A-Za-z0-9])?$/;
const repoSegment = /^[A-Za-z0-9._-]+$/;
const shaPattern = /^[0-9a-f]{40}$/i;

export function parseRepositoryUrl(value: string): { owner: string; repo: string; key: string; url: string } {
  let url: URL;
  try { url = new URL(value); } catch { throw new InvestigationError('invalid_repository', 'Enter a canonical GitHub repository URL.'); }
  const parts = url.pathname.split('/');
  if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.port || url.username || url.password || url.search || url.hash || parts.length !== 3 || !segment.test(parts[1]) || !repoSegment.test(parts[2]) || parts[2] === '.' || parts[2] === '..' || parts[2].endsWith('.git')) {
    throw new InvestigationError('invalid_repository', 'Only https://github.com/<owner>/<repo> is supported.');
  }
  const owner = parts[1], repo = parts[2];
  return { owner, repo, key: `${owner}/${repo}`.toLowerCase(), url: `https://github.com/${owner}/${repo}` };
}

export function validatePath(path: string, allowEmpty = false): string {
  if (allowEmpty && path === '') return path;
  if (typeof path !== 'string' || !path || path.length > 512 || path.includes('\\') || path.startsWith('/') || path.endsWith('/') || path.includes('//') || /[\u0000-\u001f\u007f?#%]/.test(path) || path.split('/').some(part => part === '.' || part === '..' || !part)) {
    throw new InvestigationError('invalid_arguments', 'Invalid repository path.');
  }
  return path;
}

async function bodyWithin(response: Response, maxBytes: number): Promise<string> {
  if (Number(response.headers.get('content-length')) > maxBytes) throw new InvestigationError('limit', 'Source response exceeds the retrieval limit.');
  const reader = response.body?.getReader();
  if (!reader) throw new InvestigationError('source_error', 'Empty source response.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > maxBytes) throw new InvestigationError('limit', 'Source response exceeds the retrieval limit.');
      chunks.push(part.value);
    }
  } finally { await reader.cancel().catch(() => undefined); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

export class GitHubSourceAdapter implements SourceAdapter {
  readonly mode = 'provider' as const;
  constructor(private readonly request: typeof fetch = fetch, private readonly token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN) {}

  private async get(path: string, maxBytes: number): Promise<unknown> {
    let response: Response;
    try { response = await this.request(`https://api.github.com${path}`, { headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}) }, cache: 'no-store' }); }
    catch { throw new InvestigationError('source_error', 'GitHub could not be reached.'); }
    if (response.status === 403 || response.status === 429) throw new InvestigationError('rate_limited', 'GitHub access is rate limited or forbidden.');
    if (response.status === 404) throw new InvestigationError('inaccessible', 'Repository or source is inaccessible.');
    if (!response.ok) throw new InvestigationError('source_error', `GitHub returned HTTP ${response.status}.`);
    try { return JSON.parse(await bodyWithin(response, maxBytes)); }
    catch (error) { if (error instanceof InvestigationError) throw error; throw new InvestigationError('source_error', 'GitHub returned invalid data.'); }
  }

  async resolve(owner: string, repo: string): Promise<string> {
    const meta = await this.get(`/repos/${owner}/${repo}`, 64 * 1024) as { private?: boolean; default_branch?: string };
    if (meta.private) throw new InvestigationError('private', 'Private repositories are unsupported.');
    if (typeof meta.default_branch !== 'string' || !meta.default_branch) throw new InvestigationError('source_error', 'Default branch is missing.');
    const commit = await this.get(`/repos/${owner}/${repo}/commits/${encodeURIComponent(meta.default_branch)}`, 64 * 1024) as { sha?: string };
    if (!commit.sha || !shaPattern.test(commit.sha)) throw new InvestigationError('source_error', 'Commit SHA is missing or invalid.');
    return commit.sha;
  }

  async tree(owner: string, repo: string, sha: string): Promise<TreeEntry[]> {
    if (!shaPattern.test(sha)) throw new InvestigationError('source_error', 'Invalid commit SHA.');
    const data = await this.get(`/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`, 2 * 1024 * 1024) as { truncated?: boolean; tree?: { path: string; type: string; size?: number }[] };
    if (data.truncated || !Array.isArray(data.tree) || data.tree.length > 2000) throw new InvestigationError('limit', 'Repository tree is truncated or exceeds 2,000 entries.');
    return data.tree.filter(entry => entry.type === 'blob' || entry.type === 'tree').map(entry => ({ path: validatePath(entry.path), type: entry.type as 'blob' | 'tree', size: entry.size }));
  }

  async file(owner: string, repo: string, sha: string, path: string): Promise<string> {
    validatePath(path);
    if (!shaPattern.test(sha)) throw new InvestigationError('source_error', 'Invalid commit SHA.');
    const encoded = path.split('/').map(encodeURIComponent).join('/');
    const data = await this.get(`/repos/${owner}/${repo}/contents/${encoded}?ref=${sha}`, 180 * 1024) as { type?: string; encoding?: string; content?: string; size?: number; truncated?: boolean };
    if (data.type !== 'file' || data.encoding !== 'base64' || !data.content || data.truncated) throw new InvestigationError('source_error', 'Source is not a complete text file.');
    if (typeof data.size !== 'number' || data.size > 100 * 1024) throw new InvestigationError('limit', 'File exceeds 100 KiB.');
    const compact = data.content.replace(/\s/g, '');
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(compact)) throw new InvestigationError('source_error', 'Invalid file encoding.');
    const bytes = Buffer.from(compact, 'base64');
    if (bytes.length !== data.size || bytes.length > 100 * 1024 || bytes.includes(0)) throw new InvestigationError('source_error', 'Binary or incomplete source file.');
    try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
    catch { throw new InvestigationError('source_error', 'Binary source file.'); }
  }
}

export class FixtureSourceAdapter implements SourceAdapter {
  readonly mode = 'fixture' as const;
  readonly reads: string[] = [];
  constructor(private readonly files: Record<string, string> = { 'README.md': '# Example repository\nThis repository demonstrates a source-linked investigation.\n', 'package.json': '{"scripts":{"test":"node --test"}}\n' }, public sha = 'a'.repeat(40)) {}
  async resolve(): Promise<string> { return this.sha; }
  async tree(): Promise<TreeEntry[]> { return Object.entries(this.files).map(([path, content]) => ({ path, type: 'blob', size: Buffer.byteLength(content) })); }
  async file(_owner: string, _repo: string, sha: string, path: string): Promise<string> {
    this.reads.push(`${sha}:${path}`);
    if (!(path in this.files)) throw new InvestigationError('inaccessible', 'File no longer exists.');
    return this.files[path];
  }
}
