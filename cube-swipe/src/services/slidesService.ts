import type { PageData, DesignVariant, BaseContentItem, ColorScheme } from '../components/aboutData'
import { pages, colorSchemes } from '../components/aboutData'

export interface SlideCollection {
  slides: PageData[]
  totalCount: number
}

export const getAboutSlides = (): SlideCollection => ({
  slides: pages,
  totalCount: pages.length,
})

// Artistic template content variations - 17 unique themes for 50 total slides
const templateContents: BaseContentItem[] = [
  {
    title: 'Data Visualization',
    subtitle: 'Vector Graphics & Analytics',
    emoji: '📊',
    content: [
      'Dynamic SVG charts with real-time data transformations.',
      'Bezier curves forming elegant trend lines and scatter plots.',
      'Interactive dashboards built with D3.js and custom vector art.',
    ],
  },
  {
    title: 'Creative Portfolio',
    subtitle: 'Modern Design Showcase',
    emoji: '🎭',
    content: [
      'Bold typography paired with asymmetric grid layouts.',
      'Hover animations revealing project case studies.',
      'Micro-interactions that delight and engage users.',
    ],
  },
  {
    title: 'Abstract Geometry',
    subtitle: 'Parametric Shape Design',
    emoji: '🔷',
    content: [
      'Generative art using Perlin noise and particle systems.',
      'Sacred geometry meets computational design algorithms.',
      'Tessellating patterns creating mesmerizing visual rhythms.',
    ],
  },
  {
    title: 'Motion Graphics',
    subtitle: 'Kinetic Typography',
    emoji: '⚡',
    content: [
      'Text that dances through easing functions and physics.',
      'Staggered reveals with spring-based animations.',
      'GSAP timelines orchestrating narrative sequences.',
    ],
  },
  {
    title: '3D Illustrations',
    subtitle: 'Depth & Dimension',
    emoji: '🎲',
    content: [
      'Isometric scenes rendered with pseudo-3D CSS transforms.',
      'Ray-traced lighting simulations in WebGL shaders.',
      'Parallax scrolling creating layered depth perception.',
    ],
  },
  {
    title: 'Brutalist Minimal',
    subtitle: 'Raw Digital Expression',
    emoji: '⬛',
    content: [
      'Stark monochrome palettes with intentional roughness.',
      'System fonts celebrated as design elements.',
      'Deconstructed layouts breaking traditional grids.',
    ],
  },
  {
    title: 'Retro Futurism',
    subtitle: 'Y2K Aesthetic Revival',
    emoji: '🌐',
    content: [
      'Chrome gradients and glossy metallic surfaces.',
      'Skeuomorphic elements reimagined for modern screens.',
      'Nostalgic UI patterns with contemporary interactions.',
    ],
  },
  {
    title: 'Organic Fluidity',
    subtitle: 'Blob Morphing Shapes',
    emoji: '🫧',
    content: [
      'SVG path morphing with smooth interpolation.',
      'Liquid motion graphics using noise displacement.',
      'Biomorphic forms inspired by nature and growth.',
    ],
  },
  {
    title: 'Isometric Grid',
    subtitle: 'Axonometric Projection',
    emoji: '📐',
    content: [
      'Pixel-perfect isometric tile systems for game worlds.',
      'Technical diagrams with clean vector line work.',
      'Modular components in 30-degree perspective.',
    ],
  },
  {
    title: 'Neon Cyberpunk',
    subtitle: 'Glowing Synthwave',
    emoji: '🌆',
    content: [
      'Electric gradients with vibrant glow effects.',
      'Scanlines and CRT distortion for retro-tech vibes.',
      'Holographic UI elements with chromatic aberration.',
    ],
  },
  {
    title: 'Watercolor Digital',
    subtitle: 'Painted Textures',
    emoji: '🎨',
    content: [
      'Brush stroke overlays with blend mode compositing.',
      'Color bleeding effects mimicking traditional media.',
      'Organic textures adding warmth to digital interfaces.',
    ],
  },
  {
    title: 'Gradient Mesh',
    subtitle: 'Color Transitions',
    emoji: '🌈',
    content: [
      'Multi-point gradient meshes for complex color flows.',
      'Smooth interpolation between multiple color stops.',
      'Radial and conic gradients creating depth illusions.',
    ],
  },
  {
    title: 'Line Art Wireframe',
    subtitle: 'Blueprint Aesthetics',
    emoji: '📏',
    content: [
      'Single-weight strokes forming architectural diagrams.',
      'Technical precision meets artistic minimalism.',
      'Negative space as a fundamental design element.',
    ],
  },
  {
    title: 'Glitch Distortion',
    subtitle: 'Digital Artifacts',
    emoji: '📡',
    content: [
      'RGB channel splitting creating chromatic effects.',
      'Datamoshing and compression artifacts as art.',
      'Intentional errors celebrating digital imperfection.',
    ],
  },
  {
    title: 'Nature Patterns',
    subtitle: 'Biomimicry Design',
    emoji: '🌿',
    content: [
      'Fractal branching inspired by trees and rivers.',
      'Voronoi diagrams mimicking cellular structures.',
      'Golden ratio spirals found throughout nature.',
    ],
  },
  {
    title: 'Psychedelic Color',
    subtitle: 'Chromatic Exploration',
    emoji: '🎪',
    content: [
      'High-contrast complementary color schemes.',
      'Optical illusions through pattern repetition.',
      'Vibrating color boundaries creating visual tension.',
    ],
  },
  {
    title: 'Bauhaus Modernism',
    subtitle: 'Form Follows Function',
    emoji: '🟥',
    content: [
      'Primary colors and geometric primitives only.',
      'Grid-based composition with mathematical precision.',
      'Clean sans-serif typography as structural element.',
    ],
  },
]

// Generate 50 artistic template slides with varied content and color schemes
// Uses 17 unique content themes, some repeated with different designs
export const getTemplateSlides = (): SlideCollection => {
  const variants: DesignVariant[] = ['gradient', 'card', 'minimal']
  const slides: PageData[] = []

  // Generate 50 slides by cycling through content and variants
  for (let i = 0; i < 50; i++) {
    const contentIndex = i % templateContents.length
    const variantIndex = i % variants.length
    slides.push({
      ...templateContents[contentIndex],
      design: variants[variantIndex],
      colors: colorSchemes[i],
    })
  }

  return {
    slides,
    totalCount: slides.length,
  }
}

export const createSlideCollection = (
  content: BaseContentItem[],
  schemes: ColorScheme[],
  variants: DesignVariant[],
): SlideCollection => {
  const slides: PageData[] = content.flatMap((item, index) =>
    variants.map((variant, variantIndex) => ({
      ...item,
      design: variant,
      colors: schemes[index * variants.length + variantIndex],
    })),
  )
  return { slides, totalCount: slides.length }
}

export const getSlide = (collection: SlideCollection, index: number): PageData => {
  const safeIndex = ((index % collection.totalCount) + collection.totalCount) % collection.totalCount
  return collection.slides[safeIndex]
}

export const getNextIndex = (collection: SlideCollection, currentIndex: number): number =>
  currentIndex < collection.totalCount - 1 ? currentIndex + 1 : 0

export const getPreviousIndex = (collection: SlideCollection, currentIndex: number): number =>
  currentIndex > 0 ? currentIndex - 1 : collection.totalCount - 1
