# Time Tracker

having some fun with claude i suppose...

## Deploy (GitHub Pages, free)
GitHub Actions-free Pages (Settings → Pages →　Deploy from branch → `main` / `/ (root)`).

## Firebase (required)

All data lives in Firestore — there's no local/offline mode, so the app needs
a Firebase project wired up before it does anything:

1. Go to https://console.firebase.google.com → **Add project** (free, no
   credit card).
2. **Build → Authentication → Get started → Sign-in method → Email/Password
   → Enable.**
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
   Your data lives at `tt/{your-uid}`. This rule means only *you*, signed
   into that exact account, can ever read or write it — no shared secret,
   no one else can touch it even if they find the page.
5. **Project settings → General → Your apps → Add app → Web**, register it
   (no hosting needed), and copy the `firebaseConfig` object it shows you.
6. Paste those values into the `firebaseConfig` object near the top of the
   `<script>` in `index.html`, commit, and push.

Visiting the page always requires signing in with an email and password.
Use "Create account" the first time on each device (same email/password),
or "Forgot password?" to reset it via email. Sign in with the same account
on another device and it syncs in real time; nobody else who opens the URL
can see or change anything unless they know that email and password.
