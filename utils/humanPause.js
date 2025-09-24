export async function humanPause(page, min = 300, max = 1000) {
  const delay = min + Math.floor(Math.random() * (max - min));
  await page.waitForTimeout(delay);
}
