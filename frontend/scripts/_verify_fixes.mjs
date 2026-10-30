import puppeteer from 'puppeteer-core';
const B = process.env.BASE || 'http://localhost:12009';
const br = await puppeteer.launch({ executablePath: '/usr/bin/chromium', headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
let f = 0;
const c = (n, ok, e = '') => { console.log(`${ok ? 'PASS' : 'FAIL'} - ${n}${e ? ` [${e}]` : ''}`); if (!ok) f++; };

async function open(path, vp) {
  const p = await br.newPage();
  await p.setViewport(vp);
  const errs = [];
  p.on('pageerror', (e) => errs.push('' + e));
  await p.goto(B + path, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 700));
  return { p, errs };
}
const phone = { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
const desk = { width: 1280, height: 900 };

// --- LOGIN phone ---
{
  const { p, errs } = await open('/login', phone);
  const d = await p.evaluate(() => ({
    logos: document.querySelectorAll('img[alt="LearnAfrica"]').length,
    back: [...document.querySelectorAll('a')].filter((a) => /home/i.test(a.innerText)).length,
    sidePanel: !!document.querySelector('.hidden.lg\\:flex.lg\\:w-\\[45\\%\\]'),
    google: [...document.querySelectorAll('button,div')].some((b) => /Google/.test(b.innerText || '')),
    apple: /Apple/.test(document.body.innerText),
    docH: document.documentElement.scrollHeight,
    vh: window.innerHeight,
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    panelH: Math.round((document.querySelector('.brand-panel')?.getBoundingClientRect().height) || 0),
  }));
  c('login phone: single logo', d.logos === 1, `logos=${d.logos}`);
  c('login phone: single back button', d.back === 1, `back=${d.back}`);
  c('login phone: no AuthLayout side panel', !d.sidePanel);
  c('login phone: Google present', d.google);
  c('login phone: Apple removed', !d.apple);
  c('login phone: no dead-space overflow', d.docH <= d.vh + 4, `docH=${d.docH} vh=${d.vh}`);
  c('login phone: no sideways scroll', !d.overflow);
  c('login phone: green panel visible', d.panelH > 80, `panelH=${d.panelH}`);
  c('login phone: no page errors', errs.length === 0, errs[0] || '');
  await p.close();
}

// --- LOGIN desktop ---
{
  const { p, errs } = await open('/login', desk);
  const d = await p.evaluate(() => ({
    back: [...document.querySelectorAll('a')].filter((a) => /home/i.test(a.innerText)).length,
    sidePanel: !!document.querySelector('.hidden.lg\\:flex.lg\\:w-\\[45\\%\\]'),
    splitCard: !!document.querySelector('.split-card'),
    apple: /Apple/.test(document.body.innerText),
  }));
  c('login desktop: single back button', d.back === 1, `back=${d.back}`);
  c('login desktop: no duplicate side panel', !d.sidePanel);
  c('login desktop: split card renders', d.splitCard);
  c('login desktop: Apple removed', !d.apple);
  c('login desktop: no page errors', errs.length === 0);
  await p.close();
}

// --- SIGNUP phone role picker ---
{
  const { p, errs } = await open('/signup', phone);
  const d = await p.evaluate(() => {
    const btns = [...document.querySelectorAll('button')].filter((b) => /Join as a/.test(b.innerText));
    return {
      cards: btns.length,
      hasHighlights: btns.some((b) => /Browse and enroll|Earn verifiable certificates|Get paid for your teaching/.test(b.innerText)),
      hasBigCta: btns.some((b) => /Continue as Student|Continue as Instructor/.test(b.innerText)),
      hasContinue: btns.every((b) => /Continue/.test(b.innerText)),
      docH: document.documentElement.scrollHeight,
      vh: window.innerHeight,
      err: null,
    };
  });
  c('signup: two role cards', d.cards === 2, `cards=${d.cards}`);
  c('signup: checkmark highlights removed', !d.hasHighlights);
  c('signup: big CTA buttons removed', !d.hasBigCta);
  c('signup: compact Continue affordance present', d.hasContinue);
  c('signup: fits better on phone', d.docH <= 1000, `docH=${d.docH}`);
  c('signup: no page errors', errs.length === 0, errs[0] || '');
  await p.close();
}

await br.close();
console.log(f === 0 ? 'ALL AUTH CHECKS PASSED' : `${f} FAILED`);
process.exit(f ? 1 : 0);
