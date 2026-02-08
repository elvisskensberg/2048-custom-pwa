# CLAUDE.md

## Project Overview

2048 Custom PWA ("Cube Swipe") — a professional 3D swipe-based 2048 game built with React 19, TypeScript 5.9, Vite 7, and Material UI v7. Features PWA update notifications, comprehensive analytics, and a 30-page professional showcase carousel. Deployed on Azure Static Web Apps.

**Current Version:** v0.08

**Key Features:**
- PWA with service worker caching and offline support
- User-prompted update notifications
- 30-page professional About section carousel
- Material Design 3 theming (light/dark)
- Comprehensive E2E testing across 5 device profiles
- Real-time analytics with Azure Application Insights

## Repository Layout

```
2048-custom-pwa/
├── cube-swipe/          # Main application (all npm commands run from here)
│   ├── src/
│   │   ├── components/  # React components (PascalCase files)
│   │   │   ├── AboutSection.tsx     # 30-page carousel showcase
│   │   │   ├── UpdatePrompt.tsx     # PWA update notifications
│   │   │   ├── AppVersion.tsx       # Version display (v0.08)
│   │   │   ├── GameBoard.tsx        # Main game component
│   │   │   ├── GameModeSelect.tsx   # Classic/Fibonacci mode selection
│   │   │   ├── MainMenu.tsx         # Home menu
│   │   │   ├── LeaveCommentForm.tsx # Comment submission
│   │   │   ├── BackButton.tsx       # Navigation back button
│   │   │   ├── ThemeToggle.tsx      # Light/dark theme switcher
│   │   │   └── FeedbackDialog.tsx   # User feedback dialog
│   │   ├── hooks/       # Custom hooks (useGameLogic, useInstallPrompt)
│   │   ├── utils/       # Utility functions
│   │   ├── test/        # Vitest setup and helpers
│   │   │   ├── setup.ts           # Test environment configuration
│   │   │   └── mocks/             # Test mocks (pwa-register.ts)
│   │   ├── __mocks__/   # Module mocks
│   │   ├── assets/      # Static assets
│   │   ├── App.tsx      # Root layout + view router + UpdatePrompt
│   │   ├── main.tsx     # Entry point
│   │   ├── analytics.ts # Application Insights tracking
│   │   └── vite-env.d.ts # Vite + PWA type declarations
│   ├── e2e/             # Playwright E2E tests + baseline screenshots
│   │   └── screenshots/
│   │       └── story-mode/
│   │           └── generate-pdf.cjs # PDF generation from screenshots
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

# E2E Testing
npm run test:e2e         # Playwright tests across 5 device profiles
npm run test:e2e:ui      # Playwright with UI mode

# Other
npm run test:coverage    # Coverage report
npm run preview          # Preview production build
```

**E2E Screenshots:**
- Located in `e2e/screenshots/[device]/` for each device profile
- Story-mode screenshots: `e2e/screenshots/story-mode/page01-page30.png`
- PDF generation: `node e2e/screenshots/story-mode/generate-pdf.cjs`

## Pre-Commit Checklist

**Run in order — all must pass before committing:**

### 1. Unit Tests ✅
```bash
npm test
```
- All existing tests must pass
- New features should have tests
- Bug fixes should include regression tests
- If tests fail: fix code or update tests, then re-run

### 2. Linting ✅
```bash
npm run lint
npm run lint:fix  # Auto-fix first
```
- Common issues: unused imports, `any` types, missing return types
- Use `unknown` instead of `any`
- Never disable rules without justification

### 3. Type Checking ✅
```bash
npm run type-check
```
- Fix type errors (avoid `@ts-ignore`)
- Add proper type annotations
- Use `unknown` instead of `any`

### 4. Production Build ✅
```bash
npm run build
```
- Must succeed for deployment (blocking in CI)
- Fix TypeScript or import issues if it fails
- Verify bundle size is reasonable

### 5. Code Review ✅

**React Component Patterns:**
- Single responsibility per component
- Extract hooks for reusable logic (`src/hooks/useXxx.ts`)
- State co-located with owning component
- No handler functions defined in parents that belong in children

