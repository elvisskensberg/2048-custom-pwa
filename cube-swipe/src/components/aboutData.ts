import linkedInPhoto from '../assets/linked-in-photo.jpg'

export type DesignVariant = 'gradient' | 'card' | 'minimal' | 'funky'

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
  image?: string
}

export interface BaseContentItem {
  title: string
  subtitle: string
  emoji: string
  content: string[]
  image?: string
}

export const baseContent: BaseContentItem[] = [
  {
    title: '100% AI Prompt Development',
    subtitle: 'My journey to building enterprise level Front End App with just AI',
    emoji: '🤖',
    content: [],
  },
  {
    title: 'The very basics you will need -',
    subtitle: 'Ask AI to help you install Visual Studio Code with Claude Plugin. Claude plugin will command the ship for you',
    emoji: '💻',
    content: [
      'Install VS Code - the powerful, extensible code editor from Microsoft.',
      'Add the Claude AI plugin (by Anthropic) to integrate AI assistance directly in your editor.',
      'Let Claude command the ship and guide your development journey with intelligent code suggestions.',
    ],
  },
  {
    title: 'Framework Choice',
    subtitle: 'AI-guided framework selection',
    emoji: '⚡',
    content: [
      "When creating an app, first ask AI to find the fastest most modern framework options. I've selected the following:",
      'React 19 provides a mature ecosystem with excellent TypeScript support and robust component architecture.',
      'Vite 7 offers lightning-fast HMR (<100ms) and optimized production builds with modern ES module support.',
      'PWA capabilities enable offline functionality, app-like experience, and seamless updates through service workers.',
    ],
  },
  {
    title: 'Now we need a skeleton 🦴',
    subtitle: 'Prompt AI to install all necesary tools for you and set up a skeleton project using recommended framework',
    emoji: '🛠️',
    content: [
      'Ask AI to initialize your development environment with all required dependencies.',
      'Have AI scaffold the project structure following best practices and modern conventions.',
      'Let AI configure build tools, linters, and testing frameworks automatically.',
    ],
  },
  {
    title: 'Deployment to Cloud',
    subtitle: 'Ask AI to guide you to opening account with Microsoft Azure, or Amazon AWS or some alternative, and when you have an account, ask AI to use CLI command line tools to generate resources on a cloud and deploy your skeleton website to the cloud (as a proof of concept)',
    emoji: '☁️',
    content: [
      'Have AI walk you through creating an account with a cloud provider (Azure, AWS, Google Cloud, etc.).',
      'Ask AI to install and configure CLI tools for your chosen cloud platform.',
      'Let AI generate cloud resources and deploy your skeleton website as a proof of concept.',
    ],
  },
  {
    title: 'CI/CD Pipeline',
    subtitle: 'Ask AI to help you set up a repository for your project and configure CI/CD pipeline with automated quality checks, build, and deployment',
    emoji: '🤖',
    content: [
      'Have AI create a Git repository and set up version control for your project.',
      'Ask AI to configure CI/CD workflows that run automated quality checks, build, and deployment on every push.',
      'Let AI set up PR previews with automatic status comments and continuous integration for code quality.',
    ],
  },
  {
    title: 'Testing',
    subtitle: 'Now ask AI to:',
    emoji: '✅',
    content: [
      'Set up comprehensive testing with Vitest and React Testing Library for your project.',
      'Configure fast unit test execution with modern testing infrastructure and watch mode.',
      'Integrate automated test runs into your CI/CD pipeline to ensure quality on every commit.',
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
    subtitle: 'Beautiful, Intuitive Design',
    emoji: '🎨',
    content: [
      'Material Design 3 with dynamic color theming - smooth light/dark mode transitions with elegant animations.',
      'Touch-optimized swipe gestures, responsive layouts, and delightful micro-interactions throughout the experience.',
      'Progressive Web App with native-like feel - install prompts, offline support, and seamless updates.',
    ],
  },
  {
    title: 'The fun part 🎉',
    subtitle: 'Ask AI to create 2048 game or similar, should take it 2 mins, really easy',
    emoji: '🎮',
    content: [],
  },
  {
    title: 'Did you know?',
    subtitle: 'This entire slide was made using the same project, stay tuned for next episode 😉',
    emoji: '🎭',
    content: [],
  },
  {
    title: 'About me',
    subtitle: 'AI-Driven Delivery Specialist & Senior .NET Engineer (9+ Years): Accelerating the SDLC by integrating Claude.ai, GitHub Copilot, and Gemini to bridge the gap between complex business logic and high-availability production code',
    emoji: '👨‍💻',
    content: [],
    image: linkedInPhoto,
  },
  {
    title: 'Also about me...',
    subtitle: 'Architect of Self-Validating Systems: Expert in Multi-Agent Prompt Engineering to orchestrate E2E CI/CD pipelines, ensuring resilient releases and "zero-day" delivery maturity.',
    emoji: '🏗️',
    content: [],
    image: linkedInPhoto,
  },
  {
    title: 'continued...',
    subtitle: 'Proven Scalability: Built and scaled microservices and payment platforms (Google Pay partner) with a focus on high-performance architecture and reliability.',
    emoji: '🚀',
    content: [],
    image: linkedInPhoto,
  },
  {
    title: 'last one I promise 🙏',
    subtitle: 'Strategic Technical Leader: Aligning stakeholders and engineering teams through AI-enhanced Agile workflows',
    emoji: '🎯',
    content: [
      '🚀 Unblock delivery and maximize ROI across global markets',
      '🤝 Bridge technical and business stakeholders with AI-enhanced workflows',
      '📊 Drive Agile transformation using Claude.ai for sprint planning and retrospectives',
      '💡 Champion innovation through rapid prototyping and continuous experimentation',
      '🌍 Lead distributed teams across time zones with async-first collaboration',
    ],
    image: linkedInPhoto,
  },
  {
    title: 'try out my app and tell me what you think',
    subtitle: 'warning, 2048 game is very addictive',
    emoji: '🎮',
    content: [],
    image: linkedInPhoto,
  },
  {
    title: 'Elvis Skensberg',
    subtitle: 'github.com/elvisskensberg',
    emoji: '💼',
    content: [],
    image: linkedInPhoto,
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

  // Extended variations - vibrant and artistic (20 more for 50 total)
  { primary: '#FF6B9D', secondary: '#FFE5EC', accent: '#FF8FAB' },
  { primary: '#00D9FF', secondary: '#CCF5FF', accent: '#33E0FF' },
  { primary: '#A855F7', secondary: '#F3E8FF', accent: '#C084FC' },
  { primary: '#22D3EE', secondary: '#CFFAFE', accent: '#67E8F9' },
  { primary: '#F59E0B', secondary: '#FEF3C7', accent: '#FBBF24' },
  { primary: '#EC4899', secondary: '#FCE7F3', accent: '#F472B6' },
  { primary: '#8B5CF6', secondary: '#EDE9FE', accent: '#A78BFA' },
  { primary: '#10B981', secondary: '#D1FAE5', accent: '#34D399' },
  { primary: '#F97316', secondary: '#FFEDD5', accent: '#FB923C' },
  { primary: '#06B6D4', secondary: '#CFFAFE', accent: '#22D3EE' },
  { primary: '#D946EF', secondary: '#FAE8FF', accent: '#E879F9' },
  { primary: '#14B8A6', secondary: '#CCFBF1', accent: '#2DD4BF' },
  { primary: '#F43F5E', secondary: '#FFE4E6', accent: '#FB7185' },
  { primary: '#6366F1', secondary: '#E0E7FF', accent: '#818CF8' },
  { primary: '#84CC16', secondary: '#ECFCCB', accent: '#A3E635' },
  { primary: '#EAB308', secondary: '#FEF9C3', accent: '#FACC15' },
  { primary: '#0EA5E9', secondary: '#E0F2FE', accent: '#38BDF8' },
  { primary: '#DB2777', secondary: '#FCE7F3', accent: '#F472B6' },
  { primary: '#7C3AED', secondary: '#EDE9FE', accent: '#A78BFA' },
  { primary: '#059669', secondary: '#D1FAE5', accent: '#10B981' },
]

// Create 20 pages: selected variants for each topic
// Topics 0-2, 4-5, 8-12: gradient variant (index * 3)
// Topics 3, 6-7: card variant (index * 3 + 1)
// Topics 13-19: funky variant (index * 3 + 2)
export const pages: PageData[] = baseContent.map((item, index) => {
  const isCardVariant = index === 3 || index === 6 || index === 7
  const isFunkyVariant = index >= 13 && index <= 19
  const design = isFunkyVariant ? 'funky' : (isCardVariant ? 'card' : 'gradient')

  // Special ultra-vibrant color schemes
  const ultraVibrantScheme17 = {
    primary: '#FF00FF',  // Magenta
    secondary: '#00FFFF', // Cyan
    accent: '#FFFF00'     // Yellow
  }

  const partyScheme10 = {
    primary: '#FF1493',  // Deep Pink
    secondary: '#FFD700', // Gold
    accent: '#00FF7F'     // Spring Green
  }

  const colorIndex = (index * 3 + (isFunkyVariant ? 2 : isCardVariant ? 1 : 0)) % colorSchemes.length

  // Apply special color schemes
  let colors = colorSchemes[colorIndex]
  if (index === 17) colors = ultraVibrantScheme17
  if (index === 9) colors = partyScheme10

  return {
    ...item,
    design: design as DesignVariant,
    colors,
  }
})

// Template for generating multiple variants per topic (currently unused)
// To restore 3 variants per topic, replace pages definition with:
// export const pages: PageData[] = baseContent.flatMap((item, index) => [
//   { ...item, design: 'gradient' as DesignVariant, colors: colorSchemes[index * 3] },
//   { ...item, design: 'card' as DesignVariant, colors: colorSchemes[index * 3 + 1] },
//   { ...item, design: 'minimal' as DesignVariant, colors: colorSchemes[index * 3 + 2] },
// ])
