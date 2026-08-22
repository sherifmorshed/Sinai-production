# Sinai Field — Production Readings

A standalone PWA for the hourly production readings of the Sinai field: the
PETRECO test separator on one side, the Ras Gara plant on the other, and the
daily comparison between them.

A standalone application: its own Firebase project, its own accounts, its own
release cycle. It depends on nothing outside this folder.

> **On the naming.** The app is *Sinai Field*. *Ras Gara* and *PETRECO* are the
> two measuring points inside it, and those names appear wherever they refer to
> a side — column headers, totals, an operator's own heading.

---

## What it does

**The shift day runs 06:00 → 05:00 the next morning**, 24 hourly rows. Before
06:00 the app still shows the previous day, so a night operator opens it and
sees the right page without thinking about it.

**Who types what**

| Column | Admin | PETRECO | Ras Gara | How |
|---|---|---|---|---|
| PETRECO M³/hr | edit | edit | — | typed |
| PETRECO Cumulative | — | — | — | **calculated** as the running total |
| Ras Gara M³/hr | edit | — | edit | typed |
| Ras Gara Cumulative | edit | — | edit | typed — their meter reports it separately |

Entries save automatically: to the device first, then to the cloud about a
second after typing stops, so filling 24 rows is one upload rather than 24.

**A save only writes the columns that role owns.** This matters because the two
operator groups work in different places and one of them may have been offline
for hours: without it, whoever saved last would overwrite the other side's
readings with whatever stale copy their phone happened to hold. Each save is
merged into the day server-side rather than replacing it.

**The calculations**, exactly as the original workbook did them:

```
PETRECO total  = Σ hourly M³/hr        bbl/d = total × 6.3
Ras Gara total = Σ hourly M³/hr        bbl/d = total × 6.3
Difference     = PETRECO total − Ras Gara total
```

**The difference is highlighted, and the colour means something.** Oil leaves
Ras Gara and is received at PETRECO, so the two totals should agree:

| | |
|---|---|
| **Red** | Ras Gara metered **more** than PETRECO received — oil left that PETRECO cannot account for |
| **Green** | PETRECO received at least what Ras Gara sent |

The same colouring runs down the Difference column of the daily history, so a
run of red days is visible at a glance.

**Print** opens a one-page report — the three KPI cards, the full hourly table
and the rate chart.

**Send by e-mail** builds that report as a PDF and hands it to the phone's share
sheet, where Gmail and Outlook appear with the file already attached. On a
desktop browser with no share sheet it downloads the PDF and opens a Gmail
compose window with the subject and summary written, ready for you to attach it.

**Daily comparison history** at the bottom is one row per day. Tap a row to jump
to that day.

---

## The three roles

Set by `ADMIN_EMAILS`, `PETRECO_EMAILS` and `PLANT_EMAILS` at the top of
`index.html`.

| | Admin | PETRECO (`petreco@petrobel.org`) | Ras Gara (`rasgara@petrobel.org`) |
|---|---|---|---|
| Table | 5 columns, both sides | **3 columns, PETRECO only** | **3 columns, Ras Gara only** |
| Totals | PETRECO, Ras Gara, Difference | **PETRECO only** | **Ras Gara only** |
| Chart | yes | no | no |
| Print / e-mail | yes | no | no |
| Daily history | Date, PETRECO, R/G, Difference | Date, PETRECO total | Date, Ras Gara total |
| Heading | "Production Comparison" | "PETRECO — Daily Readings" | "Ras Gara — Daily Readings" |

Neither operator group ever sees the other's figures on screen, or the
difference between them. The comparison is PETROBEL's to make.

An account in none of the three lists can sign in but is **read-only** — it can
look, not type. That is deliberate: an account added to the console by mistake
should not gain write access just by existing.

> **The screen hides each side from the other; the accounts can still read it.**
> Both sides live in one document per day and the rules let either operator read
> that document, so the other side's figures are reachable from a browser
> console. What the app *does* prevent is accidental overwriting — a save only
> writes the fields that role owns. If the two sides ever need to be genuinely
> confidential from each other, the day has to be split into two sub-documents;
> the reasoning is written into `firestore.rules` at the rule it would change.

---

## Why the frames

Every input carries a visible 2px frame at rest, not on hover.

The original was `border: 1px solid transparent` revealed on `:hover`. A phone
has no hover, so on the actual device the field only appeared **after** you had
already tapped it, and operators could not tell which cells were typeable. If
you restyle this table, keep the frames.

The calculated cells are deliberately different — muted text on the card ground
rather than a white field — so a derived number never looks like an empty input.

---

## Files

**Upload these nine — this is the whole app:**

| File | | |
|---|---|---|
| `index.html` | 84 KB | everything: markup, styles, logic |
| `sw.js` | 4 KB | offline cache — **bump `CACHE_NAME` every release** |
| `manifest.json` | 1 KB | makes it installable |
| `icon.png`, `icon-192.png` | 64 KB | home-screen icon |
| `firebase-app-compat.js` | 32 KB | ┐ |
| `firebase-firestore-compat.js` | 336 KB | ├ Firebase SDK 10.12.2 |
| `firebase-auth-compat.js` | 140 KB | ┘ |
| `html2canvas.min.js` | 196 KB | renders the report for the e-mailed PDF |

The Firebase SDK is vendored rather than loaded from Google's CDN because a
service worker cannot cache a cross-origin script. Loaded remotely, a cold
offline start leaves `firebase is not defined` and the app never boots. Do not
replace these with the `<script type="module">` snippet the Firebase console
offers — take only the config values from it.

**Do not upload these** — they are for you, not the server:

| File | |
|---|---|
| `README.md`, `SETUP.md`, `DEVELOPER_REFERENCE.md` | documentation |
| `firestore.rules` | paste into the Firebase console; never served |
| `test.html`, `test_petreco.html`, `test_plant.html`, `firebase-stub.js` | offline test harness |
| `test_build.py` | regenerates the three test files |

---

## Working on it

`index.html` is the file you edit — no build step.
There is a map of what lives where in a comment at the very top of it.

```bash
python3 -m http.server 8000
# admin:    http://localhost:8000/test.html
# PETRECO:  http://localhost:8000/test_petreco.html
# Ras Gara: http://localhost:8000/test_plant.html
```

These run the real app against a stubbed Firebase with three days of seeded
readings — no project, no network, no risk to live data. Everything works
there: typing, the chart, print and the PDF.

They are **snapshots taken from `index.html`**, so after editing it run:

```bash
python3 test_build.py
```

or you will be testing the previous version. Full detail in
`DEVELOPER_REFERENCE.md`.

---

## Getting started

`SETUP.md` — the Firebase project, the rules, the three accounts, deployment.
