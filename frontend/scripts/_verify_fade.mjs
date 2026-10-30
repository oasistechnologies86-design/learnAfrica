/**
 * Verifies the fade-only behaviour:
 *  - auth card: panel fixed left, form fixed right, both present on login AND
 *    signup (the old bug hid the panel on login)
 *  - switching only changes opacity (no transform movement)
 *  - how-it-works: panel stays put across steps (no sliding), content changes
 *  - theme toggle hover changes colors
 */
import puppeteer from 'puppeteer-core';
const B = 'http://localhost:12012';
const br = await puppeteer.launch({
  executablePath: '/usr/bin/chromium',
  headless: 'new',
  args: [
    '--no-sandbox', '--disable-dev-shm-usage',
    // advertise a real mouse so Tailwind's @media (hover:hover) utilities apply
    '--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4',
  ],
});
let fails = 0;
const check = (n, ok, x = '') => { console.log(`${ok ? 'PASS' : 'FAIL'} - ${n}${x ? ` [${x}]` : ''}`); if (!ok) fails++; };

const rect = (pg, sel) => pg.evaluate((s) => {
  const e = document.querySelector(s);
  if (!e) return null;
  const r = e.getBoundingClientRect();
  return { l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top), b: Math.round(r.bottom) };
}, sel);

// ---- auth card, desktop ----
for (const path of ['/login', '/signup']) {
  const pg = await br.newPage();
  await pg.setViewport({ width: 1280, height: 900 });
  await pg.goto(B + path, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 700));
  const panel = await rect(pg, '.brand-panel');
  const form = await pg.evaluate(() => {
    const d = [...document.querySelectorAll('div')].find((e) => e.className.includes('right-0') && e.className.includes('w-1/2') && e.className.includes('z-20'));
    if (!d) return null;
    const r = d.getBoundingClientRect();
    return { l: Math.round(r.left), r: Math.round(r.right) };
  });
  check(`${path}: green panel visible`, !!panel && panel.r > panel.l);
  check(`${path}: panel on left`, panel && panel.l < 320, panel && `${panel.l}..${panel.r}`);
  check(`${path}: form on right`, form && form.l >= 600, form && `${form.l}..${form.r}`);
  check(`${path}: panel and form do not overlap`, panel && form && panel.r <= form.l + 1, `${panel?.r} vs ${form?.l}`);
  await pg.close();
}

// ---- switching fades only (panel position unchanged, opacity animates) ----
{
  const pg = await br.newPage();
  await pg.setViewport({ width: 1280, height: 900 });
  await pg.goto(B + '/login', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 700));
  const before = await rect(pg, '.brand-panel');
  await pg.evaluate(() => [...document.querySelectorAll('button')].find((b) => (b.innerText || '').includes('Create account'))?.click());
  await new Promise((r) => setTimeout(r, 60));
  const mid = await pg.evaluate(() => {
    const el = document.querySelector('.fade-in-soft');
    const panel = document.querySelector('.brand-panel');
    const cs = el ? getComputedStyle(el) : null;
    return { hasFade: !!el, opacity: cs ? +cs.opacity : null, anim: cs ? cs.animationName : null, transform: getComputedStyle(panel).transform };
  });
  await new Promise((r) => setTimeout(r, 500));
  const after = await rect(pg, '.brand-panel');
  check('switch: panel does not move', before.l === after.l && before.r === after.r, `${before.l}->${after.l}`);
  check('switch: content uses fade', mid.hasFade && mid.anim === 'fade-in-soft', `anim=${mid.anim} opacity=${mid.opacity}`);
  check('switch: no transform on panel', mid.transform === 'none' || mid.transform === 'matrix(1, 0, 0, 1, 0, 0)', mid.transform);
  check('switch: url changed to signup', pg.url().includes('/signup'));
  await pg.close();
}

// ---- how it works: panel fixed across steps ----
{
  const pg = await br.newPage();
  await pg.setViewport({ width: 1280, height: 900 });
  await pg.goto(B + '/', { waitUntil: 'networkidle2' });
  await pg.evaluate(() => document.querySelector('#root')?.scrollIntoView());
  await pg.evaluate(() => { const h = [...document.querySelectorAll('h2')].find((e) => e.innerText.includes('4 simple steps')); h?.scrollIntoView({ block: 'center' }); });
  await new Promise((r) => setTimeout(r, 800));
  const card = await pg.evaluate(() => {
    const el = [...document.querySelectorAll('div')].find((e) => e.className.includes('h-[520px]'));
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { l: Math.round(r.left), r: Math.round(r.right) };
  });
  if (!card) { check('hiw: desktop card found', false); }
  else {
    const p1 = await pg.evaluate(() => { const el = [...document.querySelectorAll('div')].find((e) => e.className.includes('right-0') && e.className.includes('w-1/2') && e.className.includes('z-10')); const r = el?.getBoundingClientRect(); return r ? Math.round(r.left) : null; });
    await pg.evaluate(() => [...document.querySelectorAll('button')].find((b) => (b.innerText || '').trim().startsWith('Next step'))?.click());
    await new Promise((r) => setTimeout(r, 60));
    const midAnim = await pg.evaluate(() => getComputedStyle(document.querySelector('.fade-in-soft') || document.body).animationName);
    await new Promise((r) => setTimeout(r, 500));
    const p2 = await pg.evaluate(() => { const el = [...document.querySelectorAll('div')].find((e) => e.className.includes('right-0') && e.className.includes('w-1/2') && e.className.includes('z-10')); const r = el?.getBoundingClientRect(); return r ? Math.round(r.left) : null; });
    check('hiw: panel stays on the right', p1 === p2 && p1 !== null, `${p1} -> ${p2}`);
    check('hiw: uses fade', midAnim === 'fade-in-soft', midAnim);
    const stepTxt = await pg.evaluate(() => document.body.innerText.match(/Step \d of 4/)?.[0]);
    check('hiw: step advanced', stepTxt === 'Step 2 of 4', stepTxt);
  }
  await pg.close();
}

// ---- theme toggle hover colors ----
{
  const pg = await br.newPage();
  await pg.setViewport({ width: 1280, height: 900 });
  await pg.goto(B + '/', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 500));
  const box = await pg.evaluate(() => {
    const els = [...document.querySelectorAll('div')].filter((e) => (e.innerText || '').trim() === 'Toggle Theme' && e.offsetParent !== null);
    const el = els[0];
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, n: els.length, tag: el.tagName };
  });
  const read = () => pg.evaluate(() => {
    const el = [...document.querySelectorAll('div')].find((e) => (e.innerText || '').trim() === 'Toggle Theme' && e.offsetParent !== null);
    const cs = getComputedStyle(el);
    const span = el.querySelector('span');
    return { bg: cs.backgroundColor, border: cs.borderColor, text: getComputedStyle(span).color };
  });
  const before = await read();
  if (box) { await pg.mouse.move(box.x, box.y); await new Promise((r) => setTimeout(r, 400)); }
  const after = await read();
  console.log('toggle before:', JSON.stringify(before));
  console.log('toggle hover :', JSON.stringify(after));
  check('toggle: hover changes background', before.bg !== after.bg, `${before.bg} -> ${after.bg}`);
  check('toggle: hover changes border', before.border !== after.border, `${before.border} -> ${after.border}`);
  check('toggle: hover changes text color', before.text !== after.text, `${before.text} -> ${after.text}`);
  await pg.close();
}

console.log(fails === 0 ? '\nALL CHECKS PASSED' : `\n${fails} FAILURES`);
await br.close();
process.exit(fails === 0 ? 0 : 1);
