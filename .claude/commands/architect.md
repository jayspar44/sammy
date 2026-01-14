---
description: Mobile web/app architecture expert for React + Capacitor + Vite + Firebase
allowed-tools: Read, Glob, Grep, Task, WebSearch, AskUserQuestion
argument-hint: [consult|review|audit] <topic-or-path>
---

# Architect - Mobile Web/App Architecture Expert

Expert guidance on React + Capacitor + Vite + Firebase architecture for scalability, reusability, and performance.

## Arguments

- **$1** (required): Mode - `consult`, `review`, or `audit`
- **$2+** (required): Topic, question, or file/feature path

## Modes

### consult - Ask About Patterns & Decisions
Get expert advice on architectural decisions, patterns, or technology choices.

```bash
/architect consult state management for offline support
/architect consult should I use context or redux
/architect consult capacitor plugin strategy
```

### review - Review Implementation
Analyze specific code or proposed approach for architectural concerns.

```bash
/architect review frontend/src/contexts/AuthContext.js
/architect review the chat feature implementation
/architect review proposed API structure for notifications
```

### audit - Full Architectural Analysis
Comprehensive audit of a feature area or the entire codebase.

```bash
/architect audit authentication flow
/architect audit frontend state management
/architect audit full
```

---

## Core Expertise Areas

### 1. React Patterns (React 19+)
- **Component Architecture**: Container/Presentational, Compound Components, Render Props, Custom Hooks
- **State Management**: Context API, useReducer, external stores (Zustand, Jotai)
- **Performance**: React.memo, useMemo, useCallback, lazy loading, Suspense
- **Error Handling**: Error boundaries, fallback UIs
- **Server Components**: When/how to integrate (future-proofing)

### 2. Capacitor/Mobile (Capacitor 8+)
- **Platform Detection**: `Capacitor.isNativePlatform()` checks
- **Native Plugins**: Camera, Geolocation, Local Notifications, Haptics
- **Offline Storage**: Preferences (key-value), SQLite (structured), Filesystem
- **WebView Optimization**: Performance, memory management
- **App Lifecycle**: Background/foreground handling, deep links
- **Build Variants**: Multi-environment (local, dev, prod)

### 3. Vite Build System (Vite 7+)
- **Code Splitting**: Dynamic imports, route-based splitting
- **Tree Shaking**: Ensuring dead code elimination
- **Bundle Analysis**: Using rollup-plugin-visualizer
- **Environment Config**: .env files, define replacements
- **Caching Strategies**: Asset hashing, long-term caching

### 4. Firebase Architecture
- **Firestore Modeling**: Document structure, denormalization, subcollections
- **Query Optimization**: Composite indexes, query bounds, pagination
- **Security Rules**: Role-based access, field-level validation
- **Auth Patterns**: Session management, token refresh, multi-provider
- **Offline Persistence**: enablePersistence, cache-first reads
- **Real-time vs One-time**: When to use onSnapshot vs getDoc

### 5. API & Backend Patterns
- **Controller-Service Pattern**: Route -> Controller -> Service flow
- **Error Handling**: Consistent error responses, logging (Pino)
- **Rate Limiting**: AI endpoints, external API calls
- **Validation**: Input sanitization, Joi/Zod schemas

### 6. Scalability & Reusability
- **Feature-Based Structure**: Organizing by feature, not file type
- **Component Libraries**: Building reusable UI components
- **Configuration-Driven**: Feature flags, environment-based behavior
- **API Abstraction**: Centralized API layer (`api/` directory)
- **Testing Strategy**: Unit, integration, E2E (Jest, Cypress, Detox)

### 7. Security Best Practices
- **Auth Verification**: Firebase Auth on all protected endpoints
- **Input Validation**: Preventing XSS, SQL injection, command injection
- **Secure Storage**: Capacitor Secure Storage for sensitive data
- **Data Exposure**: Avoiding PII in logs, error messages

### 8. Emerging Tech (2025)
- **Signals**: Fine-grained reactivity patterns
- **View Transitions API**: Smooth page transitions
- **Web Push Notifications**: Cross-platform notifications
- **Capacitor 8 Features**: Improved plugin ecosystem
- **Bun/Edge Runtimes**: Faster builds and serverless

---

## Analysis Process

### Step 1: Read Project Context

Always start by reading project conventions:

```
1. Read CLAUDE.md for project-specific conventions
2. Identify relevant codebase areas based on query
3. Check existing patterns in the codebase
```

### Step 2: Explore Codebase (Mode-Dependent)

**consult mode:**
- Search for existing patterns related to the topic
- Check how similar decisions were made before
- Look at relevant files to understand current architecture

**review mode:**
- Read the specific file(s) mentioned
- Trace dependencies and usages
- Check for pattern violations against CLAUDE.md

**audit mode:**
- Map the entire feature/area architecture
- Identify all related files and patterns
- Check for consistency and best practices across the area

