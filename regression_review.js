const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
let pass=0, fail=0; const check=(n,ok,d)=>{ ok?pass++:fail++; console.log((ok?'PASS ':'FAIL ')+n+(d?'  — '+d:'')); };
const sleep = ms => new Promise(r=>setTimeout(r,ms));
(async () => {
  const b = await chromium.launch();
  // ── 1. day rollover ──
  { const ctx = await b.newContext({ timezoneId:'Africa/Cairo', serviceWorkers:'block', viewport:{width:412,height:915} });
    const p = await ctx.newPage(); p._e=[]; p.on('pageerror', e=>p._e.push(e.message));
    await p.clock.install({ time:new Date('2026-11-16T22:00:00+02:00') });
    await p.goto('http://localhost:8801/test_tb.html'); await p.clock.runFor(1500);
    const d0 = await p.evaluate(() => document.getElementById('tbDate').value);
    await p.clock.setFixedTime(new Date('2026-11-17T04:30:00+02:00')); await p.evaluate(() => checkShiftDay());
    const d1 = await p.evaluate(() => document.getElementById('tbDate').value);
    await p.clock.setFixedTime(new Date('2026-11-17T05:01:00+02:00')); await p.evaluate(() => checkShiftDay()); await p.clock.runFor(500);
    const d2 = await p.evaluate(() => ({ v:document.getElementById('tbDate').value, toast:(document.querySelector('.toast, #toast') || {}).textContent || '' }));
    check('Rollover: open overnight, the sheet follows the new shift day at 05:00 (not before)', d0 === '2026-11-16' && d1 === '2026-11-16' && d2.v === '2026-11-17', [d0, d1, d2.v].join(' → '));
    // looking at an old day: left alone
    await p.evaluate(() => window.__TB__.setDate('2026-08-19'));
    await p.clock.setFixedTime(new Date('2026-11-18T05:01:00+02:00')); await p.evaluate(() => checkShiftDay());
    const d3 = await p.evaluate(() => window.__TB__.date ? window.__TB__.date() : document.querySelector('#tbArea') && document.getElementById('tbDate').value);
    check('Rollover: a sheet on an older day is left where it is', await p.evaluate(() => document.querySelector('#tbArea').getAttribute('data-layout').split('|')[0]) === '2026-08-19');
    // typing: not moved until the box is left
    await p.evaluate(() => window.__TB__.setDate('2026-11-18')); await p.evaluate(() => checkShiftDay());
    await p.focus('#tbArea input[data-k="s"]');
    await p.clock.setFixedTime(new Date('2026-11-19T05:01:00+02:00')); await p.evaluate(() => checkShiftDay());
    const d4 = await p.evaluate(() => document.querySelector('#tbArea').getAttribute('data-layout').split('|')[0]);
    await p.evaluate(() => document.activeElement.blur()); await p.evaluate(() => checkShiftDay()); await p.clock.runFor(300);
    const d5 = await p.evaluate(() => document.querySelector('#tbArea').getAttribute('data-layout').split('|')[0]);
    check('Rollover: waits while a box is being typed in, then moves', d4 === '2026-11-18' && d5 === '2026-11-19', d4 + ' → ' + d5);
    check('No page errors (rollover)', !p._e.length, p._e.join('|'));
    await ctx.close(); }
  // ── 2. sync: operator ignores other sites' saves; admin reads only what changed ──
  { const ctx = await b.newContext({ timezoneId:'Africa/Cairo', serviceWorkers:'block' });
    const p = await ctx.newPage(); p._e=[]; p.on('pageerror', e=>p._e.push(e.message));
    await p.goto('http://localhost:8801/test_tb.html'); await sleep(1200);
    // own save first, so the stamp document carries this site's stamp
    await p.evaluate(() => window.__TB__.setDate('2026-08-21')); await sleep(200);
    await p.fill('#tbArea input[data-k="c"][data-i="0"]', '33'); await sleep(1600);
    const r0 = await p.evaluate(() => window.__IO__.byColl.tbReadings.reads);
    // another site saves: its doc + the stamp with ITS site only
    await p.evaluate(() => { const S = window.__STUB__.store; S['tbReadingsMeta/info'] = S['tbReadingsMeta/info'] || {}; });
    const metaKey = await p.evaluate(() => Object.keys(window.__STUB__.store).find(k => /^tbReadingsMeta\//.test(k) && k !== 'tbReadingsMeta/pm' && window.__STUB__.store[k].sites));
    await p.evaluate(async (mk) => { const u = window.__STUB__; const me = firebase.auth().currentUser.email;
      u.setUser('sherifmorshed@gmail.com');
      const f = firebase.firestore(), ts = firebase.firestore.FieldValue.serverTimestamp();
      await f.collection('tbReadings').doc('2026-08-21__tb8_1').set({ date:'2026-08-21', battery:'tb8_1', updatedAt:ts, updatedBy:'x', rows:{ '1':{ s:5 } } }, { merge:true });
      await f.collection('tbReadingsMeta').doc(mk.split('/')[1]).set({ updatedAt:{ __ts:1, __v:Date.now() + 5000 }, updatedBy:'someone else', sites:{ tb8_1:{ __ts:1, __v:Date.now() + 5000 } } }, { merge:true });
      u.setUser(me); }, metaKey);
    await sleep(700);
    const r1 = await p.evaluate(() => window.__IO__.byColl.tbReadings.reads);
    check('Operator: another site\'s save triggers NO read of his history', !!metaKey && r1 === r0, r0 + ' → ' + r1);
    // admin edits THIS operator's site → he does read
    await p.evaluate(async (mk) => { const u = window.__STUB__; const me = firebase.auth().currentUser.email;
      u.setUser('sherifmorshed@gmail.com');
      const f = firebase.firestore();
      await f.collection('tbReadings').doc('2026-08-21__tb6_2').set({ date:'2026-08-21', battery:'tb6_2', updatedAt:{ __ts:1, __v:Date.now() + 9000 }, updatedBy:'admin', temp:{ '3':77 } }, { merge:true });
      await f.collection('tbReadingsMeta').doc(mk.split('/')[1]).set({ updatedAt:{ __ts:1, __v:Date.now() + 9000 }, updatedBy:'admin', sites:{ tb6_2:{ __ts:1, __v:Date.now() + 9000 } } }, { merge:true });
      u.setUser(me); }, metaKey);
    await sleep(800);
    const r2 = await p.evaluate(() => ({ reads:window.__IO__.byColl.tbReadings.reads, v:document.querySelector('#tbArea input[data-k="c"][data-i="3"]').value }));
    check('Operator: a change to HIS site is read and shown', r2.reads > r1 && r2.v === '77', JSON.stringify(r2));
    check('No page errors (operator sync)', !p._e.length, p._e.join('|'));
    await ctx.close(); }
  { const ctx = await b.newContext({ timezoneId:'Africa/Cairo', serviceWorkers:'block' });
    const a = await ctx.newPage(); a._e=[]; a.on('pageerror', e=>a._e.push(e.message));
    await a.goto('http://localhost:8801/test.html'); await sleep(1200);
    await a.evaluate(() => { document.querySelector('#appTabs button[data-tab="tb"]').click(); window.__TB__.setDate('2026-08-21'); }); await sleep(300);
    const total = await a.evaluate(() => Object.keys(window.__STUB__.store).filter(k => /^tbReadings\//.test(k)).length);
    const days0 = await a.evaluate(() => Object.keys(window.__TB__.days()).length);
    const metaKey = await a.evaluate(() => Object.keys(window.__STUB__.store).find(k => /^tbReadingsMeta\//.test(k) && k !== 'tbReadingsMeta/pm'));
    // a real save first, so this device's synced version is a real time (the
    // seed stamps every document and the stamp document with the same instant)
    await a.fill('#tbArea input[data-tb="tb6_1"][data-k="c"][data-i="0"]', '31'); await sleep(1700);
    const r0 = await a.evaluate(() => window.__IO__.byColl.tbReadings.reads);
    await a.evaluate(async (mk) => { const f = firebase.firestore(), t = Date.now() + 4000;
      window.__STUB__.store['tbReadings/2026-08-21__tb8_1'] = Object.assign({}, window.__STUB__.store['tbReadings/2026-08-21__tb8_1'] || { date:'2026-08-21', battery:'tb8_1' }, { updatedAt:{ __ts:1, __v:t }, updatedBy:'op', temp:{ '3':66 } });
      await f.collection('tbReadingsMeta').doc(mk.split('/')[1]).set({ updatedAt:{ __ts:1, __v:t }, updatedBy:'op', sites:{ tb8_1:{ __ts:1, __v:t } } }, { merge:true }); }, metaKey);
    await sleep(900);
    const r1 = await a.evaluate(() => ({ reads:window.__IO__.byColl.tbReadings.reads, days:Object.keys(window.__TB__.days()).length, v:(window.__TB__.days()['2026-08-21'].tbs.tb8_1.c || [])[3] }));
    check('Admin: an operator\'s save costs a read of the changed document(s), not the whole history', (r1.reads - r0) >= 1 && (r1.reads - r0) <= 3 && total > 20, 'read ' + (r1.reads - r0) + ' of ' + total + ' documents');
    check('Admin: the change is in, and no other day was lost', r1.v === 66 && r1.days >= days0, JSON.stringify(r1));
    check('No page errors (admin sync)', !a._e.length, a._e.join('|'));
    await ctx.close(); }
  // ── 3. PM hours over days nobody reported ──
  { const ctx = await b.newContext({ timezoneId:'Africa/Cairo', serviceWorkers:'block' });
    const a = await ctx.newPage(); a._e=[]; a.on('pageerror', e=>a._e.push(e.message));
    await a.goto('http://localhost:8801/test.html'); await sleep(1100);
    const r = await a.evaluate(() => { const T = window.__TB__, D = T.days();
      // Fieran pump 0: reported in service on 1 Sep and 5 Sep only
      ['2026-09-01','2026-09-05'].forEach(d => { D[d] = D[d] || T.getDay(d); D[d] = JSON.parse(JSON.stringify(T.getDay(d))); D[d].tbs.fieran.dps[0] = 'in'; });
      return T.pumpPM ? T.pumpPM('fieran', 10, '2026-09-05') : null; });
    check('PM hours: 2 reports 4 days apart count 5 days running (3 estimated), not 2', r && r.run === 120 && r.est === 3, JSON.stringify(r && { run:r.run, est:r.est }));
    const r2 = await a.evaluate(() => window.__TB__.pumpPM('fieran', 10, '2026-09-30'));
    check('PM hours: silence after the last report is carried 7 days at most', r2 && r2.run === 120 + 7 * 24, JSON.stringify(r2 && { run:r2.run, est:r2.est }));
    await ctx.close(); }
  // ── 4. rules: document id must match the battery inside ──
  { const ctx = await b.newContext({ serviceWorkers:'block' }); const p = await ctx.newPage();
    await p.goto('http://localhost:8801/test_tb.html'); await sleep(900);
    const r = await p.evaluate(async () => { const f = firebase.firestore(), o = {};
      try { await f.collection('tbReadings').doc('2030-01-01__tb6_1').set({ date:'2030-01-01', battery:'tb6_2' }, { merge:true }); o.squat = 'allowed'; } catch(e){ o.squat = e.code; }
      try { await f.collection('tbReadings').doc('2030-01-01__tb6_2').set({ date:'2030-01-01', battery:'tb6_2' }, { merge:true }); o.own = 'allowed'; } catch(e){ o.own = e.code; }
      return o; });
    check('Rules (stub): cannot create another battery\'s document under own name; own still fine', r.squat === 'permission-denied' && r.own === 'allowed', JSON.stringify(r));
    await ctx.close(); }
  await b.close();
  console.log('\n' + pass + ' passed, ' + fail + ' failed');
})();
