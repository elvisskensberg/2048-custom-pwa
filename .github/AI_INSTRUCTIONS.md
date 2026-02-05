# AI Agent Instructions

This document provides guidelines for AI assistants working on this project to maintain code quality and consistency.

## Post-Task Checklist

After completing any code changes or feature implementation, AI agents MUST follow this checklist:

### 1. Run and Fix Unit Tests ✅

**Always run tests after code changes:**

```bash
cd cube-swipe
npm test
```

**If tests fail:**
1. Analyze the test failure output
2. Fix the failing tests or update the code
3. Re-run tests until all pass
4. If new functionality was added, write corresponding tests
5. Verify test coverage is maintained or improved

**Test Requirements:**
- All existing tests must pass
- New features should have tests
- Bug fixes should include regression tests
- Test coverage should not decrease

### 2. Run and Fix Linting Issues ✅

**Always run linting after code changes:**

```bash
cd cube-swipe
npm run lint
```

**If linting fails:**
1. Try auto-fix first: `npm run lint:fix`
2. For issues that can't be auto-fixed:
   - Read the linting error message
   - Fix the code to comply with ESLint rules
   - Re-run linting until clean
3. Never disable linting rules without justification

**Common Linting Issues:**
- Unused imports/variables
- `any` types (use `unknown` instead)
- Missing return types
- Inconsistent formatting

### 3. Type Check ✅

**Run TypeScript type checking:**

```bash
cd cube-swipe
npm run type-check
```

**If type errors exist:**
1. Fix type errors (don't use `@ts-ignore` without good reason)
2. Ensure proper type annotations
3. Use `unknown` instead of `any` where possible

### 4. Build Verification ✅

**Verify production build succeeds:**

```bash
cd cube-swipe
npm run build
```

**If build fails:**
1. Fix any build errors (often TypeScript or import issues)
2. Verify all dependencies are properly imported
3. Check that environment variables are correctly referenced
4. Re-run build until successful

### 5. Pre-Commit Summary

Before committing, ensure:
- [ ] All tests pass (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] No type errors (`npm run type-check`)
- [ ] Production build succeeds (`npm run build`)
- [ ] Git commit message follows conventional commits

## Workflow Example

```bash
# After making code changes:

# 1. Run tests
cd cube-swipe
npm test

# 2. Fix any test failures
# (edit code as needed)
npm test  # verify fixes

# 3. Run linting
npm run lint

# 4. Auto-fix what's possible
npm run lint:fix

# 5. Manually fix remaining issues
# (edit code as needed)
npm run lint  # verify clean

# 6. Type check
npm run type-check

# 7. Verify build
npm run build

# 8. If all pass, commit
cd ..
git add .
git commit -m "feat: add new feature

- Implemented X
- Added tests for Y
- Fixed linting issues"
git push
```

## Continuous Integration Expectations

This project uses GitHub Actions for CI/CD. The pipeline runs:
1. Linting (non-blocking, shows warnings)
2. Type checking (non-blocking, shows warnings)
3. Tests (non-blocking currently)
4. Build (BLOCKING - must pass for deployment)

While lint and type-check are non-blocking in CI, AI agents should still fix these issues locally before committing to maintain code quality.

## Code Quality Standards

### Testing
- Write tests for all new features
- Use descriptive test names
- Follow Arrange-Act-Assert pattern
- Test edge cases and error conditions
- Mock external dependencies appropriately

### Code Style
- Use TypeScript strict mode
- Prefer `const` over `let`
- Use arrow functions for callbacks
- Destructure props and objects
- Use meaningful variable names
- Keep functions small and focused

### Type Safety
- Never use `any` (use `unknown` or specific types)
- Define interfaces for complex objects
- Use union types for multiple possible types
- Leverage TypeScript's type inference
- Add return type annotations to functions

### Error Handling
- Always handle errors in async functions
- Use try-catch appropriately
- Log errors to Application Insights in production
- Provide meaningful error messages
- Don't swallow errors silently

## Commit Message Format

Use Conventional Commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build/tooling changes
- `ci`: CI/CD changes

**Example:**
```
feat(analytics): add game event tracking

- Add trackEvent calls for game start/end
- Track high scores
- Include game duration metrics

Closes #123
```

## AI-Specific Guidelines

### When to Skip Auto-Fixing

**Do NOT auto-fix in these cases:**
1. User explicitly said not to
2. Changes would be too extensive (>100 files)
3. Fixing would require architectural changes
4. Tests are intentionally failing (TDD red phase)

In these cases, inform the user of the issues and ask for guidance.

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

If unable to fix tests or linting automatically:
1. Clearly describe what's failing
2. Show the error messages
3. Suggest potential fixes
4. Ask for user guidance if needed

## Performance Considerations

When fixing code quality issues:
- Don't compromise performance for style
- Use appropriate data structures
- Avoid unnecessary re-renders in React
- Memoize expensive computations
- Lazy load when appropriate

## Documentation

When making changes:
- Update JSDoc comments if behavior changes
- Update README if user-facing features change
- Update this file if workflow changes
- Add inline comments for complex logic

## Example: Complete Task Workflow

**Task:** "Add a reset button to the game"

1. **Implement the feature**
   - Add reset button component
   - Add reset functionality
   - Update state management

2. **Write tests**
   ```typescript
   describe('ResetButton', () => {
     it('resets game state when clicked', () => {
       // test implementation
     })
   })
   ```

3. **Run tests**
   ```bash
   npm test
   # ✅ All tests pass
   ```

4. **Run linting**
   ```bash
   npm run lint
   # ⚠️ Found unused import
   npm run lint:fix
   # ✅ Fixed automatically
   ```

5. **Type check**
   ```bash
   npm run type-check
   # ✅ No type errors
   ```

6. **Build**
   ```bash
   npm run build
   # ✅ Build successful
   ```

7. **Commit**
   ```bash
   git add .
   git commit -m "feat: add reset button to game

   - Add ResetButton component with tests
   - Connect to game state reset action
   - Update UI layout to include button"
   git push
   ```

## Troubleshooting

### Tests Won't Pass

1. Check if test environment is set up: `npm install`
2. Look for missing dependencies
3. Check for async timing issues
4. Verify mocks are properly configured
5. Read test error output carefully

### Linting Won't Fix

1. Some rules can't be auto-fixed
2. Read the specific rule documentation
3. Fix manually based on error description
4. Consider if rule should be adjusted (rare)

### Build Fails

1. Usually TypeScript errors
2. Check import paths
3. Verify all dependencies installed
4. Look for circular dependencies
5. Check environment variable usage

## Summary

**Golden Rule:** Never commit code that fails tests, linting, or builds (unless explicitly instructed).

**Priority Order:**
1. Tests passing (functionality works)
2. Build succeeds (code compiles)
3. Linting clean (code quality)
4. Type-check clean (type safety)

Following these guidelines ensures high code quality and smooth collaboration between AI agents and human developers.

---

**Last Updated:** 2026-02-05
**For Questions:** See [CONTRIBUTING.md](../CONTRIBUTING.md) or [WORKFLOWS.md](WORKFLOWS.md)
