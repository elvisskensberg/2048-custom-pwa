import type { PageData, DesignVariant, BaseContentItem, ColorScheme } from '../components/aboutData'
import { pages } from '../components/aboutData'

export interface SlideCollection {
  slides: PageData[]
  totalCount: number
}

export const getAboutSlides = (): SlideCollection => ({
  slides: pages,
  totalCount: pages.length,
})

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
