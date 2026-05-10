# Driftask CRM — Product Requirements

## Overview
Driftask is a modern mobile-first CRM built with React Native (Expo) + FastAPI + MongoDB. Designed with a Swiss / high-contrast aesthetic (Klein Blue #002FA7 on Stark White) and abundant slide-based interactions: onboarding carousel, swipeable metric cards, and a horizontally pageable pipeline.

## Stack
- **Mobile**: Expo Router (TypeScript), AsyncStorage, lucide-react-native, react-native-reanimated, expo-auth-session, expo-notifications, expo-localization, @react-native-community/datetimepicker.
- **Backend**: FastAPI, Motor (async MongoDB), bcrypt, python-jose (JWT HS256), httpx (Google Drive REST).
- **Database**: MongoDB (collections: users, contacts, deals, tasks, notes, drive_tokens).
- **Auth**: Custom JWT (no Emergent / 3rd-party dependency).
- **Cloud**: Google Drive App Folder backup (REST API v3, server-side OAuth token exchange & refresh).

## Features (shipped)
### v1.0
- Onboarding 3-slide carousel + skip/continue.
- JWT auth (register/login/persist).
- Dashboard: metric carousel + bento grid + pipeline stage breakdown.
- Contacts list, search, add modal, delete.
- Pipeline: 6 horizontally pageable stages, deals CRUD, move between stages.
- Tasks: filter chips, priority, complete/delete.
- Profile: user card, sign out.

### v1.1 (new)
- **Google Drive backup & restore**
  - OAuth (PKCE, scope `drive.appdata`) via `expo-auth-session`; backend exchanges code, stores tokens per user, auto-refreshes access token.
  - "Backup now" uploads `driftask_backup_<ts>.json` (contacts/deals/tasks/notes) to App Folder.
  - "Restore from Drive" lists & downloads backups, replaces user data.
  - Disconnect button revokes local tokens.
- **Contact detail screen** (`/(app)/contact/[id]`)
  - Tap a contact card → detail with avatar, info rows, and chronological notes timeline.
  - Composer at the bottom to post new notes (`POST /api/notes`).
- **Local push notifications** (native only)
  - `due_date` field on tasks with date/time picker.
  - `expo-notifications` schedules a local reminder on the device when due_date is set.
  - Web preview gracefully no-ops (UI works, scheduling skipped).
- **Multi-language EN/ES**
  - I18n provider with translation dictionary, device-locale detection, AsyncStorage persistence.
  - Language picker in Profile → all UI strings switch live (tab labels, headings, buttons, errors, etc.).

## API (all under `/api`)
Auth: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
Contacts: `GET|POST /contacts`, `GET|DELETE /contacts/{id}`
Deals: `GET|POST /deals`, `PATCH|DELETE /deals/{id}`
Tasks: `GET|POST /tasks` (with `due_date`), `PATCH|DELETE /tasks/{id}`
Notes: `GET|POST /notes` (filter by `contact_id` / `deal_id`)
Dashboard: `GET /dashboard/stats`
Drive: `GET /drive/status`, `POST /drive/auth/exchange`, `POST /drive/disconnect`, `POST /drive/backup`, `GET /drive/backups`, `POST /drive/restore/{file_id}`

## Test Coverage
- 38/38 backend pytest cases pass (auth, contacts, deals, tasks, notes, dashboard, drive endpoints, isolation).
- 18/18 frontend e2e flows pass (onboarding, login, all 5 tabs, contact detail + notes, language switch persistence, drive UI).

## Test Credentials
See `/app/memory/test_credentials.md`.

## Future / Nice-to-have
- Multi-currency.
- Push notifications via Expo Push Tokens (requires native build).
- Notes thread per deal.
- Search across deals/tasks/notes.
- Theme picker (dark mode).
