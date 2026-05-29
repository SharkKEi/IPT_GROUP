# Changelog

## History Note — May 1, 2026

### Commit History Restored
A force-push was performed to restore original file timestamps and authorship
that were overwritten by a branch merge (master → main) on Apr 28, 2026.

### Contributor Credit
**ivel225** made the following legitimate contribution (original commit: `4013c1d`):
- `serializers.py` — skip email verification check on login when `DEBUG=True`
  so existing accounts can log in without going through the activation flow
- `views_api.py` — skip sending activation email on registration when `DEBUG=True`,
  auto-activate account and return "You can now log in" message instead

Their code changes were preserved and re-committed into the clean history.
Original commit still viewable at:
https://github.com/SharkKEi/IPT_GROUP/commit/4013c1d

No code was lost. All contributions are intact.

---

## Commits by Contributor

| Commit | Author | Description |
|---|---|---|
| `4932d22` | Sir-Nightfallx9 | Fix: auto-activate accounts in DEBUG mode (cherry-picked from ivel225) |
| `f30a495` | Sir-Nightfallx9 | feat(auth): account activation, profile editing, and UX improvements |
| `c42adac` | SharkKEi | feat: add user registration, email activation, profile picture, Cloudinary |
| `7410bf3` | Sir-Nightfallx9 | merge: resolve conflict in App.jsx |
| `bf21837` | Sir-Nightfallx9 | feat(auth): implement login, logout, and user profile page |