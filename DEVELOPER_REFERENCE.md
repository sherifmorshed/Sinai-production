# Sinai Field PWA — Developer Reference

Read this before editing. It is short, and most of it is things that have
already gone wrong once.

---

## 1. What this is

A single-page PWA: one HTML file, no framework, no build step in the npm sense.
Firebase Auth for sign-in, Firestore for storage, localStorage as the offline
mirror, a service worker for offline loading.

**This application stands alone.** Its own Firebase project, its own accounts,
its own release cycle. Nothing here reads from or writes to any other PETROBEL
app, and nothing should ever need to.

The app is called **Sinai Field**; `rasGara` is the Firestore collection name,
the localStorage key prefix and the `rg*` function prefix. That mismatch is
deliberate — renaming storage identifiers buys nothing a user can see and would
orphan every existing document and cached day.

---

## 2. Layout of `index.html`

One file, edited directly — no build step. There is a map
in a comment at the top of the file; in short:

| | |
|---|---|
| `<style>` | tokens, then chrome (header / login / toast), then the readings page |
| sprite | all 11 icons, inline `<symbol>`s |
| markup | login screen, header bar, readings page |
| script 1 | **CONFIGURATION** (Firebase + role lists), boot, helpers, auth |
| script 2 | the app — entry, calc, chart, daily record, report, PDF, cloud sync |
| script 3 | theme, service-worker registration |

Script 2 is one IIFE. It reaches the shell only through the contract in §3 —
keep it that way, so the page around it can change without touching the
readings logic.

**Two things to check by eye after editing**, since nothing checks them for you
any more:

- every `<use href="#i-…">` names a `<symbol>` that exists — a typo renders as
  nothing at all, silently;
- the three role lists in CONFIGURATION still match `firestore.rules`.

---

## 3. The host contract

Script 2 expects these from the page. If you ever lift it somewhere else, this
is the list to provide:

```
db, firebase, FIREBASE_OK          Firestore handle and a "did it initialise" flag
currentUser                        who is signed in
isAdmin, isRasGara, isPetreco      role flags (isRasGara = the Ras Gara plant)
escHtml, escAttr                   HTML escaping
showToast, updateCloudStatus       user feedback
seriesColor(slot, forPrint)        chart colours
_isoDate(date)                     local-calendar ISO date
lsGet, lsSet                       localStorage with try/catch
getSyncedVersion, setSyncedVersion, isCacheCurrent
checkStorageHeadroom
makePending(lsKey)                 the unsaved-edits queue (see §4)
registerFlush(fn), flushSaves()    send pending saves now (hide / close / sign-out)
html2canvas                        global, for the PDF
```

It exposes `window.__RG` (used by the tests),
`window.refreshRasGaraPage`, `window.startRasGaraListener`,
`window.stopRasGaraListener`.

---

## 4. Data

**Firestore**

| Path | |
|---|---|
| `rasGara/{YYYY-MM-DD}` | one shift day: `{ date, startHour, rows{…}, updatedBy, updatedAt }` |
| `rasGaraMeta/info` | `{ dates[], count, updatedAt, updatedBy }` — the version stamp |

A row is `{ p, r, rc }` — PETRECO m³/hr, Ras Gara m³/hr, Ras Gara cumulative.
`null` means "not entered", which is **not** the same as zero and must stay
distinguishable: an un-entered hour must not be counted as a zero reading.

PETRECO's cumulative is never stored — it is derived as a running total. Storing
it would create two sources of truth that could disagree.

### `rows` is a MAP on the wire and an ARRAY in memory

In Firestore, `rows` is a map keyed `"0"`…`"23"`. In memory it is always a
24-element array — every render and calculation depends on that, and
`rgRowsToArray()` converts on the way in.

The map is not cosmetic. A Firestore array is a single atomic value, so writing
it always replaces the whole thing. A map can be written with `merge:true`,
which deep-merges key by key, so each role writes **only the fields it owns**.
Without that, two operator groups working in different places overwrite each
other: PETRECO saves at 14:10 carrying a copy of the Ras Gara column from
13:00, and Ras Gara's 14:00 entry is silently gone. Worst offline, where a
phone can queue a write for hours — which is the case this app exists for.

Documents written before this change hold an array. Reads accept either shape;
a day that arrived as an array is flagged `_legacyRows`, and the next save
sends it whole once to convert it, because merging a map into an array
**replaces** it rather than merging. After that conversion, saves are partial
again.

**localStorage**

