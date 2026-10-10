# Trig Mission: Race to the Moon — Version 2

Three difficulty levels: Cadet, Pilot, Commander. Each has 30 questions in three progressively harder stages. Firebase-backed leaderboard is separate for each difficulty. Older scores appear under Classic.

## Upgrade the existing GitHub Pages game

1. Back up the existing files in the `Michael5252/Trig-Moon-Race` repository (optional but recommended).
2. In the repository, choose **Add file → Upload files** and upload **index.html, style.css, app.js, questions.js, firestore.rules, README.md** from this ZIP. Commit directly to `main`. GitHub will replace files with the same names and add `questions.js`.
3. In Firebase Console → Trig-Moon-Race → Firestore Database → Rules, replace the rules with the content of `firestore.rules`, then **Publish**. GitHub's `firestore.rules` file does not apply itself to Firebase.
4. Wait for GitHub Pages to deploy (repository → Actions or Settings → Pages).
5. Open https://michael5252.github.io/Trig-Moon-Race/ and hard-refresh. Test Cadet first, then the other levels. Complete 30 questions and confirm the score appears in the matching leaderboard.

## Notes

- The included `app.js` uses the existing project's public Firebase web configuration. Firebase web config is not a secret, but do not publish Firebase admin keys.
- No Firebase Hosting change is needed; the game still runs on GitHub Pages.
- The `Classic` leaderboard preserves access to older scores with no `difficulty` field.
- This is a casual classroom leaderboard: client-side scores can be manipulated by a technically skilled player. For anti-cheat, score verification would need a trusted backend.
- `questions.js` is the editable question bank. Each question is `[prompt, correctAnswer, [threeWrongAnswers], explanation]`.
