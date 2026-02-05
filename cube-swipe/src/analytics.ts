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
export const trackEvent = (name: string, properties?: Record<string, unknown>) => {
  if (import.meta.env.PROD) {
    appInsights.trackEvent({ name }, properties);
  } else {
    console.log('[Analytics - Dev Mode]', name, properties);
  }
};

export const trackException = (error: Error, properties?: Record<string, unknown>) => {
  if (import.meta.env.PROD) {
    appInsights.trackException({ exception: error }, properties);
  } else {
    console.error('[Analytics - Dev Mode] Exception:', error, properties);
  }
};

export const trackMetric = (name: string, value: number, properties?: Record<string, unknown>) => {
  if (import.meta.env.PROD) {
    appInsights.trackMetric({ name, average: value }, properties);
  } else {
    console.log('[Analytics - Dev Mode] Metric:', name, value, properties);
  }
};

export const trackPageView = (name?: string, properties?: Record<string, unknown>) => {
  if (import.meta.env.PROD) {
    appInsights.trackPageView({ name, properties });
  } else {
    console.log('[Analytics - Dev Mode] Page View:', name, properties);
  }
};

// Collect device information for analytics
export const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;

  // Detect device type
  const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);

  // Detect OS
  let os = 'Unknown';
  if (/Windows/i.test(userAgent)) os = 'Windows';
  else if (/Mac OS X/i.test(userAgent)) os = 'macOS';
  else if (/Linux/i.test(userAgent)) os = 'Linux';
  else if (/Android/i.test(userAgent)) os = 'Android';
  else if (/iOS|iPhone|iPad|iPod/i.test(userAgent)) os = 'iOS';

  // Detect browser
  let browser = 'Unknown';
  if (/Chrome/i.test(userAgent) && !/Edge|Edg/i.test(userAgent)) browser = 'Chrome';
  else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) browser = 'Safari';
  else if (/Firefox/i.test(userAgent)) browser = 'Firefox';
  else if (/Edge|Edg/i.test(userAgent)) browser = 'Edge';

  // Check standalone mode safely
  const isStandalone = typeof window.matchMedia === 'function'
    ? window.matchMedia('(display-mode: standalone)').matches
    : false;

  return {
    deviceType: isTablet ? 'Tablet' : isMobile ? 'Mobile' : 'Desktop',
    os,
    browser,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    pixelRatio: window.devicePixelRatio,
    touchSupport: 'ontouchstart' in window,
    orientation: window.screen.orientation?.type || 'unknown',
    isStandalone,
  };
};

// Track device info on app load
export const trackDeviceInfo = () => {
  const deviceInfo = getDeviceInfo();
  trackEvent('DeviceInfo_Load', deviceInfo);
};

export default appInsights;
