const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
let pass=0, fail=0; const check=(n,ok,d)=>{ ok?pass++:fail++; console.log((ok?'PASS ':'FAIL ')+n+(d?'  — '+d:'')); };
const sleep = ms => new Promise(r=>setTimeout(r,ms));
(async () => {
  const b = await chromium.launch();
  for (const f of ['test_tb.html', 'zz_tb101.html']) {
    const ctx = await b.newContext({ timezoneId:'Africa/Cairo', serviceWorkers:'block', viewport:{width:412,height:915} });
    await ctx.grantPermissions(['clipboard-read','clipboard-write']);
    const p = await ctx.newPage(); p._e=[]; p.on('pageerror', e=>p._e.push(e.message));
    await p.goto('http://localhost:8801/' + f); await sleep(1100);
    const tag = f === 'test_tb.html' ? ' [6/2]' : ' [10/1]';
    await p.evaluate(() => window.__TB__.setDate('2026-08-19')); await sleep(300);
    const r = await p.evaluate(() => ({ n:document.querySelectorAll('.ptab-read .rd-wa').length, chips:document.querySelectorAll('.rd-wa .ms-t').length,
      btns:[...document.querySelectorAll('.rd-wa button')].map(x => x.textContent).join('|') }));
    check('Readings: message block, no time buttons, only the copy button'+tag, r.n === 1 && r.chips === 0 && r.btns === 'نسخ الرسالة', JSON.stringify(r));
    const id = await p.evaluate(() => document.querySelector('.rd-wa').getAttribute('data-rbat'));
    const m = await p.evaluate(() => document.querySelector('.rd-wa .ms-msg').textContent);
    const scans = await p.evaluate(id => window.__TB__.getDay('2026-08-19').tbs[id].s.filter(v => v != null).length, id);
    check('Header: battery, "Readings — القراءات", date, time; no icons'+tag,
      /^\*Tank Battery \d+\/0\d\*\n\*Readings — القراءات\*\n\n\*Date : 19\/08\/2026\*\n\*Time : \d\d:00 (AM|PM)\*/.test(m) && !/[\u{1F300}-\u{1FAFF}]/u.test(m), m.slice(0, 120));
    const lines = m.split('\n').filter(x => /^\*\d\d:00 (AM|PM) :\* /.test(x));
    check('Every scanner reading of the day up to the latest, each with its production'+tag,
      lines.length === scans && lines.slice(1).every(x => / m³ · -?[\d,.]+ m³$/.test(x)), lines.length + ' of ' + scans + ' | ' + lines.slice(0, 3).join(' / '));
    check('Total production up to the latest reading'+tag, /\*Total production \(\d\d:00 (AM|PM) – \d\d:00 (AM|PM)( next day)?\) : -?[\d,.]+ m³\*/.test(m), m.split('\n').filter(x => /Total/.test(x)).join(''));
    // a new reading moves the message on: clear the last scanner, message falls back, put it back
    const offs = await p.evaluate(id => { const d = window.__TB__.getDay('2026-08-19').tbs[id]; let k = -1; d.s.forEach((v, i) => { if(v != null) k = i; }); return { k, v:d.s[k] }; }, id);
    await p.fill('.ptab-read input[data-tb="' + id + '"][data-k="s"][data-i="' + offs.k + '"]', ''); await sleep(300);
    const m2 = await p.evaluate(() => document.querySelector('.rd-wa .ms-msg').textContent);
    const l2 = m2.split('\n').filter(x => /^\*\d\d:00 (AM|PM) :\* /.test(x)).length;
    check('Removing the latest scanner: message drops back a round'+tag, l2 === scans - 1, l2 + '');
    await p.fill('.ptab-read input[data-tb="' + id + '"][data-k="s"][data-i="' + offs.k + '"]', String(offs.v)); await sleep(300);
    // the latest round's line pressure and temperature follow typing
    const o = offs.k * 3;
    await p.fill('.ptab-read input[data-tb="' + id + '"][data-k="c"][data-i="' + o + '"]', '41.5');
    await p.fill('.ptab-read input[data-tb="' + id + '"][data-k="w"][data-i="' + offs.k + '"]', '3.7'); await sleep(300);
    const m3 = await p.evaluate(() => document.querySelector('.rd-wa .ms-msg').textContent);
    check('Line pressure / temperature of the latest round, no icons'+tag, /\n\*Line pressure :\* 3\.7 (bar|psi)/.test(m3) && /\n\*Temperature :\* 41\.5 °C/.test(m3), m3.split('\n').filter(x => /Line|Temp/.test(x)).join(' | '));
    check('Chemical only on a six-hourly round'+tag, (o % 6 === 0) || !/Chemical/.test(m3), o + '');
    await p.click('.rd-wa button[data-rcp]'); await sleep(300);
    const clip = await p.evaluate(() => navigator.clipboard.readText());
    check('Copy puts the message on the clipboard'+tag, clip === m3);
    const ov = await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    check('No sideways scroll'+tag, ov);
    check('No page errors'+tag, !p._e.length, p._e.join('|'));
    if(f === 'test_tb.html') console.log('\n----- sample -----\n' + m3 + '\n------------------');
    await ctx.close();
  }
  const c2 = await b.newContext({ serviceWorkers:'block', viewport:{width:1100,height:900} });
  const a = await c2.newPage(); a._e=[]; a.on('pageerror', e=>a._e.push(e.message));
  await a.goto('http://localhost:8801/test.html'); await sleep(1000);
  await a.evaluate(() => { document.querySelector('#appTabs button[data-tab="tb"]').click(); window.__TB__.setDate('2026-08-19'); }); await sleep(400);
  const n = await a.evaluate(() => [...document.querySelectorAll('.rd-wa')].map(w => w.getAttribute('data-rbat')).join(','));
  check('Admin: a readings message on every tank battery (not stations)', n === 'tb6_1,tb6_2,tb8_1,tb8_2,tb10_1', n);
  check('No page errors (admin)', !a._e.length, a._e.join('|'));
  await b.close();
  console.log('\n' + pass + ' passed, ' + fail + ' failed');
})();
