const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
let pass=0, fail=0; const check=(n,ok,d)=>{ ok?pass++:fail++; console.log((ok?'PASS ':'FAIL ')+n+(d?'  — '+d:'')); };
const sleep = ms => new Promise(r=>setTimeout(r,ms));
const U = f => 'http://localhost:8801/' + f;
(async () => {
  const b = await chromium.launch();
  async function open(f, vp, extra){ const ctx = await b.newContext(Object.assign({ timezoneId:'Africa/Cairo', serviceWorkers:'block', viewport:vp||{width:412,height:915} }, extra||{}));
    const p = await ctx.newPage(); p._e=[]; p.on('pageerror', e=>p._e.push(e.message)); p.on('dialog', d => d.accept()); await p.goto(U(f)); await p.waitForTimeout(800); return p; }
  const cloud = (p, k) => p.evaluate(kk => JSON.parse(JSON.stringify(window.__STUB__.store[kk] || null)), k);

  // ── every account loads clean ──
  for (const [f, want] of [['test.html',/T\.B\./],['test_plant.html',/day/],['test_petreco.html',/PETRECO/],['test_pf.html',/PETRECO/],
                           ['test_tb.html',/T\.B\. day/],['zz_tb101.html',/T\.B\. day/],['test_empty.html',/no readings yet/],['test_viewer.html',/no access/i],
                           ['test_hist.html',/119/],['test_hist_rg.html',/119/],['test_stray.html',/T\.B\./]]) {
    const p = await open(f);
    const r = await p.evaluate(() => ({ f: document.getElementById('cloud-sync-status').textContent.trim(), d: window.__IO__.denied.length }));
    check(f + ' loads, nothing refused, no errors', want.test(r.f) && r.d === 0 && !p._e.length, r.f + ' / denied ' + r.d + ' ' + p._e.join('|'));
    await p.context().close();
  }

  // ── a Belayim battery (6/2): readings tab, station status tab ──
  { const p = await open('test_tb.html');
    await p.evaluate(() => window.__TB__.setDate('2026-08-20')); await sleep(200);
    const t = await p.evaluate(() => ({ tabs:[...document.querySelectorAll('.ptabs button')].map(x => x.childNodes[0].textContent.trim()).join('|'),
      head:[...document.querySelectorAll('.ptab-read thead th')].map(x => x.childNodes[0].textContent.trim()).join('|') }));
    check('6/2: two tabs, القراءات and وضع المحطة', t.tabs === 'القراءات|وضع المحطة', t.tabs);
    check('6/2 readings: no pump columns any more', t.head === 'Time|Scanner|Production|Line pressure|Temp|Sep. pressure', t.head);
    await p.fill('input[data-tb="tb6_2"][data-k="s"][data-i="5"]', '84830');
    await p.fill('input[data-tb="tb6_2"][data-k="c"][data-i="15"]', '41');
    await p.fill('input[data-tb="tb6_2"][data-k="e"][data-i="6"]', '62.5');
    await p.fill('#tbArea textarea[data-k="r"]', 'Test remark'); await sleep(1500);
    let d = await cloud(p, 'tbReadings/2026-08-20__tb6_2');
    check('6/2: scanner, temperature, sep. pressure and remark save', d.rows['5'].s === 84830 && d.temp['15'] === 41 && d.rows['6'].e === 62.5 && d.remarks === 'Test remark', JSON.stringify(d.rows['6']));
    const hd = await p.evaluate(() => ({ today:getComputedStyle(document.querySelector('.hd .tot .v')).color, yest:getComputedStyle(document.querySelector('.hd .ytot .v')).color,
      lt:document.querySelector('.hd .tot .lb').textContent, ly:document.querySelector('.hd .ytot .lb').textContent }));
    check('Header: TODAY green, YESTERDAY grey', hd.lt === 'Today' && hd.ly === 'Yesterday' && hd.today !== hd.yest && /^rgb\(29, 107, 63\)$/.test(hd.today), JSON.stringify(hd));
    await p.evaluate(() => window.__TB__.setDate('2026-08-21')); await sleep(200);
    await p.click('.ptabs button[data-ptab="pumps"]'); await sleep(200);
    const s = await p.evaluate(() => ({ groups:[...document.querySelectorAll('.pd-g')].map(x => x.textContent).join('|'),
      names:[...document.querySelectorAll('.pd-row .nm')].map(x => x.textContent).join('|'),
      comp:[...document.querySelector('.pd-row select[data-i="4"]').options].map(o => o.textContent).join('/'),
      hint:(document.querySelector('.pd-y')||{}).textContent, ar:(document.querySelector('.ms-wa-ar')||{}).textContent,
      btn:(document.querySelector('[data-pdcp]')||{}).textContent }));
    check('6/2 station: boosters, Borets, compressors, fire fighting', s.groups === 'BOOSTER PUMPS|BORETS PUMPS|COMPRESSORS|FIRE FIGHTING', s.groups);
    check('6/2 compressors: Vertical, Horizontal, Diesel; fire: 2 jockey, 2 diesel',
          /Vertical Compressor\|Horizontal Compressor\|Diesel Compressor\|Jockey Pump 1\|Jockey Pump 2\|Diesel Pump 1\|Diesel Pump 2$/.test(s.names), s.names);
    check('Compressors read the same words as pumps: في الخدمة / احتياطي / خارج الخدمة', s.comp === '—/في الخدمة/احتياطي/خارج الخدمة', s.comp);
    check('First daily day: yesterday from the last three-hour reading', /أمس/.test(s.hint || ''), s.hint);
    check('WhatsApp box: the Arabic instruction and the button', /انسخ الرسالة وابعتها على جروب الشغل/.test(s.ar || '') && s.btn === 'نسخ الرسالة للجروب', s.ar + ' / ' + s.btn);
    await p.click('.pd-copy'); await sleep(300);
    await p.selectOption('.pd-card select[data-i="5"]', 'out'); await sleep(300);
    check('Out of service: reason opens with the cursor in it', await p.evaluate(() => document.activeElement && document.activeElement.classList.contains('pd-why')));
    await p.keyboard.type('Starter fault'); await sleep(200);
    await p.selectOption('.pd-card select[data-i="7"]', 'sb'); await sleep(1500);
    d = await cloud(p, 'tbReadings/2026-08-21__tb6_2');
    check('Saved for the day', d.pumpsDaily['0'] === 'in' && d.pumpsDaily['3'] === 'out' && d.pumpsDaily['5'] === 'out' && d.pumpsDailyWhy['5'] === 'Starter fault' && d.pumpsDaily['7'] === 'sb',
          JSON.stringify(d.pumpsDaily));
    const m = await p.evaluate(() => document.querySelector('.pd-wa .ms-msg').textContent);
    check('Message headed Tank Battery 6/02, groups and reasons', /^\*`Tank Battery 6\/02`\*/.test(m) && /`COMPRESSORS`[\s\S]*\*Horizontal Compressor : Out of service — Starter fault\*/.test(m) &&
          /\*Borets B : Out of service since 14\/08/.test(m) && /\*Jockey Pump 1 : Off\*/.test(m), m.split('\n').slice(0,4).join(' / '));
    check('Tab badge counts what is out', await p.evaluate(() => (document.querySelector('.ptabs .pdot')||{}).textContent) === '2');
    check('No page errors (6/2)', !p._e.length, p._e.join('|'));
    await p.context().close(); }

  // ── 10/1: three tabs, measurements, station status ──
  { const p = await open('zz_tb101.html', null, { permissions:['clipboard-read','clipboard-write'] });
    await p.evaluate(() => window.__TB__.setDate('2026-08-19')); await sleep(200);
    check('10/1: three tabs + T.B. 2020', await p.evaluate(() => [...document.querySelectorAll('.ptabs button')].map(x => x.childNodes[0].textContent.trim()).join('|')) === 'القراءات|مقاسات المحطة|وضع المحطة|T.B. 2020');
    await p.click('.ptabs button[data-ptab="meas"]'); await sleep(200); await p.click('.ms-t[data-mslot="2"]'); await sleep(200);
    const mm = await p.evaluate(() => ({ msg:document.querySelector('.ptab-meas .ms-msg').textContent, ar:document.querySelector('.ptab-meas .ms-wa-ar').textContent }));
    check('Measurements message intact, with the Arabic instruction', /\*`Tank Battery 10\/01`\*/.test(mm.msg) && /\*TK_7 : 1\.10 m\*/.test(mm.msg) && /`SIGMA HEATERS`/.test(mm.msg) && /جروب الشغل/.test(mm.ar));
    await p.click('.ptabs button[data-ptab="pumps"]'); await sleep(200);
    const sm = await p.evaluate(() => document.querySelector('.ptab-pumps .pd-wa .ms-msg').textContent);
    const g101 = await p.evaluate(() => [...document.querySelectorAll('.ptab-pumps .pd-g')].map(x => x.textContent).join('|'));
    check('10/1: waste water and oil room pumps after high pressure', g101 === 'TRANSFER PUMPS|HIGH PRESSURE PUMPS|WASTE WATER PUMPS|OIL ROOM PUMPS|HEATERS|COMPRESSORS|FIRE FIGHTING', g101);
    check('10/1: Waste Water Pump A–C and Oil Room Pump A–B listed', await p.evaluate(() => ['Waste Water Pump A','Waste Water Pump B','Waste Water Pump C','Oil Room Pump A','Oil Room Pump B']
      .every(n => [...document.querySelectorAll('.pd-row .nm')].some(x => x.textContent === n))));
    check('10/1 station message headed 10/01', /^\*`Tank Battery 10\/01`\*/.test(sm) && /`HEATERS`/.test(sm));
    await p.click('button[data-pdcp]'); await sleep(300);
    check('Copy puts it on the clipboard', /Station Status/.test(await p.evaluate(() => navigator.clipboard.readText())));
    check('No page errors (10/1)', !p._e.length, p._e.join('|'));
    await p.context().close(); }

  // ── admin ──
  { const p = await open('test.html', { width:1100, height:900 });
    await p.evaluate(() => { document.querySelector('#appTabs button[data-tab="tb"]').click(); window.__TB__.setDate('2026-08-20'); }); await sleep(300);
    const tabs = await p.evaluate(() => [...document.querySelectorAll('#tbArea .tb-panel')].map(pn => pn.querySelectorAll('.ptabs button').length).join(','));
    check('Admin Entry: tabs on every battery (2,2,2,2,4 with T.B. 2020), W.D. Plant panel without tabs', tabs === '2,2,2,2,4,0', tabs);
    await p.evaluate(() => document.querySelector('#tbSubTabs button[data-sub="pumps"]').click()); await sleep(700);
    const r = await p.evaluate(() => ({ sum:document.querySelectorAll('#tbPumpSummary .prow').length, reg:!!document.getElementById('tbPumpRegister'),
      oos:!!document.getElementById('tbPumpOOS'), cards:document.querySelectorAll('#tb-page-pumps .pm-card').length,
      subs:[...document.querySelectorAll('#tbSubTabs button')].map(b => b.getAttribute('data-sub')).join(',') }));
    check('Pumps tab: the situation only (5 batteries + T.B. 2020 + W.D. Plant + Fieran), no hours / stoppage / PM', r.sum === 8 && !r.reg && !r.oos && r.cards === 0, JSON.stringify(r));
    check('Admin has no PM or Chemical injection tab; Machinery update is there', r.subs === 'entry,old,view,temp,pumps,mach,fieran,follow', r.subs);
    // Machinery daily update
    await p.evaluate(() => { window.__TB__.setDate('2026-08-21'); document.querySelector('#tbSubTabs button[data-sub="mach"]').click(); }); await sleep(700);
    const m = await p.evaluate(() => ({ vis:document.getElementById('tb-page-mach').style.display, card:!!document.querySelector('#tbMachCard .mdcard'),
      kp:[...document.querySelectorAll('#tbMachCard .kp b')].map(b => b.textContent).join('|'),
      outs:[...document.querySelectorAll('#tbMachCard tr.alarm')].map(t => t.innerText.replace(/\s+/g,' ')).join(' / '),
      bats:[...document.querySelectorAll('#tbMachCard .site-h .nm')].map(h => h.textContent).join('|'),
      msg:window.__MACH__.msg('2026-08-21') }));
    check('Machinery update: card with KPIs (102 items, availability)', m.vis === '' && m.card && /^102\|/.test(m.kp) && /%$/.test(m.kp), m.kp);
    check('Machinery update: out of service with since, days and reason', /Borets B 14 Aug 8 Motor tripped/.test(m.outs) && /Transfer 6/.test(m.outs), m.outs.slice(0, 160));
    check('Machinery update: every battery in its own block', ['T.B. 6/1','T.B. 6/2','T.B. 8/1','T.B. 8/2','T.B. 10/1','T.B. 2020','Water Disposal Plant','Fieran Terminal'].every(n => m.bats.includes(n)), m.bats);
    check('Machinery update: WhatsApp text', /\*Sinai Field — Machinery Daily Update\*/.test(m.msg) && /🔴 \*Out of service\*/.test(m.msg) && /T\.B\. 6\/2 — Borets B: since 14 Aug \(8 d\)/.test(m.msg) && /Booster: ✅/.test(m.msg) && /🛠 \*PM\*/.test(m.msg), m.msg.split('\n').slice(0,6).join(' ⏎ '));
    const ch = await p.evaluate(() => { const out = []; ['2026-08-15','2026-08-16','2026-08-17','2026-08-18','2026-08-19','2026-08-20'].forEach(d => { const D = window.__MACH__.data(d); D.changes.forEach(c => out.push(d + ' ' + c.b.name + ' ' + c.pm.name + ' ' + c.from.k + '>' + c.to.k)); }); return out; });
    check('Machinery update: changes since yesterday are picked up', ch.length > 0, ch.slice(0,3).join(' | '));
    const mp = await p.evaluate(async () => (await window.__REPORT__.pdfFromHTML(window.__MACH__.doc())).size);
    check('Machinery update: PDF builds', mp > 100000, mp + ' bytes');
    // report card fits; PDFs build
    const pdf = await p.evaluate(async () => { window.__TB__.setDate('2026-08-19');
      return [(await window.__RG.makePdfBlob()).size, (await window.__REPORT__.pdfFromHTML(window.__TB__.reportHTML(window.__TB__.getDay('2026-08-19')))).size,
              (await window.__REPORT__.pdfFromHTML(window.__TB__.oldDoc())).size]; });
    check('All three PDFs build', pdf.every(x => x > 100000), pdf.join(' / '));
    check('No page errors (admin)', !p._e.length, p._e.join('|'));
    await p.context().close(); }
  { const p = await open('test.html', { width:412, height:915 });
    await p.evaluate(() => { document.querySelector('#appTabs button[data-tab="tb"]').click(); window.__TB__.setDate('2026-08-19'); document.querySelector('#tbSubTabs button[data-sub="old"]').click(); }); await sleep(900);
    const m = await p.evaluate(() => { const r = document.getElementById('tbOldCardFit').getBoundingClientRect(); return { top:r.top, bottom:r.bottom, win:innerHeight }; });
    check('Report card still fits a phone screen', m.top >= 0 && m.bottom <= m.win + 2, JSON.stringify(m));
    await p.context().close(); }

  // ── PETRECO drains, R/G ──
  { const p = await open('test_pf.html');
    await p.evaluate(() => { document.querySelector('#appTabs button[data-tab="pf"]').click(); window.__PF__.setDate('2026-08-20'); });
    const prev = await p.evaluate(() => window.__PF__.getDay('2026-08-20').meters.pgb1.r[5]);
    await p.fill('input[data-pf="pgb1"][data-kind="r"][data-k="6"]', String(prev + 333)); await sleep(200);
    check('PETRECO drains: difference worked out from the readings', await p.evaluate(() => document.querySelector('#pfArea tr[data-pfrow="r6"] td:nth-child(3) .pf-dq').textContent) === '+333');
    await p.context().close(); }
  { const p = await open('test_petreco.html');
    await p.evaluate(() => window.__RG.setDate('2026-08-20'));
    await p.fill('#rgTableArea input[data-rg="p"][data-i="5"]', '9.5'); await sleep(1500);
    check('R/G: a reading saves', (await cloud(p,'rasGara/2026-08-20')).rows['5'].p === 9.5);
    await p.context().close(); }

  // ── night mode ──
  { const p = await open('test.html');
    const t0 = await p.evaluate(() => ({ mode: window.__THEME__.mode(), light: document.body.classList.contains('light-mode') }));
    check('Theme starts in Day', t0.mode === 'light' && t0.light, JSON.stringify(t0));
    await p.click('#themeToggleBtn'); await sleep(100);
    const t1 = await p.evaluate(() => ({ mode: window.__THEME__.mode(), light: document.body.classList.contains('light-mode'), icon: document.querySelector('#themeToggleBtn use').getAttribute('href') }));
    check('Tap 1: Night', t1.mode === 'dark' && !t1.light && t1.icon === '#i-moon', JSON.stringify(t1));
    await p.click('#themeToggleBtn'); await sleep(100);
    const t2 = await p.evaluate(() => { const h = new Date().getHours(); return { mode: window.__THEME__.mode(), light: document.body.classList.contains('light-mode'),
      icon: document.querySelector('#themeToggleBtn use').getAttribute('href'), night: h >= 18 || h < 6 }; });
    check('Tap 2: Auto — dark at night, light in the day, by the clock', t2.mode === 'auto' && t2.icon === '#i-auto' && t2.light === !t2.night, JSON.stringify(t2));
    await p.click('#themeToggleBtn'); await sleep(100);
    check('Tap 3: back to Day', await p.evaluate(() => window.__THEME__.mode() === 'light' && document.body.classList.contains('light-mode')));
    await p.click('#themeToggleBtn'); await sleep(100); await p.click('#themeToggleBtn'); await sleep(100);
    await p.reload(); await p.waitForTimeout(800);
    check('The choice is remembered on the device', await p.evaluate(() => window.__THEME__.mode()) === 'auto');
    await p.context().close(); }

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  await b.close(); process.exit(fail ? 1 : 0);
})();
