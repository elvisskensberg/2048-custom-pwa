# GitHub Actions Workflows Documentation

This project uses GitHub Actions for automated CI/CD. Here's what's configured:

## Workflows Overview

### 1. **Azure Static Web Apps CI/CD** ([azure-static-web-apps.yml](.github/workflows/azure-static-web-apps.yml))

**Triggers:** Push to `main`, Pull Requests

**Jobs:**
- `quality_checks` - Runs linting, type checking, tests, and builds
- `deploy_production` - Deploys to production (main branch only)
- `deploy_preview` - Creates preview deployments for PRs
- `close_pull_request` - Cleans up PR preview environments

**Features:**
- ✅ Parallel quality checks for faster feedback
- ✅ Build artifacts cached between jobs
- ✅ Automatic PR preview URLs posted as comments
- ✅ Environment protection for production
- ✅ Reuses build artifacts to avoid rebuilding

### 2. **Security & Dependency Checks** ([security.yml](.github/workflows/security.yml))

**Triggers:** Push to `main`, PRs, Weekly schedule (Mondays 9 AM UTC)

**Jobs:**
- `dependency_audit` - Runs npm audit for security vulnerabilities
- `codeql_analysis` - GitHub CodeQL security scanning

**Features:**
- ✅ Weekly automated security scans
- ✅ Checks for outdated dependencies
- ✅ CodeQL analysis for JavaScript/TypeScript

### 3. **PR Quality Checks** ([pr-checks.yml](.github/workflows/pr-checks.yml))

**Triggers:** Pull Requests

**Jobs:**
- `pr_size_check` - Warns if PR is too large (>1000 lines)
- `pr_labels` - Auto-labels PRs based on changed files
- `bundle_size_check` - Analyzes and reports bundle sizes

**Features:**
- ✅ Automatic PR labeling
- ✅ Bundle size analysis in PR summary
- ✅ Large PR warnings for better review practices

### 4. **Dependabot** ([dependabot.yml](.github/dependabot.yml))

**Schedule:** Weekly on Mondays

**Features:**
- ✅ Automatic dependency updates
- ✅ Groups minor/patch updates
- ✅ Separate updates for dev vs production dependencies
- ✅ GitHub Actions version updates

## Setup Instructions

### 1. Add Required Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions:

```
AZURE_STATIC_WEB_APPS_API_TOKEN=<your-token>
```

**Get your token:**
```bash
az staticwebapp secrets list \
  --name 2048-custom-pwa \
  --resource-group rg-2048-custom-pwa \
  --query "properties.apiKey" -o tsv
```

### 2. Enable Required Permissions

Repository Settings → Actions → General → Workflow permissions:
- [x] Read and write permissions
- [x] Allow GitHub Actions to create and approve pull requests

### 3. Branch Protection (Recommended)

Settings → Branches → Add rule for `main`:
- [x] Require status checks to pass before merging
  - [x] Quality Checks
  - [x] CodeQL
- [x] Require branches to be up to date before merging
- [x] Require pull request before merging

## Workflow Execution Flow

### Pull Request Flow
```
1. Developer opens PR
   ↓
2. quality_checks runs (lint, type-check, test, build)
   ↓
3. pr_checks runs (size check, labels, bundle analysis)
   ↓
4. deploy_preview creates preview environment
   ↓
5. Preview URL posted as comment
   ↓
6. After PR merge, preview environment cleaned up
```

### Main Branch Flow
```
1. PR merged to main
   ↓
2. quality_checks runs
   ↓
3. deploy_production deploys to Azure
   ↓
4. Production site updated
```

## Best Practices

### Writing Tests
```bash
# Run tests locally
npm test

# Watch mode during development
npm run test:watch

# Check coverage
npm run test:coverage
```

### Before Committing
```bash
# Format and lint
npm run lint:fix

# Type check
npm run type-check

# Run all checks
npm run lint && npm run type-check && npm test && npm run build
```

### Working with Workflows

**Trigger workflow manually:**
- Go to Actions tab → Select workflow → Run workflow

**Skip workflows:**
```bash
git commit -m "docs: update README [skip ci]"
```

**Debug workflows:**
- Enable debug logging: Settings → Secrets → Add `ACTIONS_STEP_DEBUG=true`

## Monitoring

### Check Workflow Status
- GitHub Actions tab shows all workflow runs
- Badge for main branch: `![CI/CD](https://github.com/USERNAME/REPO/workflows/Azure%20Static%20Web%20Apps%20CI%2FCD/badge.svg)`

### Notifications
Configure at: Settings → Notifications → Actions
- Email on workflow failure
- Slack/Discord webhooks (optional)

## Optimization Tips

1. **Faster Builds**
   - Dependencies cached automatically
   - Build artifacts reused between jobs

2. **Cost Optimization**
   - Free tier: 2,000 minutes/month
   - Workflows run in parallel when possible
   - PR previews auto-cleanup to save resources

3. **Security**
   - CodeQL scans weekly
   - Dependabot keeps dependencies updated
   - Secrets never exposed in logs

## Troubleshooting

**Build fails on CI but works locally?**
- Check Node.js version matches (20)
- Run `npm ci` instead of `npm install`
- Clear cache: Re-run workflow with "Re-run all jobs"

**Deploy fails?**
- Verify `AZURE_STATIC_WEB_APPS_API_TOKEN` is set
- Check Azure resource exists
- Ensure working directory is correct

**Tests fail only in CI?**
- Check for missing environment variables
- Verify test environment setup
- Look for timing issues in async tests

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Azure Static Web Apps CI/CD](https://learn.microsoft.com/en-us/azure/static-web-apps/github-actions-workflow)
- [Vitest Documentation](https://vitest.dev/)
