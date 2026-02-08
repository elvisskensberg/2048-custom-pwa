# 2048 Custom PWA - Cube Swipe

A 3D swipe-based 2048 game built with React, TypeScript, and Vite. This project demonstrates a complete production-ready setup using AI-assisted development with Claude Code.

**Current Version:** v0.11

**🌐 Quick Access:**
- **Production:** https://thankful-sky-020f0c103.4.azurestaticapps.net
- **Local Dev:** http://localhost:5173 (run `npm run dev` in `cube-swipe/`)

> **Note:** This entire project infrastructure—from Azure resources to CI/CD pipelines—was set up through AI assistance, showcasing modern development workflows with AI collaboration.

## 🤖 AI-Assisted Development

This project was built from scratch to production deployment using Claude Code AI assistance.

### 1. Production Build Optimization

- ✅ **Vite Configuration**: Production-optimized build configuration
- ✅ **PWA**: Service worker caching with offline support, automatic update checks
- ✅ **Smart Updates**: Periodic checks (30 min) + focus-based detection for mobile
- ✅ **Code Splitting**: React vendor chunks, animation chunks, and main chunks
- ✅ **Terser Minification**: JavaScript minification with console removal
- ✅ **Asset Caching**: Optimized caching strategies
- ✅ **Result:** **195 KB total**, **57 KB gzipped** main bundle

### 2. Azure Cloud Infrastructure

- ✅ **Static Web App**: Azure Static Web Apps deployment
- ✅ **Application Insights**: Real-time monitoring and analytics
- ✅ **Resource Group**: Organized in West Europe region
- ✅ **Deployment Tokens**: Secure token management via GitHub Secrets
- ✅ **Result:** Live at https://thankful-sky-020f0c103.4.azurestaticapps.net

### 3. GitHub Actions CI/CD Pipeline

- ✅ **Multi-Stage Workflow**: Quality checks → build → deploy
- ✅ **Automated Testing**: Linting, type-checking, and unit tests
- ✅ **PR Previews**: Automated preview deployments with status comments
- ✅ **Security Scanning**: CodeQL and npm audit integration
- ✅ **Bundle Analysis**: Automated bundle size tracking
- ✅ **Dependabot**: Automated dependency updates
- ✅ **Result:** Fully automated deployment on every push to main

### 4. Testing Infrastructure

- ✅ **Vitest + React Testing Library**: Fast unit testing framework
- ✅ **Test Coverage**: Comprehensive coverage reporting
- ✅ **CI Integration**: Automated test execution in pipeline
- ✅ **Test Utilities**: Reusable setup helpers and mock factories
- ✅ **Result:** Production-ready testing infrastructure

### 5. Monitoring & Analytics

- ✅ **Application Insights Integration**: Azure Application Insights for telemetry
- ✅ **Auto-Tracking**: Automatic page view and error tracking
- ✅ **Custom Events**: trackEvent, trackMetric, and trackException APIs
- ✅ **PWA Install Tracking**: Monitors installation prompts and completions
- ✅ **Environment Modes**: Development console logs and production telemetry
- ✅ **Result:** Real-time insights into user behavior and application performance

### 6. Security & Best Practices

- ✅ **Smart .gitignore**: Prevents credential leaks in version control
- ✅ **SECURITY.md**: Documented vulnerability disclosure process
- ✅ **Secret Management**: Clear separation of public and sensitive data
- ✅ **GitHub Secrets**: Encrypted secret storage for CI/CD
- ✅ **Automated Scanning**: Weekly CodeQL and npm audit scans
- ✅ **Result:** Production-ready security implementation

### 7. Developer Experience

- ✅ **Non-Blocking Checks**: Warnings visible without blocking deployment
- ✅ **Vite HMR**: Hot module reload under 100ms
- ✅ **Comprehensive Scripts**: Full npm script suite for all workflows
- ✅ **Environment Management**: Clear .env configuration with documentation
- ✅ **Result:** Streamlined development workflow

### 8. E2E Testing with Playwright

- ✅ **Multi-Device Testing**: 5 device profiles (iPhone 14, Galaxy S24 Ultra, iPad 11th Gen, Galaxy Tab S10, Square-1080p)
- ✅ **Accurate Rendering**: Device-specific scale factors and viewport sizes
- ✅ **Organized Screenshots**: Device-specific folders for visual regression testing
- ✅ **Test Isolation**: Separate Playwright configuration from unit tests
- ✅ **Comprehensive Coverage**: 30 E2E tests generating 150+ screenshots
- ✅ **Result:** Complete end-to-end testing across all platforms

### 9. UI/UX & Component Architecture

- ✅ **Material Design 3**: Light and dark theme implementation
- ✅ **Material UI v7**: Complete component library integration
- ✅ **Clean Components**: Modular component architecture with single responsibility
- ✅ **Web Share API**: Native sharing with clipboard fallback
- ✅ **PWA Install**: Install prompt handling for iOS and Android
- ✅ **Google Apps Script**: Comment form with spreadsheet integration
- ✅ **Version Display**: Visible version number for transparency
- ✅ **Result:** Professional Material Design 3 implementation

