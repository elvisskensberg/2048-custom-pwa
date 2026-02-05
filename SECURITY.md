# Security Guidelines

## Public Repository Security Audit

This repository is **PUBLIC**. Here's what's safe and what's protected:

## ✅ SAFE to Commit (Public)

### 1. Application Insights Connection String

**Location:** `cube-swipe/src/analytics.ts`, `cube-swipe/.env.production`

```
InstrumentationKey=b479c62c-d550-4140-b0d5-58b0bba2d1f8
IngestionEndpoint=https://westeurope-5.in.applicationinsights.azure.com/
```

**Why it's safe:**
- ✅ Designed for client-side use (embedded in browser JavaScript)
- ✅ Only allows SENDING telemetry data TO Azure (write-only)
- ✅ Cannot read data from Application Insights
- ✅ Cannot access other Azure resources
- ✅ Cannot modify or delete existing data
- ✅ Microsoft explicitly states these are safe for public code

**Reference:** [Microsoft Docs - Application Insights FAQ](https://learn.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview#can-i-use-application-insights-with-client-side-applications)

> "The instrumentation key identifies the resource that you want to associate your telemetry with, but it's not a security mechanism. Anyone who finds your instrumentation key can send data to your Application Insights resource, but they can't read data from it."
> — Microsoft Documentation

### 2. Azure Resource Names

**Safe to expose:**
- Resource Group: `rg-2048-custom-pwa`
- Static Web App: `2048-custom-pwa`
- App Insights: `2048-custom-pwa-insights`
- Subscription ID: `37682e11-36d5-4f86-ba99-2b16be6977c2`

**Why:** These are just resource identifiers, not credentials.

### 3. Production URLs

**Safe to expose:**
- `https://thankful-sky-020f0c103.4.azurestaticapps.net`
- Application Insights ingestion endpoints

**Why:** Public websites are meant to be accessible.

### 4. GitHub Actions Workflows

**Safe to expose:**
- `.github/workflows/*.yml` files
- Workflow configurations
- Build scripts

**Why:** These contain no secrets, only references to GitHub Secrets.

## 🔒 PROTECTED Secrets (GitHub Secrets)

### 1. Azure Static Web Apps Deployment Token

**Location:** GitHub Secrets → `AZURE_STATIC_WEB_APPS_API_TOKEN`

**Example value:** `28c9972ee0352fa5885056e133d9186692c7a35370008b8b938c33079e4f85ff04-...`

**Why it's secret:**
- ❌ Allows deploying to your Static Web App
- ❌ Could allow unauthorized deployments
- ❌ Could modify or delete your production site
- ❌ Grants write access to your Azure resource

**✅ Already Protected:**
- Used only in GitHub Actions via `${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}`
- Never appears in code or logs
- Redacted in GitHub Actions output

**How to rotate if compromised:**
```bash
# Generate new token
az staticwebapp secrets list --name 2048-custom-pwa --resource-group rg-2048-custom-pwa --query "properties.apiKey" -o tsv

# Update GitHub Secret
# Go to GitHub → Settings → Secrets → Edit AZURE_STATIC_WEB_APPS_API_TOKEN
```

## 📁 Files Protected by .gitignore

Your `.gitignore` now protects:

```gitignore
# Environment files
*.local
.env.local
.env.*.local

# Secrets
*.key
*.pem
*.pfx
*.p12
secrets/
credentials/

# Azure tokens (if accidentally saved)
deployment-token.txt
azure-token.txt

# Build output
dist/
node_modules/

# Test coverage
coverage/
*.lcov
```

## ⚠️ Security Best Practices

### 1. Never Commit:
- [ ] Azure deployment tokens
- [ ] Private keys or certificates
- [ ] API keys for third-party services (if you add any)
- [ ] Database connection strings (if you add a backend)
- [ ] User credentials
- [ ] Session secrets

### 2. Safe to Commit:
- [x] Application Insights connection strings
- [x] Public URLs
- [x] Resource names
- [x] Build configurations
- [x] Environment variable templates (`.env.example`)

### 3. Before Committing:

Run this check:
```bash
# Check for potential secrets in staged files
git diff --cached | grep -iE "(password|secret|token|key|private)" || echo "No obvious secrets found"
```

### 4. GitHub Secret Scanning

GitHub automatically scans for:
- Azure keys
- AWS credentials
- GitHub tokens
- Common API keys

You'll receive an alert if secrets are detected.

### 5. Dependency Security

**Enabled:**
- ✅ Dependabot security updates
- ✅ CodeQL scanning (in GitHub Actions)
- ✅ npm audit (in CI/CD pipeline)

**Monitor:**
- Check Security tab on GitHub
- Review Dependabot alerts
- Review CodeQL findings

## 🚨 What If a Secret Gets Committed?

### If Deployment Token is Exposed:

1. **Immediately rotate the token:**
   ```bash
   # This invalidates the old token
   az staticwebapp secrets reset --name 2048-custom-pwa --resource-group rg-2048-custom-pwa

   # Get new token
   az staticwebapp secrets list --name 2048-custom-pwa --resource-group rg-2048-custom-pwa --query "properties.apiKey" -o tsv
   ```

2. **Update GitHub Secret** with the new token

3. **Remove from git history** (if recently committed):
   ```bash
   # Remove file from last commit
   git reset HEAD~1

   # Or use BFG Repo-Cleaner for older commits
   # https://rtyley.github.io/bfg-repo-cleaner/
   ```

4. **Force push** (⚠️ coordinate with team):
   ```bash
   git push --force
   ```

### If Other Secrets are Exposed:

1. Rotate/revoke the compromised secret immediately
2. Remove from git history
3. Audit access logs for unauthorized use
4. Update security documentation

## 📊 Current Security Status

| Item | Status | Location |
|------|--------|----------|
| Deployment Token | 🟢 Secure | GitHub Secrets |
| App Insights Key | 🟢 Safe (Public) | Source code |
| .gitignore | 🟢 Comprehensive | Updated |
| Dependency Scanning | 🟢 Enabled | Dependabot |
| Security Scanning | 🟢 Enabled | CodeQL |
| Secret Scanning | 🟢 Enabled | GitHub |

## 🔐 Additional Security Measures (Optional)

### 1. Branch Protection Rules

Recommended for `main` branch:
- Require pull request reviews
- Require status checks (CI/CD must pass)
- Require signed commits
- Restrict who can push

### 2. Security Alerts

Enable in GitHub Settings:
- Dependabot alerts: ✅ Already enabled
- Dependabot security updates: ✅ Already enabled
- CodeQL scanning: ✅ Already enabled
- Secret scanning: ✅ Enabled by GitHub

### 3. Access Control

- Limit who has write access to the repository
- Use least privilege principle
- Regularly review collaborators
- Use deploy keys instead of personal tokens

## 📚 Resources

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning)
- [Azure Static Web Apps Security](https://learn.microsoft.com/en-us/azure/static-web-apps/authentication-authorization)
- [Application Insights Security](https://learn.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

## 📞 Security Contact

If you discover a security vulnerability, please:
1. Do NOT create a public GitHub issue
2. Email: [Your email or security contact]
3. Include: Description, reproduction steps, potential impact

---

**Last Updated:** 2026-02-05
**Next Review:** Before making repository public
