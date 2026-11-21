const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
let pass=0, fail=0; const check=(n,ok,d)=>{ ok?pass++:fail++; console.log((ok?'PASS ':'FAIL ')+n+(d?'  — '+d:'')); };
const sleep = ms => new Promise(r=>setTimeout(r,ms));
(async () => {
  const b = await chromium.launch();
  for (const vp of [{width:412,height:915},{width:1200,height:900}]) {
  const tag = vp.width < 500 ? ' [phone]' : ' [desktop]';
  const ctx = await b.newContext({ timezoneId:'Africa/Cairo', serviceWorkers:'block', viewport:vp });
  const p = await ctx.newPage(); p._e=[]; p.on('pageerror', e=>p._e.push(e.message));
  await p.goto('http://localhost:8801/zz_tb101.html'); await sleep(1200);
  await p.evaluate(() => window.__TB__.setDate('2026-11-20')); await sleep(300);
  await p.click('.ptabs button[data-ptab="meas"]'); await sleep(200);
  await p.click('.ptab-meas .ms-t[data-mslot="0"]'); await sleep(200);
  const secs = await p.evaluate(() => [...document.querySelectorAll('.ptab-meas .ms-card .ms-h .sec')].map(x => x.textContent).join('|'));
  check('A HEATER TREATER section after SIGMA HEATERS'+tag, /SIGMA HEATERS\|HEATER TREATER\|/.test(secs), secs);
  const pickBtn = (label, v) => p.evaluate(([label, v]) => {
    const row = [...document.querySelectorAll('.ptab-meas .ms-heater2')].find(r => r.querySelector('.nm').textContent === label);
    row.querySelector('.ms-row .ms-pick button[data-v="' + v + '"]').click(); }, [label, v]);
  const burner = (heater, which, v) => p.evaluate(([heater, which, v]) => {
    const row = [...document.querySelectorAll('.ptab-meas .ms-heater2')].find(r => r.querySelector('.nm').textContent === heater);
    const bb = [...row.querySelectorAll('.ms-burner')].find(x => x.querySelector('.en').textContent === 'Burner ' + which);
    bb.querySelector('button[data-v="' + v + '"]').click(); }, [heater, which, v]);
  const nBurners = await p.evaluate(() => [...document.querySelectorAll('.ptab-meas .ms-heater2')].map(r => r.querySelector('.nm').textContent + ':' + r.querySelectorAll('.ms-burner').length).join(','));
  check('Each sigma heater shows Burner A and Burner B (on / off)'+tag, nBurners === 'Heater 1:2,Heater 2:2,Heater 4:2', nBurners);
  await pickBtn('Heater 1', 'on'); await sleep(250);
  await burner('Heater 1', 'A', 'on'); await sleep(150);
  await burner('Heater 1', 'B', 'off'); await sleep(150);
  await pickBtn('Heater 2', 'off'); await sleep(250);
  const off = await p.evaluate(() => [...document.querySelectorAll('.ptab-meas .ms-heater2')].find(r => r.querySelector('.nm').textContent === 'Heater 2').querySelectorAll('.ms-burner').length);
  check('A heater set Off shows no burners'+tag, off === 0, String(off));
  await p.evaluate(() => { const s = [...document.querySelectorAll('.ptab-meas .ms-sec')].find(x => /HEATER TREATER/.test(x.querySelector('.sec').textContent)); s.querySelector('button[data-v="on"]').click(); }); await sleep(400);
  const msg = await p.evaluate(() => document.querySelector('.ptab-meas .ms-msg').textContent);
  check('Message: burners under Heater 1, Heater 2 Off, Heater Treater On'+tag,
    /\*Heater 1 : On\*\n\*Burner A : On · Burner B : Off\*/.test(msg) && /\*Heater 2 : Off\*/.test(msg) && /\*`HEATER TREATER`\*\n\n\*Heater Treater : On\*/.test(msg), msg.split('\n').filter(x => /Heater|Burner|TREATER/.test(x)).join(' | '));
  await sleep(1400);
  let st = await p.evaluate(() => (window.__STUB__.store['tbReadings/2026-11-20__tb10_1'] || {}).meas);
  check('Saved: h1S on, h1A on, h1B off, h2S off, htS on'+tag, st && st['0'].h1S === 'on' && st['0'].h1A === 'on' && st['0'].h1B === 'off' && st['0'].h2S === 'off' && st['0'].htS === 'on', JSON.stringify(st && st['0']));
  // heater switched off afterwards: its burners are cleared
  await pickBtn('Heater 1', 'off'); await sleep(1500);
  st = await p.evaluate(() => (window.__STUB__.store['tbReadings/2026-11-20__tb10_1'] || {}).meas);
  const m2 = await p.evaluate(() => document.querySelector('.ptab-meas .ms-msg').textContent);
  check('Heater 1 switched Off clears its burners (saved and in the message)'+tag, st['0'].h1A == null && st['0'].h1B == null && !/Burner/.test(m2), JSON.stringify(st['0']));
  const ov = await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  check('No sideways scroll'+tag, ov);
  check('No page errors'+tag, !p._e.length, p._e.join('|'));
  await ctx.close();
  }
  await b.close();
  console.log('\n' + pass + ' passed, ' + fail + ' failed');
})();
