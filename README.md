# 2048 Custom PWA - Cube Swipe

A 3D swipe-based 2048 game built with React, TypeScript, and Vite. This project demonstrates a complete production-ready setup using AI-assisted development with Claude Code.

**🌐 Quick Access:**
- **Production:** https://thankful-sky-020f0c103.4.azurestaticapps.net
- **Local Dev:** http://localhost:5173 (run `npm run dev` in `cube-swipe/`)

> **Note:** This entire project infrastructure—from Azure resources to CI/CD pipelines—was set up through AI assistance, showcasing modern development workflows with AI collaboration.

## 🤖 AI-Assisted Setup Journey

This project was built from scratch to production deployment using Claude Code AI assistance. Here's what was accomplished:

### 1. Production Build Optimization
- ✅ Configured Vite with production optimizations
- ✅ Implemented PWA with service worker and offline support
- ✅ Set up code splitting (React vendor, animation vendor chunks)
- ✅ Configured Terser minification with console.log removal
- ✅ Optimized asset caching strategies
- ✅ **Result:** 195 KB total bundle, 57 KB gzipped main bundle

### 2. Azure Cloud Infrastructure
- ✅ Created Azure Static Web App (`2048-custom-pwa`)
- ✅ Set up Application Insights for monitoring
- ✅ Configured resource group in West Europe
- ✅ Established deployment token management
- ✅ **Result:** Live at https://thankful-sky-020f0c103.4.azurestaticapps.net

### 3. GitHub Actions CI/CD Pipeline
- ✅ Multi-stage workflow (quality checks → deployment)
- ✅ Automated linting, type-checking, and testing
- ✅ PR preview environments with auto-comments
- ✅ Security scanning (CodeQL, npm audit)
- ✅ Bundle size analysis
- ✅ Dependabot integration for dependency updates
- ✅ **Result:** Fully automated deployment on every push

### 4. Testing Infrastructure
- ✅ Vitest configuration with React Testing Library
- ✅ Test coverage reporting
- ✅ CI integration with non-blocking tests
- ✅ Sample test files and setup utilities
- ✅ **Result:** Ready for TDD workflow

### 5. Monitoring & Analytics
- ✅ Application Insights React plugin integration
- ✅ Automatic page view and error tracking
- ✅ Custom event tracking (trackEvent, trackMetric, trackException)
- ✅ **PWA Installation Tracking** - Monitors app install events
  - Tracks when install prompt is shown
  - Tracks successful app installations
  - Tracks standalone app launches
- ✅ Development mode with console logging
- ✅ Production mode with Azure telemetry
- ✅ **Result:** Real-time user behavior insights and PWA adoption metrics

### 6. Security & Best Practices
- ✅ Comprehensive `.gitignore` for secrets protection
- ✅ `SECURITY.md` with vulnerability disclosure process
- ✅ Distinction between safe-to-commit and secret values
- ✅ GitHub Secrets integration
- ✅ Automated security scanning
- ✅ **Result:** Production-ready security posture

### 7. Developer Experience
- ✅ Non-blocking lint/type-check (warnings visible, deployment continues)
- ✅ Fast local development with Vite HMR
- ✅ Comprehensive npm scripts
- ✅ Environment variable management
- ✅ **Result:** Smooth development workflow

## 🛠️ Tech Stack

**Frontend:**
- React 19.2
- TypeScript 5.9
- Vite 7.2
- React Spring (animations)
- Zustand (state management)

**Build & Deploy:**
- Azure Static Web Apps
- GitHub Actions
- Vite PWA Plugin
- Terser (minification)

**Testing:**
- Vitest 4.0
- React Testing Library
- @testing-library/jest-dom

**Monitoring:**
- Azure Application Insights
- Application Insights React Plugin

**Code Quality:**
- ESLint
- TypeScript
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
│   └── WORKFLOWS.md        # Workflow documentation
├── cube-swipe/             # Main application
│   ├── src/
│   │   ├── analytics.ts    # Application Insights setup
│   │   ├── test/           # Test utilities
│   │   ├── App.tsx
│   │   └── ...
│   ├── public/
│   │   └── staticwebapp.config.json  # Azure SWA config
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

Potential improvements (great first issues!):
- [ ] Add more comprehensive test coverage
- [ ] Implement e2e tests with Playwright
- [ ] Add performance budgets to CI
- [ ] Create Storybook for component documentation
- [ ] Add internationalization (i18n)
- [ ] Implement advanced PWA features (push notifications)
- [ ] Add social sharing features
- [ ] Create leaderboard with backend

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

*Last updated: 2026-02-05*
