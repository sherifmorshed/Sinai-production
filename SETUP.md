# Sinai Field — setup

Everything you must do in the Firebase console before this app works. It takes
about fifteen minutes. Step 3 is the security-critical one.

---

## 1 · Create the Firebase project

Firebase Console → **Add project**. Google Analytics is not needed; turn it off.

> Already created as **`production-hourly`**, and its config is already in
> `index.html`. Steps 1 and 2 are done — skip to step 3 unless you are standing
> up a different project.

Then **Build → Firestore Database → Create database**:

- **Production mode** (not test mode — test mode is open to the world for 30
  days and then breaks silently).
- Location: pick the region closest to Egypt, `europe-west1` or `eur3`. This
  cannot be changed later.

---

## 2 · Register the web app and copy the config

Project settings (gear icon) → **Your apps** → the **`</>`** web icon.

Nickname it "Sinai Field PWA". **Do not** tick Firebase Hosting unless you intend
to host there.

You get a `firebaseConfig` block. Open `index.html`, find it near the top of the
first `<script>` (marked *CONFIGURATION*), and replace the six values there.

Copy just the **values**. The console also shows `import` statements and an
`initializeApp` call: ignore those. This app uses the compat SDK loaded from
its own local copies, and pasting the console's `<script type="module">` block
would both clash with that and break offline support, because a service worker
cannot cache a script from `gstatic.com`.

```js
const firebaseConfig = {
  apiKey:            "AIza…",
  authDomain:        "production-hourly.firebaseapp.com",
  projectId:         "production-hourly",
  storageBucket:     "production-hourly.firebasestorage.app",
  messagingSenderId: "…",
  appId:             "1:…:web:…"
};
```

If the placeholders are ever left in, the app refuses to start and says so on
the login screen rather than failing obscurely.

> **This config is not a secret.** A Firebase web config identifies the project;
> it does not authorise anything. Everyone who loads the page has it. What
> protects the data is step 3.

---

## 3 · Publish the security rules — REQUIRED

Firestore Database → **Rules** → paste the whole of **`firestore.rules`** from
this folder → **Publish**.

Skipping this is the one mistake that actually matters. Without it you get
Firestore's default, which is either wide open or completely closed, and
neither is what you want.

The rules grant:

| | `rasGara` | `rasGaraMeta` |
|---|---|---|
| `sherifmorshed@gmail.com` (admin) | read + write | read + write |
| `petreco@petrobel.org` (PETRECO) | read + write | read + write |
| `rasgara@petrobel.org` (Ras Gara) | read + write | read + write |
| anyone else | denied | denied |

Everything else in the database is denied by default.

> **A limitation worth knowing.** Both sides' readings live in one document per
> day, so the rules cannot stop one operator group from writing the other's
> field — a rule allows or denies the whole document, and each group has to be
> able to write its own half. What the app does instead is send only the fields
> that role owns, merged into the day, so the two groups cannot overwrite each
> other **by accident** even after hours offline. A deliberate write from a
> browser console is still possible; making that impossible needs the day split
> into two sub-documents, and the reason it has not been done is written in
> `firestore.rules` next to the rule itself.

---

## 4 · Create the accounts

**Build → Authentication → Get started → Email/Password → Enable.**

Then **Users → Add user**, three times:

| Email | Who |
|---|---|
| `sherifmorshed@gmail.com` | you — both columns, chart, print, e-mail |
| `petreco@petrobel.org` | the PETRECO operators — their M³/hr column only |
| `rasgara@petrobel.org` | the Ras Gara operators — their two columns only |

Set fresh passwords and hand the operators theirs directly.

If you use different addresses, change them in **two** places or the app and
the database will disagree:

1. `ADMIN_EMAILS` / `PETRECO_EMAILS` / `PLANT_EMAILS` at the top of `index.html`
2. `isAdmin()` / `isPetreco()` / `isPlant()` in `firestore.rules`

An address in none of the lists can still sign in but gets a **read-only**
view — deliberate, so an account created by mistake cannot type over real
readings.

---

## 5 · Deploy

Upload the whole folder to any static host — Firebase Hosting, Netlify, GitHub
Pages, IIS, nginx. Two requirements:

- **HTTPS.** Service workers and installable PWAs require it (`localhost` is
  exempt for testing).
- **Serve over HTTP(S), not `file://`.** Opening `index.html` from disk breaks
  the service worker and offline support.

Upload these nine and nothing else:

```
index.html  sw.js  manifest.json  icon.png  icon-192.png
firebase-app-compat.js  firebase-firestore-compat.js
firebase-auth-compat.js  html2canvas.min.js
```

The rest of the folder is documentation, `firestore.rules` (which you paste
into the console, never serve) and the offline test harness — see `README.md`.

### If you use Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting     # public directory: . ; single-page app: No
firebase deploy
```

---

## 6 · Install it on the phones

Open the URL in Chrome on the operator's phone → menu → **Add to Home screen**.
It then opens full-screen with no browser chrome and works offline.

Tell the operators the shift day runs **06:00 → 05:00**: before 06:00 the app
still shows the previous day, which is what a night operator wants.

---

## Checklist

- [ ] Project created, Firestore in **production mode**
- [ ] `firebaseConfig` pasted into `index.html`
- [ ] **`firestore.rules` published**
- [ ] Email/Password sign-in enabled
- [ ] All three accounts created, passwords handed over
- [ ] Deployed over HTTPS, development files excluded
- [ ] Signed in as each of the three accounts and confirmed each sees only what it should
