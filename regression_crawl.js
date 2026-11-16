// Smoke crawl: every account, every tab and sub-tab, both themes, two widths.
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const sleep = ms => new Promise(r=>setTimeout(r,ms));
(async () => {
  const b = await chromium.launch(); const out = [];
  const pages = ['test.html','test_tb.html','zz_tb101.html','test_wdp.html','test_mech.html','test_pf.html','test_plant.html','test_petreco.html','test_hist.html','test_empty.html','test_stray.html','test_viewer.html'];
  const fs = require('fs');
  for (const f of pages) { if(!fs.existsSync(f)) { out.push('skip ' + f); continue; }
   for (const theme of ['light','dark']) for (const w of [360, 1280]) {
    const ctx = await b.newContext({ viewport:{width:w,height:800}, serviceWorkers:'block', timezoneId:'Africa/Cairo' });
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if(m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0,160)); });
    p.on('dialog', d => d.dismiss());
    await p.addInitScript(t => localStorage.setItem('rasgara_theme', t), theme);
    await p.goto('http://localhost:8801/' + f); await sleep(900);
    const tabs = await p.evaluate(() => [...document.querySelectorAll('#appTabs button')].filter(x => x.offsetParent).map(x => x.getAttribute('data-tab')));
    for (const t of (tabs.length ? tabs : [null])) {
      if(t){ await p.evaluate(t => document.querySelector('#appTabs button[data-tab="' + t + '"]').click(), t); await sleep(350); }
      const subs = await p.evaluate(() => [...document.querySelectorAll('#tbSubTabs button, .rg-subtabs button, [data-sub]')].filter(x => x.offsetParent && x.getAttribute('data-sub')).map(x => x.getAttribute('data-sub')));
      for (const s of [...new Set(subs)]) {
        await p.evaluate(s => { const el = [...document.querySelectorAll('[data-sub="' + s + '"]')].find(x => x.offsetParent); if(el) el.click(); }, s); await sleep(300);
        for (const d of ['2026-08-19', null]) {
          if(d) await p.evaluate(d => { try { window.__TB__ && window.__TB__.setDate(d); } catch(e){} }, d); await sleep(150);
          const o = await p.evaluate(() => ({ ov:document.documentElement.scrollWidth - window.innerWidth, nan:/NaN|undefined|\[object Object\]/.test(document.body.innerText) ? (document.body.innerText.match(/.{0,40}(NaN|undefined|\[object Object\]).{0,30}/) || [''])[0] : '' }));
          if(o.ov > 1) errs.push('OVERFLOW ' + o.ov + 'px at ' + t + '/' + s);
          if(o.nan) errs.push('BADTEXT at ' + t + '/' + s + ': ' + o.nan.replace(/\s+/g,' '));
        }
        // panel tabs inside
        const pt = await p.evaluate(() => [...document.querySelectorAll('.ptabs button, .h2tabs button')].filter(x => x.offsetParent).length);
        for (let i = 0; i < pt; i++) { await p.evaluate(i => { const x = [...document.querySelectorAll('.ptabs button, .h2tabs button')].filter(x => x.offsetParent)[i]; if(x) x.click(); }, i); await sleep(60); }
      }
      if(!subs.length){
        const o = await p.evaluate(() => ({ ov:document.documentElement.scrollWidth - window.innerWidth, nan:/NaN|undefined|\[object Object\]/.test(document.body.innerText) }));
        if(o.ov > 1) errs.push('OVERFLOW ' + o.ov + 'px at ' + t); if(o.nan) errs.push('BADTEXT at ' + t);
        const pt = await p.evaluate(() => [...document.querySelectorAll('.ptabs button, .h2tabs button')].filter(x => x.offsetParent).length);
        for (let i = 0; i < pt; i++) { await p.evaluate(i => { const x = [...document.querySelectorAll('.ptabs button, .h2tabs button')].filter(x => x.offsetParent)[i]; if(x) x.click(); }, i); await sleep(60); }
        const o2 = await p.evaluate(() => /NaN|undefined|\[object Object\]/.test(document.body.innerText) ? (document.body.innerText.match(/.{0,40}(NaN|undefined|\[object Object\]).{0,30}/) || [''])[0] : '');
        if(o2) errs.push('BADTEXT panel tabs at ' + t + ': ' + o2.replace(/\s+/g,' '));
      }
    }
    const den = await p.evaluate(() => (window.__IO__ && window.__IO__.denied || []).length);
    if(den) errs.push('DENIED ' + den);
    out.push(f + ' ' + theme + ' ' + w + ': ' + ([...new Set(errs)].join(' | ') || 'clean'));
    await ctx.close();
   } }
  await b.close(); console.log(out.join('\n'));
})();
