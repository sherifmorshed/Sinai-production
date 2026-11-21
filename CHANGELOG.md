# Sinai Field — Changelog

## v66 — Usage: total under "By account"

Service-worker cache `sinai-field-v66`, `APP_VERSION` v66. Only `index.html`
and `sw.js` change. The owner's Usage tab now ends the By account table with a
**Total** row: number of accounts, devices (summed over accounts), active in
7 days, last seen. When a device is used with more than one account, a note
under it gives the number of different devices.

## v65 — Readings message: "Yesterday full day" removed

Service-worker cache `sinai-field-v65`, `APP_VERSION` v65. Only `index.html`
and `sw.js` change. The readings message keeps yesterday per interval and
yesterday's production for the same period; the full-day line is gone.

## v64 — Readings message compares with yesterday

Service-worker cache `sinai-field-v64`, `APP_VERSION` v64. Only `index.html`
and `sw.js` change; **no rules change**.

Every tank battery's readings WhatsApp message:
- each interval line now carries yesterday's production for the same three
  hours: `*08:00 AM :* 87,808 m³ · 20 m³ _(yesterday 33 m³)_` ("—" when
  yesterday has no figure for it);
- under the total: `*Yesterday production (05:00 AM – 02:00 PM) : … m³*` —
  yesterday over the SAME rounds, so the two totals compare like for like —
  and `_Yesterday full day : … m³_` (left out at the closing round, where the
  period already is the full day).

## v63 — One set of status words; Polymer pit pumps at T.B. 6/1

Service-worker cache `sinai-field-v63`, `APP_VERSION` v63. Only `index.html`
and `sw.js` change; **no rules change**.

- **Same words for every item at every site** (pumps, compressors, heaters;
  tank batteries, T.B. 2020, Water Disposal, Fieran): **On / Off / Out of
  service**, in Arabic **في الخدمة / احتياطي / خارج الخدمة**. Before, pumps read
  In service / Standby and heaters / compressors تشغيل / إيقاف. Stored values
  are unchanged (in / sb / out), so history reads the same. WhatsApp messages,
  the Pumps page, the Machinery update and the PM export use the new words.
- **T.B. 6/1 — POLYMER PIT PUMPS**: Polymer Pit Pump 1 and 2, right after the
  booster pumps, with the same three states and reasons. In Pumps, Machinery
  update, Follow-up, the monthly export and the mechanical PM page.

## v62 — T.B. 10/1: heater burners and Heater Treater

Service-worker cache `sinai-field-v62`, `APP_VERSION` v62. Only `index.html`
and `sw.js` change; **no rules change**.

T.B. 10/1 → مقاسات المحطة:
- **Sigma heaters 1, 2, 4**: each now has **Burner A** and **Burner B**, On / Off,
  shown under the heater while it is not Off. Switching a heater Off clears
  its temperature, flow and burners. In the message:
  `*Burner A : On · Burner B : Off*` under the heater's line. Burners count
  towards a complete round while their heater is on.
- **Heater Treater**: a new section after SIGMA HEATERS, On / Off
  (`*Heater Treater : On*`).
Fields `h1A h1B h2A h2B h4A h4B htS`, added at the end of the field list.

## v61 — Owner account and device usage

Service-worker cache `sinai-field-v61`. `index.html`, `sw.js` **and
`firestore.rules`** change.

**Before publishing: replace `OWNER-EMAIL` with the owner's address in BOTH
files** — `index.html` (`const OWNER_EMAILS = ['OWNER-EMAIL'];`) and
`firestore.rules` (`function isOwner()`). Create that user in Firebase
Authentication, then publish the rules.

- **Owner account** (`OWNER_EMAILS`, header OWNER): a second admin with
  everything the admin has, plus a **Usage** tab. The shared admin account
  does not get Usage and cannot read the records.
- **Device records**: each device keeps a random id and writes one record per
  account it signs in with, `devices/{deviceId}__{account}` — device type,
  system, browser, installed or browser, app version, first / last seen. At
  most every 3 hours, and at once after an update. No names, numbers or
  locations. Rules: a device writes only its own record, under its own
  account, with only those fields; only the owner reads or deletes.
- **Usage tab**: devices in total; active in 24 h / 7 / 30 days; installed on
  the home screen; active devices still on an old version; device / system /
  version split; per account (devices, active 7 d, last seen); every device.
- `APP_VERSION` in index.html must be bumped with `CACHE_NAME` each release.

## v60 — WhatsApp separator lines on the left

Service-worker cache `sinai-field-v60`. Only `index.html` and `sw.js` change;
**no rules change**.

The separator lines in the WhatsApp messages were drawn with the Arabic
stretch letter (ـ). WhatsApp decides each line's direction from its first
letter, so it set those lines on the RIGHT while the rest of the message was on
the left. Every separator line (readings, station status, 10/1 and 2020
measurements, Water Disposal, Fieran, Machinery update) is now one rule,
`WA_RULE` / `WA_SHIFT`: box-drawing characters led by a left-to-right mark, so
it stays on the left on every phone. Arabic text inside a line (reasons,
remarks) is unchanged. New test: every line of every message must start
left-to-right (`regression_whatsapp_direction.js`).

## v59 — Separator pressure replaces chemical injection (6/1, 6/2, 8/1, 8/2)

Service-worker cache `sinai-field-v59`. Only `index.html` and `sw.js` change;
**no rules change**.

- **T.B. 6/1, 6/2, 8/1, 8/2** (`sepPr:true`): the readings table's chemical
  injection column is now **Sep. pressure / ضغط السيبريتور**, in the battery's
  line-pressure unit, at every scanner reading (9 a day; 05:00 shared with the
  day before like line pressure). Stored as `rows[i].e` (queue kind `e`,
  cell `e`). In the readings WhatsApp message, the Follow-up board and the
  monthly workbook (new "Sep. pressure" column in Readings).
- **T.B. 10/1 keeps chemical injection**; Water Disposal Plant, T.B. 2020 and
  Fieran are unchanged.
- **Admin: the Chemical injection tab is removed.** Chemical figures already
  recorded stay stored; separator pressure gets no tab of its own — it is
  stored and shown like the other readings.

## v58 — T.B. 8/2 scanner reset every 48 hours

Service-worker cache `sinai-field-v58`. Only `index.html` and `sw.js` change;
**no rules change**. Affects **T.B. 8/2 only** (`scanReset:true`).

