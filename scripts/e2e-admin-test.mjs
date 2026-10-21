/**
 * e2e-admin-test.mjs — end-to-end test of the /admin editor.
 * Requires: npm run dev (port 3000) and `npx decap-server` (port 8081).
 *
 * Verifies, in a real Chromium browser:
 *   1. /admin loads the Decap UI (no login screen = local backend connected)
 *   2. The About (biography) form opens and the current bio value is present
 *   3. Editing + Save writes the change to content/about.json on disk
 *   4. Restoring + Save writes the original value back (file ends unchanged)
 *   5. Releases, Site & social links and Videos forms all open with the
 *      expected fields (screenshot evidence per collection)
 * Exits non-zero if any check fails.
 */
import { readFile } from 'node:fs/promises';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const SITE = 'http://localhost:3000/admin/';
const ABOUT_FILE = new URL('../content/about.json', import.meta.url);
const ARTIFACTS = new URL('../artifacts/', import.meta.url);

const results = [];
const check = (name, ok, extra = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ` — ${extra}` : ''}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readAbout = async () => {
  const raw = await readFile(ABOUT_FILE, 'utf8');
  return raw;
};

const originalRaw = await readAbout();
const originalLede = JSON.parse(originalRaw).lede;
const marker = `BIO-EDIT-TEST-${Date.now()}`;

await mkdir(ARTIFACTS, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
const consoleErrors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => consoleErrors.push(String(err)));
page.on('crash', () => console.log('[EVENT] page crashed'));
page.on('close', () => console.log('[EVENT] page closed'));
browser.on('disconnected', () => console.log('[EVENT] browser disconnected'));

const introField = () => page.getByLabel('Intro line', { exact: true }).first();

/** Reload with a cleared session → guaranteed one-click login screen → editor. */
const freshLoad = async () => {
  await page.goto(SITE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  }).catch(() => {});
  await page.goto(SITE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.keyboard.press('Escape').catch(() => {});
  await page.locator('#nc-root button').first().click();
  await page.getByText('Releases', { exact: true }).first().waitFor({ timeout: 60000 });
};

/** Fill and confirm React kept the value (Decap can remount fields after saves). */
const fillStable = async (value) => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const field = introField();
    await field.fill(value);
    await page.waitForTimeout(600);
    const now = await field.inputValue().catch(() => '');
    if (now === value) return true;
  }
  return false;
};

const saveAndAwait = async (expectedContains, expectedAbsent) => {
  await page.keyboard.press('Escape').catch(() => {}); // close any open dropdown
  const primary = page.getByRole('button', { name: /^(Publish now|Publish|Save)$/i }).first();
  const fallback = page.locator('button:has-text("Publish"), button:has-text("Save")').first();
  let clicked = false;
  for (let i = 0; i < 30 && !clicked; i += 1) {
    const target = (await primary.count()) > 0 ? primary : (await fallback.count()) > 0 ? fallback : null;
    if (target) {
      await target.click({ timeout: 10000 }).then(
        () => {
          clicked = true;
        },
        () => {},
      );
    }
    if (!clicked) await page.waitForTimeout(1000);
  }
  if (!clicked) {
    const buttons = await page.evaluate(() =>
      [...document.querySelectorAll('button')].map((b) => (b.innerText || '').trim()).filter(Boolean).slice(0, 20),
    );
    const body = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 200));
    await page.screenshot({ path: new URL('admin-save-button-missing.png', ARTIFACTS).pathname }).catch(() => {});
    throw new Error(`Save button never appeared. buttons=${JSON.stringify(buttons)} body=${body}`);
  }
  // Decap 3.x opens a dropdown before saving: pick "Publish now" when present.
  const publishNow = page.getByText(/^Publish now$/i).first();
  try {
    await publishNow.waitFor({ timeout: 4000 });
    await publishNow.click();
  } catch {
    /* direct-save mode: no dropdown */
  }
  for (let i = 0; i < 30; i += 1) {
    await sleep(500);
    const raw = await readAbout();
    const has = !expectedContains || raw.includes(expectedContains);
    const absent = !expectedAbsent || !raw.includes(expectedAbsent);
    if (has && absent) return true;
  }
  return false;
};

