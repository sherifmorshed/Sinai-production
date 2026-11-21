# Sinai Field — start here

**Attach `sinai-field-v66.zip` to the new chat and paste the block below as your
first message.** Everything Claude needs is in the zip; nothing from any other
conversation is required.

---

## Paste this

> This chat is **only** for the Sinai Field — Production Readings app. There is a
> separate app of mine called Land Wells; it is a different application, a
> different Firebase project and a different chat. Never touch it, never refer to
> it, and if something here seems to need it, stop and tell me instead.
>
> The attached zip is the whole project. Read `README.md`, then
> `DEVELOPER_REFERENCE.md`, then `CHANGELOG.md` before changing anything.
>
> Current release: **v66**, service-worker cache `sinai-field-v66`.
> Each release: bump `CACHE_NAME` in sw.js AND `APP_VERSION` in index.html.
>
> How I work: show me the change, test it before you say it is done, and tell me
> plainly when something I asked for is a bad idea.

---

## What this app is

Hourly PETRECO and Ras Gara oil readings for one shift day (06:00 → 05:00), the
difference between them, and a daily record across days. One HTML file, no build
step, Firebase/Firestore behind it, used on phones in the field.

Accounts: `sherifmorshed@gmail.com` (admin, sees everything),
`petreco@petrobel.org` and `rasgara@petrobel.org` (each sees only its own
columns), and `tb10-1@`…`tb8-2@petrobel.org` (each sees one tank battery only).

## The rules of the codebase

- `index.html` is edited **directly** — there is a map of the file in a comment
  at the top. No build step, no bundler.
- **Bump `CACHE_NAME` in `sw.js` on every release** or nobody sees the change.
- After editing `index.html`, **regenerate the test harnesses** or you are
  testing the old build:
  ```bash
  python3 test_build.py        # every role, a no-role account, empty & stray states
  python3 test_build_hist.py   # ~120 generated days across 5 months
  ```
- `firestore.rules` is the real access control. The e-mail lists in `index.html`
  only decide what the screen offers. Change them together.
- Ten files get deployed; `SETUP.md` lists exactly which. Everything else is
  documentation or the offline test harness — do not upload those.

## The two tabs

**R/G Production** — hourly PETRECO vs Ras Gara, 06:00 → 05:00. Unchanged.

**Tank Batteries** — five batteries, one totalizing scanner each, read every
three hours. T.B. 10/1 runs 06:00 → 06:00; the other four run 05:00 → 05:00, so
a reading time belongs to the battery, not the module. Admin sees two tabs — R/G Production and A/R Production — and A/R Production
has three pages: Entry (tank batteries and PETRECO together), Report card and
Scanner analysis. Nine readings give eight intervals;
production is the difference between consecutive readings. WHP typed alongside.
One account per battery (`tb10-1@`, `tb6-1@`, `tb6-2@`, `tb8-1@`,
`tb8-2@petrobel.org`). Each sees ONLY its own readings — enforced in
firestore.rules, not hidden on screen: the shift day is five documents, one per
battery (`2026-08-14__tb6_2`), so a rule can allow or deny a single battery.
Admin gets a breakdown across days and two reports: a one-page day report and a
record over the selected range. Operators get one tab and no tab bar.
The mechanical account (`mechanical@petrobel.org`) gets the PM page only.

The two shifts are an hour apart and are NOT the same 24 hours. Do not add a
tank battery total to a Ras Gara total.

## Where things stand

