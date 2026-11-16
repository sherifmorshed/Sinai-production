const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
let pass=0, fail=0; const check=(n,ok,d)=>{ ok?pass++:fail++; console.log((ok?'PASS ':'FAIL ')+n+(d?'  — '+d:'')); };
const sleep = ms => new Promise(r=>setTimeout(r,ms));
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ timezoneId:'Africa/Cairo', serviceWorkers:'block', viewport:{width:412,height:915} });
  const a = await ctx.newPage(); a._e=[]; a.on('pageerror', e=>a._e.push(e.message));
  await a.goto('http://localhost:8801/test.html'); await sleep(1000);
  await a.evaluate(() => document.querySelector('#appTabs button[data-tab="tb"]').click()); await sleep(300);
  const I = (id, i) => '#tbArea input[data-tb="' + id + '"][data-k="s"][data-i="' + i + '"]';
  const day = (d, id) => a.evaluate(([d, id]) => { const c = window.__TB__.getDay(d).tbs[id], k = window.__TB__.calcDay(window.__TB__.getDay(d)).per[id]; return { s:c.s.slice(), prod:k.prod.slice(), total:k.total, neg:k.neg }; }, [d, id]);
  // Day 1 on 8/2: a normal day closing at 1,800
  await a.evaluate(() => window.__TB__.setDate('2026-11-10')); await sleep(200);
  const v1 = [1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800];
  for (let i = 0; i < 9; i++) await a.fill(I('tb8_2', i), String(v1[i]));
  await sleep(300);
  // Day 2: the scanner reset at 05:00 — before the operator types, the opening shows the day before's closing
  await a.evaluate(() => window.__TB__.setDate('2026-11-11')); await sleep(300);
  const before = await a.evaluate(() => document.querySelector('#tbArea input[data-tb="tb8_2"][data-k="s"][data-i="0"]').value);
  await a.fill(I('tb8_2', 0), '0'); await sleep(200);
  await a.fill(I('tb8_2', 1), '45'); await a.fill(I('tb8_2', 2), '95'); await sleep(300);
  const d1 = await day('2026-11-10', 'tb8_2'), d2 = await day('2026-11-11', 'tb8_2');
  check('8/2 reset day: typing 0 at 05:00 leaves the day before\'s closing (1,800) alone', before === '1800' && d1.s[8] === 1800 && d1.total === 800 && d1.neg === 0, 'shown before: ' + before + ' | day 1 closing ' + d1.s[8] + ' total ' + d1.total);
  check('8/2 reset day: production counts from 0 (45, then 50) — no negative interval', d2.s[0] === 0 && d2.prod[1] === 45 && d2.prod[2] === 50 && d2.neg === 0, JSON.stringify(d2.prod.slice(0, 3)));
  // The day before's closing corrected afterwards (pre-reset reading) does not overwrite today's 0
  await a.evaluate(() => window.__TB__.setDate('2026-11-10')); await sleep(200);
  await a.fill(I('tb8_2', 8), '1810'); await sleep(200);
  const d1b = await day('2026-11-10', 'tb8_2'), d2b = await day('2026-11-11', 'tb8_2');
  check('8/2: the day before\'s closing can be corrected without touching the reset 0', d1b.s[8] === 1810 && d2b.s[0] === 0, d1b.s[8] + ' / ' + d2b.s[0]);
  // A normal (no-reset) day on 8/2 still shares 05:00 both ways
  await a.evaluate(() => window.__TB__.setDate('2026-11-11')); await sleep(200);
  await a.fill(I('tb8_2', 8), '900'); await sleep(200);
  const d3 = await day('2026-11-12', 'tb8_2');
  check('8/2 normal day: the closing becomes the next opening as before', d3.s[0] === 900, String(d3.s[0]));
  await a.evaluate(() => window.__TB__.setDate('2026-11-13')); await sleep(200);
  await a.fill(I('tb8_2', 0), '1500'); await sleep(200);
  const d4 = await day('2026-11-12', 'tb8_2');
  check('8/2 normal day: a non-zero opening still goes back as the day before\'s closing', d4.s[8] === 1500, String(d4.s[8]));
  // After a reset, an EMPTY closing is not filled from the next day's 0
  await a.evaluate(() => window.__TB__.setDate('2026-11-14')); await sleep(200);
  await a.fill(I('tb8_2', 0), '0'); await sleep(200);
  const d5 = await day('2026-11-13', 'tb8_2');
  check('8/2: an empty closing before a reset stays empty (not filled with 0)', d5.s[8] === null || d5.s[8] === undefined, String(d5.s[8]));
  // Other batteries unchanged: a 0 opening on 6/1 still writes back
  await a.evaluate(() => window.__TB__.setDate('2026-11-11')); await sleep(200);
  await a.fill(I('tb6_1', 0), '0'); await sleep(200);
  const o = await day('2026-11-10', 'tb6_1');
  check('Only 8/2: on 6/1 the 05:00 is still one shared reading', o.s[8] === 0, String(o.s[8]));
  const note = await a.evaluate(() => [...document.querySelectorAll('.tb-reset-note')].map(n => n.closest('.tb-panel').querySelector('h3').textContent).join('|'));
  check('Reset note shown on 8/2 only', note === 'T.B. 8/2', note);
  // saved to the cloud documents as entered
  await sleep(1600);
  const st = await a.evaluate(() => { const S = window.__STUB__.store; const g = k => S['tbReadings/' + k] || {}; return { a:(g('2026-11-10__tb8_2').rows || {})['8'], b:(g('2026-11-11__tb8_2').rows || {})['0'] }; });
  check('Saved: day-before closing 1,810 and reset-day opening 0', JSON.stringify(st).includes('1810') && JSON.stringify(st.b).includes('0'), JSON.stringify(st));
  check('No page errors', !a._e.length, a._e.join('|'));
  await b.close();
  console.log('\n' + pass + ' passed, ' + fail + ' failed');
})();
