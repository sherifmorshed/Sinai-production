// Every WhatsApp message: no line may START right-to-left (WhatsApp would set it on the right).
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
let pass=0, fail=0; const check=(n,ok,d)=>{ ok?pass++:fail++; console.log((ok?'PASS ':'FAIL ')+n+(d?'  — '+d:'')); };
const sleep = ms => new Promise(r=>setTimeout(r,ms));
// First strong character of a line: L (Latin etc.) → left; R/AL (Hebrew, Arabic incl. tatweel) → right.
const firstStrong = line => { for (const ch of line) { const c = ch.codePointAt(0);
  if (c === 0x200E) return 'L'; if (c === 0x200F) return 'R';
  if ((c >= 0x0590 && c <= 0x08FF) || (c >= 0xFB1D && c <= 0xFDFF) || (c >= 0xFE70 && c <= 0xFEFF)) return 'R';
  if (/\p{L}/u.test(ch)) return 'L'; } return 'N'; };
const rightLines = msg => msg.split('\n').filter(l => firstStrong(l) === 'R');
const neutralRules = msg => msg.split('\n').filter(l => /[━─—_~ـ]{5,}/.test(l) && firstStrong(l) !== 'L');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ timezoneId:'Africa/Cairo', serviceWorkers:'block', viewport:{width:1200,height:900} });
  const a = await ctx.newPage(); a._e=[]; a.on('pageerror', e=>a._e.push(e.message));
  await a.goto('http://localhost:8801/test.html'); await sleep(1000);
  await a.evaluate(() => { document.querySelector('#appTabs button[data-tab="tb"]').click(); window.__TB__.setDate('2026-08-19'); }); await sleep(400);
  // fill some station data so the messages have content, incl. an Arabic reason
  await a.click('.ptabs[data-ptabs="tb6_1"] button[data-ptab="pumps"]'); await sleep(150);
  await a.selectOption('select.ps-sel[data-tb="tb6_1"][data-k="u"][data-i="0"]', 'out'); await sleep(200);
  await a.fill('textarea.pd-why[data-tb="tb6_1"][data-i="0"]', 'عطل في الموتور'); await sleep(200);
  await a.click('.ptabs[data-ptabs="tb10_1"] button[data-ptab="h:tb2020"]'); await sleep(150);
  await a.click('.ptab-hosted .ms-t[data-mslot="0"]'); await sleep(100);
  await a.fill('.ptab-hosted input[data-tb="tb2020"][data-k="g"][data-i="0"]', '40'); await sleep(300);
  await a.click('.ptabs[data-ptabs="tb10_1"] button[data-ptab="meas"]'); await sleep(150);
  await a.click('.ptab-meas .ms-t[data-mslot="0"]'); await sleep(100);
  const mi = await a.evaluate(() => { const i = document.querySelector('.ptab-meas input[data-tb="tb10_1"][data-k="g"]'); return i ? i.getAttribute('data-i') : null; });
  if (mi) await a.fill('.ptab-meas input[data-tb="tb10_1"][data-k="g"][data-i="' + mi + '"]', '3.2');
  await sleep(500);
  const msgs = await a.evaluate(() => {
    const o = {};
    document.querySelectorAll('.rd-wa').forEach(w => o['Readings ' + w.getAttribute('data-rbat')] = w.querySelector('.ms-msg').textContent);
    document.querySelectorAll('.pd-wa').forEach(w => o['Station status ' + w.getAttribute('data-pdwa')] = w.querySelector('.ms-msg').textContent);
    document.querySelectorAll('.ms-wa:not(.rd-wa):not(.pd-wa)').forEach((w, i) => { const m = w.querySelector('.ms-msg'); if(m) o['Measurements #' + i] = m.textContent; });
    o['Machinery update'] = window.__MACH__.msg('2026-08-19');
    return o;
  });
  const names = Object.keys(msgs);
  check('Messages collected: readings, station status, 10/1 + 2020 measurements, machinery', names.length >= 14 && names.some(n => /Measurements/.test(n)) && names.some(n => /tb2020/.test(n)), names.join(', '));
  for (const n of names) {
    const r = rightLines(msgs[n]), nr = neutralRules(msgs[n]);
    check(n + ': every line starts left-to-right; separator lines anchored left', !r.length && !nr.length, (r.concat(nr)).slice(0, 3).map(l => JSON.stringify(l)).join(' | '));
  }
  const ar = msgs['Station status tb6_1'];
  check('Arabic text inside a line is kept (the reason), but the line still starts left', /عطل في الموتور/.test(ar), ar.split('\n').filter(l => /عطل/.test(l)).join(''));
  // mechanical PM work list
  const c2 = await b.newContext({ serviceWorkers:'block' }); const m = await c2.newPage();
  await m.goto('http://localhost:8801/test_mech.html'); await sleep(1100);
  const pmMsg = await m.evaluate(() => { const ta = document.createElement('textarea'); return null; });
  check('No page errors', !a._e.length, a._e.join('|'));
  await b.close();
  console.log('\n' + pass + ' passed, ' + fail + ' failed');
})();