try {
  /* 1. Admin page loads; local proxy mode shows a one-click login (no password) */
  await page.goto(SITE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const proxyLoginButton = page.locator('#nc-root button').first();
  await proxyLoginButton.waitFor({ timeout: 60000 });
  await page.screenshot({ path: new URL('admin-0-login.png', ARTIFACTS).pathname });
  await proxyLoginButton.click();
  await page.getByText('Releases', { exact: true }).first().waitFor({ timeout: 60000 });
  check('/admin loads and one-click local login opens the editor', true, 'local proxy mode, no password');
  await page.screenshot({ path: new URL('admin-1-loaded.png', ARTIFACTS).pathname });

  /* 2. About collection → biography form, current value present */
  await page.getByText('About page (biography)').first().click();
  await page.getByText('Biography & facts').first().click();
  await introField().waitFor({ timeout: 30000 });
  const shownValue = await introField().inputValue();
  check('Biography form opens with current intro line', shownValue === originalLede, `value: "${shownValue.slice(0, 60)}"`);
  await page.screenshot({ path: new URL('admin-2-bio-form.png', ARTIFACTS).pathname });

  /* 3. Edit + Save → file changes on disk */
  const filled = await fillStable(marker);
  check('Typing an edit sticks in the form', filled);
  const saved = await saveAndAwait(marker);
  const afterSave = await readAbout();
  check('Save writes the edit to content/about.json', saved && afterSave.includes(marker));
  await page.screenshot({ path: new URL('admin-3-saved.png', ARTIFACTS).pathname });

  /* 4. Fresh session: reopen the entry (proves persistence), then restore */
  await freshLoad();
  await page.getByText('About page (biography)').first().click();
  await page.getByText('Biography & facts').first().click();
  await introField().waitFor({ timeout: 30000 });
  const persistedValue = await introField().inputValue();
  check('Reopened entry shows the saved edit (persistence)', persistedValue.includes(marker), `value: "${persistedValue.slice(0, 60)}"`);
  const restoredFilled = await fillStable(originalLede);
  check('Restore edit sticks in the form', restoredFilled);
  const restored = await saveAndAwait(originalLede, marker);
  const afterRestore = await readAbout();
  check('Restore save brings the file back to original', restored && !afterRestore.includes(marker));
  check('content/about.json is byte-identical to before the test', afterRestore === originalRaw);

  /* 5. Other collections open with expected fields (fresh session again) */
  await freshLoad();
  await page.getByText('Releases', { exact: true }).first().click();
  await page.getByText('First release — title pending').first().click();
  // Publish only appears on modified entries; wait for the form itself instead.
  await page.getByLabel('Title', { exact: true }).first().waitFor({ timeout: 30000 });
  const releaseFields = {
    title: await page.getByLabel('Title', { exact: true }).count(),
    artwork: await page.getByRole('button', { name: /Choose different image/i }).count(),
    description: await page.getByLabel('Description', { exact: true }).count(),
  };
  check(
    'Releases form opens (title/artwork/description widgets)',
    releaseFields.title > 0 && releaseFields.description > 0 && releaseFields.artwork > 0,
    JSON.stringify(releaseFields),
  );
  await page.screenshot({ path: new URL('admin-4-release-form.png', ARTIFACTS).pathname });

  // The editor view hides the sidebar — reload to reach other collections.
  await freshLoad();
  await page.getByText('Site & social links').first().click();
  await page.getByText('Artist info, contact & socials').first().click();
  await page.getByLabel('Artist name', { exact: true }).first().waitFor({ timeout: 30000 });
  const artistName = await page.getByLabel('Artist name', { exact: true }).first().inputValue();
  check('Site form opens with artist name field', artistName === 'Sirius HIM');
  await page.screenshot({ path: new URL('admin-5-site-form.png', ARTIFACTS).pathname });

  await freshLoad();
  await page.getByText('Videos', { exact: true }).first().click();
  await page.getByText('Music videos & shorts').first().click();
  await page.getByText('Music videos (16:9 embeds)').first().waitFor({ timeout: 30000 });
  // List rows start collapsed — expand the first to reveal its YouTube ID field.
  const expander = page.getByRole('button', { name: /^Expand$/i }).first();
  if ((await expander.count()) > 0) await expander.click({ timeout: 10000 }).catch(() => {});
  const ytField = page.getByLabel('YouTube ID', { exact: false }).first(); // label renders as "YouTube ID (Optional)"
  await ytField.waitFor({ timeout: 15000 });
  check('Videos form opens with YouTube fields', true);
  await page.screenshot({ path: new URL('admin-6-videos-form.png', ARTIFACTS).pathname });

  const fatal = consoleErrors.filter((e) => !/favicon|Download the React DevTools/i.test(e));
  check('No console/page errors during the run', fatal.length === 0, fatal.slice(0, 3).join(' | '));
} catch (error) {
  check(`Test run completed: ${error.message.split('\n')[0]}`, false);
  console.log('--- full error ---\n' + String(error.message).slice(0, 1500));
  await page.screenshot({ path: new URL('admin-failure.png', ARTIFACTS).pathname }).catch((e) => console.log('screenshot failed:', e.message.split('\n')[0]));
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
