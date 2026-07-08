# Handoff: Comix — Comic Book Reader App

## Overview

A desktop-style comic book reader app. Users point it at a local folder containing series subfolders with `.cbz` files, and get a clean reading experience: an Inbox of unread issues, a Library of series, single and double-page reading, and persistent read/progress tracking.

## About the Design Files

`Comic Reader.dc.html` is a **high-fidelity interactive prototype** built in a streaming HTML design environment. It is a design reference — not production code. Your task is to **recreate this design in your chosen stack** (Electron, Tauri, React + Node.js, etc.) using its established patterns and libraries, replicating the visual design and behavior described below.

Open the file in Chrome/Edge/Brave to interact with all views. Hit **Try Demo** on the welcome screen to load sample data immediately — no real comics needed.

## Fidelity

**High-fidelity.** The prototype uses final colors, typography, spacing, and interaction patterns. Recreate pixel-accurately: the exact hex values, font sizes, border radii, and behaviors documented here are the intended production design.

---

## Architecture / Data Model

```
Series  { name, color, issues[] }
Issue   { name, displayName, key, isCBR }

ReadStatus { [issueKey]: { read: bool, page: number, total: number } }
LastRead   { issueKey, seriesName, issueName, page, total }
```

### File System Layer

Users select a root folder. Each subfolder = one series. Files inside = issues.

```
Comics/                    ← root (user selects this)
  Saga/
    Saga #001.cbz
    Saga #002.cbz
  The Walking Dead/
    TWD #001.cbz
```

Scan with the **File System Access API** (`showDirectoryPicker`) for browser/Electron renderer, or `fs.readdir` for Electron/Tauri main process.

Issue key format: `"SeriesName:::filename.cbz"` — used as the stable identifier for read status storage.

### CBZ Support

CBZ = ZIP archive of image files (JPG/PNG/WebP). Decompress with:
- **Browser**: JSZip (`https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js`)
- **Electron/Node**: `adm-zip`, `jszip`, or native `zlib`

Sort images inside the ZIP numerically by filename for correct page order.

CBR (RAR format) is not supported in browser environments — show a friendly alert directing users to convert to CBZ.

### Persistence

Store `ReadStatus` and `LastRead` in:
- **Browser prototype**: `localStorage` (keys: `comicReader.status`, `comicReader.lastRead`, `comicReader.rootName`)
- **Production (Electron/Tauri)**: SQLite or a JSON file in the app's user data directory

---

## Screens / Views

### 1. Sidebar (persistent — hidden in Reader)

Always visible. Dark background `#17161A`, width `222px`, full height.

**Logo row** — `padding: 20px 14px 14px`, flex row, gap `9px`:
- Icon: `27×27px`, `border-radius: 7px`, background `#E06B3A`; contains a white book/document SVG (14px)
- Wordmark: `"Comix"`, `15px`, weight `600`, color `#F0EDE8`, letter-spacing `-0.4px`

**Primary nav** — `padding: 0 8px`, flex column, gap `1px`. Each nav item:
- `padding: 7px 10px`, `border-radius: 6px`, `font-size: 13px`, weight `500`
- Inactive: background `transparent`, color `#948F89`
- Active: background `rgba(255,255,255,0.09)`, color `#F0EDE8`
- Left: 14×14px SVG icon; label (`flex: 1`); optional badge (right)

**Inbox badge** (unread count): background `#E06B3A`, color `#fff`, `font-size: 10px`, weight `600`, `padding: 1px 7px`, `border-radius: 99px`

**Divider**: `1px solid rgba(255,255,255,0.07)`, `margin: 12px 14px 8px`

**Series list** (`flex: 1`, `overflow-y: auto`, `padding: 0 8px 8px`):
- Each row: `padding: 5px 8px 5px 14px`, `border-radius: 6px`, flex, gap `8px`
- Inactive: `background: transparent`, color `#948F89`
- Active (selected): `background: rgba(255,255,255,0.08)`, color `#F0EDE8`
- Left: `7×7px` circle in series accent color
- Right: unread count, `font-size: 10px`, color `#706D68`, weight `600` (hidden when 0)
- Clicking filters the Inbox to that series; clicking again deselects