v66: Usage — Total row under By account. v65: "Yesterday full day" line removed. v64: readings message — yesterday's same 3 hours per interval, yesterday same-period
total and full day. v63: one set of status words for all items (On/Off/Out of service — في الخدمة/احتياطي/
خارج الخدمة; `tbStatesFor` always TB_PUMP_STATES); 6/1 Polymer Pit Pumps 1, 2.
v62: 10/1 measurements — burners A/B per sigma heater, Heater Treater section.
v61: OWNER account (admin + Usage tab; `OWNER_EMAILS`, rules `isOwner()`), device
records `devices/{id}__{account}`. v60: WhatsApp separator lines = `WA_RULE` / `WA_SHIFT` (LRM + ━), never Arabic
tatweel. v59: `sepPr` — Sep. pressure (rows[i].e) instead of chemical on 6/1–8/2; admin
Chemical injection tab removed. v58: T.B. 8/2 `scanReset` — a 0 opening is a scanner reset, not mirrored to the
day before. v57: W.D. Plant outlet pressure (`outletPr`, kind `o`); Follow-up copy button removed.
v56: admin **Follow-up** tab — missing-entries board (`tbFollowData`, badge, copy
list) and monthly Excel export (`tbMonthBook`, `tbExportMonth`). v55: review release — day rollover (`watchShiftDay`), incremental sync with per-site
stamps, PM hours carried over unreported days, debounced local cache, rules
`tbIdMatches`. v54: **Fieran Terminal** admin tab (station `fieran`, `adminTab:true`, 16 pumps,
engineers on the admin account); remarks on station panels (W.D. Plant).
v53: readings WhatsApp message follows the latest scanner reading and lists all the
day's readings + total (`tbReadMsg`, `tbReadLatest`); copy button only. v52 added it. v51: **T.B. 2020** — a hosted station (`host:'tb10_1'`) shown as a tab in the 10/1
panel, run with the tb10-1 account; own measurements (`TB_MEAS2`) and daily status;
rules `tbOwnsBattery()`. v50: plant flows split into Vertical pumps flow rate and Injected flow rate (m³/hr,
with Average m³/day = ×24), "Flow rate" label; Machinery update has no pump
readings and framed per-site blocks. v49 added the **Water Disposal Plant** station (`TB_STATIONS`, id `wdp`, account
`waterdisposal@petrobel.org`): 14 pumps with pressure / flow / Hz when running;
in Pumps, Machinery update and PM, never in production. v48 removed admin's PM tab (mechanical only), cut Pumps to the situation, and
added the admin **Machinery update** tab (field-wide daily status card, WhatsApp
copy, PDF — `tbMachData`, `tbMachCardHTML`, `tbMachMsg`). v47 took heaters out of PM and gave pumps, compressors, diesel units and jockey
pumps their own PM checklists (`tbPMCheckOf(pm)`). v46 added the `mechanical@petrobel.org` account: PM page only (KPIs, red-flag
work list across all batteries, checklist/technician/WO on Record PM, copy work
list, Excel export); rules `isMech()` — reads all readings, writes only
`tbReadingsMeta/pm`. v45 moved PM monitoring to its own PM tab, chosen per tank battery. v44 added
Waste Water Pump A–C and Oil Room Pump A–B to T.B. 10/1's station
status. v43 gave every battery the two-tab layout and a daily STATION STATUS (Belayim:
their pumps + Vertical/Horizontal/Diesel compressors + 2 jockey and 2 diesel fire
pumps), Arabic "copy and send to the work group" over every WhatsApp box, TODAY
green / YESTERDAY grey, and a Day / Night / Auto theme (Auto = dark 18:00–06:00).
No battery has three-hourly pump columns any more. v42 extended 10/1's daily
STATION STATUS to heaters (Sigma 1, 2, 4, Heater
Treater), compressors (A, B, Chemical) and fire fighting (Jockey 1–2, Diesel 1–2,
counts assumed), with a copy-only WhatsApp message. v41 made ALL of T.B. 10/1's
pumps daily (Transfer 1–6 and HPS 1–2, with كما أمس);
earlier three-hourly transfer readings still count via `legacy3h`. The other
batteries stay three-hourly. v40 added PM monitoring to the Pumps tab: per-pump interval (editable), running
hours since PM, hours left, projected due date, standby/out since PM, and a PM
log admin records into (tbReadingsMeta/pm). Real PM intervals are still to be
set — admin can now enter them per pump. v39 added T.B. 10/1's HP Pump 1 and 2 to وضع المحطة, recorded once a day
(transfer pumps stay three-hourly). v38 reordered T.B. 10/1's tabs: القراءات, مقاسات المحطة, وضع المحطة. v37
widened the skimmer to 4–13 stairs and added OIL ROOM (On/Off) after it.
v36 gave each Sigma heater On/Off (off clears its readings) and split high
pressure into Pump No.1 and No.2 — only the pump ON goes in the message. v35 made
the station-measurement form English-only and added Sigma heaters 1, 2
and 4 (temperature and flow rate) after the scanner. v34 added T.B. 10/1's third
tab, مقاسات المحطة: nine rounds 05:00→05:00 with
levels, samples, temperatures, pressures, scanner, skimmer and HP pump, and a
WhatsApp message in the group's format (copy / open WhatsApp). v33 moved
T.B. 10/1's pumps to their own tab, وضع المحطة (`pumpTab:true` in
TB_LIST); the other batteries keep pump columns. v32 set Today and Yesterday as two identical English lines in each battery
header. v31 renamed the WHP column Line pressure / ضغط الخط. v30 made the PETRECO
drain scanners totalizer readings (difference worked out
and shown under each; crude oil still entered as quantities) and labelled the
yesterday line أمس for operators. v29 put "Yesterday" under each battery's day
total — yesterday over the same
intervals today has read, so it is always like for like. v28 added the pump
station: one column per pump in every battery's entry table,
updated every three hours (في الخدمة / احتياطي / خارج الخدمة, with سبب التوقف
when one goes out), and a Pumps tab for admin counting hours by state, PM and
every stoppage with its reason. PM intervals are PLACEHOLDERS (4,000 h) — ask
for the real ones. Open question: should PM be recorded by admin (as now) or by
the operator? v27 dropped the "x of 8 intervals complete" note from the battery panels. v26
fixed the fitted report card shrinking and growing while scrolling on a
phone (the address bar changing the viewport height). v25 put ملاحظات اليوم beside the Remarks heading on every entry screen. v24
split Scanner analysis into Figures and Graphs analysis and dropped its two
on-screen comparison tables (the printed day report still has them). v23 added
Arabic under the English on the entry screens — headings and hours on
the batteries, the period column on the PETRECO scanners, the hour column on
R/G. v22 put the remarks on the printed day report as well and made the report card
scale to fit a phone screen (Full size button to turn it off). v21 gave every
tank battery a Remarks box, collected with PETRECO's into one
box on the report card. v20 put PETRECO's scanners on the Daily totals table (drains totalled, crude
scanners not) and shortened "Sicies Scanner" to "Sicies". v19 added that third
crude oil scanner alongside L.O.T.F and M.O.T.F. v18 added chemical injection:
a column after Temp on every battery's table, entered every six hours, with its
own admin analysis page beside Temperature. v17 removed the explanatory notes
from the PETRECO entry table (operators enter readings; they are not told why a
derived cell is empty). v16 made the report card show "Not yet" instead of a
part figure for any line
or total that is not fully read. v15 moved the five PETRECO scanners to three-hour entry from 06:00 (eight
periods), with days recorded before it still read as twelve-hour halves. v14
added 3/6/12/24-hour periods to the report card, compared only once today's
window is complete. v13 fixed three ways readings were silently lost (a sync during typing, a save
overwriting another person's field, a date change before the save went out)
and four display faults — see `CHANGELOG.md`. Typed values now sit in a
per-account queue until the cloud accepts them; read "Unsaved edits" in
`DEVELOPER_REFERENCE.md` before touching any save.

Complete-before-compared is now the rule everywhere a day or a window is
compared with another: the report card, both analysis tables, the chart chips
and the printed day report.

Known and not yet changed (waiting on the owner):
- The tank battery record report and its e-mail text still add Belayim gross
  and T.B. 10/1 net oil into one "Field total", against the rule that the two
  groups are never summed.
- The e-mailed record PDF squeezes the whole range onto one A4 page.
- Some comparisons still print a percentage beside the m³ figure.

The 2026 history import was built and then removed at my request — do not
reintroduce it.