**Hook Extraction Guidelines:**
- Extract when: shared by multiple components, complex enough to test independently
- Each hook has typed return interface
- Hooks import dependencies directly

### 6. E2E Tests ✅
```bash
npm run test:e2e
```
- Generates 150+ screenshots across 5 device profiles
- Review Galaxy S24 Ultra screenshots (highest DPI):
  - `e2e/screenshots/Galaxy S24 Ultra/app-*.png`

**Screenshot Review Checklist:**
- [ ] Content horizontally centered
- [ ] No content cutoff at edges
- [ ] No scrolling (content fits viewport)
- [ ] Version number visible
- [ ] Text readable in both themes
- [ ] Buttons properly sized and spaced

### 7. Update Documentation ✅

**Update README.md if:**
- New features added
- Commands/scripts changed
- Project structure changed
- Deployment process changed

### 8. Commit Message ✅

Use Conventional Commits format:
```
<type>(<scope>): <subject>

<body>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`

**Example:**
```
feat(analytics): add game event tracking

- Add trackEvent calls for game start/end
- Track high scores
- Include game duration metrics
```

## Code Conventions

- **Components**: Functional components only, PascalCase filenames, default exports
- **Hooks**: `use` prefix, named exports, typed return interfaces in `src/hooks/`
- **TypeScript**: Strict mode. No `any` — use `unknown` or specific types. Return type annotations on all functions
- **Styling**: MUI `sx` prop only — no separate CSS files for components. Use theme tokens (`text.primary`, `background.default`), not hardcoded colors
- **State**: `useState` at component level, `useCallback` for handlers, `useMemo` for expensive computations
- **Env vars**: `import.meta.env.VITE_*` — never `process.env`
- **Layout**: Use `100%` width/height — never `100vw` (causes scrollbar overflow on Windows)
- **Testing**: Describe/It blocks, Arrange-Act-Assert pattern, mocks in `src/test/setup.ts`
- **PWA Mocks**: Virtual modules mocked via vitest.config.ts aliases (`virtual:pwa-register/react`)
- **Content**: Professional tone, no humor, concise and factual
- **Commits**: Conventional Commits format (`feat(scope): description`)

## Architecture Notes

### View Routing
- **App.tsx** handles view routing via `useState` booleans (menu / modeSelect / game / about / comments)
- Views: `'menu' | 'modeSelect' | 'game' | 'about' | 'comments'`
- UpdatePrompt component mounted at root level for app-wide update notifications

### AboutSection - 30-Page Carousel
- 10 topics × 3 design variants = 30 unique pages
- **Design variants**: `gradient` (bold dramatic), `card` (professional floating), `minimal` (clean geometric)
- **Material Design 3**: 30 unique color palettes (10 per variant)
- **First page**: Shows "Elvis Skensberg AI Showcase" title + 2048 game preview
- **Navigation**: Left/right arrow buttons at screen edges, page counter (top-left)
- **Topics**: Production Build, Azure Cloud, CI/CD Pipeline, Testing, Analytics, Security, Developer Experience, E2E Testing, UI/UX, Layout & CSS

### PWA Update System
- **vite.config.ts**: `registerType: 'prompt'` (user-initiated updates)
- **UpdatePrompt.tsx**: Material UI Snackbar with "Update" and "Later" buttons
- **Hook**: `useRegisterSW` from `virtual:pwa-register/react`
- **Workflow**: New SW detected → Snackbar appears → User clicks "Update" → Page reloads with new version
- **Service Worker**: Workbox with `skipWaiting: true`, `clientsClaim: true`

### Game Logic
- **useGameLogic** hook - supports classic and fibonacci modes
- Grid state management, swipe detection, score calculation
- Game over detection based on available moves

### Swipe Detection
- `@use-gesture/react` for touch/mouse gestures
- Keyboard arrow support for desktop
- Minimum swipe distance threshold

### Analytics
- **Dev mode**: Logs to console
- **Prod mode**: Azure Application Insights telemetry
- **Events tracked**: Page views, errors, PWA installs, custom events
- **usePWAInstallTracking**: Tracks install prompts, completions, standalone launches

### PWA
- Service worker via `vite-plugin-pwa` with Workbox caching
- Manifest: `name: "Cube Swipe 2048"`, theme_color: `#ffffff`
- **Caching strategies**:
  - Google Fonts: CacheFirst, 1 year TTL
  - Assets: Precache on SW install