**Open Folder button** — bottom, `padding: 10px 8px 16px`:
- `padding: 7px 10px`, `border-radius: 6px`, `background: rgba(255,255,255,0.05)`, color `#908D88`, `font-size: 13px`
- 📂 emoji prefix `font-size: 15px`
- Label: `"Open Folder"` (no library) or `"Change Folder"` (library loaded)

---

### 2. Welcome / Reopen Screen

Shown on first launch (no library) or after page reload (file handles lost — File System Access API does not persist across sessions).

**Layout**: full main area, flex center, `padding: 40px`

**Card** — `max-width: 380px`, `background: #FFF`, `border-radius: 10px`, `border: 1px solid #E0DDD8`, `padding: 32px`, flex column, `align-items: center`, `gap: 18px`, centered text:

- **Icon**: `52×52px`, `background: #E06B3A`, `border-radius: 13px`, white document SVG (28px)
- **Heading**: `"Open Your Comics Library"` or `"Reopen Your Library"` — `18px`, weight `600`, `#1A1917`, letter-spacing `-0.3px`
- **Subtext**: `13px`, `#8A8680`, line-height `1.6`
- **Primary button**: full width, `padding: 10px`, `background: #1A1917`, `color: #FFF`, `border-radius: 7px`, `14px`, weight `500`. Triggers `showDirectoryPicker`.
- **Demo button**: full width, `padding: 10px`, `background: transparent`, `border: 1px solid #E0DDD8`, color `#5A5850`, `border-radius: 7px`, `13px`, weight `500`
- **Feature list**: 3 rows, `font-size: 12px`, `#8A8680`, green `✓` prefix `#48B87A`

---

### 3. Inbox View (default after library loads)

**Header** — `padding: 13px 20px 11px`, flex row, `border-bottom: 1px solid #E0DDD8`, `background: #F4F3F0`:
- `"← All"` back link (visible when series filter active): `13px`, `#9A9790`, click clears filter
- Title: `"Inbox"` or series name when filtered — `16px`, weight `600`, `#1A1917`, letter-spacing `-0.3px`
- **Filter pills** (right-aligned): container `background: #E0DDD8`, `border-radius: 6px`, `padding: 2px`
  - Each pill: `padding: 4px 10px`, `border-radius: 4px`, `12px`, weight `500`
  - Active: `background: #1A1917`, color `#F0EDE8`
  - Inactive: `background: transparent`, color `#7A7872`
  - Options: `"Unread"` (default) / `"All"`

**Empty state** (filter = Unread, everything read):
- `height: 300px`, flex center column, gap `8px`
- ✓ icon `30px`, color `#C8C5C0`
- `"All caught up"` — `14px`, weight `500`, `#5A5850`
- `"No unread issues in your library"` — `13px`, `#A09D98`
- `"Show all issues →"` — `13px`, `#9A9790`, click switches filter to All

**Issue row** — `padding: 11px 20px`, `background: #FFF`, `border-bottom: 1px solid #EDEBE7`, flex row, gap `12px`. Opacity `0.52` when read.

Components left → right:
1. **Unread dot**: `6×6px` circle, `background: #E06B3A` (unread) or `transparent` (read). `align-self: flex-start`, `margin-top: 5px`
2. **Cover thumbnail**: `60×82px`, `border-radius: 4px`, `overflow: hidden`. Background: series accent color. If cover image available: CSS `background-image: url(...)`, `background-size: cover`, `background-position: center`. If no cover: show issue number (e.g. `#3`) in `20px` bold white text, centered.
3. **Content** (`flex: 1`, `min-width: 0`):
   - Title: `14px`, weight `500`, `#1A1917` (or `#9A9790` if read). Max 2 lines, `-webkit-line-clamp: 2`. Click → opens reader.
   - Meta: series name in series accent color, weight `500`, `12px`. If in-progress: `"· 45% read"` appended in `#8A8680`.
   - Progress bar (if in-progress): `height: 3px`, `background: #E0DDD8`, `border-radius: 2px`, `width: 120px`. Fill: `background: #E06B3A`.
