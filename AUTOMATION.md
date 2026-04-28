# Page Generation Automation

This project now includes a config-driven generator so you can scale from tens of pages to hundreds with minimal manual edits.

## Files

- `pages.config.json`: Source of truth for what pages to generate.
- `scripts/generate-pages.js`: Builds pages from config and updates:
  - generated pages (`*.html`)
  - pilot folders (`es/*.html`, `us/<state>/*.html`)
  - related-calculator links within generated pages
  - `generated-calculators.html` (legacy redirect to `index.html`)
  - `index.html` (primary generated navigation index)
  - main category hubs (`financial-calculators.html`, `conversion-calculators.html`, `career-calculators.html`, `health-calculators.html`) with generated link sections
  - `sitemap.xml`
  - **`search-index.json`** — data for the header **site search** (`site-search.js`). Regenerate whenever entries or titles change so search matches shipped pages.
- `robots.txt`: Includes explicit sitemap declaration for crawler discovery.
- `site-analytics.js`: Centralized GA4/event hook loader (safe if GA ID is blank).
- `scripts/validate-pages.js`: Validates metadata/link quality.
- `scripts/migrate-layout.js`: Wraps **root-level** legacy HTML in the shared top nav, footer, and search block. Pages already built by `generate-pages.js` (they set `data-page-path` on `<html>`) are skipped. Nested paths for search assets come from the generator, not this script.
- `package.json`: Includes npm scripts.

Pull requests: see **`CONTRIBUTING.md`**. GitHub Actions runs **`npm run validate:pages`** on `main` pushes and PRs.

## Commands

```bash
npm run generate:pages
npm run validate:pages
npm run report:indexability
npm run refresh:inventory
```

- `report:indexability`: emits family-level totals for configured entries (`indexable` vs `noindex`) and writes `reports/indexability-report.json`.
- `refresh:inventory`: rebuilds `pages-inventory.md` from current on-disk HTML files.

## Current Families

Configured in `pages.config.json`:

- `currencyConverter` (from/to pairs)
- `loanPaymentByAmount` (amount-based pages)
- `salaryToHourlyByAmount` (amount-based pages)
- `pilots.spanishPages` (`/es/` pilot pages)
- `pilots.statePages` (`/us/<state>/paycheck-calculator.html` pilot pages)

With current config, generation target is ~300 total pages.

## Quality and Indexing Rules

Configured in `pages.config.json` under `qualityRules`:

- Tail templates can be generated but marked `noindex, follow`.
- `sitemap.xml` automatically excludes pages marked `noindex`.
- Main generated category sections only include indexable generated pages.
- `generated-calculators.html` stays as legacy redirect and is removed from sitemap.

This keeps long-tail templates available for users while reducing index bloat/cannibalization risk.

## Analytics Baseline

- Set your GA4 measurement ID in `site-analytics.js` (`GA_ID`).
- Once set, two key events are emitted:
  - `calculator_button_click`
  - `calculator_result_rendered`
- Use `MONETIZATION_WEEKLY_CHECKLIST.md` for ongoing review cadence.

## How to Scale to 300+

1. Open `pages.config.json`.
2. Add more currency pairs and/or amount values.
3. Run:
   - `npm run generate:pages`
   - `npm run validate:pages`
4. Commit and push.

## Overwrite behavior

Generator is safe by default:

- It skips existing files unless `--overwrite` is used.
- It always refreshes generated index pages and sitemap.

Manual overwrite:

```bash
node scripts/generate-pages.js --overwrite
```
