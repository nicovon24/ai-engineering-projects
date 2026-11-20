import { FixturePlanner, GroqPlanner } from './planner';
import { FixtureSourceAdapter, GitHubSourceAdapter, parseRepositoryUrl, validatePath } from './source';
import { InvestigationError, type Evidence, type InvestigationInput, type InvestigationResult, type PlannerContext, type Repository, type SourceAdapter, type ToolCall, type ToolOutcome, type TraceEntry, type TreeEntry } from './types';

export * from './types';
export { FixturePlanner, GroqPlanner } from './planner';
export { FixtureSourceAdapter, GitHubSourceAdapter, parseRepositoryUrl, validatePath } from './source';

export const DEMO_REPOSITORY_URL = 'https://github.com/fixture/repository-investigation-demo';
const MAX_CALLS = 8, MAX_TREE = 2000, MAX_FILE = 100 * 1024, MAX_TOTAL = 1024 * 1024;

function sourceLink(repository: Repository, path: string, startLine: number, endLine: number): string {
  return `${repository.url}/blob/${repository.sha}/${path.split('/').map(encodeURIComponent).join('/')}#L${startLine}${endLine === startLine ? '' : `-L${endLine}`}`;
}
function description(locale: 'es' | 'en', code: string): string {
  const es: Record<string,string> = { insufficient_evidence: 'La evidencia inspeccionada no alcanza para responder esa pregunta.', provider_error: 'Groq no está disponible. Configure GROQ_API_KEY para investigar este repositorio.', source_error: 'No se pudo verificar la fuente actual.', private: 'El repositorio es privado y no se puede investigar.', inaccessible: 'El repositorio o la fuente no está disponible públicamente.', rate_limited: 'GitHub limitó el acceso. Intentá de nuevo más tarde.', limit: 'La investigación se detuvo al alcanzar un límite de lectura.', invalid_tool: 'La investigación se detuvo por una operación no permitida.', invalid_arguments: 'La investigación se detuvo por argumentos inválidos.' };
  const en: Record<string,string> = { insufficient_evidence: 'The inspected evidence is insufficient to answer that question.', provider_error: 'Groq is unavailable. Set GROQ_API_KEY to investigate this repository.', source_error: 'The current source could not be verified.', private: 'This repository is private and cannot be investigated.', inaccessible: 'The repository or source is not publicly accessible.', rate_limited: 'GitHub access is rate limited. Try again later.', limit: 'The investigation stopped at a read limit.', invalid_tool: 'The investigation stopped at an unsupported operation.', invalid_arguments: 'The investigation stopped at invalid arguments.' };
  return (locale === 'es' ? es : en)[code] ?? (locale === 'es' ? 'La investigación no pudo completarse.' : 'The investigation could not be completed.');
}
function validateTool(raw: unknown): ToolCall | { name: 'finish' } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new InvestigationError('invalid_tool', 'Invalid tool request.');
  const call = raw as Record<string, unknown>;
  if (call.name === 'finish' && Object.keys(call).length === 1) return { name: 'finish' };
  if (!['list_tree', 'search_text', 'read_file'].includes(String(call.name))) throw new InvestigationError('invalid_tool', 'Unsupported tool.');
  if (Object.keys(call).sort().join(',') !== 'args,name' || !call.args || typeof call.args !== 'object' || Array.isArray(call.args)) throw new InvestigationError('invalid_arguments', 'Invalid tool arguments.');
  const args = call.args as Record<string, unknown>;
  if (call.name === 'read_file') {
    if (Object.keys(args).join(',') !== 'path' || typeof args.path !== 'string') throw new InvestigationError('invalid_arguments', 'read_file requires a path.');
    return { name: 'read_file', args: { path: validatePath(args.path) } };
  }
  if (call.name === 'list_tree') {
    if (Object.keys(args).some(key => key !== 'prefix') || (args.prefix !== undefined && typeof args.prefix !== 'string')) throw new InvestigationError('invalid_arguments', 'Invalid tree prefix.');
    return { name: 'list_tree', args: { prefix: validatePath((args.prefix as string | undefined) ?? '', true) } };
  }
  if (Object.keys(args).some(key => key !== 'query' && key !== 'prefix') || typeof args.query !== 'string' || args.query.length < 2 || args.query.length > 100 || /[\u0000-\u001f\u007f]/.test(args.query) || (args.prefix !== undefined && typeof args.prefix !== 'string')) throw new InvestigationError('invalid_arguments', 'Invalid search request.');
  return { name: 'search_text', args: { query: args.query, prefix: validatePath((args.prefix as string | undefined) ?? '', true) } };
}

