const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const fs = require('fs');
let pass=0, fail=0; const check=(n,ok,d)=>{ ok?pass++:fail++; console.log((ok?'PASS ':'FAIL ')+n+(d?'  — '+d:'')); };
const sleep = ms => new Promise(r=>setTimeout(r,ms));
(async () => {
  const b = await chromium.launch();
  for (const vp of [{width:412,height:915},{width:1200,height:900}]) {
  const tag = vp.width < 500 ? ' [phone]' : ' [desktop]';
  const ctx = await b.newContext({ timezoneId:'Africa/Cairo', serviceWorkers:'block', viewport:vp, acceptDownloads:true });
  await ctx.grantPermissions(['clipboard-read','clipboard-write']);
  const a = await ctx.newPage(); a._e=[]; a.on('pageerror', e=>a._e.push(e.message));
  // 15:10 on a fresh shift day: rounds 05,08,11,14 are due for a 05:00 battery
  await a.clock.install({ time:new Date('2026-11-16T15:10:00+02:00') });
  await a.goto('http://localhost:8801/test.html'); await a.clock.runFor(1500);
  await a.evaluate(() => document.querySelector('#appTabs button[data-tab="tb"]').click()); await a.clock.runFor(400);
  const badge0 = await a.evaluate(() => (document.querySelector('#tbSubTabs button[data-sub="follow"] .pdot') || {}).textContent);
  check('Follow-up tab carries a count of sites behind today'+tag, badge0 === '8', String(badge0));
  await a.evaluate(() => document.querySelector('#tbSubTabs button[data-sub="follow"]').click()); await a.clock.runFor(400);
  const d0 = await a.evaluate(() => { const D = window.__FOLLOW__.data('2026-11-16'); const s = D.sites.find(x => x.b.id === 'tb6_1');
    return { behind:D.behind, n:D.sites.length, read:s.parts[0], st:s.parts.find(p => p.name === 'Station status') }; });
  check('Nothing entered at 15:10: 6/1 has 4 reading rounds due and missing (05,08,11,14), status not reported'+tag,
    d0.n === 8 && d0.read.due === 4 && d0.read.miss.map(x => x.h).join(',') === '05:00,08:00,11:00,14:00' && d0.st.miss[0].what[0] === 'not reported', JSON.stringify(d0.read.miss.map(x => x.h)));
  const t10 = await a.evaluate(() => { const s = window.__FOLLOW__.data('2026-11-16').sites; const x = s.find(q => q.b.id === 'tb10_1'), y = s.find(q => q.b.id === 'tb2020'), w = s.find(q => q.b.id === 'wdp');
    return { r:x.parts[0].miss.map(m => m.h).join(','), m:x.parts.find(p => p.name === 'Station measurements').miss.map(m => m.h).join(','), m2:y.parts.map(p => p.name).join(','), w:w.parts.map(p => p.name).join(',') }; });
  check('10/1 (06:00 start): readings 06,09,12 and measurements 05,09,12 (15:00 not due until 15:30); 2020 and W.D. Plant have their own parts'+tag,
    t10.r === '06:00,09:00,12:00' && t10.m === '05:00,09:00,12:00' && t10.m2 === 'Station measurements,Station status' && t10.w === 'Station status,Pump readings', JSON.stringify(t10));
  // enter 6/1's 05:00 and 08:00 fully and its station status
  await a.evaluate(() => document.querySelector('#tbSubTabs button[data-sub="entry"]').click()); await a.clock.runFor(300);
  const I = (k, i) => '#tbArea input[data-tb="tb6_1"][data-k="' + k + '"][data-i="' + i + '"]';
  await a.fill(I('s', 0), '1000'); await a.fill(I('w', 0), '150'); await a.fill(I('c', 0), '30'); await a.fill(I('x', 0), '5');
  await a.fill(I('s', 1), '1040'); await a.fill(I('w', 1), '151'); await a.fill(I('c', 3), '31');
  await a.fill(I('s', 3), '1100');
  await a.evaluate(() => { const p = document.querySelector('.ptabs[data-ptabs="tb6_1"] button[data-ptab="pumps"]'); p.click(); });
  await a.clock.runFor(200);
  await a.evaluate(() => document.querySelector('button[data-pdcopy="tb6_1"]') && 0);
  const nSel = await a.evaluate(() => document.querySelectorAll('.tb-panel select.ps-sel[data-tb="tb6_1"][data-k="u"]').length);
  for (let i = 0; i < nSel; i++) { await a.selectOption('select.ps-sel[data-tb="tb6_1"][data-k="u"][data-i="' + i + '"]', 'sb'); await a.clock.runFor(120); }
  await a.clock.runFor(1500);
  await a.evaluate(() => document.querySelector('#tbSubTabs button[data-sub="follow"]').click()); await a.clock.runFor(400);
  const d1 = await a.evaluate(() => { const s = window.__FOLLOW__.data('2026-11-16').sites.find(x => x.b.id === 'tb6_1');
    return { read:s.parts[0], st:s.parts.find(p => p.name === 'Station status'), last:s.last, card:[...document.querySelectorAll('.fu-card')].find(c => /T\.B\. 6\/1/.test(c.innerText)).innerText.replace(/\s+/g,' ') }; });
  check('After entering: 05:00 and 08:00 complete; 11:00 missing all; 14:00 missing line pressure + temperature only'+tag,
    d1.read.done === 2 && d1.read.miss.length === 2 && d1.read.miss[0].h === '11:00' && d1.read.miss[0].what.join(',') === 'scanner,line pressure,temperature,chemical' &&
    d1.read.miss[1].h === '14:00' && d1.read.miss[1].what.join(',') === 'line pressure,temperature', JSON.stringify(d1.read.miss));
  check('Station status reported clears its line; card shows who saved last'+tag, d1.st.miss.length === 0 && !!d1.last && /2 \/ 4 due/.test(d1.card) && /last saved 16 Nov/.test(d1.card), d1.card.slice(0, 260));
  const order = await a.evaluate(() => [...document.querySelectorAll('.fu-card .pchip')].map(x => x.textContent).join('|'));
  check('Sites behind are listed first, with their count'+tag, /^\d+ missing/.test(order), order);
  check('No "Copy missing list" button'+tag, await a.evaluate(() => !document.getElementById('tbFuCopy')));
  // time moves on: 17:00 round becomes due at 17:30
  await a.clock.setFixedTime(new Date('2026-11-16T17:40:00+02:00')); await a.evaluate(() => document.querySelector('#tbSubTabs button[data-sub="follow"]').click());
  const d2 = await a.evaluate(() => window.__FOLLOW__.data('2026-11-16').sites.find(x => x.b.id === 'tb6_1').parts[0].due);
  check('The clock moves what is due (5 rounds by 17:40)'+tag, d2 === 5, String(d2));
  // a past day expects everything
  const d3 = await a.evaluate(() => { const s = window.__FOLLOW__.data('2026-08-19').sites.find(x => x.b.id === 'tb6_2'); return { due:s.parts[0].due, miss:s.parts[0].miss.length }; });
  check('A past day expects all 9 rounds'+tag, d3.due === 9, JSON.stringify(d3));
  // monthly export
  const book = await a.evaluate(() => { const B = window.__FOLLOW__.book('2026-08'); return { names:B.sheets.map(s => s[0]), days:B.days,
    prodHead:B.sheets[0][1][0], prodRows:B.sheets[0][1].length, last:B.sheets[0][1][B.sheets[0][1].length - 1],
    read:B.sheets[1][1].length, readRow:B.sheets[1][1][1], stat:B.sheets[2][1].length, statRow:B.sheets[2][1][1], oos:B.sheets[B.sheets.length - 2][1].length, m101:B.sheets[3][1].length }; });
  check('Month workbook: 7 sheets'+tag, book.names.join('|') === 'Daily production|Readings|Station status|Meas T.B. 10-1|Meas T.B. 2020|Out of service|Remarks', book.names.join('|'));
  check('Daily production: a row per day of August + month total, one column per battery'+tag, book.prodRows === 33 && book.prodHead.length === 7 && book.last[0] === 'Month total' && book.last[6] !== 0, JSON.stringify(book.last));
  check('Readings, station status, measurements and stoppages are filled'+tag, book.read > 50 && book.stat > 20 && book.oos > 1 && book.m101 > 1 && book.readRow.length === 10 && book.statRow.length === 9, JSON.stringify([book.read, book.stat, book.oos, book.m101]));
  const total = await a.evaluate(() => { const T = window.__TB__, B = window.__FOLLOW__.book('2026-08'); const row = B.sheets[0][1].find(r => r[0] === '2026-08-19'); const c = T.calcDay(T.getDay('2026-08-19'));
    return { sheet:row[1], app:Math.round(c.per.tb6_1.total * 100) / 100 }; });
  check('Workbook figure equals the app\'s day total'+tag, total.sheet === total.app, JSON.stringify(total));
  await a.fill('#tbFuMonth', '2026-08');
  const dl = a.waitForEvent('download', { timeout:10000 }).catch(() => null);
  await a.click('#tbFuXlsx'); await a.clock.runFor(1500); const d = await dl;
  let size = 0; if(d){ const pth = '/tmp/claude-0/-home-claude/b45674f8-21e3-53ef-b99c-c6655164ac00/scratchpad/' + d.suggestedFilename(); await d.saveAs(pth); size = fs.statSync(pth).size; }
  check('Export month downloads SinaiField_2026-08.xlsx'+tag, !!d && d.suggestedFilename() === 'SinaiField_2026-08.xlsx' && size > 8000, d && d.suggestedFilename() + ' ' + size);
  const ov = await a.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  check('No sideways scroll'+tag, ov);
  check('No page errors'+tag, !a._e.length, a._e.join('|'));
  await ctx.close();
  }
  // operators never get it
  { const c = await b.newContext({ serviceWorkers:'block' }); const p = await c.newPage(); await p.goto('http://localhost:8801/test_tb.html'); await sleep(900);
    const t = await p.evaluate(() => ({ sub:document.getElementById('tbSubTabs').style.display, page:document.getElementById('tb-page-follow').style.display }));
    check('Operators have no Follow-up', t.sub === 'none' && t.page === 'none', JSON.stringify(t)); await c.close(); }
  await b.close();
  console.log('\n' + pass + ' passed, ' + fail + ' failed');
})();
