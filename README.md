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

- Drag and drop one or more photos onto the dropzone panel.
- GPS coordinates are extracted automatically from each image's EXIF data.
- Each photo appears as a pin on the interactive map at its real-world location.
- Click any pin to preview the photo and view its location and timestamp details.
- Use the Story Panel to generate an AI-written narrative from your collected photos and locations.
- Sign in with PocketBase to persist your memory collections across sessions.

## How to Use

Open the app and drag photos from your device onto the photo dropzone. As long as your photos contain embedded GPS metadata — typical of smartphone camera photos — each one will appear immediately as a pin on the map. Pan and zoom the map to explore where your memories were captured. Once you have a collection of photos pinned, open the Story Panel and request an AI-generated narrative that weaves your locations and moments into a readable journey story. Sign in through the auth guard to save collections to the cloud.

Photos without embedded GPS metadata will not be placed on the map. Most smartphone photos include GPS data by default; photos from cameras with location disabled or edited-out EXIF data will be silently skipped or require manual placement.

## Stack

| Layer | Technology |
| :---- | :---- |
| UI framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Icons | Lucide React |
| Map engine | Leaflet 1.9 + React Leaflet 4 |
| EXIF parsing | exifr |
| Optional cloud persistence | PocketBase |
| Optional AI backend | Netlify Functions |
| Hosting | Netlify |

## Local Development

```
npm install
```

```
npm run dev
```

The app works fully with **no environment variables**. Without PocketBase or AI provider variables, it runs as a local browser app with in-session photo pins and EXIF extraction. The map, dropzone, and EXIF parsing all function offline with no configuration required.

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
| `VITE_POCKETBASE_URL` | Optional | Frontend/public | PocketBase sign-in and cloud memory persistence | Public PocketBase/PocketHost URL used for user authentication and user-scoped memory record CRUD. Example: `https://mjwdesign-core.pockethost.io`. |
| `OPENAI_API_KEY` | Optional | Netlify Function/server only | AI Story Generator through OpenAI | Server-side OpenAI API key. Never expose this as a `VITE_` variable. |
| `GEMINI_API_KEY` | Optional | Netlify Function/server only | AI Story Generator through Gemini fallback | Server-side Gemini API key. Used only when `OPENAI_API_KEY` is absent. Never expose this as a `VITE_` variable. |

## PocketBase Auth and Cloud Persistence

The app works fully with **no environment variables**. In local-only mode, photo pins and extracted EXIF data exist only for the current browser session. Users can still explore the map, extract GPS coordinates, and generate stories without signing in.

Cloud persistence is optional. When `VITE_POCKETBASE_URL` is configured, the `AuthGuard` component presents a PocketBase sign-in form. Authenticated users can save their memory collections to user-scoped records in PocketBase. Normal user authentication runs through the public PocketBase URL; **no PocketBase superuser token is placed in frontend code**.

### Recommended `memories` Collection

Create a PocketBase collection named `memories`. The implementation expects authenticated users to own their own records through an `owner` relation field. Configure the following fields.

| Field | Type | Notes |
| :---- | :---- | :---- |
| `title` | text | Display name for the memory collection. |
| `owner` | relation to `users` | Should point to the authenticated user. |
| `photos_json` | json | Stores photo metadata including GPS coordinates, timestamps, and filenames. |
| `story` | text | Stores the AI-generated narrative for the collection, if generated. |
| `visibility` | select | Recommended values: `private`, `shared`, `public`. |
| `created` | system field | Managed by PocketBase. |
| `updated` | system field | Managed by PocketBase. |

Recommended collection rules should allow authenticated users to create records for themselves and only read, update, or delete their own records. A practical rule pattern is `@request.auth.id != "" && owner = @request.auth.id` for user-scoped list/view/update/delete rules. The create rule should require authentication and an owner value matching the authenticated user.

## AI Story Generator Setup

The AI Story Generator is implemented through `netlify/functions/generate-story.ts`. Browser code calls `/api/generate-story` via the Netlify redirect; it never calls OpenAI or Gemini directly and never includes API keys in frontend code.

Configure one provider in your Netlify site settings under **Site configuration → Environment variables**. After adding environment variables, redeploy the Netlify site. If no API key is configured, the app displays a setup message rather than failing silently.

## Netlify Deployment

The `netlify.toml` at the project root configures the Vite build, static routing, and API function proxying. To deploy on Netlify, connect this GitHub repository and use the following production settings.

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

The release UI includes accessible labels on the photo dropzone, map controls, story panel actions, and authentication forms. Empty states are intentionally explicit — photos without GPS data are handled gracefully and the map loads in a sensible default state before any photos are added — so the app remains understandable before optional services are configured.

## Project Structure

```
src/
  components/
    AuthGuard.tsx         # PocketBase sign-in guard wrapping protected views
    MapView.tsx           # Leaflet map canvas with photo pin rendering
    PhotoDropzone.tsx     # Drag-and-drop photo upload with EXIF extraction
    StoryPanel.tsx        # AI Story Generator UI and narrative display
  lib/
    exif.ts               # EXIF GPS and metadata extraction helpers (exifr)
    pocketbase.ts         # Optional PocketBase client wrapper
  types/
    index.ts              # Shared photo, memory, and location types
  App.tsx                 # Root layout and view orchestration
  main.tsx                # Entry point

netlify/
  functions/
    generate-story.ts     # Secure server-side AI story generation function

public/
  screenshots/            # README screenshots
```

## Changelog

### v0.1.0 — Beta Release

- Implemented drag-and-drop photo dropzone with automatic EXIF GPS extraction via `exifr`.
- Added interactive Leaflet map with photo pins positioned from real GPS coordinates.
- Added secure AI Story Generator through a Netlify Function with server-side AI provider integration.
- Added optional PocketBase authentication guard for user-scoped cloud persistence.
- Configured Netlify deployment with `/api/*` proxy redirects for secure function routing.

---

Part of the **MJW Personal App Platform**.