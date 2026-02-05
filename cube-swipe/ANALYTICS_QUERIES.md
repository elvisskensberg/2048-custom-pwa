# Application Insights Queries

## How to Access Logs

1. Go to Azure Portal: https://portal.azure.com
2. Navigate to your Application Insights resource: `2048-custom-pwa-insights`
3. Click on **"Logs"** in the left sidebar
4. Paste one of the queries below

**Note:** There's a 1-5 minute delay between sending events and them appearing in queries.

## Custom Events Queries

### See All Custom Events (Last Hour)
```kusto
customEvents
| where timestamp > ago(1h)
| project timestamp, name, customDimensions
| order by timestamp desc
```

### PWA Installation Events
```kusto
customEvents
| where name startswith "PWA_"
| project timestamp, name, customDimensions
| order by timestamp desc
```

### Install Button Interactions
```kusto
customEvents
| where name startswith "InstallPrompt_"
| project timestamp, name, customDimensions
| order by timestamp desc
```

### Share Button Usage
```kusto
customEvents
| where name startswith "Share_"
| project timestamp, name, customDimensions
| order by timestamp desc
```

### Installation Funnel
```kusto
customEvents
| where name in ("InstallPrompt_Available", "InstallPrompt_Clicked", "InstallPrompt_UserChoice")
| summarize Count = count() by name
| order by Count desc
```

## Page Views

### All Page Views
```kusto
pageViews
| where timestamp > ago(1h)
| project timestamp, name, url, duration
| order by timestamp desc
```

### Page View Performance
```kusto
pageViews
| where timestamp > ago(24h)
| summarize
    AvgDuration = avg(duration),
    P50 = percentile(duration, 50),
    P95 = percentile(duration, 95),
    Count = count()
```

## Real-Time Monitoring

### Live Events (Last 5 Minutes)
```kusto
union customEvents, pageViews
| where timestamp > ago(5m)
| project timestamp, itemType, name
| order by timestamp desc
```

## Troubleshooting

If you don't see any events:

1. **Wait 2-5 minutes** - There's ingestion delay
2. **Check the time range** - Expand to "Last 24 hours" in the query window
3. **Verify in browser** - Open DevTools Network tab and look for successful POST requests to `applicationinsights.azure.com`
4. **Check connection string** - Verify `VITE_APPINSIGHTS_CONNECTION_STRING` in your environment

## Testing Locally

Events are logged to console in development mode:
```
[Analytics - Dev Mode] InstallPrompt_Available {}
```

Only in production (deployed site) are events sent to Azure Application Insights.
