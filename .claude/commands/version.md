---
description: Bump version (patch/minor/major)
allowed-tools: Bash(npm run version:*), Read, AskUserQuestion
argument-hint: [patch|minor|major] [description]
---

# Version Bump

Bump the project version using semantic versioning.

## Arguments (Optional)

- **$1**: Bump type - `patch`, `minor`, or `major` (auto-detected if omitted)
- **$2+**: Changelog description (auto-generated if omitted)

## Auto-Detection (when no arguments provided)

Analyze the changes made during this session and determine:

1. **Bump type** based on semantic versioning:
   - **patch**: Bug fixes, typo corrections, small tweaks, refactoring with no behavior change
   - **minor**: New features, new endpoints, new UI components, enhanced functionality
   - **major**: Breaking changes, API changes that require client updates, major rewrites

2. **Description**: Generate a concise changelog entry summarizing the changes

Then present your recommendation to the user with AskUserQuestion:
- Show the recommended bump type and description
- Let them confirm, adjust the type, or provide a custom description

## Steps

1. **Get current version** by reading `version.json`

2. **Determine bump type and description** (if not provided as arguments)

3. **Run version bump**: `npm run version:<type> -- "<description>"`

4. **Report result**: Show the new version number

## Version Files Updated

The npm script updates these files automatically:
- `version.json`
- `package.json`
- `frontend/package.json`
- `backend/package.json`

## Example Usage

### With arguments:
```
/version patch Fix login redirect bug
```
Result: Version bumped from 0.10.1 to 0.10.2

### Without arguments (auto-detect):
```
/version
```
Claude analyzes session changes and recommends bump type + description.

## After Bumping

Use `/commit-push` to commit and push the version bump along with your other changes.

## Important Notes

- Always verify the version bump completed successfully
- Show the user the old and new version numbers
