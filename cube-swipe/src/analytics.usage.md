# Application Insights Analytics Usage Guide

## Overview

Application Insights is configured for monitoring your 2048 Custom PWA. The analytics system automatically tracks page views, errors, and custom events.

## Configuration

**Azure Resources:**
- **Resource Name:** 2048-custom-pwa-insights
- **Resource Group:** rg-2048-custom-pwa
- **Location:** West Europe
- **Instrumentation Key:** b479c62c-d550-4140-b0d5-58b0bba2d1f8
- **Application ID:** 06cf5d47-ad56-47f2-bc4d-38df9d6779cd

**Environment:**
- ✅ Production: Analytics enabled automatically
- ✅ Development: Analytics disabled (logs to console instead)

## Features

### Automatic Tracking
- **Page Views** - Automatically tracked on route changes
- **Exceptions** - Unhandled errors are automatically captured
- **Performance** - Page load times and resource timing
- **User Sessions** - Anonymous session tracking

### Manual Tracking
Use the exported functions from `analytics.ts`:

```typescript
import { trackEvent, trackException, trackMetric, trackPageView } from './analytics';

// Track custom events
trackEvent('GameStarted', { difficulty: 'hard' });
trackEvent('HighScore', { score: 2048 });

// Track errors
try {
  // risky operation
} catch (error) {
  trackException(error as Error, { context: 'GameBoard' });
}

// Track custom metrics
trackMetric('GameDuration', 120, { level: 5 });

// Track page views manually
trackPageView('GameComplete', { score: 2048 });
```

## Usage Examples

### 1. Track Game Events

```typescript
// In your game component
import { trackEvent } from './analytics';

const handleGameStart = () => {
  trackEvent('GameStarted', {
    timestamp: new Date().toISOString(),
    difficulty: selectedDifficulty
  });
};

const handleGameOver = (score: number) => {
  trackEvent('GameOver', {
    score,
    moves: moveCount,
    duration: gameDuration
  });
};

const handleHighScore = (score: number) => {
  trackEvent('HighScore', {
    score,
    previousBest: previousHighScore
  });
};
```

### 2. Track User Interactions

```typescript
import { trackEvent } from './analytics';

const handleSwipe = (direction: string) => {
  trackEvent('UserSwipe', { direction });
};

const handleTileClick = (value: number) => {
  trackEvent('TileInteraction', { tileValue: value });
};
```

### 3. Track Performance Metrics

```typescript
import { trackMetric } from './analytics';

const trackGamePerformance = () => {
  trackMetric('AverageMovesPerGame', averageMoves);
  trackMetric('GameCompletionRate', completionRate);
  trackMetric('AverageScore', averageScore);
};
```

### 4. Error Tracking

```typescript
import { trackException } from './analytics';

const handleError = (error: Error) => {
  trackException(error, {
    component: 'GameBoard',
    action: 'calculateScore',
    userId: anonymousId
  });
};

// Or use in error boundaries
class GameErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    trackException(error, {
      componentStack: errorInfo.componentStack
    });
  }
}
```

## Viewing Analytics Data

### Azure Portal
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to Resource Groups → `rg-2048-custom-pwa`
3. Click on `2048-custom-pwa-insights`
4. View dashboards:
   - **Overview** - Quick stats
   - **Application Map** - Component dependencies
   - **Performance** - Load times and bottlenecks
   - **Failures** - Exceptions and failed requests
   - **Users** - User behavior and sessions
   - **Events** - Custom event tracking

### Key Queries (Log Analytics)

**Most popular events:**
```kusto
customEvents
| where timestamp > ago(7d)
| summarize count() by name
| order by count_ desc
```

**User sessions:**
```kusto
pageViews
| where timestamp > ago(7d)
| summarize Sessions = dcount(session_Id)
```

**Average game duration:**
```kusto
customMetrics
| where name == "GameDuration"
| summarize avg(value)
```

**High scores:**
```kusto
customEvents
| where name == "HighScore"
| extend score = toint(customDimensions.score)
| order by score desc
| take 10
```

## Best Practices

### DO ✅
- Track meaningful game events (starts, completions, high scores)
- Include relevant properties with events
- Track errors with context
- Monitor performance metrics
- Use consistent naming conventions

### DON'T ❌
- Track PII (personally identifiable information)
- Send sensitive data
- Track every single user interaction (too noisy)
- Use inconsistent property names
- Log passwords or tokens

## Privacy

- No personally identifiable information is collected
- User sessions are anonymous
- IP addresses are anonymized by default
- Data retention: 90 days

## Development Mode

In development, analytics calls are logged to the console instead of being sent to Azure:

```
[Analytics - Dev Mode] GameStarted { difficulty: 'hard' }
[Analytics - Dev Mode] Exception: Error: Something went wrong
```

This helps with debugging without polluting production analytics.

## Monitoring Dashboard

Recommended KPIs to monitor:
- **Daily Active Users** (DAU)
- **Game Completion Rate**
- **Average Score**
- **Error Rate**
- **Page Load Performance**
- **Session Duration**

Set up alerts in Azure Portal for:
- High error rates (>5%)
- Slow page loads (>3s)
- Low completion rates (<50%)

## Cost

**Free Tier Includes:**
- 5 GB data ingestion/month
- 90 days data retention
- Basic alerting

Current setup should stay within free tier for moderate traffic.

## Support

- [Application Insights Documentation](https://learn.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)
- [JavaScript SDK Reference](https://github.com/microsoft/ApplicationInsights-JS)
- [Query Language (KQL)](https://learn.microsoft.com/en-us/azure/data-explorer/kusto/query/)
