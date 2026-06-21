# App Store / Play — anti-rejection checklist

The common reasons an app like EBE gets rejected, and how we address each.

## ✅ Built (backend mechanisms in place)
| Apple guideline | Risk | Mechanism |
|---|---|---|
| **5.1.1(v) Account deletion** | apps with sign-in must let users delete account + data in-app | `DELETE /api/orb/account` wipes memories, tasks, actions, notepad, journal, council logs, connections (verified) → wire a "Delete my account" button in mobile Settings |
| **5.1.1 / 5.1.2 Privacy policy** | required, must be reachable | `GET /api/orb/privacy` (also link it in App Store Connect) |
| **2.1 / 2.3 Data & permissions** | mic permission must be justified | `NSMicrophoneUsageDescription` + `NSSpeechRecognitionUsageDescription` in `app.json` |
| **4.2 Minimum functionality** | a pure WebView wrapper gets rejected | native voice IN via `POST /api/orb/transcribe` (Whisper) + native voice OUT (expo-speech) + native screens — see "native rebuild" below |

## ⚠️ Still required before submitting (native app rebuild)
The current mobile app is a WebView — **replace it with native** to pass 4.2:
1. **Native UI** — render the orb + screens with React Native components (react-native-svg / Skia), not a WebView.
2. **Native voice** — `expo-av` records → `/api/orb/transcribe` (in); `expo-speech` (out). Real device functionality.
3. **Push notifications** — `expo-notifications` (this also powers Proactive "ORB has something important" on a locked phone).
4. **Sign in with Apple** — **Guideline 4.8**: if you offer Google sign-in, you must also offer Sign in with Apple. Add `expo-apple-authentication`.
5. **Account deletion button** in Settings → calls `DELETE /api/orb/account`.
6. **No broken links / placeholder content**; real app icon + screenshots.

## App Store Connect setup (you, with your paid accounts)
- Bundle id: `com.ebehq.orb` (set in `app.json`).
- App privacy "nutrition label": declare data types (email, usage) — none sold.
- Demo account for reviewers (a test login) so they can see it work.
- Support URL + privacy URL (use `https://app.ebehq.com/api/orb/privacy` once deployed).

## Build & submit (Expo EAS)
```bash
cd apps/mobile
npm install
npx expo install
eas login                 # your Expo account
eas build -p ios          # signs via your Apple account when prompted
eas submit -p ios         # uploads to App Store Connect
```
Same with `-p android` for Google Play.