- Update notifications via UpdatePrompt component

### State Management
- **Zustand** for global state (theme, install prompt)
- **useState** for component-local state
- Theme persisted across sessions

## Components

### Layout & Navigation
- **App.tsx** - Root layout, view router, UpdatePrompt integration
- **BackButton.tsx** - Navigation back button (top-left)
- **MainMenu.tsx** - Home menu with game start, about, comments

### Game
- **GameBoard.tsx** - 4×4 grid, swipe detection, score display
- **GameModeSelect.tsx** - Classic vs Fibonacci mode selection

### Information & Settings
- **AboutSection.tsx** - 30-page professional carousel showcase
- **AppVersion.tsx** - Version display (v0.08, bottom-right)
- **ThemeToggle.tsx** - Light/dark theme switcher (top-right)
- **UpdatePrompt.tsx** - PWA update notification system

### User Feedback
- **LeaveCommentForm.tsx** - Comment submission via Google Apps Script
- **FeedbackDialog.tsx** - User feedback dialog

## PWA Configuration

### Vite PWA Plugin (vite.config.ts)
```typescript
VitePWA({
  registerType: 'prompt',  // User-initiated updates
  includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
  manifest: {
    name: 'Cube Swipe 2048',
    short_name: 'CubeSwipe',
    description: 'A 3D swipe-based 2048 game',
    theme_color: '#ffffff',
    icons: [/* 192x192, 512x512 */]
  },
  workbox: {
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-cache',
          expiration: { maxAgeSeconds: 365 * 24 * 60 * 60 } // 1 year
        }
      }
    ]
  }
})
```

### Update Workflow
1. User visits app → Service worker checks for updates
2. New version detected → `needRefresh` state becomes `true`
3. UpdatePrompt snackbar appears with "Update" and "Later" buttons
4. User clicks "Update" → `updateServiceWorker(true)` → Page reloads
5. User clicks "Later" → Snackbar dismisses, update deferred

## Testing Infrastructure

### Unit Tests (Vitest)
- **Environment**: JSDOM (simulates browser)
- **Framework**: React Testing Library
- **Coverage**: v8 provider, HTML/JSON/text reporters
- **Setup**: `src/test/setup.ts` with comprehensive mocks

### Test Mocks (`src/test/setup.ts`)
- **Analytics**: Application Insights methods mocked
- **PWA Tracking**: Install prompt and tracking mocked
- **Assets**: `.svg`, `.png`, images return mock paths
- **window.matchMedia**: Media query support mocked
- **Google Apps Script**: API mocked for comment form testing

### PWA Virtual Module Mocking
**Problem**: `virtual:pwa-register/react` doesn't exist in test environment

**Solution** (vitest.config.ts):
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    'virtual:pwa-register/react': path.resolve(__dirname, './src/test/mocks/pwa-register.ts')
  }
}
```

**Mock** (`src/test/mocks/pwa-register.ts`):
```typescript
import { vi } from 'vitest'

