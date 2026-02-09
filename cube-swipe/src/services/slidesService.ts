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

// Template placeholder content - same text for all 30 variations
const templateContent: BaseContentItem = {
  title: 'Template Showcase',
  subtitle: 'Design System Preview',
  emoji: '🎨',
  content: [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    'Each variant showcases different Material Design 3 patterns.',
  ],
}

// Generate template slides: 30 variations with same placeholder text
// Creates 10 sets × 3 design variants (gradient, card, minimal)
export const getTemplateSlides = (): SlideCollection => {
  const slides: PageData[] = Array.from({ length: 10 }, (_, index) => [
    { ...templateContent, design: 'gradient' as DesignVariant, colors: colorSchemes[index * 3] },
    { ...templateContent, design: 'card' as DesignVariant, colors: colorSchemes[index * 3 + 1] },
    { ...templateContent, design: 'minimal' as DesignVariant, colors: colorSchemes[index * 3 + 2] },
  ]).flat()

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