| Key | |
|---|---|
| `rasgara_days_v1` | every day, mirrored for offline |
| `rasgara_days_v1__syncver` | which cloud version that mirror came from |
| `rasgara_theme` | light / dark |
| `…__pending__{email}` | unsent typed cells, one per module and per account |

### Unsaved edits: one queue per module

Every typed value goes into a queue — `_rgPend`, `_tbPend`, `_pfPend`, each made
by `makePending()` in the shell — keyed by the DATE it was typed on and then by
the FIELD, with the value:

| Module | Key | Example |
|---|---|---|
| R/G | `row.field` | `"7.p"`, `"7.rc"` |
| Tank batteries | `battery` \| `field` `index` | `"tb6_1\|s3"`, `"tb6_1\|d3"`, `"tb6_1\|c12"`, `"tb6_1\|x12"` |
| PETRECO | `meter` \| `period`, or `__remarks` | `"pgb1\|0"` |

A save sends exactly that and nothing else, one merge-write per document, and
then clears what was sent. Three rules follow from it, each of which was a
real loss before v13:

- **A download never replaces local data bare.** It goes through
  `rgOverlayPending` / `tbOverlayPending` / `pfOverlayPending`, which lay the
  queue back over it. Otherwise a sync from another device reverts a value
  typed a second ago, and it is never sent.
- **A save never sends a whole row, a whole meter or a whole day.** A phone's
  copy of the fields it did not touch may be hours old.
- **A save never looks at the date on screen.** The queue carries its own dates.

The queue is persisted per account, so a failed save is retried and one pending
at close is sent next time — by the same account only. Each save issues all its
writes BEFORE its first `await`; that is what lets `flushSaves()` hand them to
Firestore's offline queue from a page that is being hidden or closed.

**Sync**, in one paragraph: devices watch `rasGaraMeta/info`, not the day
documents. When its `updatedAt` changes, the device compares it against the
stored version stamp; if they match it already has that data and skips the
download entirely. This is why a save writes the day *and then* the meta doc —
writing meta first would tell everyone to fetch a half-written set.

---

## 5. Things that will bite you

- **`var(--…)` does not resolve in the printed report or the PDF.** Both render
  in a detached document with no token scope. An unresolved colour paints black;
  an unresolved font silently falls back. Anything reachable from `forPrint`
  needs a literal — see `PRINT_SERIES` and `numFont` in `rgChartSVG`.

- **`<use href="#i-…">` does not resolve there either.** The sprite is in the
  main document. The report carries its own inline markup; do not "tidy" it to
  use the sprite.

- **Never rebuild a table while one of its boxes has focus.** A sync can
  arrive at any moment; rebuilding destroys the focused input, which on a
  phone closes the keyboard and loses a half-typed number. `rgRenderTable`,
  `tbRenderArea` and `pfRenderArea` check for this and update the other boxes
  in place instead (`data-layout` records what the table was built for). A new
  entry table needs the same guard.

- **`.rg-calc` is on the `<td>` itself, not on a child.** Never give it a
  `display` — an `inline-block` table cell drops out of table layout and the
  value drifts out of its row.

- **`textContent` on an element containing an SVG icon deletes the icon.** Use
  `innerHTML` and re-emit the `<svg><use/></svg>`, or wrap the label in a
  `<span>` and write to that — `#rgHistTitle` does exactly this.

- **Never `!important` a `display`.** Visibility is toggled with inline
  `style.display` — login vs app, and the action buttons an operator must not
  see — and an `!important` stylesheet rule beats an inline style. Doing this
  once unhid controls for an account that was supposed to be restricted.

- **`_isoDate` takes a local `Date` meaning "now".** Never feed it a UTC-midnight
  value from a parser: local midnight converted to UTC rolls back a day in
  positive offsets, and Egypt is UTC+2/+3. That family of bug is expensive —
  it produces readings filed under the wrong shift day, which nobody notices
  for weeks.

- **`Math.abs(null)` is `0`.** A difference that does not exist would print as
  a confident "0" rather than an em dash. Anywhere a sign is printed separately
  from a magnitude, use `rgAbs(v, dp)` — never `rgFmt(Math.abs(v), dp)`.

- **A comparison needs two numbers.** `rgCalc` returns `loss: null` unless
  **both** sides reported something that day. With `||` instead of `&&`, a day
  where only Ras Gara logged readings compares 186 against an implied zero and
  files a −186 m³ "loss" that is really a missing sheet. The daily record's
  range totals exclude those days for the same reason, and say so in the
  subtitle.