### 10. Layout & CSS Architecture

- ✅ **Viewport Width Fix**: Uses `100%` instead of `100vw` to avoid scrollbar issues
- ✅ **Scroll Prevention**: Eliminated horizontal and vertical scrolling
- ✅ **Responsive Grid**: Viewport-constrained game board layout
- ✅ **Consistent Centering**: Flexbox-based centering across all views
- ✅ **Absolute Positioning**: Fixed positioning for UI controls
- ✅ **Result:** Pixel-perfect responsive layout across all devices

## 🛠️ Tech Stack

**Frontend:**
- React 19.2
- TypeScript 5.9
- Vite 7.3
- Material UI v7 (Material Design 3)
- React Spring (animations)
- @use-gesture/react (swipe detection)

**Build & Deploy:**
- Azure Static Web Apps
- GitHub Actions
- Vite PWA Plugin
- Terser (minification)

**Testing:**
- Vitest 4.0 (unit tests)
- React Testing Library
- Playwright (E2E tests, multi-device screenshots)

**Monitoring:**
- Azure Application Insights
- Application Insights React Plugin

**Code Quality:**
- ESLint
- TypeScript (strict mode)
- CodeQL (security scanning)

## 📁 Project Structure

```
2048-custom-pwa/
├── .github/
│   ├── workflows/          # CI/CD pipelines
│   │   ├── azure-static-web-apps.yml
│   │   ├── security.yml
│   │   └── pr-checks.yml
│   ├── dependabot.yml      # Dependency updates
│   ├── labeler.yml         # Auto PR labeling
│   ├── AI_INSTRUCTIONS.md  # AI workflow guide
│   └── WORKFLOWS.md        # Workflow documentation
├── cube-swipe/             # Main application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── AboutSection.tsx
│   │   │   ├── AppVersion.tsx
│   │   │   ├── BackButton.tsx
│   │   │   ├── FeedbackDialog.tsx
│   │   │   ├── GameBoard.tsx
│   │   │   ├── LeaveCommentForm.tsx
│   │   │   ├── ThemeToggle.tsx
│   │   │   └── UpdatePrompt.tsx
│   │   ├── utils/          # Utility functions
│   │   ├── analytics.ts    # Application Insights setup
│   │   ├── test/           # Test utilities
│   │   ├── App.tsx         # Root component & layout
│   │   └── ...
│   ├── e2e/
│   │   ├── app.spec.ts     # Playwright E2E tests
│   │   └── screenshots/    # Device screenshots
│   │       ├── iPhone 14/
│   │       ├── Galaxy S24 Ultra/
│   │       ├── iPad 11th Gen/
│   │       └── Galaxy Tab S10/
│   ├── public/
│   │   └── staticwebapp.config.json  # Azure SWA config
│   ├── playwright.config.ts # Playwright config (4 devices)
│   ├── vite.config.ts      # Vite + PWA config
│   ├── vitest.config.ts    # Test configuration
│   └── package.json
├── SECURITY.md             # Security guidelines
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn
- Azure account (for deployment)
- GitHub account (for CI/CD)

### Local Development

```bash
# Clone the repository
git clone https://github.com/elvisskensberg/2048-custom-pwa.git
cd 2048-custom-pwa/cube-swipe

# Install dependencies
npm install

# Start development server
npm run dev
# 🌐 Opens at http://localhost:5173

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Type check
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Create `.env.local` for local development:

```env
# Optional: Override Application Insights connection string
VITE_APPINSIGHTS_CONNECTION_STRING=your-connection-string
```

Production values are in `.env.production` (safe to commit - client-side only).

## 📦 Deployment

### Automatic Deployment (Recommended)

Every push to `main` automatically:
1. Runs quality checks (lint, type-check, tests)
2. Builds production bundle
3. Deploys to Azure Static Web Apps
4. Updates live site

### Manual Deployment

```bash
# Build the project
npm run build

# Deploy using Azure CLI
az staticwebapp deploy \
  --name 2048-custom-pwa \
  --resource-group rg-2048-custom-pwa \
  --source ./dist
```

## 📊 Monitoring

### Application Insights Dashboard

