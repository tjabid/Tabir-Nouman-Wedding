const { chromium } = require('playwright');
const URL = process.env.URL || 'http://localhost:8765/index.html';
const FPS = 30, DT = 1000 / FPS;
(async () => {
  const browser = await chromium.launch();
  const warm = await browser.newContext(); const wp = await warm.newPage();
  await wp.goto(URL, { waitUntil: 'networkidle' }); await warm.close();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const page = await ctx.newPage();
  await page.clock.install();
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '.countdown{display:none!important}' });
  await page.evaluate(() => document.fonts.ready);
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 20));
  await page.evaluate(() => {
    const seen = new WeakMap();
    window.__sync = now => { for (const a of document.getAnimations()) { if (!seen.has(a)) seen.set(a, now); a.pause(); a.currentTime = now - seen.get(a); } };
  });
  const ease = t => t < .5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2;
  const topOf = sel => page.evaluate(s => { const e = document.querySelector(s); return Math.max(0, e.getBoundingClientRect().top + scrollY - 24); }, sel);
  const maxY = () => page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  // timeline: [startMs, kind, arg]
  const plan = [[3800, 'click']];
  let t = 7600;
  for (const sel of ['#invitation', '.event', '#directions', '#rsvp', 'END']) { plan.push([t, 'glide', sel, sel === 'END' ? 2000 : 2200]); t += sel === 'END' ? 2000 + 3500 : 2200 + 2800; }
  const total = t;
  let frame = 0, glide = null, now = 0;
  while (now <= total) {
    for (const p of plan) if (!p.done && now >= p[0]) {
      p.done = true;
      if (p[1] === 'click') await page.evaluate(() => document.getElementById('openBtn').click());
      else { const from = await page.evaluate(() => scrollY); const to = p[2] === 'END' ? await maxY() : await topOf(p[2]); glide = { s: now, d: p[3], from, to }; }
    }
    if (glide) { const k = Math.min(1, (now - glide.s) / glide.d); await page.evaluate(y => scrollTo(0, y), glide.from + (glide.to - glide.from) * ease(k)); if (k >= 1) glide = null; }
    await page.evaluate(n => __sync(n), now);
    await page.screenshot({ path: `fr/${String(frame++).padStart(5, '0')}.png` });
    await page.clock.runFor(DT);
    now += DT;
  }
  console.log('frames', frame);
  await browser.close();
})();
