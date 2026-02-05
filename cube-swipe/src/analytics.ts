// analytics.ts
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { ReactPlugin } from '@microsoft/applicationinsights-react-js';

// Create React plugin for automatic component tracking
export const reactPlugin = new ReactPlugin();

// Initialize Application Insights
const appInsights = new ApplicationInsights({
  config: {
    connectionString: import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING ||
      'InstrumentationKey=b479c62c-d550-4140-b0d5-58b0bba2d1f8;IngestionEndpoint=https://westeurope-5.in.applicationinsights.azure.com/;LiveEndpoint=https://westeurope.livediagnostics.monitor.azure.com/;ApplicationId=06cf5d47-ad56-47f2-bc4d-38df9d6779cd',
    enableAutoRouteTracking: true,
    extensions: [reactPlugin],
    enableCorsCorrelation: true,
    enableRequestHeaderTracking: true,
    enableResponseHeaderTracking: true,
  }
});

// Only load if not in development mode
if (import.meta.env.PROD) {
  appInsights.loadAppInsights();
  appInsights.trackPageView();
}

// Export tracking functions
export const trackEvent = (name: string, properties?: Record<string, any>) => {
  if (import.meta.env.PROD) {
    appInsights.trackEvent({ name }, properties);
  } else {
    console.log('[Analytics - Dev Mode]', name, properties);
  }
};

export const trackException = (error: Error, properties?: Record<string, any>) => {
  if (import.meta.env.PROD) {
    appInsights.trackException({ exception: error }, properties);
  } else {
    console.error('[Analytics - Dev Mode] Exception:', error, properties);
  }
};

export const trackMetric = (name: string, value: number, properties?: Record<string, any>) => {
  if (import.meta.env.PROD) {
    appInsights.trackMetric({ name, average: value }, properties);
  } else {
    console.log('[Analytics - Dev Mode] Metric:', name, value, properties);
  }
};

export const trackPageView = (name?: string, properties?: Record<string, any>) => {
  if (import.meta.env.PROD) {
    appInsights.trackPageView({ name }, properties);
  } else {
    console.log('[Analytics - Dev Mode] Page View:', name, properties);
  }
};

export default appInsights;
