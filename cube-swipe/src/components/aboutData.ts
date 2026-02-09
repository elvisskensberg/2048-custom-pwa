export type DesignVariant = 'gradient' | 'card' | 'minimal'

export interface ColorScheme {
  primary: string
  secondary: string
  accent: string
}

export interface PageData {
  title: string
  subtitle: string
  emoji: string
  content: string[]
  design: DesignVariant
  colors: ColorScheme
}

export interface BaseContentItem {
  title: string
  subtitle: string
  emoji: string
  content: string[]
}

export const baseContent: BaseContentItem[] = [
  {
    title: 'Production Build',
    subtitle: 'Optimized Performance',
    emoji: '⚡',
    content: [
      '195 KB total bundle, 57 KB gzipped main bundle.',
      'Vite configuration with PWA offline support, code splitting, and Terser minification.',
      'Optimized asset caching strategies for fast load times.',
    ],
  },
  {
    title: 'Azure Cloud',
    subtitle: 'Cloud Infrastructure',
    emoji: '☁️',
    content: [
      'Deployed on Azure Static Web Apps with Application Insights monitoring.',
      'West Europe region for optimal performance.',
      'Live at: thankful-sky-020f0c103.4.azurestaticapps.net',
    ],
  },
  {
    title: 'CI/CD Pipeline',
    subtitle: 'Automated Deployment',
    emoji: '🤖',
    content: [
      'Automated quality checks, build, and deployment on every push.',
      'PR previews with automatic status comments.',
      'Continuous integration ensures code quality and reliability.',
    ],
  },
  {
    title: 'Testing',
    subtitle: 'Quality Assurance',
    emoji: '✅',
    content: [
      'Comprehensive testing with Vitest and React Testing Library.',
      'Fast unit test execution with modern testing infrastructure.',
      'Continuous integration with automated test runs.',
    ],
  },
  {
    title: 'Analytics',
    subtitle: 'Application Insights',
    emoji: '📊',
    content: [
      'Real-time monitoring with Azure Application Insights.',
      'Tracks page views, errors, PWA installations, and custom events.',
      'Data-driven insights for continuous improvement.',
    ],
  },
  {
    title: 'Security',
    subtitle: 'Best Practices',
    emoji: '🔒',
    content: [
      'Secure secret management with GitHub Secrets.',
      'Automated security scanning with CodeQL and npm audit.',
      'Smart .gitignore configuration to prevent credential leaks.',
    ],
  },
  {
    title: 'Developer Experience',
    subtitle: 'Modern Tooling',
    emoji: '💻',
    content: [
      'Vite HMR with sub-100ms hot module reload.',
      'Comprehensive npm scripts for development workflow.',
      'Clear environment configuration and documentation.',
    ],
  },
  {
    title: 'E2E Testing',
    subtitle: 'Playwright Automation',
    emoji: '🎭',
    content: [
      'End-to-end testing with Playwright across multiple devices.',
      '30 automated tests generating 150+ screenshots for visual regression.',
      'Tests cover 5 device profiles ensuring cross-platform compatibility.',
    ],
  },
  {
    title: 'UI/UX',
    subtitle: 'Material Design 3',
    emoji: '🎨',
    content: [
      'Implements Material Design 3 guidelines with light and dark themes.',
      'Clean component architecture with Web Share API integration.',
      'PWA install prompts and progressive enhancement features.',
    ],
  },
  {
    title: 'Layout & CSS',
    subtitle: 'Responsive Design',
    emoji: '📐',
    content: [
      'Fully responsive layout working across all device sizes.',
      'Fixed viewport width issues (100% instead of 100vw).',
      'Flexbox-based centering with absolute positioning for UI controls.',
    ],
  },
]

export const colorSchemes: ColorScheme[] = [
  // Gradient variations - bold and vibrant
  { primary: '#6750A4', secondary: '#E8DEF8', accent: '#EADDFF' },
  { primary: '#D32F2F', secondary: '#FFCDD2', accent: '#EF5350' },
  { primary: '#0288D1', secondary: '#B3E5FC', accent: '#29B6F6' },
  { primary: '#388E3C', secondary: '#C8E6C9', accent: '#66BB6A' },
  { primary: '#F57C00', secondary: '#FFE0B2', accent: '#FFA726' },
  { primary: '#7B1FA2', secondary: '#E1BEE7', accent: '#BA68C8' },
  { primary: '#C2185B', secondary: '#F8BBD0', accent: '#F06292' },
  { primary: '#1976D2', secondary: '#BBDEFB', accent: '#42A5F5' },
  { primary: '#689F38', secondary: '#DCEDC8', accent: '#9CCC65' },
  { primary: '#5D4037', secondary: '#D7CCC8', accent: '#8D6E63' },

  // Card variations - professional tones
  { primary: '#2E7D32', secondary: '#A5D6A7', accent: '#4CAF50' },
  { primary: '#0097A7', secondary: '#B2EBF2', accent: '#00BCD4' },
  { primary: '#F57F17', secondary: '#FFF59D', accent: '#FFEB3B' },
  { primary: '#5E35B1', secondary: '#D1C4E9', accent: '#9575CD' },
  { primary: '#E64A19', secondary: '#FFCCBC', accent: '#FF7043' },
  { primary: '#455A64', secondary: '#CFD8DC', accent: '#78909C' },
  { primary: '#6D4C41', secondary: '#BCAAA4', accent: '#A1887F' },
  { primary: '#00695C', secondary: '#B2DFDB', accent: '#26A69A' },
  { primary: '#AD1457', secondary: '#F48FB1', accent: '#EC407A' },
  { primary: '#1565C0', secondary: '#90CAF9', accent: '#2196F3' },

  // Minimal variations - clean and modern
  { primary: '#37474F', secondary: '#ECEFF1', accent: '#607D8B' },
  { primary: '#424242', secondary: '#E0E0E0', accent: '#757575' },
  { primary: '#00897B', secondary: '#80CBC4', accent: '#00897B' },
  { primary: '#6A1B9A', secondary: '#CE93D8', accent: '#AB47BC' },
  { primary: '#EF6C00', secondary: '#FFCC80', accent: '#FB8C00' },
  { primary: '#1E88E5', secondary: '#64B5F6', accent: '#2196F3' },
  { primary: '#43A047', secondary: '#81C784', accent: '#66BB6A' },
  { primary: '#8E24AA', secondary: '#CE93D8', accent: '#AB47BC' },
  { primary: '#00ACC1', secondary: '#4DD0E1', accent: '#26C6DA' },
  { primary: '#3949AB', secondary: '#7986CB', accent: '#5C6BC0' },
]

// Create 30 pages: 3 variations x 10 topics
export const pages: PageData[] = baseContent.flatMap((item, index) => [
  {
    ...item,
    design: 'gradient' as DesignVariant,
    colors: colorSchemes[index * 3],
  },
  {
    ...item,
    design: 'card' as DesignVariant,
    colors: colorSchemes[index * 3 + 1],
  },
  {
    ...item,
    design: 'minimal' as DesignVariant,
    colors: colorSchemes[index * 3 + 2],
  },
])