View real-time analytics:
1. Go to [Azure Portal](https://portal.azure.com)
2. Search for "2048-custom-pwa-insights"
3. View metrics:
   - Live Metrics (real-time)
   - Performance
   - Failures
   - Users
   - Custom Events

### Custom Event Tracking

```typescript
import { trackEvent, trackException, trackMetric } from './analytics';

// Track game events
trackEvent('GameStarted', { difficulty: 'hard' });
trackEvent('HighScore', { score: 2048 });

// Track errors
try {
  // risky operation
} catch (error) {
  trackException(error as Error, { context: 'GameBoard' });
}

// Track metrics
trackMetric('GameDuration', 120, { level: 5 });
```

### PWA Installation Tracking

The app automatically tracks PWA installation events:

**Tracked Events:**
- `PWA_InstallPromptShown` - When browser shows install prompt
- `PWA_AppInstalled` - When user completes installation
- `PWA_LaunchedAsApp` - When app runs in standalone mode

**View Install Metrics:**
```kusto
customEvents
| where name startswith "PWA_"
| summarize InstallCount = count() by name
| render barchart
```

These metrics help measure PWA adoption and user engagement.

### PWA Update Detection

The app features intelligent update detection for mobile devices:

**Update Checking:**
- **Periodic Checks**: Automatically checks for updates every 30 minutes while app is open
- **Focus-Based Detection**: Checks immediately when user returns to app (switches back from another app)
- **User Prompt**: Shows update notification when new version is available

**Benefits:**
- Mobile users see updates within 30 minutes maximum
- No need to manually clear cache or reinstall
- Seamless update experience across all devices

See [analytics.usage.md](cube-swipe/src/analytics.usage.md) for detailed usage.

## 🔒 Security

### Safe to Commit (Public Repo)
✅ Application Insights connection string (client-side only, write-only)
✅ Azure resource names and IDs
✅ Public URLs
✅ GitHub Actions workflows

### Protected Secrets (GitHub Secrets)
🔒 `AZURE_STATIC_WEB_APPS_API_TOKEN` - Deployment token

See [SECURITY.md](SECURITY.md) for complete security guidelines.

## 🔄 CI/CD Workflows

### Main Workflow: Azure Static Web Apps CI/CD
- Triggers on push to `main` and PRs
- Runs: lint → type-check → test → build → deploy
- Creates PR preview environments
- Deploys to production on merge

### Security Workflow
- Weekly automated security scans
- npm audit for vulnerabilities
- CodeQL code analysis
- Dependency updates via Dependabot

### PR Workflow
- Size checks (warns if >1000 lines)
- Auto-labeling based on changed files
- Bundle size analysis

See [.github/WORKFLOWS.md](.github/WORKFLOWS.md) for detailed workflow documentation.

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# UI mode
npm run test:ui
```

### Writing Tests

Tests use Vitest + React Testing Library:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

## 📈 Performance Metrics

**Production Build:**
- Total bundle size: 195.16 KB
- Main bundle (gzipped): 57.15 KB
- React vendor chunk: 3.90 KB (gzipped)
- First load time: < 1s (typical)
- PWA score: 100/100

**Optimizations Applied:**
- Code splitting by vendor
- Aggressive minification
- Tree shaking
- CSS minification
- Service worker caching
- Immutable asset headers

## 🤝 Contributing

### Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes and test**
   ```bash
   npm run lint
   npm run type-check
   npm test
   npm run build
   ```

3. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add awesome feature"
   git push origin feature/my-feature
   ```

4. **Open Pull Request**
   - GitHub Actions will automatically:
     - Run quality checks
     - Create preview deployment
     - Post preview URL in PR comments

5. **After PR approval**
   - Merge to `main`
   - Automatic deployment to production

## 📚 Resources

**Documentation:**
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Azure Static Web Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/)
- [Application Insights](https://learn.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Vitest](https://vitest.dev/)

**Project Files:**
- [Workflow Documentation](.github/WORKFLOWS.md)
- [Security Guidelines](SECURITY.md)
- [Analytics Usage Guide](cube-swipe/src/analytics.usage.md)

## 🎯 Future Enhancements

**Completed:**
- [x] Implement E2E tests with Playwright (multi-device)
- [x] Add social sharing features (Web Share API + clipboard fallback)
- [x] Material Design 3 theming with dark mode
- [x] Intelligent PWA update detection (periodic + focus-based)

**Planned:**
- [ ] Implement full 2048 game logic (tile merging, scoring, win/lose conditions)
- [ ] Add more comprehensive unit test coverage
- [ ] Add performance budgets to CI
- [ ] Create Storybook for component documentation
- [ ] Add internationalization (i18n)
- [ ] Implement advanced PWA features (push notifications)
- [ ] Create leaderboard with backend
- [ ] Add animations for tile movements and merges

## 📄 License

[Add your license here]

## 👤 Author

**Elvis Kensberg**
- GitHub: [@elvisskensberg](https://github.com/elvisskensberg)

---

## 🙏 Acknowledgments

This project was built with the assistance of **Claude Code** (Anthropic), demonstrating:
- Modern cloud infrastructure setup
- Production-ready CI/CD pipelines
- Security best practices
- Monitoring and analytics integration
- Automated testing frameworks
- Complete DevOps workflow

The entire journey from "empty repository" to "production deployment" was AI-assisted, showcasing the potential of AI-human collaboration in software development.

---

**Built with ❤️ using AI-assisted development**

*Last updated: 2026-02-08*
