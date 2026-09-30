---
applyTo: "src/**/*.{ts,js,html,png,jpg,jpeg}"
---

# Images To WebP Instruction

Use this instruction when the task mentions converting images to WebP, reducing image weight, replacing PNG/JPG/JPEG references, or optimizing static assets.

## Objective

- Convert `.png`, `.jpg`, and `.jpeg` files to `.webp`.
- Remove original files only after successful conversion.
- Replace all references in source code safely.

## Required Workflow

1. Validate preview first:
   - `npm run images:webp:dry`
2. Apply conversion:
   - `npm run images:webp`
3. Verify no stale references remain in `src/`:
   - Search for old extensions (`.png`, `.jpg`, `.jpeg`) and confirm they are either:
     - intentionally kept, or
     - already converted/replaced.
4. Report result summary:
   - images converted count
   - files with updated references count
   - any files intentionally skipped

## Rules

- Use `scripts/convert-images-to-webp.js` as the default mechanism.
- Do not manually mass-edit references if the script can handle it.
- Do not convert `svg`, `gif`, or platform-specific assets that must keep original format.
- If `cwebp` is missing, stop and request/install WebP tools before retrying.
- Keep changes scoped to requested folders when the user specifies a target path.

## Optional Script Flags

- `--src <folder>`: convert a specific folder.
- `--quality <0-100>`: set output quality (default 80).
- `--no-replace-references`: convert files only, skip code replacement.
- `--dry-run`: preview only.

## Expected Command Examples

- `node ./scripts/convert-images-to-webp.js --src src/assets/images/onboarding --quality 85`
- `node ./scripts/convert-images-to-webp.js --src src/assets/images/icons --dry-run`

## Safety Checks

- Do not delete originals when conversion fails.
- Ensure replacement preserves relative paths under `src/`.
- Avoid unrelated refactors in the same change.
