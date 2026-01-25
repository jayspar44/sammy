# Weekly Planning Feature Implementation Plan

## Overview

Add a weekly target-setting system where users can plan daily drinking targets for the upcoming week via Sammy chat or a fallback modal. Includes a new "This Week" card on the homepage and an enhanced "Last 7 Days" card with AI-generated summaries.

---

## Database Schema

### User Profile Extension (`users/{userId}`)

```javascript
{
  // Existing fields...
  dailyGoal: 2,                    // Legacy fallback

  // NEW: Weekly plan template (recurring pattern)
  weeklyPlanTemplate: {
    monday: 2,
    tuesday: 2,
    wednesday: 2,
    thursday: 2,
    friday: 3,
    saturday: 3,
    sunday: 1,
    isActive: true,                // Auto-project next week?
    lastApplied: "2026-01-27"      // Monday of last projected week
  },

  // NEW: Planning reminder preferences
  planningPreferences: {
    reminderDay: 0,                // 0=Sunday, 1=Monday...
    reminderTime: "18:00",
    enabled: true
  }
}
```

### Daily Logs (existing structure, new usage)

```javascript
// logs/{YYYY-MM-DD} - future dates get goal-only entries
{
  habits: {
    drinking: {
      goal: 3,                     // Target for this day
      goalSetAt: timestamp,        // When target was set
      goalSource: "weekly_plan",   // "weekly_plan" | "manual"
      // count: undefined          // No count = future day
    }
  }
}
```

---

## Implementation Tasks

### Phase 1: Backend Foundation

#### 1.1 Weekly Plan Controller
**File:** `backend/src/controllers/weeklyPlanController.js` (new)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/user/weekly-plan` | POST | Set weekly targets (projects 7 daily logs) |
| `/api/user/weekly-plan` | GET | Get current week's plan + template |
| `/api/stats/weekly-summary` | GET | Get last 7 days with totals + optional AI summary |

**POST /api/user/weekly-plan request:**
```javascript
{
  targets: { monday: 2, tuesday: 2, ... sunday: 1 },
  weekStartDate: "2026-01-27",    // Monday of target week
  isRecurring: true
}
```

**POST /api/user/weekly-plan logic:**
1. Validate all 7 days have non-negative integers
2. Determine which days to project:
   - If today is Monday: project all 7 days (Mon-Sun)
   - If mid-week: project remaining days of current week only (e.g., Wed-Sun if today is Wednesday)
   - Always use the Monday of the current week as weekStartDate for template tracking
3. Batch write:
   - Update `weeklyPlanTemplate` in user profile
   - Create/update daily log documents for applicable days with goal only
4. Return `{ success, weekTotal, daysProjected }`

**Mid-week behavior:** When setting a plan on Wednesday, only Wed-Sun get projected targets. Past days (Mon-Tue) remain unchanged. The template still stores the full 7-day pattern for recurring use.

**GET /api/user/weekly-plan response:**
```javascript
{
  template: { monday: 2, ... isActive: true },
  currentWeek: {
    startDate: "2026-01-20",
    days: [
      { date: "2026-01-20", goal: 2, count: 1, status: "under" },
      { date: "2026-01-21", goal: 2, count: null, status: "future" },
      ...
    ],
    totalGoal: 15,
    totalCount: 3,
    daysLogged: 2
  }
}
```

**GET /api/stats/weekly-summary response:**
```javascript
{
  days: [
    { date: "2026-01-17", count: 2, goal: 3, isDry: false },
    ...
  ],
  totalDrinks: 12,
  totalTarget: 15,
  dryDays: 2,
  moneySaved: 30,
  aiSummary: "Solid week! You stayed under on 5 of 7 days..."  // if ?includeAI=true
}
```

#### 1.2 AI Function for Weekly Planning
**File:** `backend/src/controllers/chatController.js`

Add to `LOG_TOOLS`:
```javascript
{
  name: 'set_weekly_targets',
  description: 'Set drinking targets for each day of the upcoming week. Use when user wants to plan their week.',
  parameters: {
    type: 'OBJECT',
    properties: {
      monday: { type: 'NUMBER', description: 'Target for Monday (0+)' },
      tuesday: { type: 'NUMBER', description: 'Target for Tuesday (0+)' },
      wednesday: { type: 'NUMBER', description: 'Target for Wednesday (0+)' },
      thursday: { type: 'NUMBER', description: 'Target for Thursday (0+)' },
      friday: { type: 'NUMBER', description: 'Target for Friday (0+)' },
      saturday: { type: 'NUMBER', description: 'Target for Saturday (0+)' },
      sunday: { type: 'NUMBER', description: 'Target for Sunday (0+)' },
      isRecurring: { type: 'BOOLEAN', description: 'Repeat pattern weekly' }
    },
    required: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }
}
```

Add `executeSetWeeklyTargets(uid, params, logger)`:
1. Calculate next Monday from today
2. Validate all values are non-negative integers
3. Call weeklyPlanController logic
4. Return `{ success, weekTotal, weekStartDate }`

#### 1.3 Update System Instructions
**File:** `backend/src/controllers/chatController.js`

Add to system instructions when building context:
```markdown
## Weekly Planning

