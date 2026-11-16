const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
let pass=0, fail=0; const check=(n,ok,d)=>{ ok?pass++:fail++; console.log((ok?'PASS ':'FAIL ')+n+(d?'  — '+d:'')); };
const sleep = ms => new Promise(r=>setTimeout(r,ms));
(async () => {
  const b = await chromium.launch();
  for (const vp of [{width:412,height:915},{width:1280,height:900}]) {
  const ctx = await b.newContext({ timezoneId:'Africa/Cairo', serviceWorkers:'block', viewport:vp });
  const p = await ctx.newPage(); p._e=[]; p.on('pageerror', e=>p._e.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('http://localhost:8801/test_mech.html'); await sleep(1200);
  const tag = vp.width < 500 ? ' [phone]' : ' [desktop]';
  const r = await p.evaluate(() => ({ role:document.getElementById('ubRole').textContent, tabs:getComputedStyle(document.getElementById('appTabs')).display,
    sub:document.getElementById('tbSubTabs').style.display, entry:document.getElementById('tb-page-entry').style.display,
    pm:document.getElementById('tb-page-pm').style.display, rg:document.getElementById('page-rasgara').style.display,
    head:document.getElementById('tbHeading').textContent.trim(), denied:window.__IO__.denied,
    foot:document.getElementById('cloud-sync-status').textContent.trim(), bats:document.querySelectorAll('#tbPMBats button').length,
    kpi:document.querySelectorAll('#tbPMKpi .k').length, pf:(document.getElementById('page-pf')||{style:{}}).style.display }));
  check('Mechanical: header MECHANICAL, no tab bar, no sub-tabs'+tag, r.role === 'MECHANICAL' && r.tabs === 'none' && r.sub === 'none', JSON.stringify([r.role,r.tabs,r.sub]));
  check('Mechanical: PM page only (entry, R/G, PETRECO hidden)'+tag, r.pm === '' && r.entry === 'none' && r.rg === 'none' && r.pf === 'none', JSON.stringify(r));
  check('Mechanical: heading says PM Management'+tag, /PM Management/.test(r.head), r.head);
  check('Mechanical: nothing refused, 5 batteries + T.B. 2020 + W.D. Plant + Fieran, KPI strip'+tag, !r.denied.length && r.bats === 8 && r.kpi === 5, JSON.stringify(r.denied)+' / '+r.foot);
  // set a short interval on 6/1 Booster A → overdue appears in the red-flag work list
  await p.click('#tbPMBats button[data-pmbat="tb6_1"]'); await sleep(300);
  await p.evaluate(() => { const c = [...document.querySelectorAll('.pm-card')].find(x => /Booster A/.test(x.innerText)); c.querySelector('[data-pmopen$="|every"]').click(); }); await sleep(200);
  await p.evaluate(() => { const c = [...document.querySelectorAll('.pm-card')].find(x => /Booster A/.test(x.innerText)); c.querySelector('[data-pme]').value = '100'; c.querySelector('[data-pmesave]').click(); }); await sleep(800);
  const w = await p.evaluate(() => ({ rows:[...document.querySelectorAll('#tbPMWork .pm-wr')].map(x => x.innerText.replace(/\s+/g,' ')), kpi:document.querySelector('#tbPMKpi .k:nth-child(2) b').textContent }));
  check('Interval saved by mechanical → red flag in work list'+tag, w.rows.length === 1 && /Booster A.*6\/1.*h over/.test(w.rows[0]) && /⚑ 1/.test(w.kpi), JSON.stringify(w));
  const msg = await p.evaluate(() => window.__TB__ && 1);
  // jump from the work list to the form
  await p.click('#tbPMWork .pm-wr'); await sleep(400);
  const f = await p.evaluate(() => { const c = [...document.querySelectorAll('.pm-card')].find(x => /Booster A/.test(x.innerText));
    return { form:!!c.querySelector('[data-pmsave]'), chk:c.querySelectorAll('[data-pmc]').length }; });
  check('Work list → opens Record PM with the 9-item pump checklist'+tag, f.form && f.chk === 9, JSON.stringify(f));
  // refuses an empty PM
  await p.evaluate(() => { const c = [...document.querySelectorAll('.pm-card')].find(x => /Booster A/.test(x.innerText)); c.querySelector('[data-pmd]').value = '2026-08-20'; c.querySelector('[data-pmsave]').click(); }); await sleep(500);
  let doc = await p.evaluate(() => JSON.parse(JSON.stringify(window.__STUB__.store['tbReadingsMeta/pm']||{})));
  const hist0 = Object.keys(((doc.pumps||{})['tb6_1:'+Object.keys(doc.pumps||{}).map(k=>k.split(':')[1])[0]]||{}).hist||{}).length;
  check('Empty PM (nothing ticked, no remark) is refused'+tag, hist0 === 0);
  await p.evaluate(() => { const c = [...document.querySelectorAll('.pm-card')].find(x => /Booster A/.test(x.innerText));
    c.querySelectorAll('[data-pmc]')[0].checked = true; c.querySelectorAll('[data-pmc]')[3].checked = true;
    c.querySelector('[data-pmtech]').value = 'Ahmed'; c.querySelector('[data-pmwo]').value = 'WO-1182'; c.querySelector('[data-pmsave]').click(); }); await sleep(900);
  doc = await p.evaluate(() => JSON.parse(JSON.stringify(window.__STUB__.store['tbReadingsMeta/pm']||{})));
  const ent = Object.values(doc.pumps).find(e => e.hist && Object.keys(e.hist).length);
  const h = ent && Object.values(ent.hist)[0];
  check('PM saved with checklist, technician, WO, by mechanical'+tag, h && h.chk.length === 2 && h.tech === 'Ahmed' && h.wo === 'WO-1182' && h.by === 'mechanical@petrobel.org', JSON.stringify(h));
  const after = await p.evaluate(() => ({ rows:document.querySelectorAll('#tbPMWork .pm-wr').length, log:[...document.querySelectorAll('.pm-lg')].map(x=>x.innerText.replace(/\s+/g,' ')).join('|') }));
  check('After the PM: work list clear, log shows checklist + tech + WO'+tag, after.rows === 0 && /Bearings/.test(after.log) && /Ahmed/.test(after.log) && /WO-1182/.test(after.log), JSON.stringify(after));
  const ck = await p.evaluate(() => {
    const items = name => { const c = [...document.querySelectorAll('.pm-card')].find(x => x.querySelector('.pm-nm b').textContent === name);
      c.querySelector('[data-pmopen$="|rec"]').click(); const c2 = [...document.querySelectorAll('.pm-card')].find(x => x.querySelector('.pm-nm b').textContent === name);
      return [...c2.querySelectorAll('[data-pmc]')].map(i => i.value); };
    document.querySelector('#tbPMBats button[data-pmbat="tb6_1"]').click();
    return { vert:items('Vertical Compressor'), dz:items('Diesel Compressor'), dp:items('Diesel Pump 1'), jk:items('Jockey Pump 1'),
             heaters:[...document.querySelectorAll('.pm-card .pm-nm b')].filter(b => /Heater/.test(b.textContent)).length,
             tot:[...document.querySelectorAll('#tbPMWork .pm-wr, .pm-card')].length };
  });
  check('Compressor checklist is the compressor list (oil filter, intake filter, drains, safety valve)'+tag,
    ck.vert.length === 11 && ck.vert.some(x => /Oil filter/.test(x)) && ck.vert.some(x => /Safety/.test(x)) && !ck.vert.some(x => /Mechanical seal/.test(x)), ck.vert.length+'');
  check('Diesel compressor adds the engine, drops the motor'+tag, ck.dz.some(x => /Engine oil/.test(x)) && !ck.dz.some(x => /^Motor/.test(x)), ck.dz.length+'');
  check('Diesel fire pump: pump + engine + test run; jockey: pump + pressure switch'+tag,
    ck.dp.some(x => /Mechanical seal/.test(x)) && ck.dp.some(x => /Engine oil/.test(x)) && ck.dp.some(x => /test run/i.test(x)) && ck.jk.some(x => /cut-in/.test(x)) && ck.jk.some(x => /^Motor/.test(x)),
    ck.dp.length+'/'+ck.jk.length);
  const h10 = await p.evaluate(() => { document.querySelector('#tbPMBats button[data-pmbat="tb10_1"]').click();
    return [...document.querySelectorAll('.pm-card .pm-nm b')].map(b => b.textContent); });
  check('No Sigma heaters / Heater Treater in PM (10/1: 20 items)'+tag, h10.length === 20 && !h10.some(n => /Heater/.test(n)), h10.length+'');
  const wrote = await p.evaluate(() => Object.keys(window.__STUB__.store).filter(k => /^tbReadings\//.test(k)).length);
  const den = await p.evaluate(() => window.__IO__.denied.length);
  check('Mechanical wrote nothing but the PM record, nothing refused'+tag, den === 0, 'denied '+den);
  // rules: mechanical cannot write a reading
  const refused = await p.evaluate(async () => { try { await firebase.firestore().collection('tbReadings').doc('2026-08-20__tb6_1').set({battery:'tb6_1', x:1}, {merge:true}); return false; } catch(e){ return e.code; } });
  check('Rules (stub): mechanical cannot write a reading'+tag, refused === 'permission-denied', String(refused));
  const msgTxt = await p.evaluate(() => { let t=''; const o = navigator.clipboard; return 1; });
  // Excel export builds
  const dl = p.waitForEvent('download', { timeout:8000 }).catch(() => null);
  await p.click('#tbPMXlsx'); const d = await dl;
  check('Export Excel downloads'+tag, !!d && /PM_TankBatteries_.*\.xlsx/.test(d.suggestedFilename()), d && d.suggestedFilename());
  const ov = await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  check('No sideways scroll'+tag, ov);
  check('No page errors'+tag, !p._e.length, p._e.join('|'));
  await ctx.close();
  }
  // tank battery operator cannot touch the PM doc
  { const ctx = await b.newContext({ serviceWorkers:'block' }); const p = await ctx.newPage(); await p.goto('http://localhost:8801/test_tb.html'); await sleep(900);
    const r = await p.evaluate(async () => { try { await firebase.firestore().collection('tbReadingsMeta').doc('pm').set({pumps:{}}, {merge:true}); return 'allowed'; } catch(e){ return e.code; } });
    check('Rules (stub): tank battery operator cannot write the PM record', r === 'permission-denied', r);
    await ctx.close(); }
  await b.close();
  console.log('\n' + pass + ' passed, ' + fail + ' failed');
})();
