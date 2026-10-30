import puppeteer from 'puppeteer-core';
const B = 'http://localhost:12012';
const br = await puppeteer.launch({
  executablePath: '/usr/bin/chromium', headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage',
    '--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4'],
});
const shot = async (path, file, { w = 1280, h = 900, hover = false, scroll = null } = {}) => {
  const pg = await br.newPage();
  await pg.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
  await pg.goto(B + path, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 800));
  if (scroll) {
    await pg.evaluate((t) => { const el = [...document.querySelectorAll('h2')].find((e) => e.innerText.includes(t)); el?.scrollIntoView({ block: 'center' }); }, scroll);
    await new Promise((r) => setTimeout(r, 500));
  }
  if (hover) {
    const box = await pg.evaluate(() => {
      const e = [...document.querySelectorAll('div')].find((x) => (x.innerText || '').trim() === 'Toggle Theme' && x.offsetParent !== null);
      const r = e.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    await pg.mouse.move(box.x, box.y);
    await new Promise((r) => setTimeout(r, 400));
  }
  await pg.screenshot({ path: file });
  await pg.close();
  console.log('saved', file);
};
await shot('/login', '/tmp/n_login.png');
await shot('/signup', '/tmp/n_signup.png');
await shot('/login', '/tmp/n_hover.png', { hover: true });
await shot('/', '/tmp/n_hiw1.png', { scroll: '4 simple steps' });
// step 2: click next then shot
{
  const pg = await br.newPage();
  await pg.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
  await pg.goto(B + '/', { waitUntil: 'networkidle2' });
  await pg.evaluate(() => { const el = [...document.querySelectorAll('h2')].find((e) => e.innerText.includes('4 simple steps')); el?.scrollIntoView({ block: 'center' }); });
  await new Promise((r) => setTimeout(r, 700));
  await pg.evaluate(() => [...document.querySelectorAll('button')].find((b) => (b.innerText || '').trim().startsWith('Next step'))?.click());
  await new Promise((r) => setTimeout(r, 900));
  await pg.screenshot({ path: '/tmp/n_hiw2.png' });
  await pg.close();
  console.log('saved /tmp/n_hiw2.png');
}
await br.close();