- **Every path through the listener must set a cloud status.** The footer line
  is the only thing telling anyone whether the app is talking to Firestore, and
  it used to be written in one place — after a successful save — so a healthy
  app read "Connecting…" indefinitely and a rules failure looked identical to a
  slow network. `rgCloudIdle()` and `rgCloudError()` exist so a new branch costs
  one line. A missing meta document is **not** an error: it is the normal state
  of a new project, and saying so is what separates "empty" from "broken".

- **A rejected promise from a click handler is completely silent.** No toast,
  no error the operator will ever see — the button simply does nothing. That is
  how "Send by e-mail" shipped broken for a release. Bind actions with the
  `_bind()` wrapper in the DOMContentLoaded block, which catches both throws and
  rejections and puts the reason in a toast.

- **`navigator.share()` and `window.open()` both need a LIVE user gesture.**
  Anything that takes seconds to prepare — the PDF takes several — has spent its
  activation by the time it is ready, and the call is refused silently on a
  phone. Deliver behind a second, explicit tap; that is what `rgOfferPdf()` is
  for. Never `await` something slow and then try to share or open a window.

- **An axis that steps by N usually never labels its last point.** 24 hours
  stepping by 3 stops at 03:00, so a shift running to 05:00 looked two hours
  short. Use `rgAxisMarks(n, step)` — it guarantees the final index is labelled.

- **The day report must stay ONE A4 page.** It does not fit at screen sizes, so
  `@media print` in `rgReportHTML` carries its own type, padding and chart
  sizes. If you add a row or a card, re-measure: render the report at 718px wide
  under `emulateMedia({media:'print'})` and keep `document.body.scrollHeight`
  under about 1,047px. (The e-mailed PDF is not affected — it scales an image.)

- **Bump `CACHE_NAME` in `sw.js` on every release.** Otherwise nobody sees the
  change and you will spend an afternoon debugging a fix that already shipped.

- **The rules and the email lists are two halves of one decision.** Change
  `ADMIN_EMAILS` / `PETRECO_EMAILS` / `PLANT_EMAILS` in `index.html` and
  `isAdmin()` / `isPetreco()` / `isPlant()` in `firestore.rules` together. Drift
  shows up as "the button is there but saving fails".

- **A top-level `let` is NOT on `window`.** The role flags are `let` bindings in
  script 1 and the app reads them from script 2 by lexical scope. Reaching them
  as `window.isAdmin` silently returns undefined and every role collapses to
  read-only viewer. Use the `typeof x !== 'undefined' && x` form — that is what
  `_admin()` / `_plant()` / `_petreco()` are for.

- **An account in no role list gets nothing.** `_tabsFor()` returns no tabs,
  `showApp()` shows `#page-noaccess` and starts no listener. The rules refuse
  such an account every collection, so there is nothing to show it and any
  read would only paint an error. Do not "restore" a read-only viewer without
  first deciding, in `firestore.rules`, what it may read.

- **`#page-pf` is two things.** PETRECO's own tab for PETRECO's operators, and
  embedded (`.pf-embedded`: no heading, no date bar) in A/R Production → Entry
  for admin. `showApp()` sets the class from the role on every sign-in, and
  `tbShowSub()` shows it only while A/R Production is the open tab. It must stay
  inside `#app-body`.

- **Adding a role means four edits, not one.** The list in CONFIGURATION,
  `rgSide()`, the rules, and `test_build.py`. `rgSide()` is the single place
  that decides which columns, totals, history and heading a user gets — put
  branching there rather than sprinkling `if(isX)` through the renderers.

---

## 6. Testing

`test.html` (admin), `test_petreco.html`, `test_plant.html` and `test_tb.html`
(tank battery operator) stub Firebase and
seed three days, so everything works with no project and no network. The stub
implements `merge:true` with real deep-merge semantics — without that, the
merge-write test would pass for the wrong reason.

`firebase-stub.js` enforces the same rules as `firestore.rules` for every
collection — reads, writes and listeners — and records every refusal in
`window.__IO__.denied`. `window.__STUB__.store` is the fake cloud, for a test
that needs to change it behind the app's back (another device's edit that this
one has not synced). `test_viewer.html` signs in as an account in no role list.

`test_empty.html` seeds **nothing** — connected, authenticated, empty. That is
what a fresh deployment actually looks like, and where a wrong status line makes
"no data" indistinguishable from "not connected".

`test_hist.html` (admin) and `test_hist_rg.html` (Ras Gara) seed **~120
generated days across five calendar months** instead. Use these for anything
touching the daily record: three days cannot show you a month chip, a populated
month dropdown, a 100-point chart, a date-label collision, a gap in the record
or a day where one side never reported. The generator shapes the data to hit
exactly those cases — see the docstring in `test_build_hist.py`.