export const useRegisterSW = vi.fn(() => ({
  needRefresh: [false, vi.fn()],
  offlineReady: [false, vi.fn()],
  updateServiceWorker: vi.fn(),
}))
```

### E2E Tests (Playwright)
- **5 device profiles**: iPhone 14, Galaxy S24 Ultra, iPad 11th Gen, Galaxy Tab S10, Square-1080p
- **30+ tests** generating **150+ screenshots** for visual regression
- **Coverage**: All screens, both themes, all device sizes
- **Pixel tolerance**: 3% diff threshold
- **Screenshots**: Organized by device in `e2e/screenshots/[device]/`

### Running Tests
```bash
npm test                 # Unit tests
npm run test:coverage    # With coverage report
npm run test:e2e         # E2E across all devices
npm run test:e2e:ui      # E2E with Playwright UI
```

## Tech Stack

**Core:**
- React 19.2.0
- TypeScript 5.9.3
- Vite 7.2.4
- Material UI 7.3.7
- Emotion 11.14.0+ (styling)

**State & Routing:**
- Zustand 5.0.11
- useState (view routing)

**Animations & Gestures:**
- React Spring 10.0.3
- @use-gesture/react 10.3.1

**Analytics:**
- Application Insights web 3.3.11
- Application Insights React 19.3.8

**PWA:**
- vite-plugin-pwa 1.2.0
- Workbox (via plugin)

**Testing:**
- Vitest 4.0.18
- React Testing Library
- Playwright 1.58.1

**Build & Dev Tools:**
- ESLint 9.39.1
- TypeScript ESLint 8.46.4
- Terser (minification)

**Other:**
- PDFKit 0.17.2 (screenshot PDF generation)

## CI/CD

### Main Workflow (azure-static-web-apps.yml)
1. **Quality Checks**: Lint + type-check + test (non-blocking, but shown)
2. **Build**: Production build (blocking — must pass)
3. **Deploy**: Azure Static Web Apps deployment
4. **PR Previews**: Each PR gets preview URL with auto-comment

### Security Workflow (security.yml)
- Weekly CodeQL scans
- Weekly npm audit
- Automated vulnerability detection

### PR Checks (pr-checks.yml)
- PR size warnings (large PRs flagged)
- Auto-labeling based on files changed
- Bundle size analysis

### Dependabot
- Weekly dependency updates
- Automated PRs for security patches
- Version bump notifications

## Key Configuration Files

| File | Purpose |
|---|---|
| `cube-swipe/vite.config.ts` | Build config, PWA plugin (prompt mode), code splitting, Terser minification |
| `cube-swipe/vitest.config.ts` | Test config, JSDOM env, PWA mock alias, path aliases (`@` → `./src`) |
| `cube-swipe/playwright.config.ts` | 5 device profiles, 3% pixel diff tolerance, screenshot organization |
| `cube-swipe/tsconfig.app.json` | App TS config (strict, ES2022, noUnusedLocals, noUnusedParameters) |
| `cube-swipe/eslint.config.js` | ESLint 9 flat config with TypeScript rules |
| `cube-swipe/public/staticwebapp.config.json` | Azure SWA routing + cache headers |
| `cube-swipe/src/vite-env.d.ts` | Vite client types + vite-plugin-pwa types |
| `cube-swipe/src/test/mocks/pwa-register.ts` | PWA register virtual module mock |

## Professional Content Guidelines

### Tone & Style
- **Professional**: Corporate-ready, production-focused language
- **No humor**: Removed casual language and jokes from all user-facing content
- **Concise**: Clear, factual descriptions without embellishment
- **Technical accuracy**: Precise terminology and version numbers

### Material Design 3
- Follow MD3 visual language and patterns
- Use theme tokens consistently
- Maintain design system coherence across 30 About pages

### Content Standards
- AboutSection: Professional feature showcase
- README: Technical documentation tone
- Code comments: Clear, technical explanations
- Commit messages: Conventional Commits format

## Build Optimization

### Bundle Analysis
- **Total**: 195 KB (uncompressed)
- **Main bundle**: 57 KB (gzipped)
- **Code splitting**: react-vendor, animation-vendor, main
- **Minification**: Terser with console/debugger removal
- **CSS minification**: Enabled

### Performance Targets
- Vite HMR: <100ms
- First load: <2s on 3G
- PWA offline support
- Service worker precaching

## Development Workflow

### Starting Development
```bash
cd cube-swipe
npm run dev              # http://localhost:5173
```

### Before Committing
1. Run all quality checks (see Pre-Commit Checklist)
2. Review E2E screenshots if UI changed
3. Test PWA update flow if SW changed
4. Verify build output size

### Creating PRs
- Follow Conventional Commits format
- Include screenshots for UI changes
- Run full E2E suite
- Check bundle size impact

### Deployment
- Push to `main` → Auto-deploy to Azure
- PR → Preview deployment with comment
- All quality checks run in CI

## Code Quality Standards

### Testing
- Write tests for all new features
- Use descriptive test names (what it does, not how)
- Follow Arrange-Act-Assert pattern
- Test edge cases and error conditions
- Mock external dependencies in `src/test/setup.ts`

### Code Style
- TypeScript strict mode always
- Prefer `const` over `let`
- Arrow functions for callbacks
- Destructure props and objects
- Meaningful variable names
- Small, focused functions

### Type Safety
- Never use `any` (use `unknown` or specific types)
- Define interfaces for complex objects
- Use union types for multiple possibilities
- Leverage TypeScript's type inference
- Add return type annotations to all functions

### Error Handling
- Always handle errors in async functions
- Use try-catch appropriately
- Log errors to Application Insights in production
- Provide meaningful error messages
- Don't swallow errors silently

## AI-Specific Guidelines

### When to Skip Auto-Fixing

**Do NOT auto-fix in these cases:**
1. User explicitly said not to
2. Changes would be too extensive (>100 files)
3. Fixing requires architectural changes
4. Tests are intentionally failing (TDD red phase)

In these cases, inform the user and ask for guidance.

### When to Update Tests

**Update tests when:**
- API interfaces change
- Component props change
- Function signatures change
- Behavior intentionally changes

**Create new tests when:**
- Adding new features
- Fixing bugs (regression tests)
- Covering previously untested code paths

### Reporting Issues

If unable to fix automatically:
1. Clearly describe what's failing
2. Show error messages
3. Suggest potential fixes
4. Ask for user guidance

## Workflow Example

```bash
# After making code changes in cube-swipe/:

