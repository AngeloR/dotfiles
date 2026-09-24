// Template: a scripted, self-narrating Playwright recording. Copy, fill CONFIG, write BEATS.
// Run:  RECORD=1 node record-demo.cjs        (RECORD=0 = dry run, no video, same logic)
// Requires playwright-core + a Chromium build. No screen recorder, no post-production except cut-idle.sh.
'use strict';
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

// ---------------------------------------------------------------- CONFIG (edit)
const CONFIG = {
  playwrightCore: process.env.PLAYWRIGHT_CORE || '/home/ubuntu/.nvm/versions/node/v24.18.1/lib/node_modules/@playwright/cli/node_modules/playwright-core',
  chrome: process.env.CHROME || '/home/ubuntu/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  outDir: process.env.OUT_DIR || path.join(process.cwd(), 'demo-out'),
  videoName: process.env.VIDEO_NAME || 'demo.webm',
  storageState: process.env.STORAGE_STATE || null, // saved authenticated session, or null
  startUrl: process.env.START_URL || 'https://example.test/',
  viewport: { width: 1440, height: 900 },
  timezoneId: process.env.TIME_ZONE || 'America/Chicago',
  locale: 'en-US',
  chromeArgs: ['--no-sandbox', '--ignore-certificate-errors'],
  record: process.env.RECORD !== '0',
  readPauseMs: 3500, // how long a caption stays before the next action
};
const { chromium } = require(CONFIG.playwrightCore);
fs.mkdirSync(CONFIG.outDir, { recursive: true });

// ---------------------------------------------------------------- helpers (keep)
const timeline = [];
const counters = { substitutions: {} };
const log = (...a) => { const s = `[${new Date().toISOString()}] ${a.join(' ')}`; console.log(s); fs.appendFileSync(path.join(CONFIG.outDir, 'live.log'), s + '\n'); };
const mark = (step, detail = '') => { timeline.push({ at: new Date().toISOString(), step, detail }); log('STEP', step, detail && `— ${detail}`); };
const fp = (v) => (v ? crypto.createHash('sha256').update(String(v)).digest('hex').slice(0, 8) : 'none');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CAPTION_CSS = `
#demo-caption { position: fixed; left: 50%; bottom: 22px; transform: translateX(-50%); width: 1180px; max-width: calc(100vw - 40px);
  z-index: 2147483647; background: rgba(16,24,32,.92); color: #fff; padding: 14px 18px 12px; border-radius: 10px;
  font: 14px/1.4 system-ui, sans-serif; box-shadow: 0 6px 24px rgba(0,0,0,.35); pointer-events: none; }
#demo-caption b  { display: block; font-size: 17px; margin-bottom: 4px; color: #ffd166; }
#demo-caption i  { display: block; margin-top: 6px; font-size: 12.5px; color: #9fb3c8; font-style: normal; }
#demo-caption em { position: absolute; right: 18px; top: 12px; font-size: 12px; color: #9fb3c8; font-style: normal; }`;

let browser; let ctx; let page; let shotN = 0;

/** Caption overlay in the TOP document: title (yellow), text, optional small note, UTC clock. Never throws. */
const caption = async (title, text = '', note = '') => {
  log('caption:', title);
  await page.evaluate(({ title, text, note, css, clock }) => {
    if (!document.getElementById('demo-caption-css')) { const s = document.createElement('style'); s.id = 'demo-caption-css'; s.textContent = css; document.head.appendChild(s); }
    let el = document.getElementById('demo-caption');
    if (!el) { el = document.createElement('div'); el.id = 'demo-caption'; document.body.appendChild(el); }
    el.innerHTML = '';
    const b = document.createElement('b'); b.textContent = title;
    const sp = document.createElement('span'); sp.textContent = text;
    const em = document.createElement('em'); em.textContent = clock;
    el.append(em, b, sp);
    if (note) { const i = document.createElement('i'); i.textContent = note; el.append(i); }
  }, { title, text, note, css: CAPTION_CSS, clock: new Date().toISOString().slice(11, 19) + ' UTC' }).catch((e) => log('caption failed', e.message));
};
/** Caption, let the viewer read it, then take the still. */
const beatCaption = async (label, title, text, note) => { await caption(title, text, note); await sleep(CONFIG.readPauseMs); await shot(label); };
/** Numbered PNG of the whole viewport. */
const shot = async (label) => { shotN += 1; const f = path.join(CONFIG.outDir, `${String(shotN).padStart(2, '0')}-${label}.png`); await page.screenshot({ path: f }).catch((e) => log('shot failed', e.message)); log('shot', path.basename(f)); };
/** Human typing: clear, then one keystroke per ~80 ms. */
const typeSlow = async (locator, value, delay = 80) => { await locator.fill(''); await locator.pressSequentially(String(value), { delay }); await sleep(300); };
/** Wait for the next screen by its data-testid (on a frame or the page). */
const waitTestId = (scope, id, timeout = 30000) => scope.locator(`[data-testid="${id}"]`).waitFor({ timeout });
/** Click with a settle pause so the viewer sees the transition. */
const click = async (locator, settle = 450) => { await locator.click(); await sleep(settle); };
/**
 * Substitute ONE missing dependency at the network layer. `pattern` matches the URL; `responder(route)` must fulfill.
 * Every hit is counted into result.json — disclose the substitution in a caption and the README.
 */
