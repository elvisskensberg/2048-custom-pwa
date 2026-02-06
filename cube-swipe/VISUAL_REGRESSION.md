# Visual Regression Testing

This project uses **Playwright visual regression testing** with seeded random number generation to ensure UI consistency across changes.

## How It Works

### 1. Seeded RNG for Deterministic Tests
- `Math.random()` is seeded with value `12345` before each test
- Game tiles spawn in **identical positions** every test run
- Screenshots are **reproducible** across test runs

### 2. Visual Regression with 3% Tolerance
- Playwright compares screenshots pixel-by-pixel against baseline snapshots
- **3% pixel difference** allowed for cross-platform rendering (Windows/Mac/Linux)
- **0.2 threshold** for per-pixel color differences (font antialiasing, etc.)

### 3. Platform-Specific Baselines
- Snapshots stored in `e2e/app.spec.ts-snapshots/`
- Named with platform suffix: `*-win32.png`, `*-linux.png`, `*-darwin.png`
- GitHub Actions (Linux) uses different baselines than Windows dev machines

## Developer Workflow

### Running Tests Normally
```bash
npx playwright test
```
- Compares current screenshots to baseline snapshots
- **Fails** if difference exceeds 3%
- Shows visual diff in HTML report: `npx playwright show-report`

### After Making Visual Changes
When you intentionally change UI (colors, layout, spacing, fonts):

```bash
npx playwright test --update-snapshots
```
- Regenerates baseline snapshots on your platform
- Commit updated snapshots to git
- CI will regenerate Linux baselines automatically on first run

### Reviewing Failures
If tests fail due to unexpected visual changes:

1. **View the diff**:
   ```bash
   npx playwright show-report
   ```

2. **Check what changed**:
   - Compare baseline vs actual in HTML report
   - Review if change was intentional or a bug

3. **If intentional**: Update snapshots
4. **If bug**: Fix code and re-test

## CI/CD Integration

### GitHub Actions (Linux)
- First run on Linux will fail if only Windows snapshots exist
- Update snapshots in CI by running workflow with special flag
- Or: Generate Linux baselines locally with Docker:
  ```bash
  docker run --rm --network host -v $(pwd):/work/ -w /work -it mcr.microsoft.com/playwright:v1.40.0-jammy /bin/bash
  npm ci
  npx playwright test --update-snapshots
  ```

### Cross-Platform Strategy
**Option 1: Single Platform (Recommended)**
- Only generate snapshots on Linux (CI)
- Developers run tests without snapshot comparison locally
- Add to package.json:
  ```json
  "test:e2e": "playwright test --ignore-snapshots"
  ```

**Option 2: Multi-Platform**
- Commit snapshots for all platforms
- Windows devs update `*-win32.png`
- CI updates `*-linux.png`
- macOS devs update `*-darwin.png` (if needed)

## Files

| File | Purpose |
|------|---------|
| `playwright.config.ts` | Visual regression settings (3% tolerance) |
| `e2e/app.spec.ts` | Tests with seeded RNG + snapshot assertions |
| `e2e/app.spec.ts-snapshots/` | Baseline snapshots (gitignored or committed) |
| `e2e/screenshots/` | Manual review screenshots (always saved) |

## FAQ

**Q: Why do tiles spawn in the same positions?**
A: We seed `Math.random()` to make tests deterministic. This ensures screenshots are identical across runs.

**Q: What if I want random tiles for testing gameplay?**
A: The seeding only affects E2E tests. The deployed app uses real randomness.

**Q: Why 3% tolerance?**
A: Font rendering differs slightly between Windows, macOS, and Linux. 3% allows minor antialiasing differences while catching real visual bugs.

**Q: Can I skip visual regression?**
A: Yes, run `npx playwright test --ignore-snapshots` to skip snapshot comparisons.

**Q: What about the `e2e/screenshots/` folder?**
A: Those are saved for manual review regardless of visual regression. You can open them to inspect UI at any time.

## Example: Updating After Color Change

1. You change button color from purple to blue
2. Run tests: `npx playwright test`
3. Tests fail: "Expected screenshot to match, but 18% of pixels differ"
4. Review diff: `npx playwright show-report`
5. Confirm change looks correct
6. Update: `npx playwright test --update-snapshots`
7. Commit new snapshots
8. Push to CI (will update Linux snapshots on first run)

---

**Note**: If you're only developing on Windows and CI runs on Linux, consider using **Option 1** (single platform) to avoid managing multiple snapshot sets.