You can help users plan their drinking targets for the week using set_weekly_targets.

When user asks to plan their week:
1. Reference last week's performance from context
2. Ask what they're thinking or suggest keeping same pattern
3. Parse natural language:
   - "same as last week" → use previous targets
   - "2 per day" → all days = 2
   - "3 on weekends, 1 weekdays" → fri/sat/sun=3, rest=1
   - "dry Monday" → monday=0
4. Confirm before saving
5. Call set_weekly_targets with parsed values

Current weekly plan: {weeklyPlanSummary}
Last week's actual: {lastWeekActual}
```

#### 1.4 Routes
**File:** `backend/src/routes/api.js`

```javascript
const { setWeeklyPlan, getWeeklyPlan, getWeeklySummary } = require('../controllers/weeklyPlanController');

router.post('/user/weekly-plan', setWeeklyPlan);
router.get('/user/weekly-plan', getWeeklyPlan);
router.get('/stats/weekly-summary', getWeeklySummary);
```

---

### Phase 2: Frontend - This Week Card

#### 2.1 ThisWeekCard Component
**File:** `frontend/src/components/ui/ThisWeekCard.jsx` (new)

**Props:**
```javascript
{
  weekData: {
    days: [{ date, goal, count, status }],
    totalGoal: number,
    totalCount: number,
    hasplan: boolean
  },
  onEditClick: () => void,
  onPlanWithSammy: () => void
}
```

**States:**
- Empty (no plan): Shows CTA "Plan with Sammy"
- Has plan: Shows 7-day grid with targets, actuals, status indicators

**Visual design:**
```
┌─────────────────────────────────────┐
│  This Week                      ✏️  │
│   M   T   W   T   F   S   S        │
│   2   2   2   2   3   3   1   ← targets
│   1   2   ·   ·   ·   ·   ·   ← actual
│   ✓   ✓                       ← status
│  3 of 15 · on track                 │
└─────────────────────────────────────┘
```

#### 2.2 WeeklyPlanModal Component
**File:** `frontend/src/components/common/WeeklyPlanModal.jsx` (new)

Based on existing modal patterns (SetGoalModal, TypicalWeekModal).

**Features:**
- 7-day horizontal layout with +/- steppers per day
- Weekly total display
- "Repeat weekly" toggle
- Save button
- "Chat with Sammy" link for complex changes
- Last week summary for reference

**Props:**
```javascript
{
  isOpen: boolean,
  onClose: () => void,
  onSave: (targets, isRecurring) => void,
  currentPlan: { monday: 2, ... },
  lastWeekSummary: { total: 12, target: 14 }
}
```

#### 2.3 Home.jsx Integration
**File:** `frontend/src/pages/Home.jsx`

Changes:
1. Add state: `weekPlan`, `showWeeklyPlanModal`
2. Add `fetchWeeklyPlan()` function calling `api.getWeeklyPlan()`
3. Add `handleSaveWeeklyPlan(targets, isRecurring)`
4. Render ThisWeekCard between SunProgress and WeeklyTrend
5. Render WeeklyPlanModal

**Layout order:**
```jsx
<SunProgress ... />
<ThisWeekCard
  weekData={weekPlan}
  onEditClick={() => setShowWeeklyPlanModal(true)}
  onPlanWithSammy={() => navigate('/companion', { state: { context: 'weekly_planning' }})}
