const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
let pass=0, fail=0; const check=(n,ok,d)=>{ ok?pass++:fail++; console.log((ok?'PASS ':'FAIL ')+n+(d?'  — '+d:'')); };
const sleep = ms => new Promise(r=>setTimeout(r,ms));
(async () => {
  const b = await chromium.launch();
  for (const vp of [{width:412,height:915},{width:1200,height:900}]) {
  const tag = vp.width < 500 ? ' [phone]' : ' [desktop]';
  const ctx = await b.newContext({ timezoneId:'Africa/Cairo', serviceWorkers:'block', viewport:vp });
  await ctx.grantPermissions(['clipboard-read','clipboard-write']);
  const a = await ctx.newPage(); a._e=[]; a.on('pageerror', e=>a._e.push(e.message));
  await a.goto('http://localhost:8801/test.html'); await sleep(1000);
  await a.evaluate(() => { document.querySelector('#appTabs button[data-tab="tb"]').click(); window.__TB__.setDate('2026-08-21'); }); await sleep(400);
  const entry = await a.evaluate(() => [...document.querySelectorAll('#tbArea .tb-panel h3')].map(h => h.textContent).join('|'));
  check('Fieran is not on the Entry page'+tag, !/Fieran/.test(entry), entry);
  await a.evaluate(() => document.querySelector('#tbSubTabs button[data-sub="fieran"]').click()); await sleep(400);
  const r = await a.evaluate(() => ({ vis:document.getElementById('tb-page-fieran').style.display, entry:document.getElementById('tb-page-entry').style.display,
    h:(document.querySelector('#tbFieranArea .tb-station h3') || {}).textContent, date:document.getElementById('tbFrDate').value,
    rows:[...document.querySelectorAll('#tbFieranArea .pd-row .nm')].map(x => x.textContent),
    groups:[...document.querySelectorAll('#tbFieranArea .pd-g')].map(x => x.textContent).join('|'), note:!!document.querySelector('#tbFieranArea textarea[data-k="r"]') }));
  check('Fieran Terminal tab: its own page, shift day, station panel'+tag, r.vis === '' && r.entry === 'none' && r.h === 'Fieran Terminal' && r.date === '2026-08-21', JSON.stringify([r.vis, r.entry, r.h, r.date]));
  check('Fieran: 16 pumps in 4 groups, remarks box'+tag, r.rows.length === 16 && r.groups === 'SHIPPING PUMPS|FIRE FIGHTING|API SKIMMER|WASTE WATER PUMPS' && r.note &&
    r.rows.join(',') === 'Powerhouse Pump 1,Powerhouse Pump 2,Gas Pump 706,Gas Pump 707,Gas Pump 708,Diesel Pump A,Diesel Pump B,Diesel Pump C,Diesel Pump D,Diesel Pump E,Diesel Pump F,Jockey Pump 1,Jockey Pump 2,API Skimmer Pump 1,Waste Water Pump 2,Waste Water Pump 3', r.rows.join(','));
  const S = i => '#tbFieranArea select.ps-sel[data-tb="fieran"][data-i="' + i + '"]';
  await a.selectOption(S(0), 'in'); await sleep(200);
  await a.selectOption(S(2), 'sb'); await sleep(200);
  await a.selectOption(S(3), 'out'); await sleep(300);
  await a.fill('#tbFieranArea textarea.pd-why[data-tb="fieran"][data-i="3"]', 'Gas engine overhaul'); await sleep(300);
  await a.fill('#tbFieranArea textarea[data-k="r"]', 'Shipping to tanker tomorrow'); await sleep(1500);
  const msg = await a.evaluate(() => document.querySelector('#tbFieranArea .pd-wa .ms-msg').textContent);
  check('Fieran WhatsApp: statuses and reason'+tag, /\*`Fieran Terminal`\*/.test(msg) && /Powerhouse Pump 1 : In service/i.test(msg) && /Gas Pump 707 : Out of service — Gas engine overhaul/i.test(msg), msg.slice(0, 260));
  const st = await a.evaluate(() => { const k = Object.keys(window.__STUB__.store).find(x => /__fieran$/.test(x)); return k ? JSON.parse(JSON.stringify(window.__STUB__.store[k])) : null; });
  check('Saved by admin to its own document (battery fieran)'+tag, st && st.battery === 'fieran' && st.pumpsDaily['0'] === 'in' && st.pumpsDaily['3'] === 'out' && st.pumpsDailyWhy['3'] === 'Gas engine overhaul' && (st.remarks === 'Shipping to tanker tomorrow'), st && JSON.stringify({ pd:st.pumpsDaily, n:st.remarks }));
  const hd = await a.evaluate(() => document.querySelector('#tbFieranArea .tb-station .hd').innerText.replace(/\s+/g,' '));
  check('Fieran panel header shows out count'+tag, /1 out of service/.test(hd), hd);
  // copy previous day button etc. still fine; pumps + machinery
  await a.evaluate(() => document.querySelector('#tbSubTabs button[data-sub="pumps"]').click()); await sleep(400);
  const pr = await a.evaluate(() => { const r = [...document.querySelectorAll('#tbPumpSummary .prow')].find(x => /Fieran/.test(x.innerText)); return r ? r.innerText.replace(/\s+/g,' ') : ''; });
  check('Admin Pumps: Fieran Terminal row'+tag, /Fieran Terminal/.test(pr) && /1 out/.test(pr) && /Powerhouse Pump 1/.test(pr), pr.slice(0, 200));
  await a.evaluate(() => document.querySelector('#tbSubTabs button[data-sub="mach"]').click()); await sleep(500);
  const mc = await a.evaluate(() => ({ card:document.getElementById('tbMachCard').innerText.replace(/\s+/g,' '), msg:window.__MACH__.msg('2026-08-21') }));
  check('Machinery update: Fieran block and its stoppage'+tag, /FIERAN TERMINAL/i.test(mc.card) && /Fieran Terminal Gas Pump 707 .* Gas engine overhaul/.test(mc.card), '');
  check('Machinery WhatsApp: Fieran section'+tag, /\*FIERAN TERMINAL\*/i.test(mc.msg) && /API skimmer: /.test(mc.msg) && /Shipping: ✅ Powerhouse Pump 1 · 🟡 Gas Pump 706 · 🔴 Gas Pump 707/.test(mc.msg), mc.msg.slice(mc.msg.lastIndexOf('Fieran') - 5, mc.msg.lastIndexOf('Fieran') + 250));
  // back on Fieran: values still there after redraw
  await a.evaluate(() => document.querySelector('#tbSubTabs button[data-sub="fieran"]').click()); await sleep(300);
  const back = await a.evaluate(() => ({ v:document.querySelector('#tbFieranArea select.ps-sel[data-i="3"]').value, n:document.querySelector('#tbFieranArea textarea[data-k="r"]').value }));
  check('Back on the Fieran tab, everything is still there'+tag, back.v === 'out' && back.n === 'Shipping to tanker tomorrow', JSON.stringify(back));
  const ov = await a.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  check('No sideways scroll'+tag, ov);
  check('No page errors'+tag, !a._e.length, a._e.join('|'));
  await ctx.close();
  }
  // operators never see Fieran; mechanical sees it in PM
  { const c = await b.newContext({ serviceWorkers:'block' }); const p = await c.newPage(); await p.goto('http://localhost:8801/test_tb.html'); await sleep(900);
    const t = await p.evaluate(() => ({ html:/Fieran/.test(document.getElementById('page-tb').innerText), denied:window.__IO__.denied.length }));
    check('A tank battery operator never sees Fieran', !t.html && !t.denied, JSON.stringify(t)); await c.close(); }
  { const c = await b.newContext({ serviceWorkers:'block' }); const p = await c.newPage(); await p.goto('http://localhost:8801/test_mech.html'); await sleep(1100);
    const t = await p.evaluate(() => [...document.querySelectorAll('#tbPMBats button')].map(x => x.getAttribute('data-pmbat')).join(','));
    check('Mechanical: Fieran pumps on the PM page', /fieran/.test(t), t); await c.close(); }
  await b.close();
  console.log('\n' + pass + ' passed, ' + fail + ' failed');
})();
