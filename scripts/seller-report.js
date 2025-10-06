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

    if (!ylopoLeadUrl) { 
      logEvent({
        automation: scriptName,
        action: 'in-progress',
        status: 'error-progress',
        startTime,
        metadata: { input: req.body.input, error: 'Missing ylopoLeadUrl parameter' }
      });
      return res.status(400).json({ error: 'Missing ylopoLeadUrl parameter' });
    }

    if (!address) {
      logEvent({
        automation: scriptName,
        action: 'in-progress',
        status: 'error-progress',
        startTime,
        metadata: { input: req.body.input, error: 'Missing address parameter' }
      });
      return res.status(400).json({ error: 'Missing address parameter' });
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

async function setSellerReportInFollowUpBoss(followupbossContactUrl, ylopoSellerReport) { 
  const browser = await chromium.launch({ headless: false });
  const sessionFile = path.resolve(__dirname, '../cookies/followupboss-session.json');
  const context = await browser.newContext({ storageState: sessionFile });
  const page = await context.newPage();
  page.setDefaultTimeout(60000);

  try {
    await page.goto(followupbossContactUrl, { waitUntil: 'domcontentloaded' });

    // If you're redirected to login, session expired — handle below
    if (page.url().includes('/login')) {
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

    await page.goto(followupbossContactUrl);

    const ylopoSellerReportField = page.locator('form:has(b:has-text("Ylopo Seller Report"))');

    await humanPause(page);
    await ylopoSellerReportField.hover();

    await humanPause(page);
    await ylopoSellerReportField.getByRole('img').click();

    await humanPause(page);
    await page.getByRole('main').getByRole('textbox').fill(ylopoSellerReport);

    await humanPause(page);
    await page.locator('form').filter({ hasText: 'Ylopo Seller Report' }).getByRole('button').first().click();  

    await context.close();
    await browser.close();

    return { url: followupbossContactUrl, reportUrl: ylopoSellerReport };
  } catch (err) {
    await browser.close();
    throw err;
  }
}

async function sendFUBText(followupbossContactUrl, ylopoSellerReport, FUBtag) {
  const browser = await chromium.launch({ headless: false });
  const sessionFile = path.resolve(__dirname, '../cookies/followupboss-session.json');
  const context = await browser.newContext({ storageState: sessionFile });
  const page = await context.newPage();
  page.setDefaultTimeout(60000);
  
  try {
    await page.goto(followupbossContactUrl, { waitUntil: 'domcontentloaded' });

    // If you're redirected to login, session expired — handle below
    if (page.url().includes('/login')) {
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

    await page.goto(followupbossContactUrl);

    // 🕵️ Wait for link inside the "Ylopo Seller Report" form
    const formLink = page.locator('form:has-text("Ylopo Seller Report") a');

    try {
      await formLink.waitFor({ state: 'visible', timeout: 15000 });
    } catch {
      await browser.close();
      throw new Error('❌ No Ylopo Seller Report link found — stopping script.');
    }

    await humanPause(page);
    await page.getByText('Messages', { exact: true }).click();

    if (FUBtag === "Seller Report AI") {
      await humanPause(page);
      await page.locator('div').filter({ hasText: /^Text$/ }).nth(3).click();
      await humanPause(page);
      await page.locator('div').filter({ hasText: /^Ylopo AI Text$/ }).first().click();
    } else if (FUBtag === "Seller Report Callaction") {
      await humanPause(page);
      await page.locator('div').filter({ hasText: /^Text$/ }).nth(3).click();
      await humanPause(page);
      await page.locator('div').filter({ hasText: /^CallAction$/ }).first().click();
    }

    await humanPause(page);
    await page.locator('a').filter({ hasText: 'Templates' }).click();
    await humanPause(page);
    await page.getByRole('textbox', { name: 'Search Text Templates' }).fill('Report- Seller Report, Home Owner Report,  Home Equity Report, 2.0 (NOT LOOKING TO SELL)');

    await humanPause(page);
    await page.getByText('Report- Seller Report, Home').first().click();

    if (FUBtag === "Seller Report AI") {
      await humanPause(page);
      await page.getByRole('button', { name: 'Send via Ylopo AI Text' }).click();
    } else if (FUBtag === "Seller Report Callaction") {
      await humanPause(page);
      await page.getByRole('button', { name: 'Send via CallAction' }).click();
    } else {
      await humanPause(page);
      await page.getByRole('button', { name: 'Send Text' }).click();
    }
    
    await context.close();
    await browser.close();
  } catch (err) {
    await browser.close();
    throw err;
  }
}

export default async function run(input = {}) {
  const ylopoLeadUrl = input.ylopoLeadUrl
  const address = input.address
  const followupbossContactUrl = input.followupbossContactUrl
  const FUBtag = input.FUBtag || "Seller Report Callaction"

  const result = await getYlopoSellerReport(ylopoLeadUrl, address);
  const followupboss = await setSellerReportInFollowUpBoss(followupbossContactUrl, result.reportUrl);
  await sendFUBText(followupbossContactUrl, result.reportUrl, FUBtag);


  return { ok: true, result: result.reportUrl };
}
