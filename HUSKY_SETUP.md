# Husky Git Hooks Setup

This project uses [Husky](https://typicode.github.io/husky/) to automatically run code quality checks before commits and pushes.

## What's Configured

### Pre-commit Hook (`.husky/pre-commit`)

Runs automatically before each commit:

- **Type checking**: `npm run type-check` - Ensures TypeScript types are correct
- **Lint-staged**: Runs ESLint and Prettier only on staged files
  - ESLint fixes code quality issues
  - Prettier formats code consistently

### Pre-push Hook (`.husky/pre-push`)

Runs automatically before each push:

- Type checking
- Full project linting
- Build verification to ensure the project compiles

### Commit Message Hook (`.husky/commit-msg`)

Validates commit messages follow conventional commit format:

- `feat: add new feature`
- `fix: resolve bug`
- `docs: update documentation`
- `style: formatting changes`
- `refactor: code restructuring`
- `test: add or update tests`
- `chore: maintenance tasks`

## Available Scripts

```bash
# Linting
npm run lint          # Check for linting issues
npm run lint:fix      # Fix linting issues automatically

# Formatting
npm run format        # Format all files with Prettier
npm run format:check  # Check if files are properly formatted

# Type checking
npm run type-check    # Run TypeScript type checking
```

## Lint-staged Configuration

The following files are automatically processed when staged:

- **JavaScript/TypeScript files** (`*.{js,jsx,ts,tsx}`):

  - ESLint with auto-fix
  - Prettier formatting

- **Other files** (`*.{json,md,css,scss,yaml,yml}`):
  - Prettier formatting

## How It Works

1. **When you commit**: Pre-commit hook runs type checking and lint-staged
2. **When you push**: Pre-push hook runs comprehensive checks including build
3. **Commit messages**: Must follow conventional commit format

## Bypassing Hooks (Not Recommended)

If you need to bypass hooks in emergency situations:

```bash
# Skip pre-commit hook
git commit --no-verify -m "emergency fix"

# Skip pre-push hook
git push --no-verify
```

## Troubleshooting

### Hook not running?

- Ensure Husky is installed: `npm install`
- Check if `.husky` directory exists
- Verify hooks are executable (on Unix systems)

### Type checking fails?

- Run `npm run type-check` to see specific errors
- Fix TypeScript errors before committing

### Linting fails?

- Run `npm run lint` to see issues
- Use `npm run lint:fix` to auto-fix many issues
- Some issues may need manual fixing

### Build fails on pre-push?

- Run `npm run build` locally to debug
- Fix build errors before pushing

## Benefits

- **Consistent code quality**: All code follows the same standards
- **Catch errors early**: Issues are found before they reach the repository
- **Automated formatting**: No need to manually format code
- **Team collaboration**: Everyone follows the same conventions
- **Reduced CI failures**: Many issues are caught locally
