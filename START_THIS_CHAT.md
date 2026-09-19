# Sinai Field — start here

**Attach `sinai-field-v27.zip` to the new chat and paste the block below as your
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
> Current release: **v27**, service-worker cache `sinai-field-v27`.
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

The two shifts are an hour apart and are NOT the same 24 hours. Do not add a
tank battery total to a Ras Gara total.

## Where things stand

v27 dropped the "x of 8 intervals complete" note from the battery panels. v26
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
