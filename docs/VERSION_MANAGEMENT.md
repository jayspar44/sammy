# Version Management

This document describes the version management system for the Sammy application.

## Overview

Sammy uses a centralized version management system that keeps version numbers synchronized across:
- `version.json` (source of truth with full history)
- Root `package.json`
- Frontend `package.json`
- Backend `package.json`

## Version Display

The application version and environment are displayed in the top-right corner of the page header:
- **Format**: `v0.1.1 (local)`, `v0.1.1 (dev)`, or `v0.1.1 (prod)`
- **Location**: TopBar component (all pages except Companion page)

### Environment Detection

The app automatically detects the environment based on:
- **local**: Running in Vite dev mode (`import.meta.env.DEV`)
- **dev**: Production build with API URL containing `-dev`
- **prod**: Production build with production API URL

## Version Files

### version.json
Central source of truth containing:
- Current version number
- Full version history with dates, authors, and changelog entries

### package.json Files
Three package.json files synchronized with version.json:
- `/package.json` (root)
- `/frontend/package.json`
- `/backend/package.json`

## Version Bump Scripts

### Automated Version Bump (Recommended)

Use these shorthand commands for version bumps:

```bash
# Patch version (0.1.1 → 0.1.2) - bug fixes, minor changes
npm run version:patch -- "Fix login bug" "Fix typo in header"

# Minor version (0.1.2 → 0.2.0) - new features
npm run version:minor -- "Add dark mode" "Add export feature"

# Major version (0.2.0 → 1.0.0) - breaking changes
npm run version:major -- "Breaking API changes"
```

> **IMPORTANT:** These scripts use **positional arguments**, NOT named flags.
> - Arguments after `--` are changelog entries (quoted strings)
> - Do NOT use `--type`, `--author`, or `--changes` flags - they don't exist!

### Generic Command (Alternative)

If you need to specify the bump type dynamically:

```bash
npm run version:bump -- <patch|minor|major> "changelog entry"
```

**Features:**
- Automatic semantic version increment
- Accepts multiple changelog entries as arguments (positional, not flags)
- Non-interactive (perfect for CI/CD)
- Updates all files atomically
- Provides next steps after completion

**What it updates:**
1. `version.json` - updates version and prepends history entry
2. All three `package.json` files - syncs version number
3. Displays suggested git commands for commit/tag/push

### Interactive Version Bump (Legacy)

Use the interactive script when you need more control:

```bash
npm run version:bump:interactive
```

This will prompt you for:
1. New version number
2. Changelog entries (comma-separated)

## Get Current Version

```bash
npm run version:get
```

Returns the current version from `version.json`.

## Workflow Example

### Standard Release

```bash
# 1. Make your changes
git add .
git commit -m "feat: add new feature"

# 2. Bump version with automated script
npm run version:minor -- "Add new feature"

# 3. Review the changes
git diff

# 4. Commit the version bump
git add -A
git commit -m "chore: bump version to 0.2.0"

# 5. Tag the release
git tag v0.2.0

# 6. Push changes and tags
git push && git push --tags
```

### Quick Patch Release

```bash
# One-liner for bug fixes
npm run version:patch -- "Fix critical bug" && \
  git add -A && \
  git commit -m "chore: bump version to 0.1.2" && \
  git tag v0.1.2 && \
  git push && git push --tags
```

## CI/CD Integration

The automated script is designed for CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Bump version
  run: npm run version:patch -- "Automated release"

- name: Commit and tag
  run: |
    git config user.name "GitHub Actions"
    git config user.email "actions@github.com"
    VERSION=$(npm run version:get --silent)
    git add -A
    git commit -m "chore: bump version to $VERSION"
    git tag "v$VERSION"
    git push && git push --tags
```

## Version History

View the complete version history in `/version.json`:

```json
{
  "version": "0.1.1",
  "history": [
    {
      "version": "0.1.1",
      "date": "2025-12-31",
      "author": "Antigravity",
      "changes": [
        "Feature: Set Daily Goal Modal",
        "UI: Updated Chart Colors to Blue Palette"
      ]
    }
  ]
}
```

## Best Practices

1. **Use semantic versioning**:
   - `patch` - Bug fixes, minor changes
   - `minor` - New features (backwards compatible)
   - `major` - Breaking changes

2. **Write meaningful changelog entries**:
   - Start with action word (Add, Fix, Update, Remove)
   - Be specific but concise
   - Include feature/component context

3. **Commit version bumps separately**:
   - Keep version bumps in dedicated commits
   - Use conventional commit format: `chore: bump version to X.Y.Z`

4. **Tag releases**:
   - Always tag releases with `vX.Y.Z` format
   - Push tags to trigger deployment pipelines

## Troubleshooting

### Version mismatch between files

If package.json files get out of sync:

```bash
# Re-run the bump script with same version
npm run version:bump:interactive
# Enter the current version from version.json
```

### Version not displaying in app

1. Check that `__APP_VERSION__` is defined in `vite.config.js`
2. Rebuild the app: `npm run build`
3. Check that version is in `package.json`: `npm run version:get`

### Script errors

Make sure the script is executable:

```bash
chmod +x scripts/bump-version-auto.js
```
