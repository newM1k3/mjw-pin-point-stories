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

Memory Map reads GPS coordinates from photo EXIF data and places each photo as a pin on an interactive map. Rather than browsing a flat photo grid, you explore your memories geographically — seeing exactly where each moment happened and how your journeys connected.

| Feature | Description |
| :---- | :---- |
| **Photo Drop** | Drag and drop photos onto the dropzone; GPS coordinates are parsed automatically from EXIF metadata. |
| **Interactive Map** | React Leaflet canvas displays each photo as a positioned pin; click a pin to preview the photo. |
| **EXIF Extraction** | `exifr` reads latitude, longitude, timestamp, and camera metadata directly from image files — no manual location entry needed. |
| **AI Story Generator** | Sends your collected location and photo data to a secure Netlify Function, which returns a human-readable narrative of your journey. |
| **PocketBase Auth** | Optional sign-in guard protects saved memories and allows user-scoped cloud persistence. |

**Key interactions:**

- Drag and drop one or more photos onto the dropzone panel.
- GPS coordinates are extracted automatically and pins appear on the map.
- Click any map pin to view the associated photo and metadata.
- Use the Story Panel to request an AI-generated narrative of the mapped memories.
- Sign in with PocketBase to save and retrieve your memory maps across sessions.

## How to Use

Open the app and drag photos into the dropzone. Any photo with embedded GPS data will immediately appear as a pin on the map. Photos without GPS data are accepted but will not generate a pin. Once your memories are on the map, open the Story Panel and request a generated story that weaves your locations and moments into a personal narrative. Signing in with PocketBase allows memories to persist across devices and sessions; without sign-in, the session is local only.

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

The app works fully with **no environment variables**. Without PocketBase or AI provider variables configured, it runs as a local browser app with in-session photo mapping and EXIF extraction only. Cloud saves and AI story generation require the relevant variables described below.

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

All environment variables are optional unless you enable the related feature. The app remains usable in local-only mode with no configured variables.

| Variable | Required? | Scope | Enables | Description |
| :---- | :---- | :---- | :---- | :---- |
| `VITE_POCKETBASE_URL` | Optional | Frontend/public | PocketBase sign-in and cloud-saved memory maps | Public PocketBase/PocketHost URL used for user authentication and user-scoped record CRUD. Example: `https://your-instance.pockethost.io`. |
| `OPENAI_API_KEY` | Optional | Netlify Function/server only | AI Story Generator through OpenAI | Server-side OpenAI API key. Never expose this as a `VITE_` variable. |

## PocketBase Authentication and Cloud Saves

The app works fully with **no environment variables**. In local-only mode, photos are mapped for the current session and no records are persisted. The `AuthGuard` component wraps protected views and shows a sign-in prompt when `VITE_POCKETBASE_URL` is configured.

When `VITE_POCKETBASE_URL` is set, users can sign in and have their memory maps saved to a PocketBase collection. Normal user authentication runs through the public PocketBase URL; **no PocketBase superuser token is placed in frontend code**.

### Recommended `memory_maps` Collection

Create a PocketBase collection named `memory_maps`. The implementation expects authenticated users to own their own records through an `owner` relation field. Recommended fields are listed below.

| Field | Type | Notes |
| :---- | :---- | :---- |
| `title` | text | Display name for the memory map session. |
| `owner` | relation to `users` | Should point to the authenticated user. |
| `photos_json` | json | Stores photo metadata including GPS coordinates and EXIF data. |
| `story` | text | Optional AI-generated narrative saved alongside the map. |
| `visibility` | select | Recommended values: `private`, `shared`, `public`. |
| `created` | system field | Managed by PocketBase. |
| `updated` | system field | Managed by PocketBase. |

Recommended collection rules should allow authenticated users to create records for themselves and only read, update, or delete their own records. A practical rule pattern is `@request.auth.id != "" && owner = @request.auth.id` for user-scoped list/view/update/delete rules.

## AI Story Generator Setup

The AI Story Generator is implemented through `netlify/functions/generate-story.ts`. Browser code calls `/.netlify/functions/generate-story` via the `/api/*` redirect; it never calls OpenAI directly and never includes the API key in frontend code.

Configure `OPENAI_API_KEY` in your Netlify site settings under **Site configuration → Environment variables**. After adding environment variables, redeploy the Netlify site. If no API key is configured, the Story Panel displays a setup message rather than failing silently.

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

Deploy first with no environment variables to confirm the local-only map works, then add `VITE_POCKETBASE_URL` for cloud saves and `OPENAI_API_KEY` for AI story generation if those features are needed.

## Project Structure

```
src/
  components/
    AuthGuard.tsx         # PocketBase auth wrapper for protected views
    MapView.tsx           # Leaflet map canvas with photo pin rendering
    PhotoDropzone.tsx     # Drag-and-drop photo upload + EXIF extraction trigger
    StoryPanel.tsx        # AI story generation UI and result display
  lib/
    exif.ts               # EXIF GPS and metadata extraction helpers (exifr)
    pocketbase.ts         # Optional PocketBase client wrapper
  types/
    index.ts              # Shared photo, memory, and map types
  App.tsx                 # Root layout + session state
  main.tsx                # Entry point
netlify/
  functions/
    generate-story.ts     # Secure server-side AI story generation function
public/
  screenshots/            # README screenshots
```

## Changelog

### v0.1.0 — Beta Release

- Implemented drag-and-drop photo dropzone with automatic EXIF GPS extraction using `exifr`.
- Added interactive Leaflet map with photo pin placement from extracted coordinates.
- Added secure AI Story Generator through Netlify Functions with OpenAI integration.
- Added optional PocketBase authentication guard for user-scoped cloud persistence.
- Configured Netlify deployment with API redirect rules and SPA fallback routing.

---

Part of the **MJW Personal App Platform**.