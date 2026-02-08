# CLAUDE.md

## Project Overview

2048 Custom PWA ("Cube Swipe") — a 3D swipe-based 2048 game built with React 19, TypeScript 5.9, Vite 7, and Material UI v7. Deployed as a PWA on Azure Static Web Apps.

## Repository Layout

```
2048-custom-pwa/
├── cube-swipe/          # Main application (all npm commands run from here)
│   ├── src/
│   │   ├── components/  # React components (PascalCase files)
│   │   ├── hooks/       # Custom hooks (useGameLogic, useInstallPrompt)
│   │   ├── utils/       # Utility functions
│   │   ├── test/        # Vitest setup and helpers
│   │   ├── __mocks__/   # Module mocks
│   │   ├── assets/      # Static assets
│   │   ├── App.tsx      # Root layout + view router
│   │   ├── main.tsx     # Entry point
│   │   └── analytics.ts # Application Insights tracking
│   ├── e2e/             # Playwright E2E tests + baseline screenshots
│   └── public/          # Static files, PWA manifest, Azure SWA config
├── .github/
│   ├── AI_INSTRUCTIONS.md  # Post-task checklist (tests, lint, build, E2E)
│   ├── WORKFLOWS.md        # CI/CD workflow documentation
│   └── workflows/          # GitHub Actions (deploy, security, PR checks)
└── SECURITY.md             # Secret management guidelines
```

## Common Commands

All commands must be run from `cube-swipe/`:

```bash
cd cube-swipe

# Development
npm run dev              # Start dev server (port 5173)

# Quality checks (run all before committing)
npm test                 # Unit tests (Vitest)
npm run lint             # ESLint
npm run lint:fix         # ESLint auto-fix
npm run type-check       # TypeScript type checking

# Build
npm run build            # tsc -b && vite build (must pass for deployment)

# E2E
npm run test:e2e         # Playwright tests across 5 device profiles

# Other
npm run test:coverage    # Coverage report
npm run preview          # Preview production build
```

## Pre-Commit Checklist

Run in order — all must pass before committing:

1. `npm test`
2. `npm run lint` (use `lint:fix` first)
3. `npm run type-check`
4. `npm run build`
5. `npm run test:e2e` (if UI changed)

See `.github/AI_INSTRUCTIONS.md` for the full post-task checklist including screenshot review.

## Code Conventions

- **Components**: Functional components only, PascalCase filenames, default exports
- **Hooks**: `use` prefix, named exports, typed return interfaces in `src/hooks/`
- **TypeScript**: Strict mode. No `any` — use `unknown` or specific types. Return type annotations on all functions
- **Styling**: MUI `sx` prop only — no separate CSS files for components. Use theme tokens (`text.primary`, `background.default`), not hardcoded colors
- **State**: `useState` at component level, `useCallback` for handlers, `useMemo` for expensive computations
- **Env vars**: `import.meta.env.VITE_*` — never `process.env`
- **Layout**: Use `100%` width/height — never `100vw` (causes scrollbar overflow)
- **Testing**: Describe/It blocks, Arrange-Act-Assert pattern, mocks in `src/test/setup.ts`
- **Commits**: Conventional Commits format (`feat(scope): description`)

## Architecture Notes

- **App.tsx** handles view routing via `useState` booleans (menu / modeSelect / game / about / comments)
- **Game logic** lives in `useGameLogic` hook — supports classic and fibonacci modes
- **Swipe detection** via `@use-gesture/react`, keyboard arrows also supported
- **Analytics**: Dev mode logs to console, prod sends to Azure Application Insights
- **PWA**: Service worker via `vite-plugin-pwa` with Workbox caching
- **State management**: Zustand for global state, `useState` for component-local state

## CI/CD

- **Main workflow**: Lint + type-check + test + build → deploy to Azure SWA (build is blocking)
- **Security**: Weekly CodeQL + npm audit
- **PR checks**: Bundle size analysis, PR size warnings, auto-labeling
- **Dependabot**: Weekly dependency updates

## Key Configuration Files

| File | Purpose |
|---|---|
| `cube-swipe/vite.config.ts` | Build config, PWA plugin, code splitting |
| `cube-swipe/vitest.config.ts` | Test config, JSDOM env, path aliases (`@` → `./src`) |
| `cube-swipe/playwright.config.ts` | 5 device profiles, 3% pixel diff tolerance |
| `cube-swipe/tsconfig.app.json` | App TS config (strict, ES2022, noUnusedLocals) |
| `cube-swipe/eslint.config.js` | ESLint 9 flat config |
| `cube-swipe/public/staticwebapp.config.json` | Azure SWA routing + cache headers |