T.B. 8/2's scanner zeroes itself every 48 hours at 05:00. The app treats 05:00
as ONE reading shared by two days (yesterday's closing = today's opening), so
on a reset morning yesterday's value was carried into today's opening (and a
0 typed there was written back over yesterday's closing), giving a negative
interval.

For 8/2 now:
- a **0** typed at 05:00 (opening) is the reset — it is NOT written back over
  the day before's closing;
- a closing typed (or corrected) on the day before is NOT written over a
  next-day opening of 0;
- an empty closing before a reset is not filled from the next day's 0;
- on any other day the 05:00 is still shared both ways, as before.
An Arabic note under 8/2's readings tells the operators what to do on a reset
day. Every other battery is unchanged.

## v57 — Plant outlet pressure; Follow-up without the copy button

Service-worker cache `sinai-field-v57`. Only `index.html` and `sw.js` change;
**no rules change**.

- **Water Disposal Plant — Outlet Pressure / خارج ضغط المحطة**: one figure a
  day in psi, at the top of the plant panel. Saved as `outletPr` (queue kind
  `o`, cell `op`); in the plant's WhatsApp message under the date, on the admin
  Pumps row, and in the monthly workbook (Station status sheet, group PLANT).
- **Follow-up**: the "Copy missing list" button is removed.

## v56 — Follow-up board and monthly Excel export (admin)

Service-worker cache `sinai-field-v56`. Only `index.html` and `sw.js` change;
**no rules change**.

New admin tab **Follow-up** (A/R Production), with a red count on the tab of
the sites behind today.

**Missing-entries board** for the chosen shift day:
- per site: Readings by round (scanner, line pressure, temperature, chemical
  on its six-hourly rounds), Station measurements by round (10/1, 2020),
  Station status (not reported / which items are blank), and Water Disposal
  pump readings (a running pump without pressure / flow / Hz);
- a round is missing 30 minutes after its time (`TB_DUE_GRACE`); the daily
  status is expected 3 hours into the shift (`TB_STATUS_BY`); a past day
  expects everything; an imported day total is not flagged;
- sites behind first, with what is missing in red and who saved last and when;
- **Copy missing list** — a WhatsApp-ready chase list;
- refreshes itself every minute.

**Monthly Excel export** — pick a month → `SinaiField_YYYY-MM.xlsx`:
Daily production (per battery + month total) · Readings · Station status
(with reasons and W.D. pump readings) · Station measurements (10/1, 2020) ·
Out of service episodes · Remarks.

Each site's last-saved time is now kept per site (`cell.ua` / `ub`); the first
start after this update reads the full history once to fill it.

## v55 — Review release: five fixes found by a full review

Service-worker cache `sinai-field-v55`. `index.html`, `sw.js` **and
`firestore.rules`** change — publish the rules.

Reviewed: syntax and duplicate checks on all scripts, a crawl of every account
× every tab × Day/Night × phone/desktop (errors, refused reads, bad text,
sideways scroll — all clean), then the sync, save, PM and rules logic by hand.

1. **Day rollover (all three modules).** An app left open overnight kept
   showing yesterday's sheet, so the morning's first readings could be typed
   onto yesterday. A sheet that is on the current shift day now follows the
   day when it changes (checked every minute and whenever the app comes back
   to the front), with a "New shift day" notice. A sheet opened on an older
   day is left alone; nothing moves while a box is being typed in.
   `watchShiftDay` / `checkShiftDay`.
2. **Sync load (tank batteries module).** Every save by any site made every
   open device download its whole history again — reads grew with history ×
   saves × devices, heading for the Firestore daily quota and slow phones.
   Now the stamp document records WHICH sites a save touched
   (`tbReadingsMeta/info.sites`): an operator's phone reads only when its own
   site(s) changed; admin and mechanical read only the documents written since
   their last sync (`where updatedAt > …`), with a full read when there is no
   cache and once a week as a safety net. The "synced from cloud" toast no
   longer fires on these quiet top-ups. The skip of a device's own save echo
   now checks it really is its own, and expires after 15 s.
3. **PM running hours.** A day with no status report counted as zero hours,
   so every missed report pushed PMs later than the pump's real hours. The
   last reported status is now carried over unreported days (7 days per gap at
   most), and the card says how many days are estimated. `tbPumpSlotsPM`.
4. **Local cache.** The whole history was rewritten to phone storage on every
   keystroke; now half a second after the last change. When it outgrows the
   browser's storage the newest 120 days are kept and the next start reads the
   full history from the cloud (before: an error toast on every keystroke).
5. **Rules.** A tank battery account could create a document under another
   battery's ID (with its own battery name inside) and lock that battery out
   of that day's sheet. Document IDs must now match the battery written inside
   (`tbIdMatches`).

Also removed two unused constants from the old Pumps range chips.
Not changed, noted for later: R/G and PETRECO still re-read their whole
collection on each change (one small document per day, few accounts).

## v54 — Fieran Terminal (admin tab); remarks at the Water Disposal Plant

Service-worker cache `sinai-field-v54`. Only `index.html` and `sw.js` change;
**no rules change** (admin already writes every document; no new account).

**Fieran Terminal** — a new admin tab (A/R Production → *Fieran Terminal*),
updated by the engineers on the admin account. Shift day, the station status
of its 16 pumps with reasons, remarks, and its WhatsApp message:
- Shipping pumps: Powerhouse Pump 1, 2; Gas Pump 706, 707, 708
- Fire fighting: Diesel Pump A–F; Jockey Pump 1, 2
- API skimmer: API Skimmer Pump 1
- Waste water pumps: Waste Water Pump 2, 3
Stored as `{date}__fieran` (battery `fieran`); a station with `adminTab:true`
— not on the Entry page, no operator sees it. In the admin Pumps page and the
Machinery update (status, out of service, changes, WhatsApp / PDF); its pumps
are on the mechanical PM page (kinds Shipping and API skimmer, 4,000 h).
The Entry page's delegated handlers now serve `#tbFieranArea` too.

**Water Disposal Plant** — a **Remarks / ملاحظات اليوم** box under the station
status (any station panel now has one); saved as the day's remarks.

## v53 — Readings WhatsApp message, simplified

Service-worker cache `sinai-field-v53`. Only `index.html` and `sw.js` change.

- No time buttons: entering is exactly as before; the message follows the
  LATEST scanner reading entered.
- The message carries every scanner reading of the day up to that one, each
  with its interval's production, the rate of the last interval, the latest
  round's line pressure / temperature / chemical injection, and the **total
  production** so far.
- "Readings — القراءات" in the header (the only Arabic); no icons.
- Only **نسخ الرسالة**; the open-WhatsApp button is gone.

## v52 — WhatsApp message on القراءات

Service-worker cache `sinai-field-v52`. Only `index.html` and `sw.js` change;
**no rules change**.

Under every tank battery's readings table: **WhatsApp message — readings**.
- The day's nine scanner rounds as chips (a dot once the scanner is in). Today
  it opens on the round whose time has come; another day, on its last round
  with a scanner reading.
- The message for the round picked:
  🛢️ Tank Battery x/0y · 📋 Readings · 📅 Date · ⏰ Time, then
  📟 Scanner, 🛢️ Production since the round before with its rate (m³/hr),
  🔧 Line pressure (the battery's unit), 🌡️ Temperature, 💉 Chemical
  injection (only on its six-hourly rounds), and 📊 Production so far today.
  Only what was recorded is written.
- Rewritten as the table is typed in; **نسخ الرسالة** copies it,
  **فتح واتساب** opens WhatsApp with it written.
Functions: `tbReadWAHTML`, `tbReadMsg`, `tbReadRefresh` (also called from
`tbRepaintDerived`), `tbReadWire`.

## v51 — T.B. 2020, run from T.B. 10/1

Service-worker cache `sinai-field-v51`. `index.html`, `sw.js` **and
`firestore.rules`** change — publish the rules. No new account: T.B. 2020 is
operated with **tb10-1@petrobel.org**.

**T.B. 2020** sends its oil to T.B. 10/1, so it sits inside the 10/1 panel as
a fourth tab, **T.B. 2020**, with its own switch:
- **مقاسات المحطة** — the same nine rounds as 10/1 (05:00 … 05:00 next day;
  the 05:00 round is shared with the day before). PRODUCTION.SEP (Level %,
  Pressure bar), PUMP (On/Off; Bi, Bd bar and HZ only while On — Off clears
  them), LINE 10" (Pressure bar), HEATER (On/Off). WhatsApp message in the
  station's own format (*Station : T.B 2020*, ◼️ sections, ▫️ lines, closing rule).
- **وضع المحطة** — daily status: Transfer Pump, Air Compressor, Diesel
  Compressor, Jockey Pump 1 & 2, Sigma Heater, with reasons and its WhatsApp
  message; the out-of-service count shows on the T.B. 2020 tab.

Stored as its own documents (`{date}__tb2020`, battery `tb2020`) — not mixed into
10/1's — and kept out of all production figures. New `host` on a station
(`TB_STATIONS`), `tbHosted()`, `tbOwnsId()`; the 10/1 account loads its own
documents and 2020's with one query each. Station measurements now take a
per-site field list (`TB_MEAS2`, `tbMF(id)`, `tbMeas2Form`, `tbMeas2Msg`).

**Admin:** T.B. 2020 appears right after T.B. 10/1 in Pumps and the Machinery
update (status, out of service, changes, WhatsApp/PDF), and admin can enter it
from the 10/1 panel. **Mechanical:** its pump, compressors and jockey pumps are
on the PM page (the Sigma heater is not — no heaters in PM).

**Rules:** `tbOwnsBattery()` — the tb10-1 account owns battery `tb2020` as well
as `tb10_1`; every other account is unchanged.

## v50 — Water Disposal Plant flows; Machinery update headers

Service-worker cache `sinai-field-v50`. Only `index.html` and `sw.js` change;
**no rules change**.

**Water Disposal Plant**
- The flow box is labelled **Flow rate** (English — the operators' word);
  الضغط and التردد stay. Flow rate is in **m³/hr**.
- Two flows, never added together (the same water passes both stages):
  - **Vertical pumps flow rate** — the vertical pumps (pits → injection pumps);
  - **Injected flow rate** — horizontal + Borets pumps (→ wells).
  Each is the sum of its RUNNING pumps (pump field `flow:'vert'|'inj'`), with
  an **Average m³/day** (= m³/hr × 24). Shown as two tiles on the plant panel,
  in the WhatsApp message, and on the admin Pumps row.

**Machinery update**
- No pump readings or flows (the running-pumps table is gone, card and WhatsApp).
- Each battery / the plant is a framed block with a dark name bar, clearly
  separated from the next; WhatsApp sections are separated by a rule line.
  Still one A4 page.

## v49 — Water Disposal Plant station + account

Service-worker cache `sinai-field-v49`. `index.html`, `sw.js` **and
`firestore.rules`** change — publish the rules and create the user
`waterdisposal@petrobel.org` in Firebase Authentication.

**New station: Water Disposal Plant** (id `wdp`). A pump station with no
production readings, so it is NOT in `TB_LIST` (production totals, report card,
scanner, charts and imports never see it). It lives in `TB_STATIONS`, and
`TB_ALL = TB_LIST + TB_STATIONS` drives station status, Pumps, Machinery update
and PM.

- Pumps (daily status, same states as the batteries): Old pit vertical A, B, C;
  New pit vertical D, E; Horizontal C, D; Borets A–G (14).
- Each RUNNING pump records **pressure (psi), flow rate (BWPD) and frequency
  (Hz)** — the boxes open when the pump is set to في الخدمة and are cleared when
  it leaves service. Stored as `pumpsDailyMeas.{k}.{p,q,hz}` (queue kind `h`).
- WhatsApp station message: the readings under each running pump and the
  plant's **total flow rate**.

**Account `waterdisposal@petrobel.org`** (header W.D. PLANT): one panel, the
station status; no scanner table, no totals. Same rules as a battery operator —
its own documents only (`tbBattery()` → `wdp`), no PM record.

**Admin:** Pumps situation and Machinery update include the plant (chips carry
the readings; the update has a running-pump table with total flow; out of
service and changes as for the batteries). **Mechanical:** the plant's 14 pumps
are on the PM page (Vertical / Horizontal kinds added, 4,000 h placeholder).

## v48 — Admin: Machinery daily update; PM left to mechanical

Service-worker cache `sinai-field-v48`. Only `index.html` and `sw.js` change;
**no rules change**.

- **Admin's PM tab removed.** PM is recorded by `mechanical@petrobel.org` only;
  the admin still sees the PM picture in the Machinery update.
- **Pumps tab: the situation only** — every battery's equipment by its latest
  status. The hours-by-state and stoppage tables are gone (stoppages, with
  their reasons, are now in the Machinery update).
- **New tab: Machinery update** — the whole field for one shift day, in the
  report card's style, laid out like a daily rotating-equipment status report:
  - KPIs: equipment, in service, standby / off, out of service, availability
    % (in service + standby over everything reported);
  - **Out of service** — battery, equipment, since, days out, reason;
  - **Changes since yesterday** — Yesterday → Today;
  - each battery: group by group in three columns (In service / On, Standby /
    Off, Out of service); a battery that has not reported for the day is
    flagged with the date its status comes from; unreported items are listed;
  - **PM (mechanical)** — overdue / due-soon counts and the overdue items.
  Buttons: **Copy for WhatsApp** (✅ 🟡 🔴 per group), **PDF** (one A4 page),
  **Print**.

## v47 — PM: heaters out, proper pump and compressor checklists

Service-worker cache `sinai-field-v47`. Only `index.html` and `sw.js` change;
**no rules change**.

- **Heaters removed from PM** — Sigma Heater 1, 2, 4 and the Heater Treater
  are not rotating equipment, so they no longer appear on the PM page, in the
  work list, the counts, the KPIs or the Excel export (`tbPMItemsOf`). They keep
  their daily status and stay in the Pumps report. T.B. 10/1's PM list is 20 items.
- **Checklists by equipment**, built from standard centrifugal-pump and
  air-compressor PM checklists:
  - **Pumps** (booster, Borets, transfer, HPS, waste water, oil room): bearings
    temperature & vibration, bearing lubrication, mechanical seal / packing,
    coupling & shaft alignment, foundation bolts, suction / discharge pressure,
    suction strainer, motor bearings & amps, guard / gauges / valves.
  - **Compressors**: oil level / change, oil filter, air intake filter, belts,
    condensate drains, safety valve, pressure switch & load/unload, cooler,
    leak check, air/oil separator, motor amps / noise / vibration.
  - **Diesel compressor**: the compressor list with the engine instead of the
    motor (engine oil & filter, fuel filter, coolant, engine air filter,
    battery & charger, fan belt & exhaust).
  - **Diesel fire pumps**: pump list + engine + weekly test run, fuel tank
    level, controller / alarms. **Jockey pumps**: pump list + pressure switch
    cut-in / cut-out.
  PMs already recorded keep the wording they were saved with.

## v46 — Mechanical account: PM management for the maintenance department

Service-worker cache `sinai-field-v46`. `index.html`, `sw.js` **and
`firestore.rules`** change — publish the rules, and create the user
`mechanical@petrobel.org` in Firebase Authentication.

**New account `mechanical@petrobel.org`** (header: MECHANICAL). One page and
nothing else — *PM Management — Tank Batteries*: no readings entry, no reports,
no R/G or PETRECO. It reads every battery's readings (the running hours come
from them) and writes only the PM record, `tbReadingsMeta/pm`.

The PM page (admin's PM tab gets all of this too), laid out the way CMMS
preventive-maintenance tools do — meter-based (running-hours) triggers, an
overdue-first work list, completion records with a checklist:

- **KPI strip** — PM compliance %, overdue (⚑ red flag), due soon (≥ 90 % of
  interval), PMs done in the last 30 days, pumps with no PM on record.
- **⚑ Work list — all tank batteries** — every overdue item first (most hours
  over at the top), then due soon; tap a line and it opens that pump's Record
  PM form on its battery.
- **Battery chips** as in v45, with red/amber counts.
- **Record PM** now has a checklist by equipment kind (pumps, compressors,
  heaters, fire pumps), Technician and Work-order no., plus remarks / parts.
  A PM with nothing ticked and no remark is refused. The log shows all of it.
- **Copy work list** — a WhatsApp-ready list of overdue and due items.
- **Export Excel** — two sheets: PM status of every item, and the full PM
  history.
- The PM record is now **live** (listener, not a one-off read), so admin and
  mechanical see each other's PMs at once.

**Rules:** `isMech()` added. Mechanical: read all `tbReadings`, write none;
read `tbReadingsMeta`, write only `tbReadingsMeta/pm`. Tank battery operators
can no longer read or write `tbReadingsMeta/pm` (they never used it).

PM intervals are still the 4,000 h placeholder until maintenance gives the
real figures; mechanical can set them per pump with **Interval**.

## v45 — PM on its own tab, one battery at a time

Service-worker cache `sinai-field-v45`. Only `index.html` and `sw.js` change.

PM monitoring moves off the Pumps tab to a tab of its own, **PM**, beside it.
Pick the tank battery from the chips along the top; that battery's equipment
shows in its own groups and order (BOOSTER PUMPS, COMPRESSORS, FIRE FIGHTING,
and so on), each card as before — running hours since PM, interval, hours left,
due date, standby and out since PM, Record PM, Interval, PM log.

Each battery chip carries a count of what is overdue (red) or due soon (amber),
and the tab opens on the battery most in need. The Pumps tab keeps the
situation, hours by state and stoppages.

## v44 — T.B. 10/1: waste water and oil room pumps

Service-worker cache `sinai-field-v44`. Only `index.html` and `sw.js` change;
no rules change.

T.B. 10/1's **وضع المحطة** gains two groups, after the high-pressure pumps:

- **WASTE WATER PUMPS** — Waste Water Pump A, B, C;
- **OIL ROOM PUMPS** — Oil Room Pump A, B.

Recorded once a day like the rest (في الخدمة / احتياطي / خارج الخدمة, كما أمس,
سبب التوقف), in the station WhatsApp message in the same order, and in admin's
Pumps report with hours by state, PM cards (placeholder 4,000 h) and stoppages.

## v43 — station status on every battery; night mode

Service-worker cache `sinai-field-v43`. Only `index.html` and `sw.js` change;
no rules change.

### Every tank battery has وضع المحطة, recorded once a day

T.B. 6/1, 6/2, 8/1 and 8/2 now work as T.B. 10/1 does: two tabs — **القراءات**
(scanner, production, line pressure, temperature, chemical injection; no pump
columns any more) and **وضع المحطة**, the station status, once a day, with
كما أمس, yesterday's state as a hint, سبب التوقف on the day something goes out,
and a red count on the tab. T.B. 10/1 keeps its third tab, مقاسات المحطة.

| Battery | Station status |
|---|---|
| T.B. 6/1 | Booster A, B |
| T.B. 6/2 | Booster A, B · Borets A, B |
| T.B. 8/1 | Powerhouse A, Pump B, Pump C |
| T.B. 8/2 | Booster A, B, C |
| all four | COMPRESSORS: Vertical, Horizontal, Diesel (تشغيل / إيقاف / خارج الخدمة) · FIRE FIGHTING: Jockey Pump 1, 2, Diesel Pump 1, 2 |

Each battery has its own **WhatsApp message**, headed with its name
(`Tank Battery 6/02`), copy only. Above every WhatsApp box, station status and
10/1's measurements alike: **انسخ الرسالة وابعتها على جروب الشغل في الواتساب**;
the button reads **نسخ الرسالة للجروب**.

**Nothing is lost:** each Belayim pump's three-hourly readings so far still count
in admin's report — hours, stoppages, reasons — and its PM record carries over.
On the first daily day, "yesterday" is its last three-hour reading.

### Today and Yesterday

In each battery's header **TODAY** is now green and **YESTERDAY** grey — same
size, still digit under digit.

### Night mode: Day, Night or Auto

The button in the header now cycles **Day → Night → Auto**. **Auto** turns the
app dark from 18:00 to 06:00 and light in the day by the phone's clock, checking
every minute — a night shift never has to remember to switch. The choice is kept
on the phone. Every screen added since v28 was checked in night mode: status
chips, totals and reasons now take the light end of their colours on the dark
background, and the gold selected buttons take dark text.

Also fixed: the station-status WhatsApp text could lag one change behind when
a state was picked while the cursor was still in a reason box.

## v42 — T.B. 10/1 station status: heaters, compressors, fire fighting, WhatsApp

Service-worker cache `sinai-field-v42`. Only `index.html` and `sw.js` change;
no rules change.

T.B. 10/1's **وضع المحطة** card — now headed **STATION STATUS**, still once a
day — covers the whole station, in groups:

| Group | Items | States |
|---|---|---|
| TRANSFER PUMPS | Transfer 1 – 6 | في الخدمة / احتياطي / خارج الخدمة |
| HIGH PRESSURE PUMPS | HPS 1, HPS 2 | في الخدمة / احتياطي / خارج الخدمة |
| HEATERS | Sigma Heater 1, 2, 4 · Heater Treater | تشغيل / إيقاف / خارج الخدمة |
| COMPRESSORS | Compressor A, B · Chemical Compressor | تشغيل / إيقاف / خارج الخدمة |
| FIRE FIGHTING | Jockey Pump 1, 2 · Diesel Pump 1, 2 | في الخدمة / احتياطي / خارج الخدمة |

Everything behaves as the pumps do: كما أمس fills the day, yesterday's state
shows as a hint, سبب التوقف opens on the day an item goes out, and the red count
on the tab includes it.

**WhatsApp message** for the day's station status under the card, in the
measurements' format — groups as sections, each item with its state in English
(On / Off for heaters and compressors), anything out of service with since-when
and its reason. **نسخ الرسالة** copies it; there is no "open WhatsApp" button.
Items not recorded that day are left out.

**Admin's Pumps report** carries all of it — hours by state, PM cards (placeholder
interval 4,000 h for the new kinds), stoppages with their reasons — with heaters
and compressors shown as On / Off.

## v41 — T.B. 10/1's pump station: all daily, HPS 1 and HPS 2

Service-worker cache `sinai-field-v41`. Only `index.html` and `sw.js` change;
no rules change.

**On T.B. 10/1, every pump is now recorded once a day** — the three-hourly grid
is gone from its وضع المحطة tab. One **PUMP STATION** card, يومياً:

- **TRANSFER PUMPS** — Transfer 1 to 6;
- **HIGH PRESSURE PUMPS** — **HPS 1** and **HPS 2** (the "HP Pump 1/2" of v39,
  renamed; same records).

Each pump: في الخدمة / احتياطي / خارج الخدمة. **كما أمس** on an empty day fills
every pump from its last state in one tap. A pump not yet recorded shows
yesterday's state as a hint. **سبب التوقف** opens only on the day a pump goes
out; after that it reads "خارج الخدمة منذ 18/8 — reason". The red count on the
tab counts pumps out by their last known state, so a pump out since yesterday
is counted before today is filled in.

**Nothing is lost in the change.** A transfer pump's three-hourly readings from
before v41 still count in the admin report — its running, standby and out hours,
its stoppages and their reasons — and its PM record and interval carry over. Its
last three-hour reading is what "yesterday" shows on the first daily day.

The other four batteries are unchanged — their pumps stay three-hourly columns.

## v40 — PM monitoring

Service-worker cache `sinai-field-v40`. Only `index.html` and `sw.js` change.
**No rules change**: PM records live on `tbReadingsMeta/pm`, a document in a
collection the rules already open to admin.

Admin's **Pumps** tab has a new **PM monitoring** section, above the register,
with a card for every pump — the ones that need attention first (overdue, then
due soon, then by how far into their interval):

- **running hours since the last PM**, a bar showing how far into the interval;
- the **required interval** — editable per pump (**Interval**), with "Back to
  default"; until set, the default for its kind (placeholder 4,000 h);
- **hours left** to the next PM, or hours OVER; and the **date it falls due at
  the pump's current pace** (its running hours over the last 14 days), with
  the year when it is next year — or "not running" when it has no pace;
- **standby and out-of-service hours since the last PM**, and the date of it;
- **Record PM**: date, time and what was done; saved with who recorded it. The
  count restarts from that moment — readings after it count, readings before it
  do not.
- **PM log**: every PM for the pump, newest first, each removable if recorded
  by mistake.

A summary line on top counts overdue, due soon and OK. "Due soon" is 90% of the
interval. PM is no longer a column of the register.

PMs recorded the old way (the v28 "PM done" button) still count, as a PM at the
end of that day.

## v39 — T.B. 10/1: high-pressure pumps, recorded daily

Service-worker cache `sinai-field-v39`. Only `index.html` and `sw.js` change;
no rules change.

T.B. 10/1's **وضع المحطة** tab gains a **HIGH PRESSURE PUMPS** card, above the
transfer pumps: **HP Pump 1** and **HP Pump 2**, each recorded **once a day**
(يومياً) — في الخدمة / احتياطي / خارج الخدمة — rather than at every three-hour
reading. The transfer pumps stay three-hourly underneath.

- A day not yet recorded shows yesterday's state as a hint (أمس: في الخدمة).
- Going out of service opens **سبب التوقف** with the cursor in it — on the day it
  went out only; the days after show "خارج الخدمة منذ 16/8 — reason".
- The red count on the tab includes an HP pump that is out.

**Admin's Pumps report** lists both, with each recorded day counted as 24 hours
of its state — running hours, standby, out, PM, and every stoppage with its
reason. PM placeholder 4,000 h, as for the others.

Only T.B. 10/1 has daily pumps (`TB_PUMPS_DAILY`). Stored as `pumpsDaily`,
`pumpsDailyWhy` and `pumpsDailyPM` on its daily document.

## v38 — T.B. 10/1 tab order

Service-worker cache `sinai-field-v38`. Only `index.html` and `sw.js` change.

T.B. 10/1's tabs now follow the shift: **القراءات** (scanner readings), then
**مقاسات المحطة**, then **وضع المحطة**. Nothing inside them changed.

## v37 — skimmer 4–13 stairs, Oil Room

Service-worker cache `sinai-field-v37`. Only `index.html` and `sw.js` change.

- **API skimmer** now runs **4 to 13 stairs** — ten buttons in two rows of five.
  Rounds saved at 5–9 keep their value.
- **OIL ROOM**, after the skimmer: On / Off, nothing else. In the message:

      *`OIL ROOM`*

      *Oil Room : On*

Stored as `oilR` in the round.

## v36 — heaters on/off, two high-pressure pumps

Service-worker cache `sinai-field-v36`. Only `index.html` and `sw.js` change.

**Each Sigma heater has On / Off.** Off takes its temperature and flow away —
the boxes go and anything already typed in them is cleared, since a heater not
running has nothing to report — and the message reads `*Heater 4 : Off*`. A
round with a heater off still counts as done without that heater's readings.

**High pressure is two pumps**, Pump No.1 and Pump No.2, each On / Off. Only the
pump that is ON goes in the WhatsApp message (`*Pump No.2 : On*`), the way the
group writes it; both on gives both lines, and both off gives one line,
`*Pumps No.1 & 2 : Off*`. The old single "pump number + on/off" is retired; a
round saved that way still reads correctly as that pump on or off.

Stored as `h1S`, `h2S`, `h4S` and `hp1`, `hp2` in the round.

## v35 — station measurements: English labels, Sigma heaters

Service-worker cache `sinai-field-v35`. Only `index.html` and `sw.js` change.

**The مقاسات المحطة form is now in English** — section names, field names and
choices (Water / Emulsion / Oil, On / Off, 5–9 Stairs). The operators know
these by name; the Arabic was only in the way. The round times keep their
Arabic hour, and the WhatsApp message is English only (the Arabic option is
gone).

**SIGMA HEATERS**, after the scanner: Heater 1, Heater 2 and Heater 4, each with
its temperature (°C) and flow rate (m³/h), side by side on one line. In the
message each heater is one line:

    *`SIGMA HEATERS`*

    *Heater 1 : 84 °C · 11.5 m³/h*
    *Heater 2 : 82 °C · 12 m³/h*
    *Heater 4 : 84 °C · 10.5 m³/h*

A heater with nothing read is left out. Stored as `h1T`, `h1F`, `h2T`, `h2F`,
`h4T`, `h4F` in the round.

## v34 — T.B. 10/1 station measurements (مقاسات المحطة)

Service-worker cache `sinai-field-v34`. Only `index.html` and `sw.js` change;
no rules change — the rounds are stored on 10/1's own daily document.

T.B. 10/1 gets a third tab, **مقاسات المحطة**, for the station rounds.

**Nine rounds a day**, on the station's own clock rather than the scanner's:
05:00, 09:00, 12:00, 15:00, 18:00, 21:00, 00:00, 03:00 and 05:00 the next day,
each with its Arabic hour under it (5 صباحاً … 12 ظهراً … 12 ليلاً). They sit
along the top; a dot on each says empty, part-filled (amber) or done (green).
The closing 05:00 is the next day's opening 05:00 — one entry, both days.

**One round at a time**, its form in the order it is reported, every label in
Arabic with the English under it:

| Section | Fields |
|---|---|
| المستويات · LEVEL | Tank 7, Tank 9 Bis (m) |
| خزان 01 · TANK 01 | sample number; مياه / مستحلب / زيت |
| خزان 02 · TANK 02 | sample number; مياه / مستحلب / زيت |
| درجات الحرارة · TEMPERATURE | Tank 02, Shipping line (°C) |
| الضغوط · PRESSURES | Sep 1, Sep 2, Shipping line (bar) |
| السكانر — 3 ساعات · SCANNER 3 hr | Oil quantity, Drain Tank 02 (m³) |
| السكيمر API · SKIMMER | level 5 – 9 stairs |
| طلمبة الضغط العالي · HIGH PRESSURE | pump number; تشغيل / إيقاف |

Choices are buttons — tap again to clear. **نفس قراءات** on an empty round
fills it from the round before, so only what changed needs typing.

**The WhatsApp message** for the chosen round is built under the form, in the
group's own format — the section names as code, bold lines, the ruled lines,
"Work Shift" at the foot — cleaned up: a real time (12:00 PM) and the date,
proper units, levels to two decimals, and only what was actually read.
**نسخ الرسالة** copies it; **فتح واتساب** opens WhatsApp with it written, to
choose the group. **العربي مع الإنجليزي** adds the Arabic beside each line.

Admin sees the same tab on 10/1's panel on the Entry page. Stored as
`meas.{round}.{field}` on 10/1's document.

## v33 — T.B. 10/1: the pump station on its own tab

Service-worker cache `sinai-field-v33`. Only `index.html` and `sw.js` change.

Six transfer pumps as columns made T.B. 10/1's table too wide to work in. Its
panel now has two tabs:

- **القراءات** — the readings: scanner, production, line pressure, temperature,
  chemical injection. No pump columns.
- **وضع المحطة** — the pump station: the same nine reading times, one column
  per transfer pump, the same pickers, **سبب التوقف** where one goes out, and
  **كما هو** to copy the reading before.

The وضع المحطة tab carries a red count of the pumps out of service at the day's
latest reading, so a breakdown is not hidden behind the tab. Switching tabs
shows and hides them in place — nothing typed is lost — and the open tab is
kept when the day changes. The same tabs appear on 10/1's panel on admin's
Entry page.

**The other four batteries are unchanged** — their pumps stay as columns in
the one table.

Also fixed: a reason box opened in a table wider than the phone could sit off
the right edge of the screen, label first. It is now pinned to the visible part.

To give another battery the same tabs, set `pumpTab:true` on it in `TB_LIST`.

## v32 — Today and Yesterday, one under the other

Service-worker cache `sinai-field-v32`. Only `index.html` and `sw.js` change.

The figures in each battery's header are now two identical lines:

    TODAY        186 m³
    YESTERDAY   -478 m³

Same size, same weight, labels lined up on the left and figures digit under
digit on the right. Both in English for everyone — the أمس label from v30 is
gone. Yesterday is still taken over the same intervals today has read, and the
line is still left out when there is nothing to compare.

## v31 — Line pressure

Service-worker cache `sinai-field-v31`. Only `index.html` and `sw.js` change.

The tank battery entry column headed "WHP" now reads **Line pressure** with
**ضغط الخط** under it — on the operators' screens and on admin's Entry page,
which share the table. Same field, same units (psi; bar for T.B. 10/1); only
the heading changed, so every reading already entered stays where it was.

## v30 — drain scanners read as totalizers; أمس

Service-worker cache `sinai-field-v30`. Only `index.html` and `sw.js` change;
no rules change.

**The drain scanners (29 BIS, GB #1, GB #3) are now entered as the scanner's
TOTALIZER reading**, like the tank battery scanners. The table has nine reading
rows, 06:00 to the next 06:00, and under every reading the app shows the drain
since the reading before — the difference, worked out, never typed:

- green for a normal difference; **red when a reading is lower than the one
  before it** (a reset or a misread), so it is checked rather than passed off as
  production;
- the opening reading is the day before's closing when it was not typed, and a
  closing reading is saved as tomorrow's opening too — one moment, one reading,
  as with the battery scanners;
- the twelve-hour subtotals sit under 18:00 and under the closing 06:00, and the
  day total is the closing reading minus the opening.

Everything downstream — totals, yesterday and difference, the report card, the
analysis, the daily totals — works from those differences unchanged.

**The crude oil scanners (L.O.T.F, M.O.T.F, Sicies) are unchanged** — still the
quantity for each three hours. Days entered before this release keep the
quantities they were typed with; nothing is converted.

Stored as `r.{0..8}` on the meter's document beside the old `q` and `v`.

**The "Yesterday" line under each battery's day total reads أمس for the
operators.** Admin still reads "Yesterday".

## v29 — yesterday under the day total

Service-worker cache `sinai-field-v29`. Only `index.html` and `sw.js` change.

Each battery's header now carries a second line under the day's total:
**Yesterday** and a figure — for the operator's own battery and for all five on
admin's Entry page.

That figure is yesterday over the **same intervals today has read so far**: at
08:00 yesterday's first three hours, at 11:00 its first six, and so on to the
whole day. It moves as each reading is typed, without redrawing the table. So
the two numbers stacked in the header always compare like for like — never a
day still being read against a finished one.

An interval yesterday did not read is left out. A yesterday imported as a
single daily figure has no intervals to match, so it shows only once today is
complete. With no yesterday on record, or nothing read yet today, the line is
not shown.

## v28 — pump station

Service-worker cache `sinai-field-v28`. Only `index.html` and `sw.js` change.
**`firestore.rules` needs no change** — the pump readings are fields on each
battery's own daily document, which that battery's account already writes.

### For the operator

Every battery's entry table now has **one column per pump**, after Chem. inj.,
read with the scanner every three hours:

| Battery | Pumps |
|---|---|
| T.B. 6/1 | Booster A, Booster B |
| T.B. 6/2 | Booster A, Booster B, Borets A, Borets B |
| T.B. 8/1 | Powerhouse A, Pump B, Pump C |
| T.B. 8/2 | Booster A, Booster B, Booster C |
| T.B. 10/1 | Transfer 1 – 6 |

Each box is a picker in Arabic: **في الخدمة**, **احتياطي**, **خارج الخدمة** —
green, amber and red once chosen.

- Choosing **خارج الخدمة** opens a **سبب التوقف** line under that reading,
  named for the pump, with the cursor already in it. It opens only at the
  reading where the pump went out, not again while it stays out.
- **كما هو** under the time fills an empty row's pumps from the reading before —
  the whole update when nothing changed in three hours.
- The closing reading is the next day's opening, exactly as for the scanner.
- With six pumps the table is wider than a phone: it scrolls sideways and the
  time column stays fixed.

### For admin — the new **Pumps** tab (English)

Every reading counts the THREE HOURS AFTER IT to the state it records:
in service → running hours, standby → standby hours, out of service → hours
out. So a pump left in service keeps counting running hours; the reading it
goes out, it starts counting out-of-service hours instead; standby likewise.

Pick an "As of" day and a period (This day / 7 / 30 / 90 days / All):

1. **Pumps situation** — every pump's latest state as a coloured chip, counts
   per battery and for the field.
2. **Hours by state** — per pump: state now, hours in service / standby / out
   in the period, total running hours, running hours since the last PM against
   the PM interval, and how many times it went out.
3. **Out of service** — every stoppage: when it went out, when it came back (or
   still out), hours out, and the reason the operator wrote.

**PM** is recorded by admin: set "As of" to the day it was done and press
**PM done** on the pump's row; its count to the next PM restarts after that
day. Pressed by mistake, the same button reads **Undo PM** on that day and takes
it back.

**The PM interval is a PLACEHOLDER — 4,000 running hours for every pump** —
until the real figures are known. Change `TB_PUMP_PM_HOURS` in `index.html`.
A pump shows "PM due soon" at 90% and "PM overdue" past 100%.

Stored on the battery's document: `pumps.{pump}.{reading}` = `in` | `sb` |
`out`, `pumpWhy.{pump}.{reading}` = the reason, `pumpPM.{pump}` = true on a PM
day. Running hours start from the day this is first used; nothing before it is
estimated.

## v27 — one less note on the entry table

Service-worker cache `sinai-field-v27`. Only `index.html` and `sw.js` change.

The "3 of 8 intervals complete — the total below covers those only" line is
gone from the battery panels. A man filling the table in can see which boxes
are still empty.

The two notes that remain are things he cannot see by looking: a reading LOWER
than the one before it (a meter reset, rollover or misread), and a day that
holds an imported daily figure with no three-hour readings behind it.

## v26 — the fitted card stops jumping

Service-worker cache `sinai-field-v26`. Only `index.html` and `sw.js` change.

Fit to screen shrank and grew the card while you scrolled on a phone, and
stuttered doing it. Three causes, all fixed:

- **The address bar.** A phone browser hides its address bar as you scroll and
  shows it again as you scroll back, and `window.innerHeight` changes by 60–100
  px each time — which the card was honestly re-fitting to. It now fits to the
  TALLEST height seen at this width, so the size it settles on is the size it
  keeps. A rotation starts the measurement again; a height-only change is
  ignored, because it is not a new screen.
- **The re-measuring.** Fitting tries several layout widths, and each one costs
  a reflow of the whole card. That ran again on every one of those resizes,
  which is where the stutter came from. The answer is now kept and reused until
  the day, the period or the width actually changes.
- **The scroll-up.** Fitting scrolls the card under the header once when it
  opens. It was smooth-scrolling, and could land while a finger was still
  moving, so the page appeared to fight back. It is now instant, only once per
  card, and never while the reader is mid-scroll.

## v25 — Remarks in Arabic too

Service-worker cache `sinai-field-v25`. Only `index.html` and `sw.js` change.

The Remarks heading now reads **Remarks ملاحظات اليوم** on every entry screen —
each tank battery's box, the PETRECO scanners' box, and all five boxes on
admin's Entry page. A heading has a whole line to itself, so the Arabic sits
beside the English rather than under it.

## v24 — Scanner analysis split in two

Service-worker cache `sinai-field-v24`. Only `index.html` and `sw.js` change.

**Scanner analysis now has two tabs of its own: Figures and Graphs analysis.**
Checking a shift against yesterday is reading numbers; looking for a drift is
reading shapes. They were one long scroll, so the numbers sat above five charts
and the charts below the numbers, and neither was quick to reach.

| Figures | Graphs analysis |
|---|---|
| Today at a glance, both groups | Three-hour production, field and per battery |
| Monitoring Production real-time | PETRECO three-hour production |
| PETRECO at a glance | Tank battery record — all batteries, each battery |
| PETRECO twenty-four hours | PETRECO daily production |
| PETRECO daily production table | |
| Import daily history | |
| Tank battery record — daily totals | |

Figures opens first. The range chips (30 days / 90 days / All) are drawn in both
places and share one setting, so the range chosen on one tab is the range on the
other. Charts are drawn when their tab is opened, not while it is hidden — a
chart measures itself against the width it is drawn in, and a hidden one has
none.

**The two on-screen comparison tables are gone** — "Twelve-hour halves — today
vs yesterday" and "Twenty-four hours — today vs yesterday". The printed day
report still carries both, and that is where a shift is signed off.

## v23 — Arabic on the entry screens

Service-worker cache `sinai-field-v23`. Only `index.html` and `sw.js` change.

The men entering readings read Arabic more easily than English. Arabic is added
UNDER the English, never instead of it: the same tables are read in the office
and go into the reports.

**Tank batteries** — headings and times:

| Column | Arabic |
|---|---|
| Scanner m³ | سكانر |
| Temp °C | الحرارة |
| Chem. inj. | حقن الكيمكال |
| Production, WHP | left in English |

and the hour under each time: 05:00 → **5 صباحاً**, 17:00 → **5 مساءً**, noon
→ **12 ظهراً**, midnight → **12 ليلاً**.

**PETRECO scanners** — the period column only, on both the drains and the crude
oil: 06:00 → 09:00 carries **من 6 ص إلى 9 ص**, and the twelve-hour subtotals
carry theirs. The scanner names stay as they are.

**R/G Production** — the time column only, the same wording as the batteries.
The headings stay English: that table is PETRECO against Ras Gara and is read
by both sides and by the office.

Three details that decide whether this reads properly rather than merely
appearing:

- `letter-spacing` is forced to 0 on Arabic. The headings and time columns are
  letter-spaced, and spacing between Arabic letters breaks the joins — سكانر
  comes out as سكا نر.
- A period is written **من … إلى …**, not with an arrow. An arrow between two
  Arabic runs is a neutral character whose side depends on the line's
  direction, and a period that reads backwards is worse than a longer label.
- Noon and midnight get their own words. "12 مساءً" for midday is wrong to an
  Arabic ear and "12 صباحاً" for midnight is worse.

The battery table is a little wider for it, so on a narrow phone it scrolls
sideways rather than clipping a reading: the WHP and scanner boxes keep their
digits.

## v22 — remarks on the printed report, and a card that fits the phone

Service-worker cache `sinai-field-v22`. Only `index.html` and `sw.js` change.

**The printed day report now carries the remarks too**, in a Remarks section at
the end — each battery that wrote something, headed and underlined with whose
it is, then PETRECO's. It is the same collection the report card shows
(`tbRemarksList`), so the two cannot drift apart. A day with no remarks gets no
section rather than an empty one.

**The report card fits a phone screen.** Opening it now scales the whole card
down as one block so the entire day stands on the screen at once, with no
scrolling: 0.74 on a 412px phone (≈10px figures), 0.64 on a 360px one (≈8px).
Two things make that possible — the card is measured against the whole screen
below the header rather than the space left under the date bar, and it is laid
out at the width that scales best rather than at the phone's own width, since a
narrow layout wraps tall and wastes the screen. A **Full size** button turns it
off; on a desktop screen it is off to begin with, because the card already
fits.

The card is scaled as a block, not reflowed, so what is on the screen is the
report people read on paper — same columns, same order, same shape.

## v21 — remarks from every battery

Service-worker cache `sinai-field-v21`. Only `index.html` and `sw.js` change;
`firestore.rules` needs no change — a battery's account already writes its own
document, and the remark is a field on it.

**Every tank battery now has a Remarks box**, under its table on the entry
screen. An operator sees one — his own battery's — and admin sees all five on
the Entry page. It is one remark per battery per day, saved like any other
cell: on the date it was typed, only that field, and it survives a sync
landing while it is being written.

**The report card collects them.** The Remarks box at the bottom now carries
each battery that wrote something, headed and underlined with whose it is —
T.B. 6/1, T.B. 6/2 and so on — then PETRECO's remark last, in the same box. A
battery with nothing to say is left out rather than given an empty heading, and
a day with no remarks at all still shows the box saying so.

The card stays one A4 page even with all five batteries and PETRECO writing a
long note: past two remarks the block tightens instead of pushing the day onto
a second sheet.

**The note under the Daily totals table is gone** — the table speaks for
itself.

Stored as `remarks` on the battery's own document, beside its readings.

## v20 — PETRECO on the Daily totals table

Service-worker cache `sinai-field-v20`. Only `index.html` and `sw.js` change.

The **Daily totals** table at the bottom of Scanner analysis now carries
PETRECO's own scanners beside the batteries, as day totals for the same shift
day:

- **29 BIS, GB #1, GB #3, then a Drains column** adding the three. They are
  three readings of one job, so their total means something.
- **L.O.T.F, M.O.T.F and Sicies, with no total.** They are separate
  streams into PETRECO, and a column adding them would only invite a comparison
  nobody asked for.

A day with no PETRECO readings shows dashes rather than zeros, and a figure
from a day short of readings is in italics — the same mark the rest of the app
uses. The battery columns, the red tint on a losing day and the Change columns
are untouched.

The printed record (Print record) is unchanged and still covers the batteries
only.

Also: **the Sicies scanner is now called just "Sicies"** everywhere — entry
table, analysis, report card, daily totals — because the full name cost a
column's width on every one of them. Only the label changed; the meter id
(`psicies`) and its data are untouched.

## v19 — the Sicies scanner

Service-worker cache `sinai-field-v19`. Only `index.html` and `sw.js` change;
`firestore.rules` needs no change (PETRECO's operators already write every
meter in their own collection).

**A third crude oil scanner, Sicies**, treated exactly as L.O.T.F and
M.O.T.F are:

- its own column in PETRECO Crude Oil on the entry table, typed every three
  hours, counted in the section's twelve-hour subtotals and day total;
- its own chart, its own line in the today/yesterday table, its own row in the
  monitoring grid and the daily table on Scanner analysis;
- its own line in PTB Production on the report card, counted in that TOTAL.

Stored as `pfReadings/{date}__psicies`, like any other meter. Nothing existing
moved or changed shape.

While adding it, the report card's PTB Production block stopped naming its
crude lines and now takes them from PF_LIST's `crude` group, so the next
scanner added there appears on the card without another edit.

## v18 — chemical injection

Service-worker cache `sinai-field-v18`. Only `index.html` and `sw.js` change.
**`firestore.rules` needs no change** — the tank battery rules allow a battery's
own account to write its own document, whatever fields are in it, so the new
field is covered by what is already published. Nothing to republish.

**Every battery now records chemical injection, every six hours**, in a new
column after Temp on the operator's table — T.B. 6/1, 6/2, 8/1, 8/2 and 10/1
alike. Six hours means four doses plus the closing reading: 05:00, 11:00,
17:00, 23:00 and 05:00 for the Belayim four, an hour later for T.B. 10/1, each
on its own shift clock. The rows in between have no box, the same way the
scanner columns are closed off on a temperature-only row.

Units are litres by default. If a battery doses in something else, set
`chemUnit` on it in `TB_LIST` — the column heading, the cards and the grid all
follow it.

**Admin gets a Chemical injection page** beside Temperature, built the same way
— cards per battery, a chart through the day, and a grid every six hours. Two
things differ, because a dose is not a temperature: the headline figure is the
day's TOTAL rather than the average, and the grid's last column totals the
doses. The grid carries one header per clock, so T.B. 10/1's doses are not
labelled an hour early.

Stored as `chem` on the same document, keyed by hour offset exactly as `temp`
is. A dose saves like every other cell: only that field is sent, on the date it
was typed, and it survives a sync landing mid-entry.

## v17 — no explanatory notes on the entry screen

Service-worker cache `sinai-field-v17`. Only `index.html` and `sw.js` change.

The PETRECO entry table no longer tells the operator "the comparison with
yesterday appears once all eight periods are entered". He is there to enter
readings; the app explaining its own derived cells to him is noise.

The other note — which halves of an old day are still twelve-hour figures — is
now shown to admin only, for the same reason. Nothing about the figures
themselves changed.

## v16 — report card: "Not yet" instead of a part figure

Service-worker cache `sinai-field-v16`. Only `index.html` and `sw.js` change.

**The report card no longer shows part figures.** A line whose window is not
fully read now reads **Not yet** in the Today column — not the readings taken
so far added up. v14 showed that running figure marked "so far"; on paper it
still read as a day's production, and a reader comparing it with yesterday's
finished figure reached the wrong conclusion whatever the mark said.

**A total is never part-added either.** Until every line in it is read, the
TOTAL row reads "Not yet" as well. A Belayim total of the two batteries that
happen to be in is not the group's production.

Lines that ARE fully read still show their figures and their difference
normally, on the same card — the rule is per line, not per card. Yesterday's
column is unchanged where yesterday is complete, and shows a dash where it is
not. The heading still says IN PROGRESS while anything is outstanding.

The entry screens and Scanner analysis are unchanged: there a running day total
is what an operator filling in the shift needs to see.

## v15 — PETRECO scanners every three hours

Service-worker cache `sinai-field-v15`. Only `index.html` and `sw.js` change;
`firestore.rules` is unchanged.

**All five PETRECO scanners — 29 BIS, GB #1, GB #3, L.O.T.F and M.O.T.F — are
now entered every three hours from 06:00**, eight periods a shift
(06:00→09:00 … 03:00→06:00), the same cadence as the tank battery scanners. It
was twice a day on twelve-hour periods.

The entry table keeps the twelve-hour figures as subtotal rows under the four
periods they cover, because that is how the shift is reported. Below them the
day total, yesterday, and the change — and the change appears only once all
eight periods are entered, the same rule the report card uses.

**Old days are not touched and not misread.** Every day recorded before this
release is stored as two twelve-hour halves and is read exactly as it always
was: it still totals, and still compares over 12 and 24 hours. Over 3 or 6
hours it says **12 h only** rather than showing a figure it does not have.
Each half decides this for itself, so a changeover day — the morning entered
the old way, the evening the new — is right on both halves. The moment any
three-hour period of a half is typed, that half is three-hour data and the old
figure for it stops counting.

**The report card.** L.O.T.F and M.O.T.F now have their own 3- and 6-hour
figures, so the PTB Production total adds up over those windows too — it
previously could not, and read "12 h only". The drain section likewise.

**Scanner analysis.** The PETRECO charts are now eight three-hour bars per
section and per meter, today against yesterday. The KPI cards show the day,
the change against yesterday and the 7-day average, then each twelve-hour
half. The five PETRECO scanners also appear in the Monitoring Production grid,
under their own 06:00 header row and clearly labelled PETRECO — they are not
tank batteries and are never added into a battery total. Comparisons there
follow the same rule: a shift still being read is not compared, and the 7-day
average counts complete days only.

**The tank battery side of Scanner analysis now follows the same rule**, which
it did not: the "Twenty-four hours — today vs yesterday" table, the twelve-hour
halves table and the chips on the three-hour charts compared a shift still
being read against a finished one and reported the unread hours as a loss. They
now say **not complete** until the shift (or that half) is fully read, and mark
today's figure in italics. The printed day report carries the same table, so it
is fixed there too.

Storage: three-hour periods are written to a new `q` field on the same
document; the old `v` is left alone. Nothing is migrated and nothing is
rewritten.

## v14 — report card: 3, 6, 12 and 24 hours

Service-worker cache `sinai-field-v14`. Only `index.html` and `sw.js` change.

**The report card period now offers First 3 hours, First 6 hours, First 12
hours and 24 hours** (Second 12 hours is still there, last). Every line reads
the window on its own clock, and each block heading now prints it: for the
first 3 hours that is 05:00–08:00 for the Belayim batteries and 06:00–09:00 for
T.B. 10/1, PETRECO and R/G.

**Nothing is compared until today's window is complete.** A window is complete
when every reading inside it exists — both three-hour intervals for 6 hours,
all six hourly R/G readings for 6 hours, and so on. Until then:

- today's figure is shown in italics marked **SO FAR**;
- yesterday's figure is still shown, for reference;
- the Difference reads **not complete** instead of a gain or loss;
- the heading adds **IN PROGRESS**.

The rule applies line by line and to every total: the Belayim TOTAL is compared
only when all four batteries have the whole window, and the R/G gap only when
both meters do. A short window on yesterday's side (a missed reading) is marked
**incomplete** and is not compared either.

This replaces the earlier "like for like" method, which compared today's part
window against the same hours of yesterday. That still produced a difference
for an unfinished window; now there is none until it is finished.

**PETRECO's scanners are read per twelve hours**, so they have no 3- or 6-hour
figure. Over those windows their lines read **12 h only**, and so does the PTB
Production TOTAL, because two of its four streams (L.O.T.F, M.O.T.F) are
missing — a total without them is not the PTB figure. T.B. 10/1 and Received at
PETRECO still show their own 3- and 6-hour figures.

The printed card stays one A4 page for every period (861–903px of 1085).

## v13 — no lost readings

Service-worker cache `sinai-field-v13`. Ten files deploy (see `SETUP.md`).

Seven faults, all reproduced in a browser before they were fixed and each now
covered by a check that fails on v12. The first three lost readings silently.

**A reading typed while another device saved was lost.** Every save bumps a
version stamp that all devices watch, and a device that sees it downloads the
data again and replaces its own copy wholesale — including a value typed less
than a second earlier and still waiting to upload. The box then showed the old
value and the new one was never sent. With five battery phones sharing one
stamp, and PETRECO and Ras Gara sharing another, this was not rare. The same
re-download rebuilt the table under the operator's finger, which also closed
the phone's keyboard mid-number.

Now every typed cell is held in a queue, with its value, until the cloud
accepts it (`makePending()` in the shell). A download is laid back over with
whatever is still queued, and a table whose box is being typed in is updated
in place around that box instead of being rebuilt.

**A save could erase someone else's correction.** A save sent more than was
typed — a whole row for the tank batteries (scanner, WHP and correction
together), both periods for a PETRECO meter, and every PETRECO or Ras Gara
hour of the day for R/G. A phone that had not synced since the admin corrected
a value sent its old copy back over the correction: an operator who changed
only a WHP reset the admin's correction to nothing. Saves now send exactly the
fields that were typed and nothing else.

**Changing the date before the save went out stranded the entry.** R/G and
PETRECO saved whichever day was on screen when the one-second delay ran out.
Type on the 17th, switch to the 16th, and the 16th was written while the 17th
stayed on the phone only, until the next sync overwrote it. The queue is keyed
by the date the value was typed on.

**The queue survives.** It is kept on the device per account, so a save that
fails — no signal — is retried, and one still waiting when the app is closed is
sent the next time the same account opens it. It is never sent by a different
account signing in on that phone. Pending saves are also sent immediately when
the app is put in the background and before signing out, rather than waiting
out the delay.

**The PETRECO entry tables appeared under R/G Production for admin.** They are
embedded in A/R Production → Entry, but every tank battery refresh re-showed
them whatever tab was open, so they sat at the bottom of the R/G page. They now
follow the open tab, and the PETRECO page lives inside the app body so signing
out hides it with everything else.

**PETRECO's tab lost its heading and date picker after an admin sign-out.** The
"embedded" marker was added for admin and never removed, so PETRECO signing in
on the same page got a tab with no date box. It is now set from the role at
every sign-in.

**The report card's 12-hour periods ignored R/G.** "First 12 hours" printed the
whole day's From Ras Gara and Received at PETRECO, and added that whole day into
the PTB Production total beside twelve-hour figures. R/G now uses rows 06:00–17:00
for the first half and 18:00–05:00 for the second.

**An account in no role list saw an error instead of an explanation.** The code
treated it as a read-only viewer, but the rules refuse it every collection, so
it got an empty app and "Cloud refused access" in the footer. It now gets a
"No access" page, starts no listener, and the footer says the account has no
access. The rules are unchanged — widening them so any account created in the
console could read production data would be the wrong fix.

Also fixed: PETRECO's own calculated Cumulative column did not update while
typing, only on the next full redraw.

Rules: **no change.** `firestore.rules` is the same as v12.

Development only: `firebase-stub.js` now enforces every collection's rules, not
just the tank batteries', and a new harness `test_viewer.html` signs in as an
account with no role.

## v12 — PETRECO scanners, report card, chart detail

Service-worker cache `sinai-field-v12`. Twelve files deploy.

## v11 — Tank Batteries

"Where the hours went" is now **Monitoring Production real-time**. The grid is
sized to the page — 90% of the available width, centred, large figures — and
carries no note underneath it at all.

Its columns are clock times, headed with the time each interval ENDS — the
05:00→08:00 three hours is headed 08:00, because that is the reading the figure
came from. The two shifts get a header row each, sitting directly above the
batteries that run them (08:00…05:00 for the Belayim four, 09:00…06:00 for
10/1), so nothing is ever labelled with a time it was not read at and the
ordinals are gone.

Fixed: the grid was reading the date SELECTED ON SCREEN rather than the date it
was asked to draw, so a printed report for any other day came out empty. Found
by looking at a rendered report; the tests had never caught it because they set
the date first. There is now a test that prints one day while another is
selected.
**Top battery / lowest battery cards are gone**, replaced by **vs 14-day** and
**vs 21-day** averages alongside the 7-day. Ranking four batteries said nothing
about whether the line is performing; three trailing baselines tell a bad day
apart from a bad fortnight.

Comparisons are in **m³, not percentages** — everywhere. "Down 4%" at Belayim
and "down 4%" at 10/1 are very different barrels, and barrels are what ships.

The pair of daily gain/loss charts is gone, replaced by a **24-hour today vs
yesterday table**: every battery and both group totals, with the gain or loss as
a plain figure in green or red. Reading a number off a bar is worse than reading
the number.

The **daily totals table** is rebuilt for its real job — scanning a long run of
days for where production fell away. Weekday spelled out, larger type, sticky
header, zebra rows, a red edge on any day Belayim produced less than the day
before, and a change column per group in m³. Group columns are tinted so the two
lines read apart at a glance.

"shipped to PETRECO" replaces "own line to PETRECO".

Date axes read "10 Jul", not "07-10". The same page carries three-hour ranges
written "05–08", and a date in the same NN-NN shape was read as a time — the
gain/loss chart looked like it was plotting 07:00–10:00. The gain/loss chart
also now states outright that each bar is one day against the day before, and a
stepped axis label is dropped when it would crowd the final date.

**Daily-only history.** A day can now carry a `dayTotal` with no readings
behind it — a figure taken from the daily scanner sheet. It totals, compares and
averages like any other day, but has no three-hour detail and never pretends to:
the panel says "Daily figure only", the record table tags the row `daily`, and
the monitoring grid shows dashes. The moment a real reading is entered for that
battery and day, the measured figure wins and the imported one steps aside.

**The shift boundary is one reading, not two.** A day's closing reading and the
next day's opening reading are the same meter at the same moment, written down
twice. Operators were entering it on one day and not the other, which left
whichever day missed out a full interval short — through no fault of theirs,
because there is only one reading to take.

It is now entered once, on EITHER day, and written to both. Nothing is invented:
this is not a guess at a reading nobody took, it is the reading they did take,
filed where it also belongs. There is no new control, no marker and no wording
to read — the other day is simply already correct when they reach it.

Days recorded before this can still be missing one end; the reading is on the
neighbouring day, so it is read across rather than leaving an interval
unaccounted for. That fill is read-only and writes nothing.

A correction is deliberately NOT mirrored. At index 8 it belongs to that day's
last interval; at index 0 of the next day it would belong to an interval that
does not exist.

This revises an earlier decision. The opening reading was deliberately left
un-filled on the grounds that "a meter reading nobody took is worse than a blank
one". That reasoning was about inventing a figure, and it does not apply here:
the boundary reading was taken, it was just filed on the other day.

Dirty-tracking is keyed by DATE now, since one entry legitimately changes two
days and both have to reach the cloud.

**Charts open.** Tapping any chart on the Scanners page opens it larger with
the figures written out underneath — every value on the bars, and a table of
the numbers with a Total row. A bar is a shape; reconciling production needs
the number. Closes on Escape, on the backdrop, or on the X. Keyboard-reachable.

A difference column is shown only where the two series are the SAME measurement
at two different times. It is never inferred from "there are two series": the
daily chart carries Belayim and T.B. 10/1, and subtracting one delivery line
from the other would have been a number that means nothing. Caught by testing
the opened table rather than the chart.

**The admin's tabs are two, not three.** `R/G Production` keeps its name;
everything downstream of it — the tank batteries and PETRECO's own scanners —
is now `A/R Production`, with three pages under it:

- **Entry** — the tank battery panels AND the PETRECO scanners on one screen,
  so a correction to the day is one place, not two tabs
- **Report card**
- **Scanner analysis** (was `Scanners`)

The embedded PETRECO entry drops its own page header and date bar and follows
the date chosen above it: two "Shift day" boxes on one screen is a question, not
a tool. PETRECO's own operators keep their own top-level tab, unchanged — this
is an admin-side grouping only, and tank battery operators see none of it.

Admin now starts the PETRECO listener despite having no PETRECO tab, because
the data feeds both that entry page and the report card.

**PETRECO scanners.** PETRECO run the central processing facility the tank
batteries feed, and they now record its own readings on their own tab:

- **Drain of the tanks** — 29 BIS, GB #1, GB #3
- **PETRECO Crude Oil** — L.O.T.F, M.O.T.F

Laid out TIME DOWN THE LEFT and SCANNERS ACROSS THE TOP — the same way round as
the PETRECO/Ras Gara readings these same operators already fill in every day. It
was the other way round at first; an operator moving between the two screens
should not have to work out which axis is which. Two typed rows, one per
twelve-hour period (06:00→18:00 and 18:00→06:00), then day total, yesterday and
the difference derived beneath them, with a Total column down the right. A period is a QUANTITY for those twelve hours,
not a meter reading to be differenced — so unlike the tank batteries there is no
opening reading and no shared boundary. A missing period is never counted as
zero, which would report a shut-in that did not happen.

Own collection `pfReadings/{date}__{meter}`, own rules: admin and PETRECO only.
A tank battery operator cannot see it and a PETRECO operator still cannot see
the tank batteries.

**Remarks** are a free-text note per day, entered on the same tab and printed on
the report card. The card omits the block when there is no note — an empty box
on a printed report is a question nobody can answer.

**The card is tighter.** Row padding, the gap between sections and the header
were all cut back: 1,124px to 946px on a phone and 1,355px to 987px on a desktop,
with nothing removed. Five sections read as one card now rather than as five
tables with space between them. The printed version already had its own
measurements and is unchanged.

**Fixed: the card's total row did not shrink on a phone.** `tr.tot td` carries
its own font-size, which outranks the rule the phone sizes were written on, so
every cell shrank except the totals — 12.5px rows with an 18px total, and the
columns stopped reading as columns. The phone rules now answer every size set
above them, and there is a second step down below 400px. Anything that sets a
size on a cell has to be answered in both.

**Every section is always drawn**, filled or not. Sections used to be omitted on
a day with no readings, which meant PETRECO's two blocks were invisible until
somebody entered data and looked like they had never been added. The card is a
standing form: an unfilled section shows dashes, which is a smaller question
than a section that vanishes.

The printed card is **one A4 page** — measured at 881px against 1085px of
printable height, with all five sections and the remarks on it. It gets its own
set of measurements rather than the screen's: five sections and sixteen rows fit
paper only if the paper version is sized for paper. The screen card is
unchanged.

**Temperature, in °C, on every tank battery.** A fourth column beside Scanner,
Production and WHP, read at the SAME nine times as the scanner — the table is
unchanged at nine rows and nothing about the scanner moved.

Temperatures are stored against the HOUR OFFSET from the shift start in their
own `temp` map on the same document, rather than inside the scanner rows, so a
battery could be put on a different cadence later without moving anybody's data.
A temperature save writes only the `temp` map and leaves the scanner rows alone.

**No rules change** — temperature lives in the document the battery already
owns, so the existing per-battery access covers it.

**Temperature tab** for admin, alongside Entry, Report card and Scanner
analysis: average, range and spread per battery; all five plotted through the
day on one clock face, openable for the exact figures; and a reading-by-reading
grid shaded against each battery's OWN range for the day, so a hot battery and a
cool one are each read against themselves.

**Fixed: a cached day belonged to whoever cached it.** An operator caches ONE
battery; an admin caches all five. The local cache was not stamped with the
account, so an admin signing in on a device an operator had used inherited that
single-battery cache — and because the version stamp still matched, the full
read was skipped and the admin saw one battery and four blanks. The cache now
carries the account that wrote it and is dropped when the account changes. Found
by looking at a rendered screenshot, not by a failing test.

Temperatures are spot readings — never differenced, never summed.

**PETRECO on the Scanner analysis page**, given the same treatment the tank
batteries already had, on its own shape — two twelve-hour periods rather than
eight three-hour ones:

- Today at a glance per section: today, vs yesterday, vs the 7-day average, and
  each period on its own card
- Twelve-hour production today vs yesterday — one chart per section and one per
  meter, all of them openable for the exact figures
- A twenty-four-hour table: every meter with its section total underneath
- Daily production across the range, driven by the same 30/90/All chips as the
  battery record, with a day-by-day table

Also fixed while adding it: paired bars were separated by a fixed 2px, which is
fine for eight intervals and far too close for two — the value labels of today
and yesterday overlapped each other in the opened view. The gap is a share of
the band now, so it scales with how many bars there are.

**Fixed: a part day was compared against a whole one.** Six hours read today
against twenty-four of yesterday reported a collapse in production that had not
happened — the rest of today simply had not been read yet, and the card said so
in red as if it were a loss.

Yesterday is now summed over EXACTLY the readings today holds and no others, so
what is compared is like for like. Applied to every line on the card: each
battery, the Belayim total, both PETRECO sections, PTB Production, and the R/G
rows hour by hour. Where nothing has been read today, yesterday stands on its
own and there is no difference drawn at all rather than a difference against
zero. The gap between Ras Gara and PETRECO needs both sides on both days, or it
is not a gap.

When the day is short the heading says so — "12 HRS READ SO FAR" — because every
figure below it is then "so far" rather than "for the period".

**The card follows the circulated layout**, four sections in this order:

1. **Belayim T.B. Scanners** — 6/1, 6/2, 8/1, 8/2 and their total
2. **PETRECO Scanners — drain of the tanks** — 29 BIS, GB #1, GB #3 and their total
3. **PTB Production** — L.O.T.F, M.O.T.F, T.B. 10/1 and Received at PETRECO,
   added together: the streams that reach PETRECO in their own right
4. **R/G Production** — From Ras Gara, Received at PETRECO, then the gap between
   them, in the order the oil travels

T.B. 10/1 no longer has a block of its own; it is a line inside PTB Production.
"Received at PETRECO" appears twice on purpose — once as a contributor to the
PTB total, once against what Ras Gara sent. Remarks always appear and read
"— No remarks —" when empty, rather than the block disappearing.

**The report card now carries all of it** in the order of the card colleagues
use: the Belayim batteries, T.B. 10/1, PETRECO drains, PETRECO crude oil, the
R/G comparison, then remarks. Each section carries its own total and no section
is added to another.

**T.B. 10/1's pressure column reads `bar`**, the other four read `psi`. Like the
shift start, the unit is a property of the BATTERY rather than of the module.
Display only: WHP is never summed and never compared across batteries, so the
two units never meet in one figure.

**Operators get the entry table and nothing above it.** The summary cards are
admin only now. For an operator they were worse than surplus: he holds only his
own battery's data, so a card headed "Belayim Tank Batteries" was showing ONE
battery's figure under the name of the whole group. His own day total is still
on the panel header, where he is already looking.

**The reading-time explanations are gone.** The operators entering these
readings do not read English, so sentences about shift windows and boundary
readings were never going to help them — and since the boundary is now one
reading written to both days, the disagreement they described cannot happen.
Removed: the per-panel shift window, the hint above the table, the
opening-does-not-match-yesterday's-closing warning, and the shift label on the
card's R/G block.

What stays is what does not need reading: the times run down the left of the
table, and the meter-reset warning remains because a backwards scanner is a
fault somebody has to look at.

The card also carries the **R/G production comparison** — "Received at PETRECO",
"From Ras Gara" and the difference between them, named for what each figure is
rather than for the meter it came from, today against yesterday, in the same layout. Read
through `window.__RG`, so it stays a view of the readings module rather than a
second copy of its arithmetic. There is deliberately NO total row: the two
meter the same oil at two points and adding them would count it twice, so the
figure that means something is the difference, and that gets its own row. The
block is omitted entirely on a day with no readings rather than printing a row
of dashes.

**Report card tab.** A third page on Tank Batteries, admin only, reproducing the
card colleagues already read every morning — scanner, today, yesterday,
difference — in the app's own colours rather than the original blue and yellow.
Print and e-mail buttons; the printed card is one A4 page.

It follows the group model: the Belayim four with their TOTAL, then T.B. 10/1 on
its own. A group of one gets no TOTAL row — the same figure twice under two
names only invites the question of why they differ.

The original card covered twelve hours, so the period is selectable — 24 hours,
first 12, second 12 — and the heading says which is on the page. An imported
daily-only day answers for the whole day and shows a dash for either half,
because it has no intervals to halve.

**Password reveal on the login screen.** A long password typed on a phone with
nothing but dots to check it against is how people get locked out. It lives in
its OWN script block and is delegated from the document: the first attempt sat
in the shell block beside the Firebase boot, and when that boot throws — a
placeholder API key is enough — the listener was never reached and the button
did nothing. It also climbs to the button by hand instead of using closest(),
because a real tap lands on the icon inside it.

**The monitoring grid fits a phone.** Its columns were divided evenly whatever
was in them, so a five-figure number in a 30px column spilled straight out of
its cell. On narrow screens the columns are sized to their CONTENT instead, and
the type steps down: the grid went from 549px wide to 372px, fits outright at
412px and above, and scrolls 10-25px inside its own box on a smaller phone
without ever dragging the page sideways. Measured at 375, 390, 412 and 768px,
with a test that fails if any cell is narrower than the number in it.

A related trap worth knowing: the mobile rules were written ABOVE the base
rules, so the base won and nothing changed. Same specificity means source order
decides.

**Fixed a crash on upload.** The first version of the import read the sheet's
DECLARED range. This workbook declares A2:XFD1955 — every one of Excel's 16,384
columns — so a dense grid of it came to 32 million cells and killed the browser
tab; nothing was imported and the app had to be restarted. The grid is now sized
from the cells that actually exist (only populated cells are keys on the sheet),
capped as a backstop. The same file now parses in under two seconds at ~35 MB of
heap. There is a test that drives the real file through the real file input in a
real browser and fails if the tab dies — the earlier tests only exercised the
parser in Node, where the larger heap hid the problem.

The month dropdown defaults to the last month with at least 20 days, not simply
the newest — the newest is usually a few days of the current month.

**Import is a file upload**, on the Scanners page, admin only. Pick the daily
scanner workbook, get a preview — days found, date range, and every problem
spotted — then choose which month to import.

Columns are found by their HEADINGS, never by position: a column inserted into
the sheet would otherwise file the right figures under the wrong battery in
silence. A heading that no longer matches stops the import with the battery
named. The 10/1 column is picked by NET OIL, so the gas column of the same name
is not taken; TOTAL GROSS is excluded so it is never read as a battery.

The preview reports, before anything is written: days where the sheet's own
TOTAL GROSS disagrees with its four batteries added up, days missing a battery
figure, and that the Belayim columns are gross while 10/1 is net oil.

Writes go to Firestore with merge, so real readings already entered survive.
`xlsx.full.min.js` (861 KB) is deployed but deliberately NOT precached — it is
fetched on demand, so an operator's phone never stores a library for a screen
they cannot open.

**Two groups, not one field.** 6/1, 6/2, 8/1 and 8/2 sit at Belayim and send
their gross to PETRECO down ONE line; T.B. 10/1 is at a separate location and
sends its oil on its own line. Every total, comparison, chart and printed figure
is now per GROUP — **Belayim Tank Batteries** and **T.B. 10/1** — and there is no
all-five total anywhere, because adding two delivery lines together was never a
number anyone delivers. It also settles the clock question: the Belayim four all
start at 05:00, so their sum is clock-consistent, and 10/1 carries its 06:00
alone.

Second tab, renamed **R/G Production** for the first. Five tank batteries —
T.B. 10/1, 6/1, 6/2, 8/1, 8/2 — each with one totalizing scanner read every
three hours.

**Two shift clocks.** T.B. 10/1 runs 06:00 → 06:00; the other four run
05:00 → 05:00. A reading time is a property of the BATTERY, not of the module —
every label, row date and shift window takes the battery and nothing assumes
05:00. Each panel states its own window. On the printed report the Time column
is the 05:00 schedule with 10/1's own time in brackets on every row, because a
cell under a heading saying 05:00 must not hold a reading taken at 06:00. Each battery total covers exactly that battery's own nine readings; the field
figure is the sum of five days that begin an hour apart.

**The Scanners page** is an analysis page, not a second copy of the data. It
carries no totalizer readings at all — a totalizer is working data for the man
at the tank; what an engineer wants is production and whether it is normal:

- **Three-hour production, today against yesterday** — grouped bars, field-wide
  and one chart per battery, each on its own clock. Bars not lines: eight
  discrete buckets, and a line would imply production between readings that
  nobody measured.
- **Where the hours went** — a grid of battery × interval, each cell shaded
  against that battery's OWN average for the day, never against the field, so a
  small battery does not read as permanently failing. Columns become ordinals
  when the batteries do not share a clock.
- Day KPIs including **vs the 7-day average**, which is the context that says
  whether "down 8% on yesterday" is a problem or just Tuesday.

**The tank battery tab has two pages for admin:** Entry and Scanners. Entry is
done standing at a tank with a phone, the overview sitting down; burying the
entry table above five charts served neither. Operators have Entry only and see
no chips.

- **Nine readings, eight intervals.** Production is the difference between a
  reading and the one before it, so the day carries a closing 05:00 reading as
  well as an opening one. Without the ninth, 02:00 → 05:00 has no production.
  Production is derived, never stored.
- **The 05:00 shift is NOT the 06:00 one.** Tank battery days and Ras Gara days
  with the same date cover different 24 hours. Nothing adds them together.
- **WHP** typed at each of the nine times. Stored, shown, never summed.
- **A scanner that reads lower than it did three hours ago** is flagged red and
  named as a reset, rollover or misread rather than dragging the total down.
- **Opening vs yesterday's closing** is compared and any disagreement reported.
  It does NOT auto-fill — a meter reading nobody took is worse than a blank.
- **Part-filled days say so** ("5 of 8 intervals") and never get a day-over-day
  percentage, which at 11:00 would otherwise read as a catastrophic decline.
- **One account per battery** — `tb10-1@`, `tb6-1@`, `tb6-2@`, `tb8-1@`,
  `tb8-2@petrobel.org`. The address is the battery, so a login is
  self-documenting and `updatedBy` names the source without a lookup table.
  Note this maps an account to a BATTERY, not a person: two men rotating on the
  same battery share a login, and the save timestamp plus the roster is what
  separates them.
- **Each battery now sees ONLY its own readings, and this is enforced, not
  hidden.** The shift day was split from one document into FIVE — one per
  battery per day, id `2026-08-14__tb6_2`, with the battery also stored as a
  field. While a whole day was a single document a rule could only allow or
  deny the lot, so per-battery access could never have been more than a curtain
  on the screen. Now the rule is a comparison against that field and the server
  refuses. An operator's client queries `.where('battery','==',his own)`; an
  unfiltered query is rejected outright rather than trimmed, which is how
  Firestore evaluates queries and what the app relies on.
- Splitting the documents also removed the last way two operators could tread on
  each other: they no longer write to the same document at all. Saves still
  patch only the cells that client typed, so an admin editing another hour of
  the same battery is not overwritten.
- An operator sees one panel, headed with his battery, and no "Field total" —
  that card would be his own battery under a name implying four others.
- **Collection renamed** `tankBatteries` → `tbReadings`, meta likewise. No
  migration: this shape had not been deployed.
- **Admin breakdown:** day-over-day comparison on every total card, a record
  across days with 30/90/All ranges, one chart per battery, all five plus the
  field total in one chart, and a daily totals table with vs-prev.
- **Access:** tank battery operators get one tab and no tab bar. `isTankBattery()`
  is deliberately kept OUT of `isOperator()` in firestore.rules, so they cannot
  read rasGara even from a browser console. `firebase-stub.js` now simulates
  these rules, so the isolation tests fail if the enforcement is ever weakened. Their client does not start the
  Ras Gara listener at all — that read would be refused and would paint a false
  "Cloud refused access" error in the footer of a healthy app.
- **The footer status line now aggregates.** Two datasets report to it; the worst
  status wins, and when both are healthy their counts are joined. Previously the
  last writer won, which could paint over a real error.
- **Printed day report and e-mail PDF**, admin only, one A4 portrait page:
  totals cards with vs-yesterday, scanner readings interleaved with production
  (12 columns), WHP in its own table, and a production-per-interval chart.
  Measured in Chrome at A4/9mm — 928px clean, 957px with the warning banners,
  against 1054px printable. A backwards scanner or a part day is named in a
  banner at the top, not left as a cell colour.
- **Printed record and e-mail PDF** over the selected range. NOT held to one
  page and cannot be — "All" is however many days there are. What is guaranteed
  is that PAGE ONE is a complete report on its own: range, headline numbers,
  per-battery breakdown with shares and reset-flag counts, and the chart. The
  summary block ends at 620px at every range and is kept off a page break; the
  day-by-day table runs on after it. 30 days prints as 2 pages, 119 as 4.
  Averages and best/lowest day use COMPLETE days only, and the page says how
  many part days were excluded.
- The PDF writer and the delivery sheet moved to `window.__REPORT__` and are now
  shared rather than copied, so a fix to either lands in both reports.
- New harness `test_tb.html`. `test_build.py` seeds 14 tank battery days
  including a meter reset and a part-filled day; `test_build_hist.py` now seeds
  the same 119-day span for the batteries so the record report and its ranges
  are exercised against real length.

## v10  (cache `sinai-field-v10`)

**The chart now reaches the end of the shift.** The x-axis stepped by three
hours from 06:00 and stopped at index 21 — 03:00 — so the last two hours were
never labelled and the graph read as though the shift ended two hours early. The
line was always drawn to 05:00; only the axis was lying. The final point now
always gets a label, and if that would crowd the one before it, it replaces it
instead.

The daily-trend chart had the same fault: the most recent day was usually
unlabelled, so the record appeared to stop short of the newest reading. Same
fix, one shared helper (`rgAxisMarks`).

**The printed day report fits one A4 page.** It was 1,147px against roughly
1,047px of printable A4, so it always spilled a few rows onto a second sheet —
two things to staple and one to lose.

Print now gets its own set of numbers rather than a scale hack: `@page` at A4
with 9mm margins, and tightened type, padding, card and chart sizes inside
`@media print`. That brings it to 987px — one page, with about 60px of headroom
so a longer figure or a wrapped heading cannot push it over. Screen and the
e-mailed PDF are untouched; the PDF was already a single page, because it scales
a rendered image to fit.

The **daily record** printout still runs to as many pages as the range needs —
116 days cannot be one sheet, and its table headers repeat on each.

---

## v9  (cache `sinai-field-v9`)

**The 2026 history import is gone.** Removed entirely, as asked — the panel, its
styles, the loader, the data file and every mention of it in the documentation.
`index.html` is ~7 KB smaller and contains nothing about importing anything.

Nothing else changed: the daily record, its ranges, the month and custom
pickers, the chart, the table and both printouts are untouched. Any readings
already in the cloud stay exactly as they are — this release only removes the
thing that could put more in.

**The long-run test harnesses now generate their own days.** `test_hist.html`
and `test_hist_rg.html` used to be seeded from the workbook extract; that file
is deleted, so `test_build_hist.py` builds **~120 days across five calendar
months** instead. They are shaped to hit the cases the record has to survive
rather than to look plausible — gaps where a day is missing, days where only one
side reported, and differences in both directions. Three days cannot show you a
month dropdown with more than one entry, a 100-point chart, or a date-label
collision, and those are the things that break.

---

## v8  (cache `sinai-field-v8`)

**The history import was hidden from the one person who needed it.** I gated it
on the project being *completely* empty. A project holding a few unrelated test
days — which is what a real deployment looks like after somebody has tried the
app — never showed the panel, with no way to reach it and nothing on screen
explaining why. That is why the history would not load however many times the
files were uploaded.

It now asks the right question: **is the 2026 record here?** Days outside its
span are irrelevant. The panel appears whenever any of the 116 days are missing,
and says which case it is:

```
The 2026 history is not loaded          →  [ Load the 2026 history ]
Part of the 2026 history is missing     →  [ Load the missing 3 day(s) ]
```

Unrelated days are left alone: loading into a project holding three August test
days gives 119 days, not 116, and those three keep their readings.

**Ranges are calendar months now, not rolling windows.** "The last 30 days" and
"this month" answer different questions, and a monthly report wants the second —
a range starting on the 1st can be compared with the one before it, and 9 July
to 8 August cannot be compared with anything.

| | |
|---|---|
| **This month** | the 1st onward — `August 2026 · 8 days · 1 Aug – 8 Aug 2026` |
| **90 days** | the last 90 recorded days |
| **All** | everything |
| **Custom** | opens the panel below |

**Custom takes a whole month or an explicit span.** A dropdown lists every month
that has readings, newest first — one click for "show me June". Underneath,
**From** and **To** for anything else. Dates entered backwards move the end you
did *not* just type, rather than rewriting the one you are looking at.

The chart, the table and **Print daily record** all follow the selection, so
printing a single month is now picking the month and pressing print.

**New harness `test_stray.html`** — a project with unrelated days but no 2026
record. That state had no name, which is how the import bug got past me.

---

## v7  (cache `sinai-field-v7`)

**The daily record has a proper header.** It was a bare uppercase label like the
smaller sections, which undersold it — it opens a whole second view with its own
range, chart, table and printout. It is now a titled panel with a navy-to-gold
rule across the top, and a line underneath saying exactly what is on screen:

```
Daily record
Showing 30 of 116 days  ·  9 Jul – 8 Aug 2026
```

switching to `All 116 recorded days · 8 Apr – 8 Aug 2026` when you pick All. The
range chips sit below a divider inside the same panel, so the header and the
control that governs it read as one thing.

**The chips no longer carry counts.** "All 3" was the giveaway — a number inside
a button label reads as part of what you are choosing, when it is really a fact
about the data. The chips are now plainly `30 days` · `90 days` · `All`, and the
count lives in the header line where it belongs.

**A single chip is no longer shown at all.** With only a few days recorded the
only surviving option was "All", already selected — a chip you cannot change is
furniture. Below two options the row is dropped, and the header still says how
many days there are.

---

## v6  (cache `sinai-field-v6`)

**"Send by e-mail" never worked.** It built the PDF, then called a helper —
`_downloadBlob()` — that **was never written**. The call threw, the rejected
promise went nowhere, and the button sat on "Building PDF…" doing nothing. My
mistake, and it shipped because a click handler that returns a rejected promise
fails completely silently: no toast, no visible console entry, nothing an
operator could report beyond "nothing happens".

Three fixes, because one of them is the actual bug and two are why it survived:

**1. The helper exists.** It also revokes its object URL on a delay — revoking
straight after `click()` cancels the download in some browsers before they have
finished reading the blob.

**2. The PDF is now handed over behind a fresh tap.** Building takes several
seconds, and *both* delivery routes need a live user gesture: `navigator.share()`
throws `NotAllowedError` without one, and `window.open()` is blocked as a pop-up
for the same reason. The tap that started the build is long spent by the time
the file exists, so even with the helper in place the phone would have refused —
silently. A **Report ready** sheet now appears with **Share / e-mail**, **Save
PDF**, **Open Gmail** and **Cancel**; each runs inside its own tap. It also lets
whoever is holding the phone choose, instead of the app deciding for them.

**3. No button can fail silently again.** Print, Send by e-mail and Print daily
record all run through one wrapper that catches both thrown errors and rejected
promises and puts the message in a toast. A failed build now says
`Could not build the PDF: <reason>` instead of nothing.

Verified end to end: with no Web Share the sheet offers Save/Gmail and saves a
valid 355 KB single-page A4 PDF; with Web Share present the file reaches
`navigator.share()` with the right name and size; a simulated build failure
raises a warning toast and leaves the sheet closed.

Also swept the whole file for any other identifier that is called but never
defined — `_downloadBlob` was the only one.

---

## v5  (cache `sinai-field-v5`)

Two things you reported, and they turned out to share a cause: **the app never
said anything about the state of its cloud connection.**

**The footer said "Connecting…" forever.** It was written in exactly one place —
after a successful save — so an app that was connected, authenticated and
working sat on "Connecting…" until somebody typed a reading. Worse, a rules
failure looked identical to a slow network. Every outcome now reaches that line:

| | |
|---|---|
| `Cloud connected · 116 day(s)` | working, and how much it can see |
| `Cloud connected · no readings yet` | working; the project is simply empty |
| `Loading readings…` | fetching |
| `Offline — showing 116 saved day(s)` | no network, serving the local cache |
| `Cloud refused access — publish firestore.rules` | the rules were never published |
| `Cloud error: <code>` | anything else, with the code |

Losing the network does not fire Firestore's error callback — it goes quiet and
keeps serving its cache — so the online/offline events are wired up too.

**The history is now loaded from inside the app.** A separate loader page was
the wrong shape: it had to be uploaded, opened, signed into and then deleted,
and until all four happened the app showed no history and no reason why. Sign in
as admin and look under **Daily record** — while the project holds no readings, a
panel there offers to load the 116 days from `Ras Gara Test 2026.xlsx`. Press it
once; it disappears as soon as there is any history.

Safe to leave in production: admin only (enforced by the rules, not just the
screen), visible only when there are no days at all, and it skips any day that
already holds readings. `load-history.html` is deleted — one way to do this, not
two. `history-data.js` is now a deployed file, but it is fetched only when that
button is pressed.

**New harness: `test_empty.html`** — connected, authenticated, and completely
empty. That is the state a fresh deployment is actually in, and the one where
"no data" and "not connected" look the same if the status line is wrong.

---

## v4  (cache `sinai-field-v4`)

**116 days of history, and a daily record to read it in.**

**The 2026 history is loadable.** `history-data.js` holds every recorded day
from `Ras Gara Test 2026.xlsx` — 2026-04-08 to 2026-08-08, 2,783 hours with
readings — and `load-history.html` writes them into Firestore once. It reads the
Firebase config out of `index.html`, and it skips any day that already holds
readings, so running it twice cannot overwrite work the operators have done.
Delete both files from the server afterwards.

> The workbook types midnight as `0.5` (12:00) on **all 116 sheets** — a
> template typo. Keying the hourly slots off the TIME cell therefore drops one
> reading per day silently. The extraction uses **row position** instead, since
> the rows are chronological, and reads TIME only to learn the shift start.
> 228 of 232 daily totals reconcile against each sheet's own total row; the four
> that do not are listed at the end of this entry.

**Daily record.** Under the day view: every shift day, one row each, newest
first, tap to open. Range chips for **30 / 90 / All**, governing the chart, the
table and the printout together.

**Day-by-day chart** — each day's total, PETRECO against Ras Gara. Drift that is
invisible hour to hour shows up as two lines separating. Markers up to 45 days,
dropped beyond that where they merge into a band. An operator sees only their
own line.

**Print daily record** — its own document: range totals, trend chart, and the
full day-by-day table with the same red/green Difference column. Admin only.

**Two counting bugs found while testing against the real days, both fixed:**

- A day where only **one side** reported was showing a full-size difference
  against the other side's implied zero — 2026-04-25 read **−180 m³** when the
  truth is that PETRECO has no sheet for that day. The difference is now "—"
  unless both sides reported. `rgCalc` used `pAny || rAny`; it needed `&&`.
- The range totals summed each column over every day, comparing 116 Ras Gara
  days against 114 PETRECO ones and booking the two missing sheets as loss
  (−1,412.9 m³ against a true −1,046.9 m³). They now cover only the days both
  sides reported, and the subtitle says how many were excluded.

Also: `Math.abs(null)` is `0`, so a missing difference printed as a confident
"0" in two places. `rgAbs()` replaces that pattern. The daily-record report was
missing the legend's stylesheet, so its two series names ran together as
"PETRECORas Gara".

**Four days where the source workbook disagrees with itself.** Loaded as the
hourly readings say, and listed here rather than quietly smoothed:

| Day | |
|---|---|
| 2026-04-08 | hourly PETRECO sums to 92.5; the sheet's own total row says 51.5 |
| 2026-04-27 | no PETRECO hourly data at all; the HISTORY sheet says 193 |
| 2026-06-06 | Ras Gara hourly sums 5 short of the sheet total |
| 2026-06-07 | same, 5 short |

**New test harnesses.** `test_hist.html` and `test_hist_rg.html` are the offline
harness seeded with the 116 real days instead of three synthetic ones —
`python3 test_build_hist.py` regenerates them. A range chip, a 116-point chart
and a one-sided day are not things three days can show you.

---

## v3  (cache `sinai-field-v3`)

**The difference now shows its own sign.** It is PETRECO − Ras Gara, so a day
where Ras Gara metered more reads **−143**, not "+143". The card had been
inverting the sign while the Difference column of the daily history right below
it printed the raw value — the two disagreed on screen. They now agree, and the
printed report agrees with both.

| | Difference | |
|---|---|---|
| Ras Gara metered **more** than PETRECO received | negative | red |
| PETRECO received at least what Ras Gara sent | positive | green |

**Footer credit** — "Powered by Sherif Morshed" under PETROBEL · Sinai Field,
on screen and at the foot of the printed report.

## v2  (cache `sinai-field-v2`)

**Backup & migration removed.** The admin JSON export/import is gone, along with
its markup, styles and code. This application no longer has any path in or out
of another PETROBEL system.

> If the readings taken while Ras Gara was a tab in Land Wells are still wanted,
> `wells/archive-rasgara-readings.html` saves them as a JSON file — but that is
> an **archive**, not a migration. There is no longer anything here that can
> read it back.

**The difference is now highlighted, and the colour means something.** Oil
leaves Ras Gara and is received at PETRECO, so the two totals should agree:

| | |
|---|---|
| **Red** | Ras Gara metered **more** than PETRECO received — oil PETRECO cannot account for |
| **Green** | PETRECO received at least what Ras Gara sent |

The card takes a tinted ground and a coloured edge, not just coloured digits,
and the same rule colours the Difference column of the daily history. The
decision lives in one place, `rgDiffIsBad()`, with the reasoning beside it —
the sign reads backwards if you think of it as a plain shortfall, so it is
written down once rather than inlined three times.

**The written summary is gone from the printed report.** It now runs KPI cards →
hourly table → rate chart. The summary text is still generated for the body of
the e-mail, where it is the only thing carrying the numbers.

**The source is clean.** Every reference to Land Wells, to versions of it, and
to migration has been removed from `index.html` and from all three documents.
The folder is `sinai-field/`. Someone opening this project now has no reason to
go looking at another one.

---

## v1  (cache `sinai-field-v1`)

First standalone release. Hourly PETRECO and Ras Gara entry on a 06:00 → 05:00
shift day, three roles, the comparison chart, the printed report and the
e-mailed PDF, offline support, and per-side merge writes so two operator groups
cannot overwrite each other.
