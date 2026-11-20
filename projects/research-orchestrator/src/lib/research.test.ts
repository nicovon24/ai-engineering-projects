import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRun, extractText, getRun, publicAddress, reviewRun, validUrl } from './research';

test('URL and address boundary rejects local, reserved, and credentialed targets', () => {
  for (const value of ['http://example.com', 'https://127.0.0.1', 'https://[::1]', 'https://user:pass@example.com', 'https://localhost', 'https://example.com:8443']) assert.equal(validUrl(value), null);
  assert.equal(validUrl('https://example.com/a#fragment')?.href, 'https://example.com/a');
  for (const address of ['127.0.0.1', '10.2.3.4', '192.168.2.3', '169.254.1.1', '192.0.2.1', '198.51.100.1', '203.0.113.1', '::1', 'fc00::1', '2001:db8::1']) assert.equal(publicAddress(address), false, address);
  assert.equal(publicAddress('8.8.8.8'), true);
});

test('extraction removes executable markup and bounds text', () => {
  assert.equal(extractText('<h1>Title</h1><script>ignore()</script><style>.bad{}</style><p>A &amp; B</p>'), 'Title A & B');
  assert.equal(extractText('a'.repeat(13000)).length, 12000);
});

test('demo persists evidence and needs explicit human approval', async () => {
  const run = await createRun('How does human review work?', 'en', 'demo');
  assert.equal(run.status, 'pending');
  assert.deepEqual(run.stages.map(stage => stage.name), ['plan', 'collect', 'synthesize', 'review']);
  const sourceText = run.sources[0].text;
  const reviewed = reviewRun(run.id, 'approve', 'Edited report with a human decision.', 'Reviewed');
  assert.equal(reviewed?.status, 'approved');
  assert.equal(getRun(run.id)?.sources[0].text, sourceText);
  assert.equal(getRun(run.id)?.editedReport, 'Edited report with a human decision.');
  const revised = reviewRun(run.id, 'revise', 'Edited report requesting more context.', 'Add another source');
  assert.equal(revised?.status, 'revision_requested');
  assert.deepEqual(revised?.decisions.map(item => item.action), ['approve', 'revise']);
  assert.equal(getRun(run.id)?.sources[0].text, sourceText);
});

test('missing search configuration stops before synthesis', async () => {
  const prior = process.env.BRAVE_SEARCH_API_KEY;
  delete process.env.BRAVE_SEARCH_API_KEY;
  try {
    const run = await createRun('What is source-based research?', 'es', 'live');
    assert.equal(run.status, 'failed');
    assert.deepEqual(run.stages.map(stage => stage.name), ['plan', 'collect']);
    assert.match(run.error, /BRAVE_SEARCH_API_KEY/);
  } finally { if (prior) process.env.BRAVE_SEARCH_API_KEY = prior; }
});