Also worth knowing: `rgDiffIsBad()` is the single place that decides which way
the difference is bad. Red means Ras Gara metered more than PETRECO received.
It reads backwards if you think of `loss` as a plain shortfall, which is why it
is written down once with the reasoning beside it — do not inline it again.

They are **snapshots of `index.html`**. After editing it, run:

```bash
python3 test_build.py        # three synthetic days, all three roles
python3 test_build_hist.py   # the 116 real days, admin + Ras Gara
```

or you are testing the previous version — an easy hour to lose.

Worth exercising after any change: each role seeing and editing only its own
columns; entry recalculating and debouncing to a single cloud write; **a save
from one operator not wiping the other side** even when the local copy is
stale; a legacy array day converting without loss; the chart in both themes;
the report rendering with no unresolved `var(--` and no unresolved `<use>`; the
PDF building;
wiping a real day; and an offline reload still showing the cached days.

For the daily record specifically: each range chip changing the chart, the table
**and** the printed report together; the Difference column staying on a 412px
screen (the hourly table's 520px `min-width` used to push it off — `#rgHistory
table.rg-tbl` overrides it); an operator seeing one column and no print button;
and a one-sided day reading "—" rather than a full-size fake loss.

When testing the clobber case, call `window.__RG.setDate('…')` first. Without
it the inputs on screen belong to today's blank document and the test measures
nothing — that cost me a wrong "FAIL" once.

Run the app in a non-UTC timezone. Cairo and São Paulo between them catch the
date bugs that are invisible at UTC — a positive offset and a negative one
behave differently, and only testing at UTC hides both.

---

## 7. Design

Never hard-code a colour — every value lives in the token block at the top.

`--s1` / `--s2` are the chart series and were chosen by running a palette
validator, not by eye: the PETROBEL brand navy and gold **failed** it, only
ΔE 4.9 apart under colour-blind simulation against a target of ≥ 8. Brand
colours stay on the interface chrome. If you add a third series, validate it.

Every control carries a visible frame at rest — see "Why the frames" in
`README.md` for why that is not a matter of taste.

No web font is bundled. It would cost ~300 KB and break the offline guarantee,
which matters more at a plant than the typeface does.

## Tank batteries

Second tab, its own collection, its own shift. Five batteries, one totalizing
scanner each, read every three hours on an **05:00 → 05:00** day.

**Two groups.** `TB_GROUPS` is a fact about the field, not a display choice —
Belayim (6/1, 6/2, 8/1, 8/2) is one line into PETRECO, T.B. 10/1 is another.
`tbGroupCalc`, `tbGroupHalf` and `tbGroupTrailing` are the only correct way to
total more than one battery. Never sum across groups.

**Temperature cadence.** Every battery reads temperature at its nine scanner
times. `tempEvery` in `TB_LIST` exists so a battery could be put on a finer
cadence later; none uses it today. Table rows are HOUR OFFSETS (`tbOffsets`), and
`tbScanIndex(o)` maps an offset back to a scanner index or -1 when that hour has
no scanner reading. Temperatures are stored in a separate `temp` map keyed by
offset, never inside `rows`.

**Two pressure units.** `wUnit` in `TB_LIST` — 10/1 is bar, the rest psi. Read
through `tbWUnit(b)`. Never assume psi.

**Two clocks.** T.B. 10/1 starts at 06:00, the rest at 05:00 — see `start` in
`TB_LIST`, and `tbStart(b)`. `tbLabel`, `tbHour`, `tbRowDate` and `tbShiftDates`
all take a battery. Never reintroduce a module-wide start hour: `TB_START_HOUR`
is the page default and the fallback, not a truth about the shift.
`tbOneClock()` reports whether the visible batteries agree, and is what decides
whether a shared Time column can be printed without mislabelling a reading — the
printed report falls back to bracketed second times, the heat grid to ordinal
columns. Those are LABELS and must stay; the commentary that used to sit beside
them was removed at the owner's request.

**The operator's screen is the table.** No summary cards, no shift sentences, no
sub-tabs — an operator sees his date, his panel and his nine rows. Anything
group-level is admin only, because an operator's data cannot answer a
group-level question.

**The report card compares only complete windows.** A period is a window in
hours from the shift start (`TB_PERIODS`: h3, h6, h1 = first 12, day, h2 =
second 12), read by each line on its own clock. `tbWin` / `tbPairOf` /
`tbPairSum` give each line `{a, aDone, b, bDone, na}`; the Difference is drawn
only when `aDone && bDone`, and a total is done only when every line in it is.
An unfinished window shows NO FIGURE on the card — "Not yet" for today, a dash
for yesterday — and never the readings so far added up, totals included. `na`
is a line that cannot be measured over the window at all — PETRECO's scanners
on that day — and makes any total containing it `na` too. Window boundaries
must fall on a reading: every line now reads every 3 h, so 3, 6, 12 and 24 all
work. The one `na` case left is a PETRECO day recorded before v15 as two
twelve-hour halves, asked for less than a half.

**PETRECO scanners: three-hour periods, twelve-hour history.** A meter-day is
`{ q:[8], v:[2] }` — `q` the three-hour periods from 06:00, `v` the two
twelve-hour halves every day before v15 was written with. `pfHalfMode(cell, h)`
decides per HALF which one counts: any `q` value in the half wins, otherwise
the old `v` figure stands. `pfWindow(date, id, fromHour, toHour)` is the one
accessor everything else is built on — totals, the card, the analysis — and it
returns `null` when the window cannot be measured (a twelve-hour half asked for
three hours of itself) rather than a number nobody recorded. Writes go to
`q.{period}`; `v` is never rewritten.

Elsewhere (the Scanner analysis page) comparisons still use their own rules;
never compare a running total against a finished one.

**The boundary is shared.** Row 8 of a day and row 0 of the next are the same
reading. `tbApplyInput` writes both (`tbBoundaryTwin`), and `tbBoundaryFill`
reads one across when the other is missing. Never "fix" this by making either
day's boundary independent — it is one number.

**Nine readings, eight intervals.** Production is `reading[i] − reading[i-1]`.
The ninth reading (the closing 05:00, on the NEXT calendar day) is not a spare —
without it the 02:00 → 05:00 interval has no production. Production is derived
and never stored, for the same reason PETRECO's cumulative is not.

**The 05:00 shift is not the 06:00 one.** A tank battery day and a Ras Gara day
carrying the same date cover different 24 hours. Never add their totals.

**Storage.** ONE DOCUMENT PER BATTERY PER DAY: `tbReadings/{date}__{batteryId}`,
carrying `date`, `battery`, and `rows.{"0".."8"} = {s,w}` — a map, never an
array. `tbReadingsMeta/info` is the version stamp, watched as `rasGaraMeta` is.

The split exists so per-battery access can be ENFORCED. While a whole shift day
was one document a rule could only allow or deny the lot. `battery` is stored as
a field, not just embedded in the id, because that is what a rule and a query
can both match on.

**Querying.** Admin reads the collection unfiltered. An operator MUST query
`.where('battery','==', his own)` — Firestore rejects a query it cannot prove
safe rather than trimming the result, so an unfiltered read is denied outright
even though some documents are his. `firebase-stub.js` simulates this.

**Drain scanners are totalizers.** For the `drain` group a meter-day carries
`r[0..8]`, nine readings from 06:00. `pfDeriveDrains` (called from `pfGetDay`)
fills a missing opening from the previous day's closing and, if any reading
exists, OVERWRITES `q[k]` with `r[k+1] − r[k]` — so every consumer of `q`
(totals, card, analysis) needs no change. A day with no readings keeps its
typed `q` / `v`. `pfApplyReading` writes the closing reading to tomorrow's
opening and the opening to yesterday's closing. Crude oil meters are untouched.

**Station measurements (T.B. 10/1).** `TB_MEAS_HOURS` (nine rounds, 05:00 to
05:00 — its own clock, not `TB_STEP`), `TB_MEAS_SECTIONS` and `TB_MEAS_FIELDS`
define the tab; a field's position in `TB_MEAS_FIELDS` is its save key, so new
fields go at the end. A round is `cell.meas[round]` = `{ t7:…, s1:'emulsion', … }`,
stored as `meas.{round}.{field}`; queue kind `g`, index `round*100+field`. Round
8 and the next day's round 0 are written together. A field marked `retired`
(the v34 single HP pump, `hpN`/`hp`) stays in the array for its key but is off
the form, the message and the done count; `tbMeasHP` reads old rounds through
it. `tbMeasNeeded` decides what "done" means — a heater that is OFF needs no
temperature or flow. `tbMeasMsg` builds the
WhatsApp text; edits refresh it in place (`tbMeasRefresh`), never by redrawing.

**PM monitoring.** Intervals and PM records live on ONE admin document,
`tbReadingsMeta/pm` = `{ pumps:{ "tb6_1:0":{ every, hist:{ <id>:{ at, note, by, tech, wo, chk:[…] } } } } }`,
watched LIVE by `tbPMLoad` (onSnapshot, admin and mechanical only; stopped in
`tbStopListener` via `tbPMStop`) and written with merge by `tbPMWrite`.
`hist` is a map so one PM is added or removed alone (removed = null). `tbPumpPM`
counts slots whose START (`tbSlotStart`) is at or after the last PM, by state;
the due date divides hours left by the last 14 days' running hours per day.
Pre-v40 day-flags (`pmd`, `dpm`) still count as a PM at the end of that day.

**Owner and usage (v61).** `OWNER_EMAILS` are also admins (`ADMIN_EMAILS =
OWNER_EMAILS.concat([...])`); `isOwner` adds the top-level tab `use` (page
`page-use`). `deviceBeacon(email, role)` runs from `showApp` for every account
with a role, throttled by `DEV_BEAT` in localStorage (3 h or a new
`APP_VERSION`). `loadUsage` reads the `devices` collection (owner only),
`usageStats(rows)` computes everything (testable), `renderUsage` draws it.
Rules: `match /devices/{docId}` — owner reads/deletes; a signed-in account
creates/updates only `^[0-9a-f]{16}__<its email>$` with the listed keys.
The test harness swaps the placeholder for `owner@test.local`.

**Follow-up (v56, admin).** Sub-page `follow`. `tbFollowSite(b, date)` builds a
site's parts (Readings / Station measurements / Station status / Pump readings)
with `due`, `done`, `miss[{h, what[]}]`; due-ness from `tbHoursInto` against the
clock (`TB_DUE_GRACE`, `TB_STATUS_BY`). `tbFollowBadge` puts the count on the
sub-tab. `tbMonthBook(ym)` returns the sheets as arrays (testable without
XLSX); `tbExportMonth` writes them. Per-site last save: `cell.ua` / `cell.ub`,
set in the loader and after a push (raw `TB_DAYS` only — `tbGetDay` does not
copy them).

**Sync and rollover (v55).** `tbPushToCloud` writes `sites.{id}` server stamps
on the meta document. Listener: an operator skips a snapshot whose own-site
stamps are not newer than `_tbOwnSeen`; admin/mechanical read
`where('updatedAt','>', syncedVersion − 2 min)` and lay the result over
`TB_DAYS` (`inc`), full read when no cache / `TB_PARTIAL` / older than 7 days
(`TB_FULL`). `tbSaveLocal` is debounced (`tbSaveLocalNow` on flush). Shift-day
rollover: each module calls `watchShiftDay({today,get,set,shown})`;
`checkShiftDay` runs every minute and on resume. PM hours come from
`tbPumpSlotsPM` (carry over unreported days, `TB_PM_CARRY`).
Test suites: `regression*.js` (general, mech, wdp, tb2020, readings_wa, fieran,
review) and `regression_crawl.js`.

**Admin-tab stations (v54).** `adminTab:true` (Fieran Terminal): not on the
Entry page; the admin sub-page `fieran` renders it into `#tbFieranArea` via
`tbRenderFieran` (called from `tbRenderArea`; skipped while a box in it has
focus). The Entry delegated handlers are attached to both `#tbArea` and
`#tbFieranArea`. No account and no rule — admin writes it.

**Hosted stations (v51).** A station with `host:'<site id>'` (T.B. 2020 →
`tb10_1`) has no panel of its own: `tbPanel` adds a tab `h:<id>` for it and
`tbHostedHTML` renders its measurements + status behind a `.h2tabs` switch
(`_tbHostTab`). `TB_ALL` puts hosted stations right after their host.
Ownership: `tbOwnsId(id)` (operator: own site or one it hosts) in `tbMayWrite`;
the loader runs one `where('battery','==',id)` per owned id (the rules prove each);
rules `tbOwnsBattery(b)` must list every host → hosted pair. Measurements:
`tbMF(id)` gives the field list a site saves against (`TB_MEAS_FIELDS` for 10/1,
`TB_MEAS2[b.meas2].fields` otherwise); a `meas2` site renders with `tbMeas2Form`
and writes `tbMeas2Msg`; a field's `when` hides it (and drops it from the count
and message) while the named field is 'off'.

