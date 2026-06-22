# EBE Mobile (React Native · Expo)

A native iOS/Android shell that hosts the ORB web face full-screen, so everything we built
(NeuralCluster orb, council, reservations, briefing, approvals) runs on your phone.

## Run it
```bash
cd apps/mobile
npm install
npx expo install react-native-webview expo-status-bar   # reconciles versions to your Expo SDK
npx expo start
```
Then scan the QR with **Expo Go** (iOS/Android), or press `i` / `a` for a simulator.

## Point it at your EBE server
Your phone can't reach `localhost`. In **`App.js`**, set `EBE_URL` to your computer's LAN IP
(same Wi-Fi) — e.g. `http://192.168.1.20:8080`. Find your IP:
- Windows: `ipconfig` → IPv4 Address
- Mac: `ipconfig getifaddr en0`

Make sure the API is running on the computer (`npm run dev:api`). Once EBE is deployed to a
public URL, set `EBE_URL` to that instead and it works anywhere.

## What works in the WebView
- ✅ The full orb visuals, typing to EBE, the council, reservations, briefing, approvals, news, notes.
- ⚠️ **Voice is limited inside a WebView.** Browser speech (the "Hey EBE" mic + spoken replies) relies
  on the Web Speech API, which mobile system WebViews don't fully provide. For full hands-free voice
  on mobile, that's the **native rebuild** (expo-speech for TTS + @react-native-voice for STT) — ask
  and I'll build it. Voice still works if you open the EBE URL in the phone's Chrome/Safari directly.

## Notes
- This app is intentionally **not** part of the npm workspace (React Native dislikes hoisting) —
  install it standalone from `apps/mobile`.
