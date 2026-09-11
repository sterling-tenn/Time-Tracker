# Time Tracker

having some fun with claude i suppose...

## Deploy (GitHub Pages, free)
GitHub Actions-free Pages (Settings → Pages → Deploy from branch → `main` / `/ (root)`).

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
       match /allowlist/{email} {
         allow read: if request.auth != null && request.auth.token.email == email;
         // No client writes - only the admin adds/removes entries, in the console.
       }
       match /tt/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid
           && exists(/databases/$(database)/documents/allowlist/$(request.auth.token.email));
         match /entries/{entryId} {
           allow read, write: if request.auth != null && request.auth.uid == uid
             && exists(/databases/$(database)/documents/allowlist/$(request.auth.token.email));
         }
       }
     }
   }
   ```
   Your projects/tags live at `tt/{your-uid}`; each tracked session is its own
   document under `tt/{your-uid}/entries/` (one collection, unlimited size,
   instead of one big array — Firestore caps a single document at 1MiB, and a
   few years of daily tracking could otherwise get there). This rule means
   only *you*, signed into that exact account — and only once it's approved,
   see below — can ever read or write any of it.
5. **Project settings → General → Your apps → Add app → Web**, register it
   (no hosting needed), and copy the `firebaseConfig` object it shows you.
6. Paste those values into the `firebaseConfig` object near the top of the
   `<script>` in `index.html`, commit, and push.

## Access control (invite-only)

This app is public (public repo, public URL), so signing in isn't the same
as being allowed in — there's no self sign-up button, and even if someone
created a Firebase Auth account directly (the client SDK config is public by
necessity, so that's never fully preventable), it wouldn't matter: the
Firestore rules above also require an `/allowlist/{email}` document to exist
before any read/write to that person's data succeeds, and only the admin can
create those documents.

To grant someone access:
1. **Firebase Console → Authentication → Users → Add user.** Enter their
   email and a temporary password, and share it with them (they can change
   it via "Forgot password?" on the sign-in screen once they're in).
2. **Firebase Console → Firestore Database → Data → `allowlist` collection
   → Add document.** Use their exact email (lowercase) as the **document
   ID**, and leave the fields empty (its existence is all that's checked).

Until step 2 is done, a signed-in account sees "hasn't been approved yet" —
sign-in works, but no data loads or saves. To revoke access, delete their
`allowlist` document (their Firestore data stays intact, just inaccessible
until re-approved) or delete their user under Authentication → Users.

## Storage schema

```
allowlist/{email}                 document, empty - existence is the approval flag
tt/{uid}                          document   { projects: [...], tags: [...] }
tt/{uid}/entries/{entryId}        subcollection, one document per tracked session
```

`tt/{uid}` — small, rarely-changing stuff, pushed as one document:
```js
{
  projects: [{ id, name, color }],
  tags:     [{ id, projectId, name, color }],
}
```

`tt/{uid}/entries/{entryId}` — one document per session (the Firestore document
ID *is* the entry's id, so it isn't duplicated inside the document body):
```js
{
  projectId,           // which project this session belongs to
  title,
  description,         // free-text notes, optional
  tagIds:    [id, ...],
  start,               // ms timestamp
  end,                 // ms timestamp, or null while still running
  pauseStart,          // ms timestamp if currently paused, else null
}
```

Sessions are kept in their own subcollection instead of one big array field
because Firestore caps a single document at 1MiB — with everything in one
array, that's roughly 5,000 sessions before writes start failing. A
subcollection has no such cap, so history can grow indefinitely; only an
individual entry (never an issue, a few hundred bytes) needs to stay under
the limit.

A running session is just an entry with `end: null` — no separate "timers"
structure. Pausing doesn't track a cumulative paused duration either; on
resume (or stop-while-paused), `start` is simply shifted forward by however
long the pause lasted, so that time is excluded from the total.