**Stations (v49).** `TB_STATIONS` (Water Disposal Plant, `wdp`, `station:true`)
and `TB_ALL = TB_LIST.concat(TB_STATIONS)`. Rule of thumb: production code walks
`TB_LIST` / `tbVisible()`; station status, Pumps, Machinery update, PM and
`tbById` walk `TB_ALL` / `tbVisibleAll()`. A station's Entry panel is
`tbStationPanel` (rendered AFTER the battery panels, so `tbRepaintDerived`'s
index-by-order still lines up). Pump readings: `TB_PUMP_MEAS` (p psi, q BWPD,
hz), cell `dpx[k]`, queue kind `h` with i = k*10 + f, document field
`pumpsDailyMeas`. `tbPumpMeasTxt`; `tbStationFlow` returns `{vert, inj}` — sums of q
over running pumps by the pump's `flow` field (never added together);
`tbFlowLines` adds `day` = q × 24 (the Average m³/day). Flow unit m³/hr (v50).
Account in `TB_ACCOUNTS` and rules `tbBattery()`.

**Machinery update (v48, admin).** Sub-page `mach` / `#tb-page-mach`.
`tbMachData(date)` builds everything once: totals, `outs` (current out-of-service
episode from `tbPumpOOS`: since, days, reason), `changes` (latest state vs the day
before, only where today was reported), per-battery groups split in/sb/out/none
with `stale` = oldest report date when not reported today, and the PM work list
when `_tbPMDoc` has loaded. `tbMachCardHTML(date, forPrint)` mirrors
`tbOldCardHTML` (C/Z palettes, one-A4 print sizes); `tbMachMsg` is the WhatsApp
text; `tbMachDoc` the print/PDF document. Admin has no `pm` sub-page any more
(`tbShowSub` sends it to Entry); the Pumps page is the situation only.