/>
<WeeklyTrend ... />  // Renamed: Last 7 Days card
```

---

### Phase 3: Frontend - Enhanced Last 7 Days

#### 3.1 WeeklyTrend Enhancement
**File:** `frontend/src/pages/Home.jsx` (WeeklyTrend component, lines 17-105)

Changes:
1. Add totals row: "12 drinks · 14 target · 2 under ✓"
2. Add tap handler to open expanded view
3. Add chevron icon indicating tappable

#### 3.2 Last7DaysSummaryModal Component
**File:** `frontend/src/components/common/Last7DaysSummaryModal.jsx` (new)

**Features:**
- Day-by-day breakdown with progress bars
- Dry days highlighted with star
- Stats summary (total, target, money saved)
- AI-generated summary (lazy loaded)

**Data flow:**
1. Open modal → show cached day breakdown immediately
2. Fetch AI summary: `api.getWeeklySummary({ includeAI: true })`
3. Show shimmer placeholder → replace with AI text

---

### Phase 4: Chat Integration

#### 4.1 Weekly Planning Context
**File:** `frontend/src/pages/Companion.jsx`

Add handling for `context: 'weekly_planning'`:
1. Check navigation state for `{ context: 'weekly_planning' }`
2. Send init message with context to trigger planning flow
3. Display chat suggestions: ["Plan my week", "Same as last week"]

#### 4.2 Chat Suggestions Component
**File:** `frontend/src/components/common/ChatSuggestions.jsx` (new)

Quick-reply chips that appear contextually:
- No plan set: "Plan my week"
- Has plan: "Update my plan"
- Sunday/Monday: "Plan my week" prominent

---

### Phase 5: Discoverability

#### 5.1 Empty State CTA
ThisWeekCard empty state includes prominent "Plan with Sammy" button.

#### 5.2 Planning Reminder Notification
**File:** `frontend/src/services/notificationService.js`

Add functions:
- `schedulePlanningReminder(dayOfWeek, time)`
- `cancelPlanningReminder()`

Notification config:
```javascript
{
  id: 2,  // Different from morning reminder (id: 1)
  title: "Ready to plan your week?",
  body: "Tap to set your drinking targets with Sammy",
  schedule: { on: { weekday: dayOfWeek, hour, minute } }
}
```

#### 5.3 Post-Week Prompt
After logging on Sunday, Sammy can prompt:
"That wraps up your week! Want to set up next week?"

Add to chat context detection in chatController.js.

---

### Phase 6: API Client Updates

**File:** `frontend/src/api/services.js`

Add methods:
```javascript
// Weekly plan
getWeeklyPlan: async () => client.get('/user/weekly-plan'),
setWeeklyPlan: async (targets, weekStartDate, isRecurring) =>
  client.post('/user/weekly-plan', { targets, weekStartDate, isRecurring }),

// Weekly summary with AI
getWeeklySummary: async (includeAI = false) =>
  client.get(`/stats/weekly-summary?includeAI=${includeAI}`),
```

---

## File Summary

| File | Action | Purpose |
|------|--------|---------|
| `backend/src/controllers/weeklyPlanController.js` | Create | Weekly plan endpoints |
| `backend/src/controllers/chatController.js` | Modify | Add set_weekly_targets function |
| `backend/src/routes/api.js` | Modify | Add weekly plan routes |
| `frontend/src/components/ui/ThisWeekCard.jsx` | Create | This Week card component |
| `frontend/src/components/common/WeeklyPlanModal.jsx` | Create | Week editor modal |
| `frontend/src/components/common/Last7DaysSummaryModal.jsx` | Create | Expanded last 7 days view |
| `frontend/src/components/common/ChatSuggestions.jsx` | Create | Quick-reply chips |
| `frontend/src/pages/Home.jsx` | Modify | Integrate new cards/modals |
| `frontend/src/pages/Companion.jsx` | Modify | Weekly planning context |
| `frontend/src/api/services.js` | Modify | Add API methods |
| `frontend/src/services/notificationService.js` | Modify | Planning reminder |

---

## Verification Plan

### Backend Testing
1. Start local backend: `npm run dev:backend`
2. Use curl/Postman to test:
   - `POST /api/user/weekly-plan` with valid targets
   - `GET /api/user/weekly-plan` returns projected week
   - `GET /api/stats/weekly-summary?includeAI=true` returns AI summary
3. Verify Firestore has 7 future-dated log documents with goals

### Frontend Testing
1. Start local dev: `npm run dev:local`
2. Home page:
   - This Week card shows empty state → tap "Plan with Sammy"
   - After setting plan, card shows 7-day grid with targets
   - Tap ✏️ opens WeeklyPlanModal
   - Edit and save → card updates
3. Last 7 Days:
   - Shows totals in collapsed view
   - Tap opens Last7DaysSummaryModal
   - AI summary loads after brief delay
4. Companion:
   - Navigate with planning context → Sammy prompts planning
   - Say "2 on weekdays, 3 on weekends" → AI parses and confirms
   - Confirm → plan saved, This Week card updates

### Chat Function Testing
1. Open Companion, type "plan my week"
2. Sammy should ask about targets
3. Respond with natural language patterns:
   - "same as last week"
   - "2 per day"
   - "dry on Monday and Wednesday"
4. Confirm plan → verify via GET /api/user/weekly-plan

### Edge Cases
- Set plan mid-week → only project remaining days (Wed-Sun if today is Wednesday)
- Change single day after plan set → update that day's goal with `goalSource: "manual"`
- View This Week card when week has no plan → show empty state with CTA
- User with no logged history asks to plan → use defaults, Sammy guides them
- Sunday planning → projects Sun (today) + full next week? Or just next week? (Recommend: just today + next week)

---

## Implementation Order

1. **Backend foundation** (weeklyPlanController, routes)
2. **AI function** (set_weekly_targets in chatController)
3. **API client updates** (services.js)
4. **ThisWeekCard + WeeklyPlanModal** (frontend components)
5. **Home.jsx integration** (wire up new components)
6. **Last 7 Days enhancement** (totals + expanded modal)
7. **Chat integration** (planning context, suggestions)
8. **Discoverability** (notifications, prompts)
