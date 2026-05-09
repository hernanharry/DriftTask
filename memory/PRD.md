# Driftask CRM — Product Requirements

## Overview
Driftask is a modern mobile-first CRM built with React Native (Expo) + FastAPI + MongoDB. Designed with a Swiss / high-contrast aesthetic (Klein Blue #002FA7 on Stark White) and abundant slide-based interactions: onboarding carousel, swipeable metric cards, and a horizontally pageable pipeline.

## Stack
- **Mobile**: Expo Router (TypeScript), AsyncStorage, lucide-react-native, react-native-reanimated.
- **Backend**: FastAPI, Motor (async MongoDB), bcrypt, python-jose (JWT HS256).
- **Database**: MongoDB (collections: users, contacts, deals, tasks, notes).
- **Auth**: Custom JWT (no Emergent / 3rd-party dependency).

## Features (MVP — shipped)
- **Onboarding**: 3-slide horizontal carousel with paging dots, Skip + Continue/Get Started CTAs.
- **Auth**: Register (email + password ≥ 6 chars + full name), Login, persistent session via AsyncStorage. Logout returns to login screen.
- **Dashboard**: Horizontally swipeable metric carousel (Revenue, Pipeline Value, Conversion %, Won Deals), bento grid for Contacts/Deals/Tasks counts, stage breakdown bar chart.
- **Contacts**: List with avatars, search, add via modal (name, email, phone, company, position), delete.
- **Pipeline**: 6 horizontally pageable stage screens (lead → qualified → proposal → negotiation → won / lost), pill tabs, add deal modal, ChevronLeft/Right buttons to move deals between stages, delete.
- **Tasks**: Open/All/Done filter chips, add modal with priority pills (low/medium/high), toggle-complete circle, delete.
- **Profile**: User card with initials avatar, Cloud Integrations section (Cloud Sync SOON), Preferences (Notifications, Privacy, Help), Sign out.
- **Dashboard stats endpoint**: total_contacts, total_deals, won_deals, open_tasks, revenue, pipeline_value, conversion_rate, deals_by_stage.

## API (all under `/api`)
- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- `GET|POST /contacts`, `GET|DELETE /contacts/{id}`
- `GET|POST /deals`, `PATCH|DELETE /deals/{id}`
- `GET|POST /tasks`, `PATCH|DELETE /tasks/{id}`
- `GET|POST /notes` (filter by contact_id / deal_id)
- `GET /dashboard/stats`

## Future / Nice-to-have
- Cloud sync integration (placeholder UI present in Profile tab).
- Notes thread per contact / deal in detail screen.
- Reminder push notifications for tasks.
- Multi-currency support.

## Test Credentials
See `/app/memory/test_credentials.md`.
