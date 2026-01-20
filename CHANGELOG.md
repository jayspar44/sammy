# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.13.0](https://github.com/jayspar44/sammy/compare/v0.12.2...v0.13.0) (2026-01-20)


### Features

* add manual trigger to PR preview cleanup workflow ([bf42149](https://github.com/jayspar44/sammy/commit/bf4214927f8a79647c6306f0692c4081730a54be))
* add morning notification system for Android ([#24](https://github.com/jayspar44/sammy/issues/24)) ([7637c1d](https://github.com/jayspar44/sammy/commit/7637c1dd6086cc4f812d08f3324e70e87b6c3568))
* add system theme option with auto-detection ([#25](https://github.com/jayspar44/sammy/issues/25)) ([ea21168](https://github.com/jayspar44/sammy/commit/ea21168f6f0e03bf39ec900f073f2fa31ac89194))

### [0.12.2](https://github.com/jayspar44/sammy/compare/v0.12.0...v0.12.2) (2026-01-16)


### Features

* add markdown support to AI chat messages ([42430b4](https://github.com/jayspar44/sammy/commit/42430b452b405929ef4ed13c9ae1ab50616d8b4d))

### [0.12.1](https://github.com/jayspar44/sammy/compare/v0.12.0...v0.12.1) (2026-01-16)

## [0.12.0](https://github.com/jayspar44/sammy/compare/v0.11.1...v0.12.0) (2026-01-16)


### Features

* Add configurable release status to Play Store workflow ([e8e988e](https://github.com/jayspar44/sammy/commit/e8e988e825b2d9912621e3da918f23063057a46a))
* add conventional commits, release skill, husky pre-commit security hook ([02813e2](https://github.com/jayspar44/sammy/commit/02813e20fb2e2c2eb7fb82353f55a04af8c1e770))
* Add dev flavor support to Play Store workflow ([75aba6b](https://github.com/jayspar44/sammy/commit/75aba6ba5f97da2e86171359c9c321d76e8c3b13))
* Add GitHub issue creation for unfixed HIGH items in pr-flow ([2985b53](https://github.com/jayspar44/sammy/commit/2985b5379363fead892b5e4e712e17fa39eb8aaf))


### Bug Fixes

* Add Android platform before Capacitor sync in workflow ([1e081dd](https://github.com/jayspar44/sammy/commit/1e081dda7ed0d8c22074e1db48c89a6c026b983a))
* Add product flavors to workflow build.gradle ([52186ae](https://github.com/jayspar44/sammy/commit/52186aef186138650c30b591b699a2a5789d3c0b))
* Auto-increment versionCode in Play Store workflow ([297bd7d](https://github.com/jayspar44/sammy/commit/297bd7de69179626f6b85456a46d01baaf60c8e3))
* clarify security-scan exception handling ([698313b](https://github.com/jayspar44/sammy/commit/698313bdc4102f631eb4d1f74ed309d03951bf52))
* Target correct Firebase site (sammy-658-dev) in cleanup workflows ([2f73c3a](https://github.com/jayspar44/sammy/commit/2f73c3af64fa00354a44e5f502c465fda7f55197))
* Use Java 21 for Capacitor build in workflow ([c54c0b1](https://github.com/jayspar44/sammy/commit/c54c0b16d38242231b9be43af3e1f537c3524c8d))

## [0.11.6] - 2026-01-16

### Fixed
- Fix version display NaN and ensure Cloud Build routes traffic to latest

## [0.11.5] - 2026-01-15

### Added
- Add /upload-play-store skill for Play Store uploads via GitHub Actions

## [0.11.4] - 2026-01-15

### Added
- Add separate backend version display to Settings page

## [0.11.3] - 2026-01-14

### Added
- Add live version/timestamp display from health API with HMR tracking

## [0.11.2] - 2026-01-14

### Added
- Secure Firestore rules, add architect skill, UI improvements

## [0.11.1] - 2026-01-14

### Fixed
- Fix CORS for PR preview environments by updating backend with exact frontend URL

## [0.11.0] - 2026-01-14

### Added
- Add CI/CD utopia: PR previews, GitHub Actions APK/AAB builds, Play Store uploads

## [0.10.10] - 2026-01-14

### Added
- Add Claude Code project commands with dotfiles integration

## [0.10.9] - 2026-01-11

### Added
- Add APK build automation with /build-app skill

## [0.10.8] - 2026-01-11

### Fixed
- Fix Android status bar edge-to-edge design and icon colors

## [0.10.7] - 2026-01-11

### Added
- Add build timestamp to version display on all pages

## [0.10.6] - 2026-01-11

### Fixed
- Fix Android safe area and status bar handling

## [0.10.5] - 2026-01-11

### Changed
- Improve weekly trend card with drink counts and clickable history

## [0.10.4] - 2026-01-11

### Changed
- Update CLAUDE.md with missing API endpoint, ThemeContext, and accurate gitignore patterns

## [0.10.3] - 2026-01-10

### Fixed
- Fix Android keyboard handling for absolute positioning architecture

## [0.10.2] - 2026-01-10

### Added
- feat: Add version/env info to Login page

## [0.10.1] - 2026-01-10

### Fixed
- Fix express-rate-limit trust proxy error in local dev

## [0.10.0] - 2026-01-10

### Added
- Add Android app icons and splash screens with theme-adaptive design

## [0.9.3] - 2026-01-10

### Fixed
- fix: Refactor layout architecture with absolute positioning for proper scrolling and floating nav elements

## [0.9.2] - 2026-01-10

### Changed
- Improve Home page UI with Card containers and visual refinements

## [0.9.1] - 2026-01-10

### Changed
- Strengthen gitignore to prevent secret leaks

## [0.9.0] - 2026-01-10

### Added
- Add dark mode with Tailwind v4 custom variant support

## [0.8.2] - 2026-01-10

### Fixed
- Fix Cloud Run trust proxy and secure env files

## [0.8.1] - 2026-01-10

### Fixed
- Fix Android safe area and status bar visibility on Pixel devices

## [0.8.0] - 2026-01-10

### Changed
- Migrate to new Gemini SDK with structured chat API

## [0.7.0] - 2026-01-10

### Added
- Improve AI chat naturalness and add daily stats breakdown

## [0.6.3] - 2026-01-10

### Added
- Add skeleton loading states to prevent UI flicker

## [0.6.2] - 2026-01-10

### Added
- Add typical week baseline feature for progress tracking

## [0.6.1] - 2026-01-10

### Changed
- UI polish: new logo assets, settings button redesign, wordmark styling

## [0.6.0] - 2026-01-10

### Changed
- Expand chat AI context to 90 days with comprehensive summaries

## [0.5.0] - 2026-01-04

### Added
- Add Capacitor StatusBar safe area support for mobile devices

## [0.4.0] - 2026-01-04

### Changed
- Implement structured logging with Pino (backend) and custom logger (frontend)

## [0.3.1] - 2026-01-04

### Added
- Add version header to API responses

## [0.3.0] - 2026-01-04

### Added
- Add branch protection and Claude PR review documentation
- Add automatic version tagging for minor/major releases
- Add Claude Code PR review GitHub Action

## [0.2.1] - 2026-01-04

### Fixed
- Fix Edit History modal layout - width and height constraints

## [0.2.0] - 2026-01-03

### Added
- Add version and environment display in page header
- Add dynamic page title based on environment
- Add automated version bump scripts with semantic versioning
- Add comprehensive version management documentation

## [0.1.1] - 2025-12-31

### Added
- Feature: Set Daily Goal Modal
- Feature: Configurable Avg Cost and Calories in Settings

### Fixed
- Fix: Dry Streak logic
- Fix: Home Page Layout reordering

### Changed
- Refactor: Login Page with Design System
- UI: Updated Chart Colors to Blue Palette

## [0.1.0] - 2025-12-30

### Changed
- Initial MVP release
- Implemented Email/Password Authentication
- Integrated Gemini 2.5 Flash for AI Companion
- configured default ports to 4000/4001