const substitute = async (name, pattern, responder) => {
  counters.substitutions[name] = 0;
  await ctx.route((u) => pattern.test(u.href), async (route) => { counters.substitutions[name] += 1; log(`substitution "${name}" hit #${counters.substitutions[name]}`); await responder(route); });
};
/** Poll until `predicate()` is truthy, refreshing a countdown caption every `every` ms. */
const waitFor = async (predicate, { title, text, timeoutMs = 300000, every = 5000 } = {}) => {
  const start = Date.now(); let last = 0;
  while (Date.now() - start < timeoutMs) {
    if (await predicate()) return true;
    if (title && Date.now() - last > every) { last = Date.now(); await caption(title, `${text || ''} (${Math.round((Date.now() - start) / 1000)} s)`); }
    await sleep(1000);
  }
  throw new Error(`timed out waiting: ${title || 'predicate'}`);
};

// ---------------------------------------------------------------- BEATS (write your story here)
// Each beat: caption → read pause → still → actions → wait for the next screen → mark.
const BEATS = [
  async function beat1_open() {
    await page.goto(CONFIG.startUrl, { waitUntil: 'domcontentloaded' }); await sleep(2000);
    await beatCaption('open', 'Title of the demo', 'One sentence on what the viewer is looking at.');
    mark('open', CONFIG.startUrl);
  },
  // async function beat2_something() {
  //   await click(page.getByRole('button', { name: 'Start' }));
  //   await waitTestId(page, 'next-screen');
  //   await beatCaption('next-screen', 'What just happened', 'Why it matters.', 'Note: what is real vs staged.');
  //   mark('next-screen');
  // },
];

// ---------------------------------------------------------------- run
(async () => {
  browser = await chromium.launch({ executablePath: CONFIG.chrome, headless: true, args: CONFIG.chromeArgs });
  ctx = await browser.newContext({
    ...(CONFIG.storageState ? { storageState: CONFIG.storageState } : {}),
    viewport: CONFIG.viewport, timezoneId: CONFIG.timezoneId, locale: CONFIG.locale,
    ...(CONFIG.record ? { recordVideo: { dir: path.join(CONFIG.outDir, '.video'), size: CONFIG.viewport } } : {}),
  });
  page = await ctx.newPage();
  mark('start', `record=${CONFIG.record} tz=${CONFIG.timezoneId}`);
  try {
    for (const beat of BEATS) await beat();
    mark('end');
  } finally {
    const video = page.video();
    await ctx.close();
    if (video) { const p = await video.path(); const dest = path.join(CONFIG.outDir, timeline.some((t) => t.step === 'end') ? CONFIG.videoName : CONFIG.videoName.replace(/\.webm$/, '.FAILED.webm')); fs.renameSync(p, dest); log('video', dest); }
    await browser.close();
    fs.writeFileSync(path.join(CONFIG.outDir, 'timeline.json'), JSON.stringify(timeline, null, 2));
    fs.writeFileSync(path.join(CONFIG.outDir, 'result.json'), JSON.stringify({ config: { ...CONFIG, storageState: CONFIG.storageState ? '(set)' : null }, counters, stills: shotN }, null, 2));
  }
})().catch((e) => { log('ERROR', e.stack || e); process.exit(1); });

module.exports = { fp }; // fp is handy for logging credentials as fingerprints in profiles
