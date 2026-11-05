# My Journal — Version 3

An interactive personal travel archive built with React, Vite, and React state (`useState`). The three initial journals — Antwerp, Paris, and Cusco — use **the user's original travel photographs** from [travel-collage](https://github.com/Michelleieong/travel-collage), referenced from their public GitHub raw paths. The original travel site inspired the typewriter typography, fashion-editorial imagery, and freeform collage style.

## Start

```bash
npm install
npm run dev
```

## Features

- Full-width photo cover with movable-free, editable typography settings (font, weight, colors, overlay, background).
- Quiet white homepage without ornamental symbols or large masthead, asymmetric photographic index, search, filtering and sorting.
- Add, edit, and delete journals via the site editor; upload photos and choose editorial, grid, polaroid, or draggable freeform collage. In Edit mode choose **Freeform**, drag photos to reposition, and drag the small circular bottom-right handle to resize. Position and size changes save locally. Switching from the structured layout to Freeform initializes a three-column (two-column on smaller screens) editable arrangement.
- Add handwritten notes, resize, rotate, layer, caption, and frame images.
- React state updates the UI instantly, and IndexedDB saves edits to this browser; JSON import/export provides backups.

**Important:** IndexedDB is local to one browser. GitHub Pages is static and this version does not sync new entries across devices or publish newly created posts to other visitors. Publishing user-created posts to everyone will require authentication and cloud storage (for example, Supabase).

The original pictures are hotlinked from `raw.githubusercontent.com`, so an internet connection is required to display them.

## Publish

Set `base` in `vite.config.js` to the GitHub repository name and run `npm run build` and then publish `dist/` via GitHub Pages or the configured `npm run deploy` command. See comments in `vite.config.js`.

## AI tool disclosure

ChatGPT was used to help generate the React project scaffolding and components, layout CSS, state management, collage drag interactions, and this README. Example prompts: “Build an interactive archive with React useState and editable freeform photo collage,” “Make the hero image edge-to-edge and replace beige template cards with a white editorial homepage,” and “Reuse my Antwerp, Paris and Cusco photographs from my travel-collage repository.” Visual direction, travel images and original travel collage were user supplied.

## Complete original photo collection

All **136 JPG photographs** in the original public `travel-collage/images` directory are included (Antwerp 1–63, Paris 1–26, Cusco 1–47). Each city's `1.jpg` also serves as the cover. **Antwerp1.mp4**, a separate video asset, is not a photograph and is not yet embedded in the editor.

Default city pages use the responsive `Editorial` gallery mode, which displays the full collection without overlapping dozens of photos in one fixed-height canvas. Users can switch to Grid, Polaroid, or Freeform mode. Photo paths point to the original public repo and therefore require internet access.

Existing locally saved V2 journals are merged with missing original photographs on startup without overwriting user-edited image objects or notes. This merge adds images intentionally deleted from the original seeded city journals, so make an exported backup before upgrading if deletions should be preserved.

## V5 editor behavior

Every page now has one canvas; no Editorial / Freeform / Grid mode picker and no per-image left/right ordering arrows. Click **Edit** and directly drag an image or annotation to reposition it. Select it and drag the lower-right handle to resize it. Changes are automatically saved locally. Existing V4 journals are migrated to canvas coordinates without deleting images or notes; export a JSON backup before upgrading for extra safety.
