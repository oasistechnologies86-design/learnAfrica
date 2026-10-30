import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath: '/usr/bin/chromium', headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage();
await page.setViewport({ width: 1024, height: 768 });
await page.goto('http://localhost:12002/', { waitUntil: 'networkidle0' });
await page.evaluate(() => { const h = [...document.querySelectorAll('h2')].find((x) => /4 simple steps/i.test(x.textContent)); if (h) h.scrollIntoView({ block: 'center' }); });
await new Promise((r) => setTimeout(r, 500));
const wide = await page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const out = [];
  document.querySelectorAll('*').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && (r.right > vw + 1 || r.left < -1)) {
      out.push({ tag: el.tagName, cls: (el.className || '').toString().slice(0, 90), left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width) });
    }
  });
  return { vw, out: out.slice(0, 25) };
});
console.log(JSON.stringify(wide, null, 2));
await browser.close();
