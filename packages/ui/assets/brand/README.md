# Brand Assets

Canonical source-of-truth for Meshva branding files.

## Place official logo files here
- `packages/ui/assets/brand/meshva-logo.svg` (preferred for web)
- `packages/ui/assets/brand/meshva-logo.png` (fallback/raster)

## Usage convention
- Import from the shared UI package asset path in dashboard apps when rendering logo components.
- Keep this folder as the only editable brand source to avoid per-app drift.
- Run `pnpm brand:sync` after updating logo files to copy them into each dashboard app `public/brand` directory.
- Run `pnpm brand:check` to verify all dashboard app brand assets are byte-for-byte synced.
