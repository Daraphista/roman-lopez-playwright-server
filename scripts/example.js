// scripts/example.js
import { chromium } from 'playwright';
import { humanPause } from '../utils/humanPause.js';

export default async function run(input = {}) {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const url = input.url || 'https://example.com';
  await page.goto(url);

  await humanPause(page, 2000, 5000);
  
  const title = await page.title();

  await context.close();
  await browser.close();

  return { ok: true, title };
}
