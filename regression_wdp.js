const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
let pass=0, fail=0; const check=(n,ok,d)=>{ ok?pass++:fail++; console.log((ok?'PASS ':'FAIL ')+n+(d?'  — '+d:'')); };
const sleep = ms => new Promise(r=>setTimeout(r,ms));
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ timezoneId:'Africa/Cairo', serviceWorkers:'block', viewport:{width:412,height:915} });
  const p = await ctx.newPage(); p._e=[]; p.on('pageerror', e=>p._e.push(e.message));
  await p.goto('http://localhost:8801/test_wdp.html'); await sleep(1200);
  const r = await p.evaluate(() => ({ role:document.getElementById('ubRole').textContent, tabs:getComputedStyle(document.getElementById('appTabs')).display,
    head:document.getElementById('tbHeading').textContent.trim(), panels:document.querySelectorAll('#tbArea .tb-panel').length,
    st:document.querySelectorAll('#tbArea .tb-station').length, tbl:document.querySelectorAll('#tbArea .tb-tbl').length,
    rows:document.querySelectorAll('#tbArea .pd-row').length, groups:[...document.querySelectorAll('#tbArea .pd-g')].map(g => g.textContent).join('|'),
    sub:document.getElementById('tbSubTabs').style.display, tot:getComputedStyle(document.getElementById('tbTotals')).display, denied:window.__IO__.denied }));
  check('W.D. Plant: header W.D. PLANT, one tab, heading', r.role === 'W.D. PLANT' && r.tabs === 'none' && /Water Disposal Plant/.test(r.head), JSON.stringify([r.role, r.head]));
  check('W.D. Plant: station panel only — no scanner table, no totals', r.panels === 1 && r.st === 1 && r.tbl === 0 && r.tot === 'none' && r.sub === 'none', JSON.stringify(r));
  check('W.D. Plant: 14 pumps in 4 groups', r.rows === 14 && r.groups === 'OLD PIT VERTICAL PUMPS|NEW PIT VERTICAL PUMPS|HORIZONTAL PUMPS|BORETS PUMPS', r.rows + ' ' + r.groups);
  check('W.D. Plant: nothing refused', !r.denied.length, JSON.stringify(r.denied));
  // set Vertical A running → readings boxes appear; Borets B out
  const sel = (i) => '#tbArea select.ps-sel[data-k="u"][data-i="' + i + '"]';
  await p.selectOption(sel(0), 'in'); await sleep(400);
  const mx = await p.evaluate(() => document.querySelectorAll('#tbArea .pd-mx input').length);
  check('Running pump opens Pressure / Flow / Hz', mx === 3, mx + ' boxes');
  const lb = await p.evaluate(() => [...document.querySelectorAll('#tbArea .pd-mx label')].slice(0,3).map(l => l.innerText.replace(/\s+/g,' ').trim()).join(' | '));
  check('Labels: الضغط psi | Flow rate m³/hr | التردد Hz', lb === 'الضغط psi | Flow rate m³/hr | التردد Hz', lb);
  await p.fill('#tbArea input[data-k="h"][data-i="0"]', '850'); await p.fill('#tbArea input[data-k="h"][data-i="1"]', '12000'); await p.fill('#tbArea input[data-k="h"][data-i="2"]', '50');
  await p.selectOption(sel(7), 'in'); await sleep(400);
  await p.fill('#tbArea input[data-k="h"][data-i="71"]', '8000'); await p.fill('#tbArea input[data-k="h"][data-i="72"]', '48.5');
  await p.selectOption(sel(8), 'out'); await sleep(400);
  await p.fill('#tbArea textarea.pd-why[data-i="8"]', 'Cable fault'); await sleep(300);
  await p.selectOption(sel(1), 'sb'); await sleep(1600);
  const st = await p.evaluate(() => { const k = Object.keys(window.__STUB__.store).find(x => /^tbReadings\/.*__wdp$/.test(x)); return k ? JSON.parse(JSON.stringify(window.__STUB__.store[k])) : null; });
  check('Saved to its own document with battery wdp', st && st.battery === 'wdp', st && Object.keys(st).join(','));
  check('Saved: states, reason and pump readings', st && st.pumpsDaily['0'] === 'in' && st.pumpsDaily['8'] === 'out' && st.pumpsDailyWhy['8'] === 'Cable fault' &&
    st.pumpsDailyMeas['0'].p === 850 && st.pumpsDailyMeas['0'].q === 12000 && st.pumpsDailyMeas['0'].hz === 50 && st.pumpsDailyMeas['7'].q === 8000, JSON.stringify(st && st.pumpsDailyMeas));
  const msg = await p.evaluate(() => document.querySelector('#tbArea .pd-wa .ms-msg').textContent);
  check('WhatsApp: plant name, readings, vertical and injected flow kept apart', /Water Disposal Plant/.test(msg) && /\*Vertical A : In service\*\nP 850 psi · Q 12,000 m³\/hr · 50 Hz/i.test(msg) && /Borets B : Out of service — Cable fault/i.test(msg) && /\*Vertical pumps flow rate : 12,000 m³\/hr\* \(1 pump\)/.test(msg) && /\*Injected flow rate : 8,000 m³\/hr\* \(1 pump\)/.test(msg), msg.slice(0, 400));
  const hd = await p.evaluate(() => (document.querySelector('#tbArea .tb-station .hd').innerText + ' ' + document.querySelector('#tbArea .tb-station .st-flows').innerText).replace(/\s+/g,' '));
  check('Panel header: vertical and injected flow, out count', /Vertical pumps flow rate 12,000 m³\/hr · 1 pump/i.test(hd) && /Injected flow rate 8,000 m³\/hr · 1 pump/i.test(hd) && /1 out of service/.test(hd), hd);
  check('Daily average = rate × 24 on panel and WhatsApp', /Average 288,000 m³\/day/.test(hd) && /Average 192,000 m³\/day/.test(hd) &&
    /Vertical pumps flow rate : 12,000 m³\/hr\* \(1 pump\)\nAverage : 288,000 m³\/day/.test(msg) && /Injected flow rate : 8,000 m³\/hr\* \(1 pump\)\nAverage : 192,000 m³\/day/.test(msg), hd);
  // standby clears readings
  await p.selectOption(sel(7), 'sb'); await sleep(1500);
  const st2 = await p.evaluate(() => { const k = Object.keys(window.__STUB__.store).find(x => /^tbReadings\/.*__wdp$/.test(x)); return JSON.parse(JSON.stringify(window.__STUB__.store[k])); });
  check('Pump leaves service → its readings are cleared', st2.pumpsDailyMeas['7'].q == null && st2.pumpsDailyMeas['7'].hz == null, JSON.stringify(st2.pumpsDailyMeas['7']));
  // outlet pressure
  const opBox = await p.evaluate(() => { const i = document.querySelector('#tbArea .tb-station input[data-k="o"]'); return i ? i.closest('.st-op').innerText.replace(/\s+/g,' ') : null; });
  check('Outlet Pressure box with its Arabic, in psi', opBox && /Outlet Pressure/.test(opBox) && /خارج ضغط المحطة/.test(opBox) && /psi/.test(opBox), String(opBox));
  await p.fill('#tbArea .tb-station input[data-k="o"]', '1250'); await sleep(1500);
  const op = await p.evaluate(() => { const k = Object.keys(window.__STUB__.store).find(x => /^tbReadings\/.*__wdp$/.test(x));
    return { v:window.__STUB__.store[k].outletPr, msg:document.querySelector('#tbArea .pd-wa .ms-msg').textContent }; });
  check('Outlet pressure saved and in the WhatsApp message', op.v === 1250 && /\*Outlet Pressure : 1,250 psi\*/.test(op.msg), JSON.stringify(op).slice(0, 200));
  // remarks
  await p.fill('#tbArea .tb-station textarea[data-k="r"]', 'Vertical C motor sent to workshop'); await sleep(1500);
  const rm = await p.evaluate(() => { const k = Object.keys(window.__STUB__.store).find(x => /^tbReadings\/.*__wdp$/.test(x)); return window.__STUB__.store[k].note || window.__STUB__.store[k].remarks; });
  check('W.D. Plant: remarks box saves the operator\'s note', rm === 'Vertical C motor sent to workshop', String(rm));
  // rules
  const ru = await p.evaluate(async () => { const f = firebase.firestore(), o = {};
    try { await f.collection('tbReadings').doc('2026-08-20__tb6_1').set({ battery:'tb6_1', x:1 }, { merge:true }); o.w = 'allowed'; } catch(e){ o.w = e.code; }
    try { await f.collection('tbReadings').get(); o.r = 'allowed'; } catch(e){ o.r = e.code; }
    try { await f.collection('tbReadingsMeta').doc('pm').set({ x:1 }, { merge:true }); o.pm = 'allowed'; } catch(e){ o.pm = e.code; }
    return o; });
  check('Rules (stub): W.D. Plant cannot write a battery, read all, or touch PM', ru.w === 'permission-denied' && ru.r === 'permission-denied' && ru.pm === 'permission-denied', JSON.stringify(ru));
  const ov = await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  check('No sideways scroll', ov);
  check('No page errors (W.D. Plant)', !p._e.length, p._e.join('|'));
  // carry the store into an admin page: pumps + machinery show it
  await ctx.close();
  const c2 = await b.newContext({ timezoneId:'Africa/Cairo', serviceWorkers:'block', viewport:{width:1100,height:900} });
  const a = await c2.newPage(); a._e=[]; a.on('pageerror', e=>a._e.push(e.message));
  await a.goto('http://localhost:8801/test.html'); await sleep(1000);
  await a.evaluate(() => { document.querySelector('#appTabs button[data-tab="tb"]').click(); window.__TB__.setDate('2026-08-21'); }); await sleep(400);
  const S = (i) => '#tbArea .tb-station select.ps-sel[data-k="u"][data-i="' + i + '"]';
  await a.selectOption(S(0), 'in'); await sleep(300);
  await a.fill('#tbArea .tb-station input[data-k="h"][data-i="0"]', '850'); await a.fill('#tbArea .tb-station input[data-k="h"][data-i="1"]', '12000'); await a.fill('#tbArea .tb-station input[data-k="h"][data-i="2"]', '50');
  await a.selectOption(S(1), 'sb'); await sleep(300);
  await a.selectOption(S(8), 'out'); await sleep(300);
  await a.fill('#tbArea .tb-station textarea.pd-why[data-i="8"]', 'Cable fault'); await sleep(300);
  await a.fill('#tbArea .tb-station input[data-k="o"]', '1180'); await sleep(1500);
  const today = '2026-08-21';
  await a.evaluate(d => { window.__TB__.setDate(d); document.querySelector('#tbSubTabs button[data-sub="pumps"]').click(); }, today); await sleep(600);
  const pr = await a.evaluate(() => { const row = [...document.querySelectorAll('#tbPumpSummary .prow')].find(x => /Water Disposal Plant/.test(x.innerText)); return row ? row.innerText.replace(/\s+/g,' ') : ''; });
  const pr2 = pr;
  check('Admin Pumps: W.D. Plant row shows outlet pressure', /outlet pressure 1,180 psi/.test(pr2), pr2.slice(0, 200));
  check('Admin Pumps: W.D. Plant row with readings and flow', /Vertical A P 850 psi · Q 12,000 m³\/hr · 50 Hz/.test(pr) && /vertical pumps flow rate 12,000 m³\/hr/.test(pr) && /1 out/.test(pr), pr.slice(0, 300));
  await a.evaluate(() => document.querySelector('#tbSubTabs button[data-sub="mach"]').click()); await sleep(600);
  const mc = await a.evaluate(d => ({ card:document.getElementById('tbMachCard').innerText.replace(/\s+/g,' '), msg:window.__MACH__.msg(d) }), today);
  check('Machinery update: W.D. Plant block, no pump readings or flow', /Water Disposal Plant/.test(mc.card) && !/Running pump|Total flow|psi|m³\/hr/i.test(mc.card), mc.card.slice(mc.card.lastIndexOf('Water Disposal Plant'), mc.card.lastIndexOf('Water Disposal Plant') + 400));
  check('Machinery update: W.D. Plant out of service listed with reason', /Water Disposal Plant Borets B .* Cable fault/.test(mc.card));
  check('Machinery WhatsApp: W.D. Plant section', /━+\n\*WATER DISPOSAL PLANT\*/.test(mc.msg) && /Old pit vertical: ✅ Vertical A · 🟡 Vertical B/.test(mc.msg) && !/psi|m³\/hr/.test(mc.msg), mc.msg.slice(mc.msg.indexOf('*WATER'), mc.msg.indexOf('*WATER') + 300));
  const prod = await a.evaluate(() => ({ hist:document.querySelectorAll('#tbHist tbody tr').length, list:window.__TB__.list.map(b => b.id).join(',') }));
  check('Production untouched: W.D. Plant is not a tank battery', prod.list === 'tb6_1,tb6_2,tb8_1,tb8_2,tb10_1', prod.list);
  check('No page errors (admin)', !a._e.length, a._e.join('|'));
  await b.close();
  console.log('\n' + pass + ' passed, ' + fail + ' failed');
})();