4. **Actions** (flex column, gap `5px`, align right):
   - **Open button**: `border: 1px solid #E0DDD8`, `border-radius: 4px`, `background: #FFF`, `color: #3A3830`, `11px`, weight `500`
   - **Read toggle**: `border: none`, `border-radius: 4px`, `11px`, weight `500`. Unread: `background: #1A1917`, `color: #FFF`, label `"✓ Mark Read"`. Read: `background: #F0EDE8`, `color: #6A6158`, label `"↺ Unread"`.

---

### 4. Library View

**Header**: `"Library"` title + `"{n} series"` subtitle in `#9A9790`.

**Grid**: `padding: 16px 20px 20px`, CSS grid `repeat(auto-fill, minmax(168px, 1fr))`, gap `14px`.

**Series card** — `border: 1px solid #E5E2DC`, `border-radius: 8px`, `overflow: hidden`, `background: #FFF`, cursor pointer → navigates to Series view.

- **Cover area** (`height: 200px`): background = series accent color. If cover cached: CSS `background-image`, `background-size: cover`. No cover: series name centered, `18px` bold `#fff`, `text-shadow: 1px 1px 3px rgba(0,0,0,0.4)`, `word-break: break-word`.
- **Issue count badge** (bottom-right of cover): `background: rgba(0,0,0,0.45)`, `backdrop-filter: blur(4px)`, `color: #fff`, `11px`, weight `600`, `padding: 2px 8px`, `border-radius: 4px`, `position: absolute`, `bottom: 8px`, `right: 8px`
- **Info area** — `padding: 10px 12px 12px`:
  - Series name: `14px`, weight `600`, `#1A1917`, single-line truncate
  - Read label: `"{n} of {total} read"`, `12px`, `#8A8680`, `margin-bottom: 8px`
  - Progress bar: `height: 3px`, `background: #E0DDD8`, `border-radius: 2px`. Fill: `#E06B3A`.

---

### 5. Series View

**Header** — flex row, gap `12px`, `border-bottom: 1px solid #E0DDD8`:
- `"← Library"` nav link, `13px`, `#9A9790`
- Series name: `16px`, weight `600`, `#1A1917`, letter-spacing `-0.3px`, `flex: 1`
- `"{n} of {total} read"` — `12px`, `#9A9790`
- `"Mark all read"` button: `border: 1px solid #E0DDD8`, `border-radius: 6px`, `background: #FFF`, `color: #3A3830`, `12px`, weight `500`

