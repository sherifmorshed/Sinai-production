const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
let pass=0, fail=0; const check=(n,ok,d)=>{ ok?pass++:fail++; console.log((ok?'PASS ':'FAIL ')+n+(d?'  — '+d:'')); };
const sleep = ms => new Promise(r=>setTimeout(r,ms));
const PH = { 'iPhone':'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
             'Android':'Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36' };
(async () => {
  const b = await chromium.launch();
  // devices: carry one shared store across pages so the owner sees what others wrote
  let store = null;
  const visit = async (file, ua, vp) => {
    const ctx = await b.newContext({ serviceWorkers:'block', viewport:vp || {width:412,height:915}, userAgent:ua });
    const p = await ctx.newPage(); p._e = []; p.on('pageerror', e => p._e.push(e.message));
    if(store) await p.addInitScript(s => { window.__CARRY__ = s; }, store);
    await p.addInitScript(() => { const iv = setInterval(() => { if(window.__STUB__ && window.__CARRY__){ const S = JSON.parse(window.__CARRY__); Object.keys(S).filter(k => /^devices\//.test(k)).forEach(k => window.__STUB__.store[k] = S[k]); clearInterval(iv); } }, 1); });
    await p.goto('http://localhost:8801/' + file); await sleep(1300);
    store = await p.evaluate(() => JSON.stringify(window.__STUB__.store));
    return { ctx, p };
  };
  let v = await visit('test_tb.html', PH.Android);
  const d1 = await v.p.evaluate(() => Object.keys(window.__STUB__.store).filter(k => /^devices\//.test(k)).map(k => ({ k, v:window.__STUB__.store[k] })));
  check('An operator\'s device leaves ONE record: id__account, Android phone, browser, v61', d1.length === 1 && /^devices\/[0-9a-f]{16}__tb6-2@petrobel\.org$/.test(d1[0].k) &&
    d1[0].v.platform === 'Phone' && d1[0].v.os === 'Android' && d1[0].v.browser === 'Chrome' && d1[0].v.installed === false && d1[0].v.version === 'v61' && d1[0].v.role === 'T.B. 6/2', JSON.stringify(d1[0]));
  const rd = await v.p.evaluate(async () => { try { await firebase.firestore().collection('devices').get(); return 'allowed'; } catch(e){ return e.code; } });
  check('Rules (stub): an operator cannot read the device records', rd === 'permission-denied', rd);
  const spoof = await v.p.evaluate(async () => { const f = firebase.firestore(), o = {};
    try { await f.collection('devices').doc('0123456789abcdef__tb6-1@petrobel.org').set({ device:'0123456789abcdef', account:'tb6-1@petrobel.org' }); o.other = 'allowed'; } catch(e){ o.other = e.code; }
    try { await f.collection('devices').doc('0123456789abcdef__tb6-2@petrobel.org').set({ device:'0123456789abcdef', account:'tb6-2@petrobel.org', extra:'x' }); o.extra = 'allowed'; } catch(e){ o.extra = e.code; }
    return o; });
  check('Rules (stub): a device cannot write for another account or add other fields', spoof.other === 'permission-denied' && spoof.extra === 'permission-denied', JSON.stringify(spoof));
  // same device opening again soon: no second write
  const w0 = await v.p.evaluate(() => window.__IO__.byColl.devices ? window.__IO__.byColl.devices.writes : -1);
  await v.p.evaluate(() => window.__USAGE__.beacon('tb6-2@petrobel.org', 'T.B. 6/2')); await sleep(200);
  const w1 = await v.p.evaluate(() => window.__IO__.byColl.devices ? window.__IO__.byColl.devices.writes : -1);
  check('A device reports at most every 3 hours (no second write on reopening)', w1 === w0, w0 + ' → ' + w1);
  check('No page errors (operator)', !v.p._e.length, v.p._e.join('|'));
  await v.ctx.close();
  v = await visit('test_mech.html', PH.iPhone); await v.ctx.close();
  v = await visit('test.html', undefined, { width:1280, height:900 });
  const ad = await v.p.evaluate(() => ({ tabs:[...document.querySelectorAll('#appTabs button')].map(b => b.getAttribute('data-tab')).join(','), role:document.getElementById('ubRole').textContent,
    page:document.getElementById('page-use').style.display }));
  const adRead = await v.p.evaluate(async () => { try { await firebase.firestore().collection('devices').get(); return 'allowed'; } catch(e){ return e.code; } });
  check('The shared admin: no Usage tab, and cannot read the records', ad.tabs === 'rg,tb' && ad.role === 'ADMIN' && ad.page === 'none' && adRead === 'permission-denied', JSON.stringify(ad) + ' ' + adRead);
  await v.ctx.close();
  // owner, on a phone
  v = await visit('test_owner.html', PH.Android);
  const ow = await v.p.evaluate(() => ({ tabs:[...document.querySelectorAll('#appTabs button')].map(b => b.textContent.trim()).join('|'), role:document.getElementById('ubRole').textContent }));
  check('Owner: header OWNER, every admin tab plus Usage', ow.tabs === 'R/G Production|A/R Production|Usage' && ow.role === 'OWNER', JSON.stringify(ow));
  // owner can do admin things: open A/R Production sub-tabs
  await v.p.evaluate(() => document.querySelector('#appTabs button[data-tab="tb"]').click()); await sleep(400);
  const subs = await v.p.evaluate(() => [...document.querySelectorAll('#tbSubTabs button')].map(b => b.getAttribute('data-sub')).join(','));
  check('Owner sees everything the admin sees (all A/R sub-tabs)', subs === 'entry,old,view,temp,pumps,mach,fieran,follow', subs);
  const wr = await v.p.evaluate(async () => { try { await firebase.firestore().collection('tbReadings').doc('2026-11-01__tb6_1').set({ date:'2026-11-01', battery:'tb6_1', temp:{ '0':30 } }, { merge:true }); return 'allowed'; } catch(e){ return e.code; } });
  check('Owner can write like the admin', wr === 'allowed', wr);
  await v.p.evaluate(() => document.querySelector('#appTabs button[data-tab="use"]').click()); await sleep(800);
  const u = await v.p.evaluate(() => ({ kpi:[...document.querySelectorAll('#useBody .pm-kpis .k')].map(k => k.innerText.replace(/\s+/g,' ')).join(' | '),
    acc:[...document.querySelectorAll('#useBody .use-tbl')][0].innerText.replace(/\s+/g,' '),
    devs:document.querySelectorAll('#useBody .use-tbl')[1].querySelectorAll('tbody tr').length,
    rows:[...document.querySelectorAll('#useBody .use-row')].map(r => r.innerText.replace(/\s+/g,' ')).join(' | ') }));
  check('Usage: 4 devices (operator, mechanical, admin, owner), all active today', /^4 devices in total \| 4 active last 24 h \| 4 active last 7 days/.test(u.kpi), u.kpi);
  check('Usage: by account, with roles', /tb6-2@petrobel\.org T\.B\. 6\/2 1 1/.test(u.acc) && /mechanical@petrobel\.org MECHANICAL 1 1/.test(u.acc) && /owner@test\.local OWNER/.test(u.acc), u.acc.slice(0, 300));
  check('Usage: device / system / version split', /Phone 3/.test(u.rows) && /Desktop 1/.test(u.rows) && /Android 2/.test(u.rows) && /iOS 1/.test(u.rows) && /v61 4/.test(u.rows), u.rows);
  check('Usage: every device listed', u.devs === 4, String(u.devs));
  // an old version shows as such
  const old = await v.p.evaluate(() => { const S = window.__USAGE__.stats([{ device:'a', account:'x', version:'v61', lastSeen:Date.now() }, { device:'b', account:'y', version:'v60', lastSeen:Date.now() - 86400000 }, { device:'c', account:'z', version:'v58', lastSeen:Date.now() - 40 * 86400000 }]);
    return { old:S.old, latest:S.latest, d30:S.d30, dev:S.devices }; });
  check('Usage: "active on an old version" counts only devices seen in 30 days', old.old === 1 && old.latest === 'v61' && old.d30 === 2 && old.dev === 3, JSON.stringify(old));
  const ov = await v.p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  check('Usage page: no sideways page scroll on a phone (tables scroll inside)', ov);
  check('No page errors (owner)', !v.p._e.length, v.p._e.join('|'));
  await v.ctx.close();
  // sign-out clears the Usage page
  await b.close();
  console.log('\n' + pass + ' passed, ' + fail + ' failed');
})();
