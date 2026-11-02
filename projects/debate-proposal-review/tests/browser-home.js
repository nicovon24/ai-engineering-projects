/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI evaluates this function expression. */
async page => {
  await page.goto('http://127.0.0.1:3301/');
  await page.getByRole('textbox', { name: 'Tu propuesta' }).waitFor();
  if (await page.getByRole('heading', { name: 'Registro de afirmaciones' }).count()) throw new Error('Review ledger must not be on the chat homepage');
  await page.getByRole('link', { name: 'Revisiones guardadas', exact: true }).waitFor();
  await page.getByRole('checkbox', { name: /Autorizo/ }).waitFor();
}
