# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

"Wordico" (bundle id `com.ysfdem.footballtaboo`, also branded "FutTaboo"/"Football Taboo") is a React Native/Expo taboo-style word-guessing game with solo, online multiplayer, and tournament modes. It ships to iOS/Android via EAS and has a companion Node/Socket.IO backend deployed on Railway (`wordico.net`, fallback `futtaboo.onrender.com`).

## Repo layout

- **App root** — Expo Router-less RN app (`App.tsx` → `src/navigation/AppNavigator.tsx`, a single React Navigation native stack; see `RootStackParamList` in that file for every screen and its params).
- **`backend/`** — standalone Express + Socket.IO server (`server.js`) with a Mongoose/MongoDB layer (`db.js`). It has its own `package.json`/`node_modules` and an empty, uninitialized nested `.git` (not a submodule — files under `backend/` are tracked normally by the root repo).
- **`src/screens/`** — one file per app screen (Home, Game, OnlineGame, RoomLobby, Tournament, Market, Profile, Leaderboard, PitchBattle, CardAlbum, etc.).
- **`src/services/`** — cross-cutting singletons: `socket.ts` (Socket.IO client + `SOCKET_URL`), `ads.tsx` (AdMob), `analytics.ts` / `crashlytics.ts` (Firebase), `remoteConfig.ts` (Firebase Remote Config with local fallback defaults), `notifications.ts`, `clueRouter.ts`.
- **`src/utils/`** — game logic: `ClueService.ts` (loads `assets/data/cards.json` + `clues.json`, per-card clue selection), `ClueHistory.ts` (AsyncStorage-backed recent-clue tracking to avoid repeats), `LeagueHelper.ts`, `WordSync.ts`.
- **`src/context/LanguageContext.tsx`** — app-wide i18n context; strings live in `src/constants/translations.ts`.
- **`src/constants/FeatureFlags.ts`** — hand-edited compile-time flags (e.g. `ENABLE_DYNAMIC_CLUES`).
- **`patches/`** — `patch-package` patches for `@react-native-firebase/*` packages, applied automatically via the `postinstall` script.
- **Root-level `.js`/`.py` scripts and `.xlsx`/`.csv` files** — one-off data-generation/migration tooling for card/clue word lists (football, cinema, music, date categories) and Excel↔JSON/CSV conversion. Not part of the runtime app; only touch these if the task is specifically about word/clue data.
- **`scripts/`** — image-processing utilities (avatar/logo cropping, checkerboard-artifact cleanup).

## Commands

App (run from repo root):
- `npm start` — `expo start` (also `Start_Expo_Go_Local.bat` for LAN, `Start_Expo_Go.bat` for `--tunnel`)
- `npm run android` / `npm run ios` — native builds via `expo run:android` / `expo run:ios`
- `npm run web` — `expo start --web`
- `npm run dev` — `run_dev.js`: spawns the backend socket server on :3000, a local proxy on :19003 that routes `/socket.io` traffic to the backend and everything else to Expo on :19004, and an SSH tunnel via `localhost.run`; used for testing cross-device online play without deploying the backend.
- There is no configured lint or test script — verify changes by running the app (see `run` skill) rather than assuming `npm test`/`npm run lint` exist.
- EAS builds are configured in `eas.json` (`development`, `preview`, `production` profiles); `sdkVersion`/`runtimeVersion` come from `app.json`.

Backend (run from `backend/`):
- `npm start` — `node server.js`

## Architecture notes

- **Expo SDK 54** with the New Architecture enabled (`newArchEnabled: true` in `app.json`). Per `AGENTS.md`, Expo APIs have changed meaningfully in recent SDKs — check `https://docs.expo.dev/versions/v57.0.0/` before writing Expo-related code rather than relying on training knowledge.
- **Client-server split**: `src/services/socket.ts` hardcodes the production `SOCKET_URL` (`https://wordico.net`); the dev-tunnel override logic is present but commented out, meaning Expo Go currently always talks to production/Render regardless of `__DEV__`. Local end-to-end testing goes through `npm run dev` (see above) instead.
- **Realtime protocol**: all online-game and account state travels over Socket.IO events defined in `backend/server.js`'s single `io.on('connection', ...)` handler — matchmaking (`join_queue`, `join_friendly_queue`, `create_room`, `join_room`, `start_room_game`), gameplay (`request_guess_turn`, `pass_round`, `guess_word`, `leave_room`), tournaments (`get_weekly_tournament`, `submit_tournament_score`, `get_tournament_leaderboard`, `grant_tournament_ad_attempt`), and account/profile (`register_profile`, `login_profile`, `forgot_password`, `reset_password`, `update_avatar`, `save_push_token`, `buy_joker`, `reward_free_coins`, `reward_double_coins`, `check_my_coins`, `use_joker`). A handful of REST endpoints exist alongside (`/health`, `/version`, `/privacy*`, `/api/refresh-words`, `/api/fix-tournaments`, `/seed-players`).
- **Persistence**: Mongoose models in `backend/db.js` — `guestToken`, `player`, `systemLog`, `tournamentScore`, `weeklyTournament`.
- **Mail**: password-reset flow uses both a direct SMTP transport (Gmail, IP-pinned to dodge Railway IPv6 issues) and a Resend HTTP API fallback (to dodge Render's SMTP port blocking) — see top of `backend/server.js`.
- **Card/clue data**: gameplay content is static JSON bundled at `assets/data/cards.json` / `assets/data/clues.json`, generated offline from the root-level Excel/CSV word lists and backend `generate_*`/`add_tv_shows.js` scripts — these are not regenerated at runtime.
- **Remote Config / feature flags**: `src/services/remoteConfig.ts` wraps Firebase Remote Config with hardcoded local defaults and fails soft (native module unavailable in Expo Go), so always keep the `defaults` object in sync with the flags actually read.
- **Firebase native modules** (`@react-native-firebase/{app,analytics,crashlytics,remote-config}`) are patched via `patches/` — if upgrading these packages, check whether the patches still apply.
