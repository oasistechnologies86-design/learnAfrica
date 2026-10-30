// Runtime check for the sanitizer fix: feed the previously-bypassing payloads
// through the real function in a real browser DOM and assert no active content
// survives, while ordinary formatting is preserved.
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/lib/sanitizeHtml.js', import.meta.url), 'utf8');

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium',
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();

const results = await page.evaluate((moduleSrc) => {
  const blob = new Blob([moduleSrc], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  return import(url).then(({ sanitizeHtml }) => {
    const bypass = [
      '<a href="javascript:alert(1)">x</a>',
      '<a href="java\tscript:alert(1)">x</a>',
      '<a href="java\nscript:alert(1)">x</a>',
      '<a href="&#106;avascript:alert(1)">x</a>',
      '<a href="&#x6a;avascript:alert(1)">x</a>',
      '<a href="jav&#x09;ascript:alert(1)">x</a>',
      '<a href="data:text/html,<script>alert(1)</script>">x</a>',
      '<a href="data:image/svg+xml;base64,PHN2Zz4=">x</a>',
      '<img src=x onerror=alert(1)>',
      '<svg><script>alert(1)</script></svg>',
      '<iframe src="javascript:alert(1)"></iframe>',
      '<a href="vbscript:msgbox(1)">x</a>',
    ];
    const legit = [
      '<p>Hello <strong>world</strong></p>',
      '<a href="https://example.com" title="e">link</a>',
      '<img src="https://cdn.example.com/a.png" alt="pic">',
      '<p>2 &lt; 3 &amp; 4 &gt; 1</p>',
    ];
    const danger = /javascript|vbscript|onerror|on\w+\s*=|data:|<script|<iframe|<svg/i;
    return {
      bypass: bypass.map((p) => ({ in: p, out: sanitizeHtml(p), bad: danger.test(sanitizeHtml(p)) })),
      legit: legit.map((p) => ({ in: p, out: sanitizeHtml(p) })),
    };
  });
}, src);

let fails = 0;
for (const r of results.bypass) {
  const ok = !r.bad;
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'} - ${JSON.stringify(r.in)} -> ${JSON.stringify(r.out)}`);
}
console.log('--- legit preserved ---');
for (const r of results.legit) {
  console.log(`   ${JSON.stringify(r.in)} -> ${JSON.stringify(r.out)}`);
}
console.log(fails === 0 ? 'ALL SANITIZER CHECKS PASSED' : `${fails} SANITIZER CHECK(S) FAILED`);
await browser.close();
process.exit(fails === 0 ? 0 : 1);