**Mechanical account (v46).** `MECH_EMAILS` / `isMech` ↔ `isMech()` in the
rules. `_tabsFor()` gives it `['tb']`; inside the module `_tbMech()` forces the
`pm` sub-page (`tbShowSub`), the sub-tab bar stays hidden, and `tbMine()` is
null so the readings query is unfiltered (rules allow mechanical to read every
battery). It is never an editor: `tbCanEdit` / `tbMayWrite` are false, so the
pending queue never holds anything of theirs. `_tbPMUser()` = admin or
mechanical gates the PM listener. Page pieces: `tbRenderPMDash` (KPI strip
`#tbPMKpi`, red-flag work list `#tbPMWork` from `tbPMAll`/`tbPMWorkList`),
`tbPMWorkMsg` (Copy work list), `tbPMExport` (two-sheet xlsx via
`tbLoadXLSX`), checklist by equipment `tbPMCheckOf(pm)` (v47: pump / compressor /
engine / jockey lists; diesel by name). PM covers `tbPMItemsOf(id)` — every
item except kind `Heater`. Cards carry
`id="pmc-<key>"` so the work list can scroll to them.

**Every battery is tabbed (v43).** All five have `pumpTab:true`; only 10/1 has
`measTab:true`. `TB_PUMPS` is empty for all of them — every item lives in
`TB_PUMPS_DAILY`, the Belayim pumps with `legacy3h` so their three-hourly past
still counts. `b.wa` is the name written at the top of a battery's WhatsApp text.

