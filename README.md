# Trig Mission: Race to the Moon

This is HTML + CSS + JavaScript (web browsers use JavaScript, not Java).

## Shared leaderboard
The game works immediately, but cross-student scores require a shared database. This version uses Firebase Firestore.

1. Create a Firebase project and Web App.
2. Create a Firestore database.
3. Copy the Firebase web config into `firebaseConfig` at the top of `app.js`.
4. Paste `firestore.rules` into Firestore Rules and publish.
5. Upload all files to a GitHub repository.
6. GitHub → Settings → Pages → Deploy from branch → main/root.
7. Share the GitHub Pages URL.

Ranking: more correct answers first; ties go to the faster time.

Do NOT commit service-account JSON, admin keys, passwords, or other secrets.
This is a classroom game, not tamper-proof: browser-side scores can be manipulated by a technical user.
