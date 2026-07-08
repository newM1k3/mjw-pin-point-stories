<div align="center">

![MJW Design](https://mjwdesign.ca/wp-content/uploads/2024/01/mjw-design-logo.png)

**Built with [MJW Design](https://mjwdesign.ca) — AI-Powered Development**

---

</div>

# MJW Memory Map

A photo-driven interactive map app for capturing and reliving memories. Upload photos with embedded GPS metadata, drop them onto a Leaflet map, and generate AI-powered narrative stories from the locations and moments you've collected. The app includes optional **PocketBase cloud authentication**, EXIF GPS extraction, a drag-and-drop photo dropzone, and an optional **AI Story Generator** that crafts personal narratives through a secure Netlify Function.

## Screenshots

| Map View with Photo Pins | Story Panel |
| :---- | :---- |
| ![Memory Map desktop map view — placeholder](public/screenshots/map-view.png) | ![Memory Map story panel — placeholder](public/screenshots/story-panel.png) |

## What It Does

Memory Map reads GPS coordinates from photo EXIF data and places each photo as a pin on an interactive Leaflet map. Rather than browsing a flat photo grid, you explore your memories geographically — seeing exactly where each moment happened and how your journeys connected.

| Feature | Description |
| :---- | :---- |
| **Photo Drop** | Drag and drop photos onto the dropzone; GPS coordinates are parsed automatically from EXIF metadata. |
| **Interactive Map** | React Leaflet canvas displays each photo as a positioned pin; click a pin to preview the photo and its metadata. |
| **EXIF Extraction** | `exifr` reads latitude, longitude, timestamp, and camera metadata directly from image files — no manual location entry needed. |
| **AI Story Generator** | Sends your collected location and photo data to a secure Netlify Function, which returns a human-readable narrative of your journey. |
| **PocketBase Auth** | Optional sign-in guard protects saved memories and allows user-scoped cloud persistence. |

**Key interactions:**

- Drag and drop one or more photos onto the dropzone to extract their GPS coordinates and add them to the map.
- Pan and zoom the Leaflet map to explore where your photos were taken.
- Click any map pin to preview the associated photo and its location metadata.
- Open the Story Panel to generate an AI narrative from your collected photo locations.
- Sign in through PocketBase to persist memories across sessions.

## How to Use

Open the app and drop photos onto the upload zone. Each photo with embedded GPS data will appear as a pin on the map automatically — no manual coordinates required. Pan across the map to see your journey take shape, and click individual pins to revisit each moment. When you have a set of memories on the map, open the Story Panel and generate an AI narrative that weaves your locations into a readable story. Sign in with a PocketBase account to save your memory collections across devices.

## Stack

| Layer | Technology |
| :---- | :---- |
| UI framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Icons | Lucide React |
| Map engine | Leaflet 1.9 + React Leaflet 4 |
| EXIF parsing | exifr |
| Optional cloud persistence & auth | PocketBase |
| Optional AI backend | Netlify Functions |
| Hosting | Netlify |

## Local Development

```
npm install
```

```
npm run dev
```

The app works fully with **no environment variables**. Without PocketBase or AI provider variables, it runs as a local browser app with in-memory photo pins and map state. EXIF extraction and Leaflet map rendering work entirely offline.

## Quality Checks

```
npm run typecheck
```

```
npm run lint
```

```
npm run build
```

## Available Scripts

```
npm run dev        # Start development server (http://localhost:5173)
npm run build      # Production build → dist/
npm run preview    # Preview production build locally
npm run lint       # ESLint check
npm run typecheck  # TypeScript type check (no emit)
```

## Environment Variables

All environment variables are optional unless you enable the related feature. The app remains production-usable in local-only mode with no configured variables.

| Variable | Required? | Scope | Enables | Description |
| :---- | :---- | :---- | :---- | :---- |
| `VITE_POCKETBASE_URL` | **Required for auth** | Frontend/public | PocketBase sign-in and cloud story persistence | Public PocketBase/PocketHost URL. Defaults to `https://mjwdesign-core.pockethost.io` if unset, but should always be set explicitly in Netlify. |
| `ANTHROPIC_API_KEY` | **Required for AI** | Netlify Function/server only | AI Story Generator via Claude 3.5 Sonnet | Server-side Anthropic API key. Set in Netlify site configuration → Environment variables. Never expose this as a `VITE_` variable. |

## PocketBase Auth and Cloud Persistence

The app works fully with **no environment variables**. In local-only mode, photos and map pins exist in browser memory for the current session, and users can still drop photos, explore the map, and generate stories. This preserves offline use and makes the app safe to deploy before PocketBase is configured.

Cloud persistence is optional. When `VITE_POCKETBASE_URL` is configured, the `AuthGuard` component enables a PocketBase sign-in flow. Authenticated users can save their memory collections to PocketBase and access them across sessions. Normal user authentication runs through the public PocketBase URL; **no PocketBase superuser token is placed in frontend code**.

### `stories` Collection

The `stories` collection exists in the MJW PocketBase instance (`mjwdesign-core.pockethost.io`, id: `pbc_232317621`). It was created to match the exact fields written by `StoryPanel` and read by `TripsView`.

| Field | Type | Required | Notes |
| :---- | :---- | :---- | :---- |
| `user` | relation → `users` | **Yes** | Set to `pb.authStore.model.id` on every create. Scopes all reads and writes to the owning user. |
| `trip` | text (max 36) | No | `crypto.randomUUID()` generated in `App.tsx` when photos are first loaded. Groups all stops from one session into a single trip. |
| `location_name` | text (max 500) | No | Reverse-geocoded place name, optionally prefixed with the user's trip name: `Japan 2024 — Kyoto, Japan`. |
| `coordinates` | json | No | `{ lat: number, lng: number }` — the cluster centre point. |
| `lenses_used` | json | No | Array of `TravelerLens` strings selected by the user. |
| `content` | text (max 10 000) | No | The AI-generated story text returned by the Netlify Function. |
| `created` | autodate | System | Managed by PocketBase. |
| `updated` | autodate | System | Managed by PocketBase. |

**Access rules** (all scoped to the authenticated owner):

| Rule | Value |
| :---- | :---- |
| `listRule` | `@request.auth.id != '' && user = @request.auth.id` |
| `viewRule` | `@request.auth.id != '' && user = @request.auth.id` |
| `createRule` | `@request.auth.id != ''` |
| `updateRule` | `@request.auth.id != '' && user = @request.auth.id` |
| `deleteRule` | `@request.auth.id != '' && user = @request.auth.id` |

## AI Story Generator Setup

The AI Story Generator is implemented through `netlify/functions/generate-story.ts`. Browser code calls `/api/generate-story` via the Netlify redirect rules; it never calls Anthropic directly and never includes API keys in frontend code.

The function calls **Anthropic Claude 3.5 Sonnet** (`claude-3-5-sonnet-20241022`) with a crafted travel-writing system prompt. It accepts a `locationName` and an array of `lenses` (traveler perspectives), and returns a 250–300 word second-person narrative.

Set `ANTHROPIC_API_KEY` in your Netlify site settings under **Site configuration → Environment variables**. After adding the key, redeploy the site. If the key is absent, the function returns a 500 error.

## Netlify Deployment

The `netlify.toml` at the project root configures the Vite build, API redirects, and static routing. To deploy on Netlify, connect this GitHub repository and use the following production settings.

| Setting | Value |
| :---- | :---- |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Functions directory | `netlify/functions` |
| Node/package install | Netlify default Node environment with `npm install` |

```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Deploy first with no environment variables to confirm the local-only app works, then add `VITE_POCKETBASE_URL` for cloud persistence and AI provider variables for the Story Generator if those features are needed.

## Accessibility and Production Readiness

The release UI includes accessible labels on major map controls, the photo dropzone, authentication actions, and story generation controls. Empty states are explicit so the map and dropzone remain understandable before any photos are added. The auth guard provides clear sign-in and sign-out flows, and the story panel communicates loading and error states rather than failing silently.

## Project Structure

```
src/
  context/
    AuthContext.tsx       # Hardened auth context (MJW Platform standard)
  components/
    AuthGuard.tsx         # PocketBase authentication gate — consumes AuthContext
    MapView.tsx           # React Leaflet map with cluster markers and route polyline
    PhotoDropzone.tsx     # Drag-and-drop photo upload + EXIF parsing + loading overlay
    StoryPanel.tsx        # AI story generation and PocketBase save UI (lifted state)
    TripsView.tsx         # Saved trips accordion — reads stories from PocketBase
  lib/
    exif.ts               # EXIF GPS extraction, clustering, and reverse geocoding
    pocketbase.ts         # Hardened PocketBase client with ensureAuth()
  types/
    index.ts              # Shared MapPin, Cluster, Story, and TravelerLens types
  App.tsx                 # Root layout + state management
  main.tsx                # Entry point

netlify/
  functions/
    generate-story.ts     # Secure server-side AI story generation via Claude 3.5 Sonnet

public/
  screenshots/            # README screenshots
```

## Changelog

### v0.3.0 — Sprint 1 + PocketBase Schema

- Created `stories` PocketBase collection (`pbc_232317621`) with correct fields: `user` (relation), `trip`, `location_name`, `coordinates` (json), `lenses_used` (json), `content`. Access rules scope all reads/writes to the owning user.
- Added `user` field to `Story` TypeScript type to match the real schema.
- `StoryPanel` now sets `user: pb.authStore.model.id` on every `stories.create()` call.
- `TripsView` filter updated to use `user = "${userId}"` against the real relation field.
- `App.tsx` generates a `crypto.randomUUID()` `tripId` when photos are first loaded; adds a trip name input field; lifts story state into `Map<clusterId, ClusterStoryState>` so each stop remembers its lenses, story, and saved status across navigation.
- Added `TripsView` component — accordion UI grouping saved stories by trip with relative date formatting and lens tags.
- Added `ClusterStoryState` interface to `types/index.ts`.

### v0.2.0 — Auth Hardening (MJW Platform Standard)

- Added `AuthContext` — proper React context exposing `user`, `isLoading`, `login`, and `logout`. Listens for `pb:authError` DOM event to force a clean logout on stale tokens, eliminating infinite loading spinners.
- Added `ensureAuth()` to `pocketbase.ts` — pre-write token refresh guard called before every PocketBase write to prevent silent 403 errors.
- Refactored `AuthGuard` to consume `useAuth()` from `AuthContext`; login logic moved out of the component layer.
- Updated `App.tsx` to wrap with `<AuthProvider>` and use `useAuth().logout()` instead of calling `pb.authStore.clear()` directly.
- Updated `StoryPanel` to call `ensureAuth()` before `pb.collection('stories').create()`.

### v0.1.0 — Beta Release

- Added drag-and-drop photo dropzone with automatic EXIF GPS coordinate extraction via `exifr`.
- Added interactive Leaflet map with cluster markers, route polyline, and reverse geocoding via Nominatim.
- Added secure AI Story Generator through Netlify Functions calling **Anthropic Claude 3.5 Sonnet**.
- Added PocketBase authentication guard and cloud story persistence.
- Added Netlify deployment configuration with API redirect rules and SPA routing.

---

Part of the **MJW Personal App Platform**.