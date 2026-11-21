const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
let pass=0, fail=0; const check=(n,ok,d)=>{ ok?pass++:fail++; console.log((ok?'PASS ':'FAIL ')+n+(d?'  — '+d:'')); };
const sleep = ms => new Promise(r=>setTimeout(r,ms));
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ timezoneId:'Africa/Cairo', serviceWorkers:'block', viewport:{width:412,height:915} });
  const a = await ctx.newPage(); a._e=[]; a.on('pageerror', e=>a._e.push(e.message));
  await a.goto('http://localhost:8801/test.html'); await sleep(1000);
  await a.evaluate(() => { document.querySelector('#appTabs button[data-tab="tb"]').click(); window.__TB__.setDate('2026-11-20'); }); await sleep(400);
  // every select at every site offers the same three words
  const all = await a.evaluate(() => {
    const out = {};
    document.querySelectorAll('select.ps-sel[data-k="u"]').forEach(s => { out[[...s.options].map(o => o.textContent).join('/')] = (out[[...s.options].map(o => o.textContent).join('/')] || 0) + 1; });
    return out; });
  check('Every station item at every site offers في الخدمة / احتياطي / خارج الخدمة', Object.keys(all).length === 1 && Object.keys(all)[0] === '—/في الخدمة/احتياطي/خارج الخدمة', JSON.stringify(all));
  const tb = await a.evaluate(() => window.__TB__.all.map(b => b.id));
  check('Checked across all sites', tb.length >= 8, tb.join(','));
  // 6/1 polymer pit pumps, after the boosters
  await a.click('.ptabs[data-ptabs="tb6_1"] button[data-ptab="pumps"]'); await sleep(200);
  const p61 = await a.evaluate(() => { const panel = document.querySelector('.ptabs[data-ptabs="tb6_1"]').closest('.tb-panel');
    return { groups:[...panel.querySelectorAll('.ptab-pumps .pd-g')].map(x => x.textContent).join('|'), names:[...panel.querySelectorAll('.ptab-pumps .pd-row .nm')].map(x => x.textContent).join('|') }; });
  check('T.B. 6/1: POLYMER PIT PUMPS (Pump 1, Pump 2) right after the boosters', /^BOOSTER PUMPS\|POLYMER PIT PUMPS\|COMPRESSORS/.test(p61.groups) && /Booster B\|Polymer Pit Pump 1\|Polymer Pit Pump 2\|Vertical Compressor/.test(p61.names), JSON.stringify(p61));
  const idx = await a.evaluate(() => [...document.querySelectorAll('select.ps-sel[data-tb="tb6_1"][data-k="u"]')].find(s => s.closest('.pd-row').querySelector('.nm').textContent === 'Polymer Pit Pump 1').getAttribute('data-i'));
  await a.selectOption('select.ps-sel[data-tb="tb6_1"][data-i="' + idx + '"]', 'in'); await sleep(200);
  await a.selectOption('select.ps-sel[data-tb="tb6_1"][data-i="' + (Number(idx) + 1) + '"]', 'out'); await sleep(200);
  await a.fill('textarea.pd-why[data-tb="tb6_1"][data-i="' + (Number(idx) + 1) + '"]', 'تسريب في الصيل'); await sleep(200);
  const vc = await a.evaluate(() => [...document.querySelectorAll('select.ps-sel[data-tb="tb6_1"][data-k="u"]')].find(s => s.closest('.pd-row').querySelector('.nm').textContent === 'Vertical Compressor').getAttribute('data-i'));
  await a.selectOption('select.ps-sel[data-tb="tb6_1"][data-i="' + vc + '"]', 'sb'); await sleep(1500);
  const m = await a.evaluate(() => document.querySelector('.pd-wa[data-pdwa="tb6_1"] .ms-msg').textContent);
  check('WhatsApp: On / Off / Out of service for pumps and compressors alike', /`POLYMER PIT PUMPS`/.test(m) && /\*Polymer Pit Pump 1 : On\*/.test(m) && /\*Polymer Pit Pump 2 : Out of service — تسريب في الصيل\*/.test(m) && /\*Vertical Compressor : Off\*/.test(m) && !/In service|Standby/.test(m), m.split('\n').filter(x => /Polymer|Vertical/.test(x)).join(' | '));
  const st = await a.evaluate(i => { const d = window.__STUB__.store['tbReadings/2026-11-20__tb6_1'] || {}; return { a:d.pumpsDaily && d.pumpsDaily[i], b:d.pumpsDaily && d.pumpsDaily[String(Number(i) + 1)] }; }, idx);
  check('Saved (stored as before: in / out)', st.a === 'in' && st.b === 'out', JSON.stringify(st));
  // admin pumps + machinery wording
  await a.evaluate(() => document.querySelector('#tbSubTabs button[data-sub="mach"]').click()); await sleep(500);
  const mc = await a.evaluate(() => ({ kp:[...document.querySelectorAll('#tbMachCard .kp span')].map(x => x.textContent).join('|'), th:[...document.querySelector('#tbMachCard .site table, #tbMachCard table:not(.x)').querySelectorAll('th')].map(x => x.textContent).join('|'), msg:window.__MACH__.msg('2026-11-20') }));
  check('Machinery update: On / Off / Out of service everywhere', /On\|Off\|Out of service/.test(mc.kp) && !/In service|Standby/.test(mc.msg) && /Polymer pit: ✅ Polymer Pit Pump 1 · 🔴 Polymer Pit Pump 2/.test(mc.msg), mc.kp + ' || ' + mc.msg.split('\n').filter(x => /Polymer|Equipment/.test(x)).join(' | '));
  await a.evaluate(() => document.querySelector('#tbSubTabs button[data-sub="pumps"]').click()); await sleep(400);
  const pr = await a.evaluate(() => document.getElementById('tbPumpSummary').innerText);
  check('Pumps page: counts read on / off, not in service / standby', !/in service|standby/i.test(pr) && / on\b/.test(pr), pr.slice(0, 160).replace(/\s+/g, ' '));
  check('No page errors', !a._e.length, a._e.join('|'));
  await b.close();
  console.log('\n' + pass + ' passed, ' + fail + ' failed');
})();
