const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
let pass=0, fail=0; const check=(n,ok,d)=>{ ok?pass++:fail++; console.log((ok?'PASS ':'FAIL ')+n+(d?'  — '+d:'')); };
const sleep = ms => new Promise(r=>setTimeout(r,ms));
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ timezoneId:'Africa/Cairo', serviceWorkers:'block', viewport:{width:412,height:915} });
  const p = await ctx.newPage(); p._e=[]; p.on('pageerror', e=>p._e.push(e.message));
  await p.goto('http://localhost:8801/zz_tb101.html'); await sleep(1200);
  const r0 = await p.evaluate(() => ({ role:document.getElementById('ubRole').textContent, panels:document.querySelectorAll('#tbArea .tb-panel').length,
    tabs:[...document.querySelectorAll('.ptabs button')].map(x => x.childNodes[0].textContent.trim()).join('|'), denied:window.__IO__.denied }));
  check('10/1 account: one panel, T.B. 2020 tab after وضع المحطة', r0.role === 'T.B. 10/1' && r0.panels === 1 && r0.tabs === 'القراءات|مقاسات المحطة|وضع المحطة|T.B. 2020', JSON.stringify(r0));
  check('10/1 account: loading 10/1 and 2020 refused nothing', !r0.denied.length, JSON.stringify(r0.denied));
  await p.click('.ptabs button[data-ptab="h:tb2020"]'); await sleep(300);
  const r1 = await p.evaluate(() => ({ vis:[...document.querySelectorAll('.tb-panel > .bd > div')].filter(d => d.style.display !== 'none').map(d => d.className).join(','),
    h2:[...document.querySelectorAll('.h2tabs button')].map(x => x.childNodes[0].textContent.trim()).join('|'),
    secs:[...document.querySelectorAll('.ptab-hosted .h2-meas .ms-card .ms-h .sec')].map(x => x.textContent).join('|'),
    times:document.querySelectorAll('.ptab-hosted .ms-t').length }));
  check('2020 tab: its own switch (measurements / status), the rest of 10/1 hidden', /ptab-hosted/.test(r1.vis) && !/ptab-read|ptab-pumps|ptab-meas/.test(r1.vis) && r1.h2 === 'مقاسات المحطة|وضع المحطة', JSON.stringify(r1));
  check('2020 measurements: 4 sections, 9 rounds (same times as 10/1)', r1.secs === 'PRODUCTION.SEP|PUMP|LINE 10"|HEATER' && r1.times === 9, r1.secs + ' / ' + r1.times);
  // fill round 05:00 (slot 0)
  await p.click('.ptab-hosted .ms-t[data-mslot="0"]'); await sleep(200);
  const F = { lvl:0, pSep:1, pump:2, bi:3, bd:4, hz:5, pLn:6, heat:7 };
  const inp = (k) => '.ptab-hosted input[data-tb="tb2020"][data-k="g"][data-i="' + F[k] + '"]';
  await p.fill(inp('lvl'), '40'); await p.fill(inp('pSep'), '2');
  await p.click('.ptab-hosted button[data-mg="' + F.pump + '"][data-v="on"]'); await sleep(300);
  await p.fill(inp('bi'), '2'); await p.fill(inp('bd'), '4.6'); await p.fill(inp('hz'), '35'); await p.fill(inp('pLn'), '4.8');
  await p.click('.ptab-hosted button[data-mg="' + F.heat + '"][data-v="on"]'); await sleep(400);
  const msg = await p.evaluate(() => document.querySelector('.ptab-hosted .h2-meas .ms-msg').textContent);
  const want = ['*Station : T.B 2020*', '', '*Time : 05:00 AM*'];
  check('2020 message in its own format', msg.startsWith(want.join('\n')) &&
    /\*◼️PRODUCTION\.SEP\*\n\n\*▫️Level : 40 %\*\n\n\*▫️Pressure : 2 bar\*/.test(msg) &&
    /\*◼️PUMP : On\*\n\n\*▫️Bi : 2 bar\*\n\n\*▫️Bd : 4\.6 bar\*\n\n\*▫️HZ : 35\*/.test(msg) &&
    /\*◼️LINE 10" \*?\n?\n?\*▫️Pressure : 4\.8 bar\*/.test(msg.replace('*◼️LINE 10"*', '*◼️LINE 10" *')) &&
    /\*◼️HEATER : On\*/.test(msg) && /\*————————————-\*$/.test(msg), msg);
  const dot = await p.evaluate(() => document.querySelector('.ptab-hosted .ms-t[data-mslot="0"]').className);
  check('Round 05:00 marked done', /done/.test(dot), dot);
  // pump off hides and clears Bi / Bd / Hz
  await p.click('.ptab-hosted button[data-mg="' + F.pump + '"][data-v="off"]'); await sleep(400);
  const off = await p.evaluate(() => ({ n:document.querySelectorAll('.ptab-hosted .h2-meas input[data-i="3"],.ptab-hosted .h2-meas input[data-i="4"],.ptab-hosted .h2-meas input[data-i="5"]').length,
    msg:document.querySelector('.ptab-hosted .h2-meas .ms-msg').textContent, cls:document.querySelector('.ptab-hosted .ms-t[data-mslot="0"]').className }));
  check('Pump Off: Bi / Bd / Hz go, message says PUMP : Off, round still done', off.n === 0 && /\*◼️PUMP : Off\*/.test(off.msg) && !/Bi :|Bd :|HZ :/.test(off.msg) && /done/.test(off.cls), JSON.stringify(off).slice(0, 300));
  // station status of 2020
  await p.click('.ptab-hosted .h2tabs button[data-h2tab="pumps"]'); await sleep(200);
  const pr = await p.evaluate(() => ({ rows:[...document.querySelectorAll('.ptab-hosted .h2-pumps .pd-row .nm')].map(x => x.textContent).join('|'),
    groups:[...document.querySelectorAll('.ptab-hosted .h2-pumps .pd-g')].map(x => x.textContent).join('|') }));
  check('2020 station status: pump, 2 compressors, 2 jockey pumps, sigma heater', pr.rows === 'Transfer Pump|Air Compressor|Diesel Compressor|Jockey Pump 1|Jockey Pump 2|Sigma Heater' && pr.groups === 'PUMPS|COMPRESSORS|FIRE FIGHTING|HEATERS', JSON.stringify(pr));
  await p.selectOption('.ptab-hosted select.ps-sel[data-tb="tb2020"][data-i="0"]', 'in'); await sleep(300);
  await p.selectOption('.ptab-hosted select.ps-sel[data-tb="tb2020"][data-i="2"]', 'out'); await sleep(300);
  await p.fill('.ptab-hosted textarea.pd-why[data-tb="tb2020"][data-i="2"]', 'Starter fault'); await sleep(300);
  await p.selectOption('.ptab-hosted select.ps-sel[data-tb="tb2020"][data-i="5"]', 'in'); await sleep(1600);
  const sm = await p.evaluate(() => document.querySelector('.ptab-hosted .h2-pumps .pd-wa .ms-msg').textContent);
  check('2020 status message', /\*`T\.B 2020`\*/.test(sm) && /\*Transfer Pump : In service\*/i.test(sm) && /Diesel Compressor : Out of service — Starter fault/i.test(sm) && /Sigma Heater : On/i.test(sm), sm.slice(0, 300));
  const badge = await p.evaluate(() => document.querySelector('.ptabs button[data-ptab="h:tb2020"] .pdot') && document.querySelector('.ptabs button[data-ptab="h:tb2020"] .pdot').textContent);
  check('Out-of-service count on the T.B. 2020 tab', badge === '1', badge);
  const st = await p.evaluate(() => { const k = Object.keys(window.__STUB__.store).find(x => /__tb2020$/.test(x)); return k ? JSON.parse(JSON.stringify(window.__STUB__.store[k])) : null; });
  check('Saved to T.B. 2020\'s own document (battery tb2020) by the 10/1 account', st && st.battery === 'tb2020' && st.pumpsDaily['0'] === 'in' && st.pumpsDaily['2'] === 'out' && st.meas['0'].lvl === 40 && st.meas['0'].pump === 'off' && st.meas['0'].bi == null, st && JSON.stringify(st.meas));
  const den = await p.evaluate(() => window.__IO__.denied.length);
  check('Nothing refused while saving', den === 0, String(den));
  const ru = await p.evaluate(async () => { const f = firebase.firestore(), o = {};
    try { await f.collection('tbReadings').doc('2026-08-20__wdp').set({ battery:'wdp', x:1 }, { merge:true }); o.w = 'allowed'; } catch(e){ o.w = e.code; }
    try { await f.collection('tbReadings').where('battery', '==', 'tb6_1').get(); o.r = 'allowed'; } catch(e){ o.r = e.code; }
    return o; });
  check('Rules (stub): 10/1 still cannot touch other sites', ru.w === 'permission-denied' && ru.r === 'permission-denied', JSON.stringify(ru));
  // round 05:00 is shared with the previous day's closing 05:00
  const tw = await p.evaluate(() => { const d = window.__TB__.days(); const dt = Object.keys(d).sort(); return dt.filter(x => d[x].tbs.tb2020 && d[x].tbs.tb2020.meas && d[x].tbs.tb2020.meas[8] && d[x].tbs.tb2020.meas[8].lvl === 40).length; });
  check('05:00 round shared with the day before (closing round)', tw === 1, String(tw));
  const ov = await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  check('No sideways scroll', ov);
  check('No page errors (10/1 + 2020)', !p._e.length, p._e.join('|'));
  await ctx.close();
  // admin sees 2020 in pumps + machinery, and can enter it too
  const c2 = await b.newContext({ timezoneId:'Africa/Cairo', serviceWorkers:'block', viewport:{width:1100,height:900} });
  const a = await c2.newPage(); a._e=[]; a.on('pageerror', e=>a._e.push(e.message));
  await a.goto('http://localhost:8801/test.html'); await sleep(1000);
  await a.evaluate(() => { document.querySelector('#appTabs button[data-tab="tb"]').click(); window.__TB__.setDate('2026-08-21'); }); await sleep(400);
  await a.click('.ptabs[data-ptabs="tb10_1"] button[data-ptab="h:tb2020"]'); await sleep(200);
  await a.click('.ptab-hosted .h2tabs button[data-h2tab="pumps"]'); await sleep(200);
  await a.selectOption('.ptab-hosted select.ps-sel[data-tb="tb2020"][data-i="0"]', 'in'); await sleep(200);
  await a.selectOption('.ptab-hosted select.ps-sel[data-tb="tb2020"][data-i="1"]', 'sb'); await sleep(200);
  await a.selectOption('.ptab-hosted select.ps-sel[data-tb="tb2020"][data-i="3"]', 'out'); await sleep(200);
  await a.fill('.ptab-hosted textarea.pd-why[data-tb="tb2020"][data-i="3"]', 'Seal leak'); await sleep(1200);
  await a.evaluate(() => document.querySelector('#tbSubTabs button[data-sub="pumps"]').click()); await sleep(500);
  const prow = await a.evaluate(() => [...document.querySelectorAll('#tbPumpSummary .prow')].map(x => x.querySelector('.pb').textContent));
  check('Admin Pumps: T.B. 2020 right after T.B. 10/1', prow.join('|') === 'T.B. 6/1|T.B. 6/2|T.B. 8/1|T.B. 8/2|T.B. 10/1|T.B. 2020|Water Disposal Plant|Fieran Terminal', prow.join('|'));
  await a.evaluate(() => document.querySelector('#tbSubTabs button[data-sub="mach"]').click()); await sleep(500);
  const mc = await a.evaluate(() => ({ card:document.getElementById('tbMachCard').innerText.replace(/\s+/g,' '), msg:window.__MACH__.msg('2026-08-21') }));
  check('Machinery update: T.B. 2020 block with its pumps / compressors', /T\.B\. 2020 GROUP IN SERVICE \/ ON STANDBY \/ OFF OUT OF SERVICE Pumps Transfer Pump — — Compressors — Air Compressor — /i.test(mc.card), mc.card.slice(mc.card.indexOf('T.B. 2020'), mc.card.indexOf('T.B. 2020') + 260));
  check('Machinery update: T.B. 2020 out of service with reason', /T\.B\. 2020 Jockey Pump 1 .* Seal leak/.test(mc.card));
  check('Machinery WhatsApp: T.B. 2020 section', /\*T\.B\. 2020\*/i.test(mc.msg) && /Pumps: ✅ Transfer Pump/.test(mc.msg) && /Fire fighting: 🔴 Jockey Pump 1/.test(mc.msg), mc.msg.slice(mc.msg.indexOf('2020') - 20, mc.msg.indexOf('2020') + 200));
  const prod = await a.evaluate(() => window.__TB__.list.map(b => b.id).join(','));
  check('Production untouched: T.B. 2020 is not in the production list', prod === 'tb6_1,tb6_2,tb8_1,tb8_2,tb10_1', prod);
  check('No page errors (admin)', !a._e.length, a._e.join('|'));
  await b.close();
  console.log('\n' + pass + ' passed, ' + fail + ' failed');
})();
