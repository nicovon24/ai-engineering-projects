/* eslint-disable @typescript-eslint/no-unused-expressions */
async page => {
  const origin = 'http://127.0.0.1:3302';
  const id = '48dac69b-f184-48d1-890b-45e69a78df13';
  const source = { id: 'source-1', reviewId: id, title: 'Test source', format: 'text', passages: [
    { id: 'source-1:P1', sourceId: 'source-1', locator: 'paragraph 1', text: 'A supporting observation.' },
    { id: 'source-1:P2', sourceId: 'source-1', locator: 'paragraph 2', text: 'A conflicting observation.' },
  ] };
  const base = { id, locale: 'es', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), consentAt: new Date().toISOString(), proposal: { title: 'Review findings test', summary: 'Synthetic review for browser testing.' }, messages: [], sources: [source], stageOutputs: {}, stage: 'opposing' };
  let record = { ...base, stageOutputs: {
    claims: { claims: [{ text: 'Initial factual assertion.', kind: 'factual' }] },
    supporting: { arguments: [{ text: 'Provisional supporting reason.', claims: [{ text: 'Supporting assertion.', kind: 'factual' }] }] },
    opposing: { arguments: [{ text: 'Provisional opposing reason.', claims: [{ text: 'Opposing assertion.', kind: 'factual' }] }] },
  } };
  await page.route(`**/api/reviews/${id}`, route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ review: record }) }));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${origin}/reviews/${id}`);
  await page.getByRole('button', { name: 'ES', exact: true }).click();
  await page.getByText('Provisional supporting reason.').waitFor();
  await page.getByText('Provisional opposing reason.').waitFor();
  await page.getByText('Initial factual assertion.').waitFor();
  await page.getByText(/provisional/i).first().waitFor();
  await page.getByText(/pueden estar equivocad/i).waitFor();
  await page.waitForTimeout(650);
  await page.screenshot({ path: '.playwright-cli/review-findings-partial.png' });
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await page.getByText('Provisional arguments · no evidence verdict yet').waitFor();
  await page.getByText(/may be wrong/i).waitFor();
  await page.waitForTimeout(650);
  await page.screenshot({ path: '.playwright-cli/review-findings-partial-en.png' });

  record = { ...base, stage: 'complete', stageOutputs: {}, snapshot: { reviewId: id, sources: [source], arguments: [], claims: [{ id: 'claim-1', text: 'The result is consistent.', origins: ['proposal'], kind: 'factual', argumentIds: [] }], verdicts: [{ claimId: 'claim-1', status: 'mixed', supportingPassageIds: ['source-1:P1'], contradictingPassageIds: ['source-1:P2'], rationale: 'Passages disagree.' }] } };
  await page.goto(`${origin}/reviews/${id}`);
  await page.getByRole('button', { name: 'ES', exact: true }).click();
  await page.getByText('A favor de la afirmación').waitFor();
  await page.getByText('En contra de la afirmación').waitFor();
  await page.getByRole('button', { name: /Inspeccionar pasaje: source-1:P2/ }).click();
  await page.getByText('A conflicting observation.').waitFor();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(650);
  await page.screenshot({ path: '.playwright-cli/review-findings-mixed.png' });
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await page.getByText('Supporting the claim').waitFor();
  await page.getByText('Contradicting the claim').waitFor();
  await page.getByText('Supporting the claim').scrollIntoViewIfNeeded();
  await page.waitForTimeout(650);
  await page.screenshot({ path: '.playwright-cli/review-findings-mixed-en.png' });
  return 'partial outputs, advisory, and mixed citation groups passed';
}
