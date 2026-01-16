# Version Management

This document describes the version management system for the Sammy application.

## Overview

Sammy uses **Conventional Commits** with **standard-version** for automated versioning:
- Commits use format `<type>: <description>` (e.g., `feat: add export`, `fix: button bug`)
- Version bumps are determined automatically from commit history
- Run `/release` when ready to ship - it analyzes commits and bumps version accordingly

## Version Files

Version is synchronized across these files (automatically by standard-version):
- `version.json` - Source of truth
- `package.json` (root)
- `frontend/package.json`
- `backend/package.json`

**Changelog**: `CHANGELOG.md` - Auto-generated from commits

## Commit Types → Version Bumps

| Type | Meaning | Bump |
|------|---------|------|
| `fix:` | Bug fix | PATCH (0.11.5 → 0.11.6) |
| `feat:` | New feature | MINOR (0.11.5 → 0.12.0) |
| `feat!:` or `BREAKING CHANGE:` | Breaking change | MAJOR (0.11.5 → 1.0.0) |
| `chore:`, `docs:`, `refactor:` | Maintenance | No bump (in changelog) |
| `perf:` | Performance | No bump (in changelog) |
| `test:` | Tests | No bump (hidden) |

## Release Commands

```bash
# Auto-detect bump from commits (recommended)
/release                    # Or: npm run release

# Force specific bump (override commit analysis)
npm run release:patch       # Force patch
npm run release:minor       # Force minor
npm run release:major       # Force major

# First release (when no tags exist)
npm run release:first
```

## Typical Workflow

```bash
# Day-to-day development (commits accumulate)
/commit-push -m "feat: add CSV export"
/commit-push -m "fix: date format bug"
/commit-push -m "feat: add PDF export"
# Version still 0.11.5 (no bump yet)

# When ready to ship
/release
# → Analyzes commits, finds 2 feats + 1 fix
# → Auto-bumps to 0.12.0
# → Updates all version files
# → Generates CHANGELOG entry
# → Creates git tag v0.12.0
# → Pushes everything
```

## Version Display

**Settings page shows:** `v0.12.0+abc1234`
- Version from package.json
- Git commit hash (first 7 chars) for build identification

## What `/release` Does

1. Shows commits since last tag
2. Runs `npm run release` (standard-version)
3. Updates version files based on commit analysis
4. Updates CHANGELOG.md
5. Creates commit: `chore(release): X.Y.Z`
6. Creates tag: `vX.Y.Z`
7. Pushes changes and tags

## Important Notes

### Release Commits Should Be Separate

```bash
# ✅ CORRECT workflow:
feat: add export feature        ← code change
fix: button alignment           ← code change
chore(release): 0.12.0          ← release (created by /release)

# ❌ WRONG - don't mix code and release:
feat: add export + bump to 0.12.0
```

### Commit Message Enforcement

The `commitlint` hook validates all commit messages:
- Invalid format → commit rejected
- Format: `type: description` (subject must be lowercase)
- Valid types: feat, fix, chore, docs, refactor, perf, test, build, ci, style

### Finding Version Commits

```bash
# Find all releases
git log --oneline | grep "chore(release)"

# Find specific version
git log --oneline | grep "0.12.0"

# List all version tags
git tag -l "v*"
```

## Reminders in Other Skills

- `/upload-play-store` - Asks if you want to run `/release` first if there are unreleased commits
- `/pr-flow` - Asks if you want to run `/release` before creating PR if there are unreleased commits

## Configuration Files

| File | Purpose |
|------|---------|
| `commitlint.config.js` | Commit message validation rules |
| `.versionrc.json` | standard-version configuration (bump files, tag prefix, sections) |
| `.husky/commit-msg` | Git hook that runs commitlint |

## Troubleshooting

### Commit rejected by hook

Your commit message doesn't follow conventional format:
```bash
# Bad
git commit -m "fixed the bug"

# Good
git commit -m "fix: resolve login button issue"
```

### Version mismatch between files

Run release again - standard-version will sync all files:
```bash
npm run release:patch
```

### No tags exist

Use first release:
```bash
npm run release:first
```

### Check current version

```bash
cat version.json
# or
node -p "require('./package.json').version"
```
