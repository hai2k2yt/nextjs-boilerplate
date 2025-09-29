# Testing Husky Setup

## Quick Test Commands

### 1. Test Lint-Staged (Pre-commit simulation)

```bash
npx lint-staged
```

### 2. Test Type Checking

```bash
npm run type-check
```

### 3. Test Linting

```bash
npm run lint
npm run lint:fix
```

### 4. Test Formatting

```bash
npm run format:check
npm run format
```

## Testing the Git Hooks

### Test Pre-commit Hook

1. Stage the test file:

   ```bash
   git add test-husky.js
   ```

2. Try to commit (this will trigger the pre-commit hook):
   ```bash
   git commit -m "test: add husky test file"
   ```

The hook should:

- Run type checking
- Run ESLint and fix issues
- Run Prettier and format the code
- Only proceed if all checks pass

### Test Commit Message Validation

Try committing with an invalid message:

```bash
git commit -m "bad commit message"
```

This should fail and show the conventional commit format requirements.

Try with a valid message:

```bash
git commit -m "feat: add husky git hooks setup"
```

### Test Pre-push Hook

```bash
git push origin main
```

This will run:

- Type checking
- Full project linting
- Build verification

## Expected Behavior

### ✅ Pre-commit Hook Success

```
🔍 Running pre-commit checks...
📝 Type checking...
✅ Type check passed
🔧 Running lint-staged...
✅ All files formatted and linted
✅ Pre-commit checks passed!
```

### ❌ Pre-commit Hook Failure

```
❌ Type checking failed!
src/components/example.tsx:15:7 - error TS2322: Type 'string' is not assignable to type 'number'.
```

### ❌ Commit Message Failure

```
❌ Invalid commit message format!

Commit message should follow conventional commit format:
  type(scope): description

Types: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert
Examples:
  feat: add user authentication
  fix(auth): resolve login redirect issue
  docs: update API documentation
```

## Troubleshooting

### If hooks don't run:

1. Ensure Husky is properly installed:

   ```bash
   npm run prepare
   ```

2. Check if `.husky` directory exists and contains the hook files

3. Verify the hooks have proper permissions (Unix systems):
   ```bash
   chmod +x .husky/pre-commit
   chmod +x .husky/pre-push
   chmod +x .husky/commit-msg
   ```

### If you need to bypass hooks temporarily:

```bash
# Skip pre-commit (emergency only)
git commit --no-verify -m "emergency: critical fix"

# Skip pre-push (emergency only)
git push --no-verify
```

## Clean Up Test Files

After testing, you can remove the test files:

```bash
git rm test-husky.js
git commit -m "chore: remove husky test file"
```