**Issue list**: same row format as Inbox, without the series name meta line (it's implied).

---

### 6. Reader View

Full-screen dark overlay (`position: fixed; inset: 0`). Sidebar hidden. `background: #0d0c0a`.

**Top bar** — `height: 44px`, `background: #17161A`, `border-bottom: 1px solid #2a2520`, flex row, `padding: 0 16px`, gap `12px`:
- `"← Back"` button: transparent bg, `color: #948F89`, `border: 1px solid #2a2520`, `border-radius: 4px`, `12px`, weight `500`
- Series + issue name (flex:1, truncate): series in `#5A5880` weight `500`; issue in `#706D68`
- Page counter: `"{current}/{total}"` or `"{n}–{n+1}/{total}"` in double-page mode — `12px`, `#4E4B47`
- `"✓ Mark Read"` button (hidden once marked): `color: #48B87A`, `border: 1px solid #1a3a28`, transparent bg, `11px`
- Page mode toggle: `"1-page"` / `"2-page"`. Active (2-page): `background: #E06B3A`, `color: #fff`; inactive: transparent, `color: #948F89`. `border-radius: 4px`, `11px`
- Fullscreen button: `"⛶"`, transparent bg, `#4E4B47`, `border: 1px solid #2a2520`, `14px`

**Page area** (`flex: 1`, overflow hidden, flex center):
- **Left click zone**: `position: absolute; left: 0; top: 0; bottom: 0; width: 32%`. Cursor `w-resize` (disabled at first page). Click → previous page.
- **Right click zone**: same but right. Cursor `e-resize` (disabled at last page). Click → next page.
- **Page image(s)**: flex row, gap `4px`, `padding: 8px`, centered. `max-height: 100%`, `object-fit: contain`. In double-page mode: each image `max-width: 50%`. `box-shadow: 0 0 60px rgba(0,0,0,0.8)`.

**Progress bar** — `height: 3px`, `background: #2a2520`. Fill: `#E06B3A`, `transition: width 0.15s`.

---

## Interactions & Behavior

| Action | Result |
|---|---|
| Click right half of reader | Next page |
| Click left half of reader | Previous page |
| Arrow keys (← →) | Previous / next page |
| Spacebar | Next page |
| `d` key | Toggle single/double page mode |
| `f` key | Toggle fullscreen |
| `Escape` | Close reader, return to previous view |
| Reach last page | Auto-mark issue as read |
| Click `✓ Mark Read` | Marks current issue read immediately |
| Click `↺ Unread` on a card | Toggles read status back to unread |
| Click series in sidebar | Filters Inbox to that series |
| Click series again | Deselects filter |
| Click series card in Library | Opens Series view |

---

## State Management

```
library[]          — series with issues; populated on folder open; lost on reload (re-open required)
readStatus{}       — persisted to localStorage / DB; survives reload
lastRead           — persisted; drives "continue reading" state on home
selectedSeries     — null or series name; filters Inbox
inboxFilter        — 'unread' | 'all'
view               — 'welcome' | 'inbox' | 'library' | 'series' | 'reader'
pages[]            — blob URLs for current issue pages; freed on close
currentPage        — int, 0-indexed
doublePageMode     — bool
```

### Cover Caching

Covers are the first page of a CBZ. Cache as CSS `background-image` data URL or blob URL on the cover div. Only populated after an issue is opened (reading the full CBZ just for a thumbnail is too expensive for large libraries). Show colored placeholder with issue number until opened.

### Series Accent Colors

Assign deterministically from series name hash:

```js
const COLORS = ['#4A9BE8','#E8943A','#48B87A','#5A8FD4','#8B5CF6','#E05C5C','#06B6D4','#D97706','#84CC16','#F43F5E','#A855F7','#14B8A6'];
function seriesColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return COLORS[((h % COLORS.length) + COLORS.length) % COLORS.length];
}
```

---

## Design Tokens

```
Colors:
  --sidebar-bg:        #17161A
  --sidebar-text:      #948F89
  --sidebar-active:    #F0EDE8
  --app-bg:            #F4F3F0
  --surface:           #FFFFFF
  --border:            #E0DDD8
  --border-subtle:     #EDEBE7
  --text-primary:      #1A1917
  --text-secondary:    #5A5850
  --text-muted:        #8A8680
  --text-faint:        #9A9790
  --accent-orange:     #E06B3A   (unread dots, progress bars, badges, logo)
  --accent-green:      #48B87A   (success / mark-read states)
  --reader-bg:         #0d0c0a
  --reader-bar:        #17161A

Typography:
  Font: Inter (Google Fonts, weights 400/500/600)
  Fallback: system-ui, sans-serif

Spacing: 4px base unit (4, 6, 8, 10, 12, 14, 16, 20, 24, 32)

Border radius: 4px (small controls/badges), 6–7px (buttons/inputs), 8–10px (cards/avatars), 99px (pills)
```

---

## Implementation Notes

1. **Electron / Tauri** is the natural production target — gives persistent file handles, native file picker, no browser security restrictions, and SQLite for read state.
2. **CBZ loading**: Read the ZIP, extract images, sort numerically by filename. Pre-load the next issue while the user is reading the current one.
3. **Cover loading**: Lazy — load the first page of a CBZ only when the user opens that series or issue, then cache it.
4. **Double-page mode**: Show pages `[n, n+1]` side by side. Skip to `[n+2]` on next. Page 0 (cover) is typically shown solo.
5. **Read state persistence**: Save `readStatus` JSON on every page turn and on mark-read. `lastRead` saves the issue key and page so the user can resume from exactly where they left off.
6. **No Electron?** The prototype uses the browser File System Access API — fully functional in Chrome/Edge/Brave with `showDirectoryPicker({ mode: 'read' })`. Each session requires the user to reselect the folder (handles don't survive reload without `StorageManager.persist()`).

---

## Files in This Package

| File | Purpose |
|---|---|
| `Comic Reader.dc.html` | Full interactive prototype — open in Chrome/Edge/Brave |
| `README.md` | This document |
