import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, rmdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { createHistoryStore } from '../src/lib/history';
import { FixtureSourceAdapter, GitHubSourceAdapter, investigate, type InvestigationResult, type Planner, type SourceAdapter } from '../src/lib/repository';

const repositoryUrl = 'https://github.com/octocat/Hello-World';
const question = 'What does the README say?';
const newSha = 'b'.repeat(40);
const planner: Planner = {
  next: async context => context.evidence.some(item => item.path === 'README')
    ? { name: 'finish' }
    : { name: 'read_file', args: { path: 'README' } },
  answer: async context => {
    const line = context.evidence.find(item => item.path === 'README' && item.excerpt.trim());
    return line
      ? { status: 'answered', answer: line.excerpt.trim(), citationIds: [line.id] }
      : { status: 'insufficient_evidence', answer: 'The inspected source is insufficient.', citationIds: [] };
  },
};

function save(store: ReturnType<typeof createHistoryStore>, conversationId: string, result: InvestigationResult) {
  return store.saveRun({
    conversationId,
    repository: result.repository,
    question,
    result: {
      answer: result.answer,
      status: result.status,
      trace: result.trace.map(item => ({ tool: item.tool, outcome: item.status, detail: item.detail })),
      inspectedPaths: result.trace.filter(item => item.path).map(item => ({ path: item.path!, outcome: item.status })),
      evidence: result.evidence.map(item => ({ ...item, sourceConversationId: item.originConversationId })),
      citations: result.citations.map(item => ({ evidenceId: item.id, path: item.path, startLine: item.startLine, endLine: item.endLine, url: item.url })),
    },
  });
}

async function main() {
  const dir = mkdtempSync(join(process.cwd(), '.local-data', 'ria-flow-'));
  const dbPath = join(dir, 'agent.sqlite');
  const store = createHistoryStore({ dbPath });
  try {
    const live = new GitHubSourceAdapter();
    let fileReads = 0;
    const source: SourceAdapter = {
      mode: 'provider',
      resolve: (...args) => live.resolve(...args),
      tree: (...args) => live.tree(...args),
      file: (...args) => { fileReads++; return live.file(...args); },
    };
    const first = await investigate({ repositoryUrl, question, locale: 'en', adapter: source, planner });
    assert.equal(first.status, 'answered');
    assert.equal(first.answer, 'Hello World!');
    assert.equal(first.citations.length, 1);
    assert.equal(fileReads, 1);
    const conversation = store.createConversation(first.repository.key, 'README investigation');
    save(store, conversation.id, first);

    const prior = [{ conversationId: conversation.id, runId: 'first', sha: first.repository.sha, question, answer: first.answer, evidence: first.citations }];
    const repeated = await investigate({ repositoryUrl, question, locale: 'en', adapter: source, planner, prior });
    assert.equal(repeated.repository.sha, first.repository.sha);
    assert.equal(repeated.status, 'answered');
    assert.equal(fileReads, 1, 'same-commit evidence should be reused without another file read');
    save(store, conversation.id, repeated);

    const changedSource = new FixtureSourceAdapter({ README: 'Hello New World!\n' }, newSha);
    const changed = await investigate({ repositoryUrl, question, locale: 'en', adapter: changedSource, planner, prior });
    assert.equal(changed.changed, true);
    assert.equal(changed.status, 'answered');
    assert.equal(changed.answer, 'Hello New World!');
    assert.deepEqual(changedSource.reads, [`${newSha}:README`]);
    save(store, conversation.id, changed);

    const saved = store.getConversation(conversation.id);
    assert.ok(saved);
    assert.deepEqual(saved.runs.map(run => run.sha), [first.repository.sha, first.repository.sha, newSha]);
    assert.equal(saved.runs[0].citations[0].url, first.citations[0].url);
    assert.equal(saved.runs[2].citations[0].url, changed.citations[0].url);
    console.log(JSON.stringify({ repository: first.repository.key, liveSha: first.repository.sha, firstCitation: first.citations[0].url, repeatedFileReads: fileReads, simulatedSha: newSha, newCitation: changed.citations[0].url, savedRuns: saved.runs.length }, null, 2));
  } finally {
    store.close();
    for (const suffix of ['', '-wal', '-shm']) {
      const path = `${dbPath}${suffix}`;
      if (existsSync(path)) unlinkSync(path);
    }
    rmdirSync(dir);
  }
}

mkdirSync(join(process.cwd(), '.local-data'), { recursive: true });
main().catch(error => { console.error(error); process.exitCode = 1; });
