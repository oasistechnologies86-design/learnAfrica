/**
 * Verifies this task's fixes:
 *  1. mobile green banner fits (nothing clipped)
 *  2. no logo/wordmark inside the auth card
 *  3. "Toggle Theme" wording present everywhere
 *  4. honest placeholders (no value-like text)
 *  5. no sideways scroll / no page overflow on phones
 *  6. desktop split card still intact
 */
import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE || 'http://localhost:12011';
const PHONES = [
  { name: 'small-phone', w: 360, h: 740 },
  { name: 'big-phone', w: 414, h: 896 },
];
const THEMES = ['light', 'dark'];
let fails = 0;
const check = (n, ok, x = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} - ${n}${x ? ` [${x}]` : ''}`);
  if (!ok) fails++;
};
const br = await puppeteer.launch({
  executablePath: '/usr/bin/chromium',
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const setTheme = async (p, t) => {
  await p.evaluate((th) => localStorage.setItem('theme', th), t);
  await p.reload({ waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 400));
};

for (const theme of THEMES) {
  for (const ph of PHONES) {
    for (const path of ['/login', '/signup']) {
      const p = await br.newPage();
      await p.setViewport({ width: ph.w, height: ph.h, isMobile: true, hasTouch: true });
      await p.goto(BASE + path, { waitUntil: 'networkidle2', timeout: 30000 });
      await setTheme(p, theme);
      const d = await p.evaluate(() => {
        const panel = document.querySelector('.brand-panel');
        const pr = panel.getBoundingClientRect();
        const kids = [...panel.querySelectorAll('p,h2,button,span')].filter((e) => (e.innerText || '').trim());
        const lastBottom = Math.max(...kids.map((e) => e.getBoundingClientRect().bottom));
        const firstTop = Math.min(...kids.map((e) => e.getBoundingClientRect().top));
        const toggle = [...document.querySelectorAll('span')].find((e) => (e.innerText || '').trim() === 'Toggle Theme');
        return {
          clipped: lastBottom > pr.bottom + 1 || firstTop < pr.top - 1,
          lastBottom: Math.round(lastBottom),
          panelBottom: Math.round(pr.bottom),
          firstTop: Math.round(firstTop),
          panelTop: Math.round(pr.top),
          logosInCard: [...document.querySelectorAll('img[alt="LearnAfrica"]')].filter((i) => i.closest('.max-w-md')).length,
          toggleText: !!toggle && toggle.offsetParent !== null,
          docH: document.documentElement.scrollHeight,
          vh: window.innerHeight,
          hOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        };
      });
      const tag = `${theme}/${ph.name}${path}`;
      check(`${tag}: banner text not clipped`, !d.clipped, `${d.firstTop}..${d.lastBottom} in ${d.panelTop}..${d.panelBottom}`);
      check(`${tag}: no logo inside card`, d.logosInCard === 0, `found ${d.logosInCard}`);
      check(`${tag}: "Toggle Theme" words visible`, d.toggleText);
      check(`${tag}: no sideways scroll`, !d.hOverflow);
      // A long sign-up form may scroll vertically on a very small phone; only the
      // compact login view is expected to fit a single screen.
      if (path === '/login') check(`${tag}: page fits phone height`, d.docH <= d.vh + 4, `${d.docH} vs ${d.vh}`);
      await p.close();
    }
  }
}

// placeholders
const p = await br.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true });
for (const [path, want] of [
  ['/login', ['Enter your email address', 'Enter your password']],
  ['/signup', ['Enter your full name', 'Enter your email address', 'Create a password', 'Confirm your password']],
]) {
  await p.goto(BASE + path, { waitUntil: 'networkidle2' });
  if (path === '/signup') {
    // signup opens on the role picker; choose Student to reach the form
    await p.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => (b.innerText || '').includes('Join as a Student'));
      btn?.click();
    });
    await new Promise((r) => setTimeout(r, 600));
  }
  const got = await p.evaluate(() => [...document.querySelectorAll('input')].map((i) => i.placeholder).filter(Boolean));
  check(`${path}: honest placeholders`, want.every((w) => got.includes(w)), got.join(' | '));
}
await p.close();

// desktop intact
const d = await br.newPage();
await d.setViewport({ width: 1280, height: 900 });
await d.goto(BASE + '/login', { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 500));
const desk = await d.evaluate(() => {
  const card = document.querySelector('.brand-panel')?.closest('.rounded-\\[20px\\]');
  const panel = document.querySelector('.brand-panel');
  return { hasSplit: !!card, h: card ? Math.round(card.getBoundingClientRect().height) : 0, hasPanel: !!panel };
});
check('desktop: split card present', desk.hasSplit && desk.hasPanel, `h=${desk.h}`);
await d.close();

console.log(fails === 0 ? '\nALL CHECKS PASSED' : `\n${fails} FAILURES`);
await br.close();
process.exit(fails === 0 ? 0 : 1);
