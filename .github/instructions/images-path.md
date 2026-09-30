---
applyTo: "src/**/*.{ts,html,webp,png,jpg,jpeg,svg}"
---

# Image Management Instruction

Use this instruction when the task includes adding, replacing, renaming, or consuming image assets in the application.

## PR Review Policy (Strict)

- Any new hardcoded image path in source code is a PR blocker.
- Any modified file that adds direct literals like `assets/...`, `/assets/...`, or `src/assets/...` is a PR blocker unless explicitly approved as an exception.
- Review outcome must be `Request changes` until hardcoded paths are replaced with `ImagesPath` keys.
- This rule applies to `.ts` and `.html` files under `src/`.

## Source of Truth

- Centralize all image routes in `src/app/shared/const/images-path.ts`.
- Do not hardcode asset paths directly in components, services, or templates when an `ImagesPath` entry can be used.

## Asset Rules

- Preferred format for photos/illustrations: `.webp`.
- Keep `.svg` for vector icons, logos, and scalable graphics.
- Keep existing format only when there is a functional reason (transparent vector quality, animation, platform requirement).
- Place files under `src/assets/images/<feature>/` when possible.

## Naming Convention

- Use lowercase kebab-case for file names.
- Use domain grouping inside `ImagesPath` (example: `onboarding`, `map`, `confirmations`).
- Use descriptive keys in camelCase.

## Update Workflow

1. Add or replace the image file in `src/assets/`.
2. Register or update the key in `src/app/shared/const/images-path.ts`.
3. Replace direct string paths in code with `ImagesPath` keys when possible.
4. If source files are PNG/JPG/JPEG, convert to WebP using:
   - `npm run images:webp:dry`
   - `npm run images:webp`
5. Verify old references are removed and no broken paths remain.

## Consumption Pattern

- In TypeScript: import and expose `ImagesPath` for template usage.
- In templates: bind image paths from the exposed constant (avoid inline literals).
- Reuse existing keys before creating a new one.

## Validation Checklist

- New image is in the correct folder.
- Path exists in `ImagesPath` and is spelled correctly.
- No stale path strings remain in related files.
- Image format follows optimization rules.
- No unrelated refactors are included in the same change.

## Hardcoded Path Detection For PR Review

- Run a targeted search before approving:
  - `rg -n "['\"](?:/)?(?:src/)?assets/[^'\"]+\.(?:png|jpe?g|webp|svg|gif)" src`
- For each match, confirm one of the following:
  - It is replaced by `ImagesPath.<domain>.<key>`.
  - It is a documented exception (see next section).
- If any non-exception match remains, block the PR.

## Allowed Exceptions (Must Be Explicit)

- Third-party configuration files that require literal URLs/paths.
- Static framework files where `ImagesPath` cannot be imported.
- Test fixtures intentionally validating raw path behavior.

When an exception is used:

- Add a short comment explaining why `ImagesPath` cannot be used.
- Keep the exception scoped to the minimum number of lines.
- Include the exception in the PR description.

## Avoid

- Duplicating the same physical image with different names without reason.
- Mixing temporary paths and centralized constants.
- Keeping unused assets after replacement.
