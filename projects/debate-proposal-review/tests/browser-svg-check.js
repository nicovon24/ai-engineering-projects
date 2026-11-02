/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI evaluates this function expression. */
async page => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const slugs = ["overview", "review", "evidence", "privacy"];
  for (const slug of slugs) {
      const name = slug;
      await page.goto(`http://127.0.0.1:8766/${name}.svg`);
      const result = await page.evaluate(() => {
        const root = document.documentElement;
        const bounds = root.getBoundingClientRect();
        const labels = [...root.querySelectorAll("text")];
        return {
          namespace: root.namespaceURI,
          role: root.getAttribute("role"),
          title: root.querySelector("title")?.textContent,
          description: root.querySelector("desc")?.textContent,
          font: getComputedStyle(labels[0]).fontFamily,
          clipped: labels.some(label => {
            const box = label.getBoundingClientRect();
            return box.left < bounds.left - 1 || box.right > bounds.right + 1 || box.top < bounds.top - 1 || box.bottom > bounds.bottom + 1;
          }),
        };
      });
      if (result.namespace !== "http://www.w3.org/2000/svg" || result.role !== "img" || !result.title || !result.description || !/Arial/.test(result.font) || result.clipped) {
        throw new Error(`${name}: ${JSON.stringify(result)}`);
      }
      await page.screenshot({ path: `.playwright-cli/${name}-svg.png` });
  }
}
