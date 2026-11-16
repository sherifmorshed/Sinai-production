const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
let pass=0, fail=0; const check=(n,ok,d)=>{ ok?pass++:fail++; console.log((ok?'PASS ':'FAIL ')+n+(d?'  — '+d:'')); };
const sleep = ms => new Promise(r=>setTimeout(r,ms));
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ timezoneId:'Africa/Cairo', serviceWorkers:'block', viewport:{width:1200,height:900} });
  const a = await ctx.newPage(); a._e=[]; a.on('pageerror', e=>a._e.push(e.message));
  await a.goto('http://localhost:8801/test.html'); await sleep(1000);
  await a.evaluate(() => { document.querySelector('#appTabs button[data-tab="tb"]').click(); window.__TB__.setDate('2026-11-10'); }); await sleep(400);
  const heads = await a.evaluate(() => [...document.querySelectorAll('#tbArea .tb-panel')].filter(p => p.querySelector('.tb-tbl')).map(p => p.querySelector('h3').textContent + '=' + p.querySelector('.tb-tbl th.tb-grp5').innerText.replace(/\s+/g,' ')).join(' | '));
  check('Sep. pressure on 6/1, 6/2, 8/1, 8/2; 10/1 keeps chemical injection', /T\.B\. 6\/1=Sep\. pressure/i.test(heads) && /T\.B\. 6\/2=Sep\. pressure/i.test(heads) && /T\.B\. 8\/1=Sep\. pressure/i.test(heads) && /T\.B\. 8\/2=Sep\. pressure/i.test(heads) && /T\.B\. 10\/1=Chem\. inj\./i.test(heads), heads);
  const cnt = await a.evaluate(() => ({ e61:document.querySelectorAll('#tbArea input[data-tb="tb6_1"][data-k="e"]').length, x61:document.querySelectorAll('#tbArea input[data-tb="tb6_1"][data-k="x"]').length,
    x101:document.querySelectorAll('#tbArea input[data-tb="tb10_1"][data-k="x"]').length, e101:document.querySelectorAll('#tbArea input[data-tb="tb10_1"][data-k="e"]').length,
    st:document.querySelectorAll('#tbArea .tb-station input[data-k="e"], #tbArea .tb-station input[data-k="x"]').length }));
  check('6/1: a sep. pressure box at each of the 9 readings, no chemical boxes; 10/1 chemical unchanged; stations untouched', cnt.e61 === 9 && cnt.x61 === 0 && cnt.x101 > 0 && cnt.e101 === 0 && cnt.st === 0, JSON.stringify(cnt));
  const E = (id, i) => '#tbArea input[data-tb="' + id + '"][data-k="e"][data-i="' + i + '"]';
  await a.fill(E('tb8_1', 0), '55'); await a.fill(E('tb8_1', 3), '57.5');
  await a.fill('#tbArea input[data-tb="tb8_1"][data-k="s"][data-i="3"]', '2000'); await sleep(1600);
  const st = await a.evaluate(() => { const S = window.__STUB__.store; return { d:(S['tbReadings/2026-11-10__tb8_1'] || {}).rows, prev:(S['tbReadings/2026-11-09__tb8_1'] || {}).rows }; });
  check('Saved as rows[i].e; the 05:00 value is shared with the day before like line pressure', st.d['0'].e === 55 && st.d['3'].e === 57.5 && st.prev && st.prev['8'].e === 55, JSON.stringify({ d0:st.d['0'], d3:st.d['3'], p8:st.prev && st.prev['8'] }));
  // readings WhatsApp
  const msg = await a.evaluate(() => document.querySelector('.rd-wa[data-rbat="tb8_1"] .ms-msg').textContent);
  check('Readings WhatsApp: Sep. pressure line, no chemical', /\*Sep\. pressure :\* 57\.5 psi/.test(msg) && !/Chemical/.test(msg), msg.split('\n').filter(x => /Sep|Chem|Line/.test(x)).join(' | '));
  // admin tabs
  const subs = await a.evaluate(() => [...document.querySelectorAll('#tbSubTabs button')].map(x => x.getAttribute('data-sub')).join(','));
  check('Admin: no Chemical injection tab', !/chem/.test(subs), subs);
  // follow-up and export
  const fu = await a.evaluate(() => { const s = window.__FOLLOW__.data('2026-11-10').sites; return { r81:s.find(x => x.b.id === 'tb8_1').parts[0].miss.map(m => m.h + ':' + m.what.join('/')).join(' ; '), r101:s.find(x => x.b.id === 'tb10_1').parts[0].miss.slice(0, 3).map(m => m.what.join('/')).join(' ; ') }; });
  check('Follow-up asks 6/1–8/2 for sep. pressure, 10/1 still for chemical', /sep\. pressure/.test(fu.r81) && !/chemical/.test(fu.r81) && /chemical/.test(fu.r101), JSON.stringify(fu).slice(0, 300));
  const bk = await a.evaluate(() => { const B = window.__FOLLOW__.book('2026-11'); const r = B.sheets[1][1]; return { head:r[0].join('|'), row:r.find(x => x[1] === 'T.B. 8/1' && x[2] === '14:00') }; });
  check('Monthly export: Sep. pressure column', /Temperature \(°C\)\|Sep\. pressure\|Chemical injection/.test(bk.head) && bk.row && bk.row[8] === 57.5, JSON.stringify(bk.row));
  check('No page errors', !a._e.length, a._e.join('|'));
  await ctx.close();
  // operator 6/2
  const c2 = await b.newContext({ serviceWorkers:'block', viewport:{width:412,height:915} });
  const p = await c2.newPage(); p._e=[]; p.on('pageerror', e=>p._e.push(e.message));
  await p.goto('http://localhost:8801/test_tb.html'); await sleep(1000);
  const h = await p.evaluate(() => document.querySelector('.tb-tbl th.tb-grp5').innerText.replace(/\s+/g,' '));
  check('Operator 6/2 sees Sep. pressure with its Arabic', /Sep\. pressure psi ضغط السيبريتور/i.test(h), h);
  const ov = await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  check('No page errors (operator)', !p._e.length, p._e.join('|'));
  await b.close();
  console.log('\n' + pass + ' passed, ' + fail + ' failed');
})();
