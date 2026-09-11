# Time Tracker

A dark-themed time tracker: per-project timers, tags, a session log, and stats
(total time, sessions, longest session, day record, 30-day chart, time per tag).

Single static page, no build step, no dependencies — data is saved in the
browser's `localStorage` (per-browser, not synced across devices).

## Run locally

Just open `index.html` in a browser.

## Deploy (GitHub Pages, free)

Already set up for this repo via GitHub Actions-free Pages (Settings → Pages →
Deploy from branch → `main` / `/ (root)`). Push to `main` and the site
publishes at the Pages URL shown in the repo's Settings → Pages tab.

## Cross-device sync (optional)

Without any setup, data is saved only in the current browser's `localStorage`,
no login. To make it follow you across devices — privately, so no one else
can read or write your data — wire up a free Firebase project:

1. Go to https://console.firebase.google.com → **Add project** (free, no
   credit card).
2. **Build → Authentication → Get started → Sign-in method → Google → Enable.**
3. **Build → Firestore Database → Create database** (production mode, any
   region).
4. In **Firestore → Rules**, paste and publish:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /tt/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```
   Your data lives at `tt/{your-Google-uid}`. This rule means only *you*,
   signed into that exact Google account, can ever read or write it — no
   shared secret, no one else can touch it even if they find the page.
5. **Project settings → General → Your apps → Add app → Web**, register it
   (no hosting needed), and copy the `firebaseConfig` object it shows you.
6. Paste those values into the `firebaseConfig` object near the top of the
   `<script>` in `index.html`, commit, and push.

Once configured, visiting the page requires **Sign in with Google** before
showing any data. Sign in with the same account on another device and it
syncs in real time; nobody else who opens the URL can see or change anything.