**Theme.** Three modes, `light` / `dark` / `auto`, kept in localStorage under
`rasgara_theme`; `auto` is dark from 18:00 to 06:00, re-checked every minute and
on returning to the app. `window.__THEME__` exposes it to the harness. Night-mode
colour overrides for v28+ components are one block of `body:not(.light-mode)`
rules beside `.ms-wa-ar`.

**Station status words.** An item with `labels:'onoff'` (heaters, compressors)
shows تشغيل / إيقاف / خارج الخدمة and On / Off / Out of service; everything else
the pump words. Both store `in` / `sb` / `out`, so hours count alike — use
`tbStateOf(def, k)`, not `tbPumpState`, wherever a daily item is labelled.
`tbStationMsg` builds 10/1's daily WhatsApp text.

**Daily pumps.** Since v41 ALL of T.B. 10/1's pumps are daily — `TB_PUMPS.tb10_1`
is empty, and `TB_PUMPS_DAILY.tb10_1` holds HPS 1, HPS 2 (keys 0, 1) then
Transfer 1–6 (keys 2–7), shown in `ord` order under `group` headings. A transfer
pump's `legacy3h` is its old three-hourly index: `tbPumpSlots` and
`tbPumpLatest` fall back to `ps[legacy3h]` on days with no daily record, and
`tbPMKey` keeps its PM under the old key. `TB_PUMPS_DAILY`
pumps recorded once per day: `cell.dps[k]` state, `cell.dpy[k]` reason,
`cell.dpm[k]` PM; queue kinds `u`, `v`, `n`; stored as `pumpsDaily`,
`pumpsDailyWhy`, `pumpsDailyPM`. In the report a daily pump is index
`TB_DAILY_BASE + k` (10+), so `tbPumpSlots` and everything built on it serve
both kinds — a daily slot counts 24 hours.