export async function investigate(input: InvestigationInput): Promise<InvestigationResult> {
  const parsed = parseRepositoryUrl(input.repositoryUrl);
  const demo = parsed.url === DEMO_REPOSITORY_URL;
  const adapter: SourceAdapter = input.adapter ?? (demo ? new FixtureSourceAdapter() : new GitHubSourceAdapter());
  const mode = adapter.mode ?? (adapter instanceof FixtureSourceAdapter ? 'fixture' : 'provider');
  const fixture = demo || mode === 'fixture';
  const prior = (input.prior ?? []).slice(0, 5);
  const empty: Repository = { ...parsed, sha: '' };
  const trace: TraceEntry[] = [];
  let repository = empty;
  let changed = false;
  const stop = (code: string, detail: string): InvestigationResult => {
    trace.push({ step: trace.length + 1, tool: 'stop', status: 'stop', detail, sha: repository.sha });
    return { status: 'stopped', answer: description(input.locale, code), repository, citations: [], evidence: [], trace, mode, changed, error: code };
  };
  if (!input.question?.trim() || input.question.length > 2000 || !['es', 'en'].includes(input.locale)) return stop('invalid_arguments', 'Invalid question or locale.');
  try { repository = { ...parsed, sha: await adapter.resolve(parsed.owner, parsed.repo) }; }
  catch (error) { const code = error instanceof InvestigationError ? error.code : 'source_error'; return stop(code, 'Commit resolution failed.'); }
  if (!/^[a-f0-9]{40}$/i.test(repository.sha)) return stop('source_error', 'Source adapter returned an invalid SHA.');
  changed = prior.some(item => item.sha !== repository.sha);
  trace.push({ step: 1, tool: 'resolve', status: 'ok', detail: 'Default commit resolved.', sha: repository.sha });
  if (!input.planner && !fixture && !process.env.GROQ_API_KEY) return stop('provider_error', 'No answer provider configured.');
  const planner = input.planner ?? (fixture ? new FixturePlanner() : new GroqPlanner(process.env.GROQ_API_KEY!));
  let tree: TreeEntry[] | undefined;
  const cached = new Map<string, string>();
  const evidence: Evidence[] = [];
  const outcomes: ToolOutcome[] = [];
  let totalBytes = 0, calls = 0;
  const currentPrior = prior.filter(item => item.sha === repository.sha);
  for (const finding of currentPrior) for (const item of finding.evidence) {
    if (item.sha !== repository.sha || !Number.isInteger(item.startLine) || !Number.isInteger(item.endLine) || item.startLine < 1 || item.endLine < item.startLine || item.endLine - item.startLine > 100 || typeof item.excerpt !== 'string' || item.excerpt.length > MAX_FILE) continue;
    try { validatePath(item.path); } catch { continue; }
    if (item.url !== sourceLink(repository, item.path, item.startLine, item.endLine)) continue;
    evidence.push({ ...item, id: `prior-${evidence.length + 1}`, url: sourceLink(repository, item.path, item.startLine, item.endLine), originConversationId: finding.conversationId });
  }
  const context = (): PlannerContext => ({ repository, question: input.question, locale: input.locale, prior, outcomes, evidence, remainingCalls: MAX_CALLS - calls });
  const loadTree = async (): Promise<TreeEntry[]> => {
    if (!tree) {
      tree = await adapter.tree(repository.owner, repository.repo, repository.sha);
      if (tree.length > MAX_TREE) throw new InvestigationError('limit', 'Tree exceeds 2,000 entries.');
      for (const entry of tree) validatePath(entry.path);
    }
    return tree;
  };
  const loadFile = async (path: string): Promise<string> => {
    if (cached.has(path)) return cached.get(path)!;
    const entries = await loadTree();
    const entry = entries.find(item => item.path === path && item.type === 'blob');
    if (!entry) throw new InvestigationError('invalid_arguments', 'File is absent from the pinned tree.');
    if (entry.size !== undefined && entry.size > MAX_FILE) throw new InvestigationError('limit', 'File exceeds 100 KiB.');
    const content = await adapter.file(repository.owner, repository.repo, repository.sha, path);
    const bytes = Buffer.byteLength(content);
    if (bytes > MAX_FILE || totalBytes + bytes > MAX_TOTAL) throw new InvestigationError('limit', 'Text retrieval budget exceeded.');
    if (content.includes('\0')) throw new InvestigationError('source_error', 'Binary source file.');
    totalBytes += bytes;
    cached.set(path, content);
    return content;
  };
  const addLines = (path: string, content: string, matching?: string): Evidence[] => {
    const lines = content.split(/\r?\n/);
    const selected: Evidence[] = [];
    for (let i = 0; i < lines.length && selected.length < (matching ? 20 : 400); i++) {
      const line = lines[i];
      if (!line.trim() || (matching && !line.toLowerCase().includes(matching.toLowerCase()))) continue;
      let item = evidence.find(e => e.path === path && e.startLine === i + 1 && e.sha === repository.sha);
      if (!item) {
        item = { id: `e${evidence.length + 1}`, path, startLine: i + 1, endLine: i + 1, excerpt: line, sha: repository.sha, url: sourceLink(repository, path, i + 1, i + 1) };
        evidence.push(item);
      }
      selected.push(item);
    }
    return selected;
  };
  let currentTool = 'planner';
  try {
    if (changed) {
      const paths = [...new Set(prior.filter(item => item.sha !== repository.sha).flatMap(item => [...(item.inspectedPaths ?? []).map(path => path.path), ...item.evidence.map(e => e.path)]))].slice(0, 3);
      for (const path of paths) {
        try { validatePath(path); } catch { continue; }
        if (calls >= MAX_CALLS) throw new InvestigationError('limit', 'Eight-tool-operation limit reached while rechecking prior source.');
        calls++;
        currentTool = 'read_file';
        try {
          const content = await loadFile(path);
          const found = addLines(path, content);
          outcomes.push({ name: 'read_file', summary: `Rechecked prior path: ${path}; ${found.length} readable lines`, evidence: found });
          trace.push({ step: trace.length + 1, tool: 'read_file', status: 'ok', detail: 'Prior path rechecked at current commit.', sha: repository.sha, path, count: found.length });
        } catch (error) {
          if (!(error instanceof InvestigationError) || !['inaccessible', 'invalid_arguments'].includes(error.code)) throw error;
          outcomes.push({ name: 'read_file', summary: `Prior path removed or inaccessible at current commit: ${path}` });
          trace.push({ step: trace.length + 1, tool: 'read_file', status: 'error', detail: 'Prior path is absent at current commit.', sha: repository.sha, path });
        }
      }
    }
    while (true) {
      currentTool = 'planner';
      const call = validateTool(await planner.next(context()));
      if (call.name === 'finish') break;
      if (calls >= MAX_CALLS) throw new InvestigationError('limit', 'Eight-tool-operation limit reached.');
      calls++;
      currentTool = call.name;
      let outcome: ToolOutcome;
      if (call.name === 'list_tree') {
        const prefix = call.args.prefix ?? '';
        const entries = (await loadTree()).filter(item => !prefix || item.path === prefix || item.path.startsWith(`${prefix}/`));
        outcome = { name: call.name, summary: `${entries.length} entries${entries.length > 200 ? '; showing first 200' : ''}`, paths: entries.slice(0, 200).map(item => item.path), partial: entries.length > 200, scanned: Math.min(entries.length, 200), total: entries.length };
      } else if (call.name === 'read_file') {
        const content = await loadFile(call.args.path);
        const found = addLines(call.args.path, content);
        outcome = { name: call.name, summary: `${found.length} readable lines`, evidence: found };
      } else {
        const entries = (await loadTree()).filter(item => item.type === 'blob' && (item.size ?? 0) <= MAX_FILE && (!call.args.prefix || item.path.startsWith(`${call.args.prefix}/`)));
        const found: Evidence[] = [];
        let scanned = 0;
        for (const entry of entries.slice(0, 20)) {
          scanned++;
          const content = await loadFile(entry.path);
          found.push(...addLines(entry.path, content, call.args.query));
          if (found.length >= 20) break;
        }
        const partial = scanned < entries.length || found.length >= 20;
        outcome = { name: call.name, summary: `${found.length} matching lines; scanned ${scanned} of ${entries.length} files${partial ? '; partial coverage' : ''}`, evidence: found.slice(0, 20), partial, scanned, total: entries.length };
      }
      outcomes.push(outcome);
      trace.push({ step: trace.length + 1, tool: call.name, status: 'ok', detail: outcome.summary, sha: repository.sha, path: 'path' in call.args ? call.args.path : undefined, count: outcome.evidence?.length ?? outcome.paths?.length });
    }
    currentTool = 'answer';
    const proposed = await planner.answer(context());
    if (!proposed || !['answered', 'insufficient_evidence'].includes(proposed.status) || typeof proposed.answer !== 'string' || !Array.isArray(proposed.citationIds) || proposed.citationIds.some(id => typeof id !== 'string')) throw new InvestigationError('provider_error', 'Invalid structured answer.');
    const ids = [...new Set(proposed.citationIds)];
    const citations = ids.map(id => evidence.find(item => item.id === id));
    if (citations.some(item => !item) || (proposed.status === 'answered' && citations.length === 0) || (proposed.status === 'insufficient_evidence' && citations.length > 0)) throw new InvestigationError('provider_error', 'Answer contains unsupported citations.');
    trace.push({ step: trace.length + 1, tool: 'finish', status: 'stop', detail: proposed.status, sha: repository.sha });
    return { status: proposed.status, answer: proposed.answer, repository, citations: citations as Evidence[], evidence, trace, mode, changed };
  } catch (error) {
    const code = error instanceof InvestigationError ? error.code : 'source_error';
    trace.push({ step: trace.length + 1, tool: currentTool, status: code === 'invalid_tool' || code === 'invalid_arguments' ? 'rejected' : 'error', detail: error instanceof InvestigationError ? error.message : 'Operation failed.', sha: repository.sha });
    return stop(code, error instanceof InvestigationError ? error.message : 'Operation failed.');
  }
}
