# Sulphamax Smart Lucky Draw

A browser-based partner rewards event built with Next.js 14, React 18, TypeScript, Tailwind CSS, and Radix UI. The interface includes participant import, search and filtered export, top dealers, a prize gallery, prize and audio configuration, sequential draws, and downloadable results.

## Development

```bash
npm ci
npm run dev
```

Use the existing checkout in cloud tasks. No backend, database, or credentials are required. Node 24 and npm 11 were used for validation. Google Fonts requires access to `fonts.googleapis.com` and `fonts.gstatic.com` during a production build. Development can use fallback fonts. External prize photos and optional custom audio depend on their hosts; prize images fall back to a local placeholder.

```bash
npm run build
npm run typecheck
npm run start
```

Stop the development server before building: both use `.next`. Build type checking is enabled. The inherited `lint` script still needs an ESLint configuration; it is not part of the verification commands above.

## Run an event

1. Open **Data Upload**, download the spreadsheet template, and import Excel or CSV. Every row needs `Name` and `Coupon Number`. Optional fields are `Customer Id`, `District`, `Count of Total Coupons`, and `Row Number`.
2. Check **Data View** and **Top Dealers**, then configure prizes, order, themes, and audio under **Manage Prizes**.
3. Open **Live draw**. Each draw runs an 8.2-second award-show sequence: a sealed gold envelope, rotating participant names, a three-beat countdown, the envelope opening, and a full-stage winner reveal. The parent records the selected winner only after the presentation finishes. Move to the next category when all its winners have been revealed.
4. Open **Results** to export Excel, a detailed Excel report, or CSV. Reset requires confirmation.

Participant and winner data live in memory for the current browser session. Export before refreshing or closing the page. Importing another file resets results and requires confirmation when winners exist. Only the selected background theme and custom color persist in local storage.

### Preserved draw rules

- A random eligible coupon is selected before the animation begins.
- Drawn coupon numbers are excluded from later draws.
- A participant cannot win again: both customer ID and trimmed participant name are checked.
- Refrigerator (`washing-machine`) and Honda Unicorn (`honda-unicorn`) categories require `Count of Total Coupons >= 3`.
- Default prize names, quantities, order, and category IDs come from `main`.

Audio is optional. A bundled drawing track and a local synthesized reveal fanfare work without remote audio files. Custom music, enable switches, and master volume are configured in Manage Prizes. The stage has a separate mute toggle. Reduced-motion preferences replace the envelope and countdown with a still selection state; the selection rules and reveal timing remain the same. Full-screen mode removes navigation and the header for projection. The live view features burgundy curtains, moving spotlights, gold details, and a large winner name; management sections remain accessible outside full screen.

## Browser regression tests

```bash
npm ci
npx playwright install chromium
npm run build
npm run test:e2e
```

The tests start a production server on port 3100 and run Chromium desktop and mobile profiles. When `/usr/bin/chromium` is available it is used automatically; otherwise Playwright uses its installed browser. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to use another Chromium installation. `PLAYWRIGHT_BASE_URL` can target an already-running server.

Coverage includes all seven sections and empty states, template download, invalid and empty files, Excel/CSV import, search, pagination, filtered Excel export, leaderboard data, prize create/edit/delete/reorder, theme persistence, all five draw categories, envelope countdown and reveal, customer/coupon exclusions, high-engagement eligibility, category/event completion, all result exports (including quoted names), reset confirmation, full screen, reduced motion, exhausted ticket pools, mobile overflow, and uncaught browser errors. Test result files and traces are ignored by Git.

The draw regression uses deterministic random selection and a one-winner configuration for each category. Animations run on their real timeline; this validates selection and progression without waiting for the entire default 31-prize event. Tests isolate optional remote assets and do not validate their third-party availability. Browser audio controls are covered; audible quality remains a manual check.

## Code review and design

`app/page.tsx` owns participant data, eligibility, draw selection, progression, and tab composition. `components/sequential-draw-interface.tsx` owns stage presentation and audio. `lib/draw-timing.ts` shares the animation timeline between them. Prize management, winner lists, and export components retain their existing responsibilities. Shared UI primitives are in `components/ui`; the shared design system is `app/globals.css`, with the award-show presentation in `app/gala.css`. The older standalone draw and prize-configuration components and `styles/globals.css` are not imported by the active page and remain available unchanged.

The redesign replaces hidden mouse-only navigation and fixed stage columns with visible, keyboard-accessible tabs and responsive layouts. The live draw uses a burgundy theatre, gold envelope, sweeping spotlights, countdown, confetti, and large winner typography. The host’s overview stays in the management sections so the stage takes priority during the show. Upload feedback, action states, sound controls, reset confirmation, and prevention of overlapping draws improve the host’s workflow.

## Validation and changed files

The redesign was checked with a production build, TypeScript, and 14 Playwright cases across desktop and mobile Chromium. Third-party media availability and audible sound quality are not asserted by the automated suite.

| Area                             | Files                                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Event shell and visual system    | `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `app/gala.css`, `components/ui/button.tsx`                          |
| Draw, audio, and shared timeline | `components/sequential-draw-interface.tsx`, `lib/draw-timing.ts`                                                         |
| Prize administration and results | `components/prize-management.tsx`, `components/winners-list.tsx`, `components/export-results.tsx`                        |
| Local prize illustration         | `public/prize-placeholder.svg`                                                                                           |
| Build and browser checks         | `next.config.mjs`, `playwright.config.ts`, `tests/lucky-draw.spec.ts`, `package.json`, `package-lock.json`, `.gitignore` |
| Documentation                    | `README.md`                                                                                                              |