### Step 3: Apply Expertise

For each finding, evaluate against:

1. **CLAUDE.md Compliance**: Does it follow project conventions?
2. **React Best Practices**: Component patterns, hooks usage, performance
3. **Capacitor Best Practices**: Platform handling, native features, offline
4. **Firebase Best Practices**: Data modeling, security, performance
5. **Scalability**: Will this pattern scale? Is it reusable?
6. **Security**: Any vulnerabilities or exposures?
7. **Modern Alternatives**: Are there better 2025 approaches?

---

## Output Format

### For consult mode:

```markdown
## Architecture Guidance: [Topic]

### Recommendation
[Clear recommendation with rationale]

### For This Project
[How to apply this in Sammy specifically, referencing CLAUDE.md patterns]

### Implementation Approach
[Step-by-step guidance with code examples]

### Alternatives Considered
[Other approaches and why recommendation is preferred]

### Related Technologies
[Modern tools/patterns to consider]
```

### For review mode:

```markdown
## Architecture Review: [File/Feature]

### Summary
[Overall assessment: Strong/Adequate/Needs Improvement]

### What's Working Well
- [Positive patterns found]

### Issues Found

#### Critical (Must Address)
| Issue | Location | Recommendation |
|-------|----------|----------------|
| [Issue] | `file:line` | [Fix] |

#### Important (Should Address)
| Issue | Location | Recommendation |
|-------|----------|----------------|
| [Issue] | `file:line` | [Fix] |

#### Suggested (Consider)
- [Enhancement opportunity]

### Refactoring Opportunities
[If significant improvements possible]

### Modern Alternatives
[2025 patterns/tech that could improve this]
```

### For audit mode:

```markdown
## Architecture Audit: [Feature/Area]

### Executive Summary
[Overall health score: Excellent/Good/Fair/Poor]
[Key findings in 2-3 sentences]

### Architecture Map
[Visual or textual map of components and data flow]

### Strengths
- [What's well-architected]

### Areas of Concern

#### Critical Issues
[Issues that will cause problems at scale]

#### Technical Debt
[Patterns that should be improved]

#### Enhancement Opportunities
[Ways to modernize or optimize]

### Recommended Actions
[Prioritized list of improvements]

### Technology Recommendations
[Modern tech/patterns to adopt]

### Scalability Assessment
[How well will this scale? What changes needed?]
```

---

## Integration with Other Skills

This skill can be invoked by other agents for architectural guidance:

```markdown
# Example: feature-dev calling architect
Before implementing, consult architect:
Skill(architect, "review proposed approach for [feature]")
```

When invoked by another agent, provide concise but complete guidance that the calling agent can act on.

---

## Examples

### Example 1: Consult on State Management
```bash
/architect consult offline-first state management strategy
```

Expected output: Detailed comparison of approaches (Context + local storage vs Zustand + Preferences), with specific recommendation for Sammy's needs based on existing patterns.

### Example 2: Review a Context
```bash
/architect review frontend/src/contexts/UserPreferencesContext.jsx
```

Expected output: Analysis of the context implementation, checking for performance issues (missing memoization), proper context splitting, and CLAUDE.md compliance.

### Example 3: Full Audit
```bash
/architect audit authentication flow
```

Expected output: Complete map of auth flow (AuthContext -> Firebase Auth -> Backend verification), security analysis, session management review, and improvement recommendations.

### Example 4: Capacitor Plugin Decision
```bash
/architect consult which storage plugin for user preferences
```

Expected output: Comparison of @capacitor/preferences vs @capacitor/sqlite vs localStorage, with recommendation based on data complexity and offline requirements.

---

## Technology Reference

### Current Stack (from CLAUDE.md)
- **Frontend**: React 19 + Vite + Tailwind CSS
- **Mobile**: Capacitor 8
- **Backend**: Node.js 22 + Express 5
- **Database**: Firebase Firestore
- **Auth**: Firebase Auth
- **AI**: Google Gemini 2.5

### Complementary Technologies to Consider
- **State**: Zustand, Jotai, TanStack Query
- **Forms**: React Hook Form, Zod
- **Animations**: Framer Motion, Lottie
- **Testing**: Vitest, Playwright, Detox
- **Offline**: Workbox, PouchDB
- **Analytics**: Firebase Analytics, Amplitude
- **Error Tracking**: Sentry
- **Performance**: React DevTools, Lighthouse

---

## Notes

- **Model**: Uses current model for quality analysis
- **Context-Aware**: Always reads CLAUDE.md first
- **Project-Specific**: Recommendations tailored to Sammy's stack and conventions
- **Forward-Looking**: Considers 2025 best practices and emerging tech
- **Actionable**: Provides specific file paths, code examples, and concrete steps
- **Non-Destructive**: This skill only reads and analyzes; it does not modify files
