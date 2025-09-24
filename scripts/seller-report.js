// scripts/example.js
import { chromium } from 'playwright';
import { humanPause } from '../utils/humanPause.js';
import { logEvent } from '../utils/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const scriptName = 'seller-report';

async function getYlopoSellerReport(ylopoLeadUrl, address) {
  const browser = await chromium.launch({ headless: true });
  const sessionFile = path.resolve(__dirname, '../cookies/ylopo-session.json');
  const context = await browser.newContext({ storageState: sessionFile });
  const page = await context.newPage();
  page.setDefaultTimeout(60000);

  try {
    await page.goto(ylopoLeadUrl, { waitUntil: 'domcontentloaded' });
    
    // If you're redirected to login, session expired — handle below
    if (page.url().includes('/auth')) {
      const startTime = Date.now();
      logEvent({
        automation: scriptName,
        action: 'start',
        status: 'error-progress',
        startTime,
        metadata: { input: req.body.input, error: 'Session not valid / expired. Re-save storageState by logging in manually.' }
      });
      await browser.close();
      process.exit(1);
    }


    await humanPause(page);
    await page.locator('[data-testid="user-action-icon"]:has-text("Create New Seller Alert") [data-testid="user-action-icon-clickable"]').click();

    await humanPause(page);
    await page.getByRole('textbox', { name: 'Label' }).fill('Home');

    await humanPause(page);
    await page.getByRole('textbox', { name: 'Label' }).press('Tab');
    await page.getByRole('combobox', { name: 'Address' }).click();

    await humanPause(page);
    await page.getByRole('combobox', { name: 'Address' }).fill(address);

    await humanPause(page);
    const selected = page.locator('[role="option"][class*="t-selectedLocationSuggestion"]');
    await selected.first().waitFor({ state: 'visible' });  // waits up to default 30s
    await selected.first().click();

    await humanPause(page);
    await page.getByRole('combobox').filter({ hasText: 'Weekly' }).click();

    await humanPause(page);
    await page.getByRole('option', { name: 'Monthly' }).click();

    await humanPause(page);
    await page.getByRole('button', { name: 'Create Seller Alert' }).click();

    await humanPause(page);
    const rawPath = await page.locator('a.link.add-value-link').first().getAttribute('href');


    // Split by "/" and grab the last piece
    const parts = rawPath.split("/");
    const lastId = parts.pop();  // "8f1fa17b-afec-409e-b699-656748b6da8c"

    // Build the new URL
    const reportUrl = `https://roman.romanlopez.com/seller/report/${lastId}`;

    await context.close();
    await browser.close();

    return { url: ylopoLeadUrl, reportUrl };
  } catch (err) {
    await browser.close();
    throw err;
  }
}

export default async function run(input = {}) {
  const ylopoLeadUrl = input.ylopoLeadUrl || 'https://app.ylopo.com/lead/12345'; // Replace with a valid lead URL
  const address = input.address || '123 Main St, Anytown, USA'; // Replace with a valid address

  const result = await getYlopoSellerReport(ylopoLeadUrl, address);

  return { ok: true, result: result.reportUrl };
}