# 1. Run tests
npm test

# 2. Fix any failures, then verify
npm test

# 3. Run linting
npm run lint
npm run lint:fix    # Auto-fix what's possible

# 4. Type check
npm run type-check

# 5. Verify build
npm run build

# 6. Run E2E tests (if UI changed)
npm run test:e2e

# 7. Review screenshots
# Check e2e/screenshots/Galaxy S24 Ultra/*.png

# 8. Update documentation if needed
# Edit README.md if user-facing changes

# 9. Commit with conventional format
cd ..
git add .
git commit -m "feat: add new feature

- Implemented X
- Added tests for Y
- Updated README

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
git push origin main
```

## Troubleshooting

### Common Issues

**Tests won't pass:**
1. Check if environment is set up: `npm install`
2. Look for missing dependencies
3. Check for async timing issues
4. Verify mocks properly configured in `src/test/setup.ts`
5. Read test error output carefully

**Linting won't fix:**
1. Some rules can't be auto-fixed
2. Read specific rule documentation
3. Fix manually based on error description
4. Never disable rules without good reason

**Build fails:**
1. Usually TypeScript errors
2. Check import paths
3. Verify all dependencies installed
4. Look for circular dependencies
5. Check environment variable usage (`import.meta.env.VITE_*`)

**PWA not updating:**
- Check browser DevTools → Application → Service Workers
- Verify `registerType: 'prompt'` in vite.config.ts
- Clear service workers and reload

**Tests failing with virtual module error:**
- Ensure vitest.config.ts has PWA mock alias
- Check `src/test/mocks/pwa-register.ts` exists

**100vw causing horizontal scroll:**
- Use `100%` instead of `100vw` (Windows scrollbar issue)

**E2E screenshot mismatches:**
- Review visual diff in Playwright report
- Update baselines if intentional: `npx playwright test --update-snapshots`

**Build size increased:**
- Check bundle analysis output
- Review new dependencies
- Consider code splitting opportunities

## CI/CD Expectations

The GitHub Actions pipeline runs:
1. **Linting** (non-blocking, shows warnings)
2. **Type checking** (non-blocking, shows warnings)
3. **Tests** (non-blocking currently)
4. **Build** (BLOCKING - must pass for deployment)

While lint and type-check are non-blocking in CI, always fix these issues locally before committing to maintain code quality.

## Golden Rules

1. **Never commit code that fails tests, linting, or builds** (unless explicitly instructed)
2. **Single source of truth**: CLAUDE.md contains all project documentation and workflow guidelines
3. **Professional tone**: No humor in user-facing content
4. **Type safety**: Never use `any` (use `unknown` or specific types)
5. **Test coverage**: All new features and bug fixes have tests

**Priority Order:**
1. Tests passing (functionality works)
2. Build succeeds (code compiles)
3. E2E tests pass (UI works across devices)
4. Linting clean (code quality)
5. Type-check clean (type safety)
6. Documentation updated (if user-facing changes)