**Pump station on a tab.** A battery with `pumpTab:true` in `TB_LIST` (only
T.B. 10/1) builds its pump cells into a second table, `.ptab-pumps`, instead of
columns in the readings table; `_tbPanelTab[id]` remembers which is open, and
switching only toggles `display` so nothing is redrawn.

**Pump station.** `TB_PUMPS` lists each battery's pumps; a pump's INDEX in
its list is its key in the database, so new pumps go at the END and a list is
never reordered. Each scanner row holds every pump's state (`cell.ps[pump][row]`)
and, where it went out, a reason (`cell.py`); a PM day is `cell.pmd[pump]`.
Save-queue keys pack pump and row into one number — `tbPumpKey(i, r)` = `i*100+r`
— under kinds `q` (state) and `y` (reason); PM is kind `m` with the pump index.
Hours are derived, never stored: `tbPumpSlots` walks every recorded row across
days and gives each the three hours that FOLLOW it (row 8 is the next day's row
0 and starts nothing). `tbPumpHours`, `tbPumpLatest`, `tbPumpOOS` and `tbPumpPM`
are all built on it. `TB_PUMP_PM_HOURS` holds the PM intervals — placeholders.
The state picker is a `<select>`; it is blurred before the panel redraws,
because the "don't rebuild under a focused box" rule would otherwise keep the
reason line from opening.

**Arabic labels.** `arHour(h)`, `arShortHour(h)`, `arSpan(txt)` and
`arRange(a, b)` live in the shell and are used by all three modules. Arabic goes
UNDER the English, never instead of it. Two rules a new label must follow: set
`letter-spacing:0` (the `.ar` class does, with `!important`, because the
heading rules are more specific) or the letters stop joining; and never put a
bare arrow between two Arabic runs — use `arRange`, which writes من … إلى … in
one right-to-left line.

**Remarks are per battery per day.** `note` on the cell, `remarks` on the
document, pending key `"tb6_1|r0"` (kind `r`, no index — it is text, not a
reading). The report card collects every battery's, then PETRECO's, into one
box; how many there are decides the type size, which is why `notes` is built at
the top of `tbOldCardHTML` before the size tokens.

**Two hour-offset fields, not scanner-indexed.** `c` is temperature (°C, read
at every scanner hour) and `x` is chemical injection (every `TB_CHEM_EVERY` = 6
hours), both arrays indexed 0..24 by HOUR OFFSET from that battery's shift
start, and both stored as maps — `temp` and `chem` — on the battery's document.
Neither has a boundary twin: they are a reading at a moment, not a total
carried across midnight. A new reading of this kind needs a letter in
`tbApplyInput`/`tbPushToCloud`/`tbOverlayPending`, a slot in `tbBlankCell`,
`tbCellIn` and `tbGetDay` (that last one is easy to forget — the array is
silently empty everywhere if you do), and a column in `tbPanel`.

**Concurrency.** `tbPushToCloud` sends ONLY the fields that client typed,
from `_tbPend` (see "Unsaved edits" in §4), one write per battery per date.
Sending whole rows let an operator who changed only a WHP reset the admin's
correction on the same row. An operator's save never carries a correction (`d`)
or another battery's cell, and only admin rewrites `dates` in the stamp — an
operator's copy is one battery and would shrink the list.

**Listeners are role-gated.** `_tabsFor()` decides both which tabs are drawn and
which listeners start. A tank battery operator never attaches the Ras Gara
listener — the rules would refuse that read and the refusal would paint a red
"Cloud refused access" in the footer of a perfectly healthy app.

**The footer status line aggregates.** Two datasets report to it. Each source
keeps its own state, the worst wins, and when all are healthy their fragments
are joined. On `synced` a module passes only its fragment ("116 day(s)"); on any
other status it passes a whole sentence.

**Reports.** The day report is ONE A4 page — measured in Chrome, 928px clean and
957px with the warning banners, against 1054px printable. The record report is
deliberately not one page; its summary block is `break-inside:avoid` and ends at
620px at every range, so page one always stands alone. Both use
`window.__REPORT__` (`buildPdf`, `pdfFromHTML`, `printHTML`, `offerPdf`) rather
than carrying their own PDF writer.

**Charts pass `forPrint`.** A report renders in a detached document where the
theme tokens are not in scope, and an unresolved `var(--…)` paints black.
