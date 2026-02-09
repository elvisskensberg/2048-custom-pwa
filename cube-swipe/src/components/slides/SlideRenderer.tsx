import type { PageData } from '../aboutData'
import GradientSlide from './GradientSlide'
import CardSlide from './CardSlide'
import MinimalSlide from './MinimalSlide'
import FunkySlide from './FunkySlide'

export interface SlideRendererProps {
  page: PageData
  firstPageContent?: React.ReactNode
}

const SlideRenderer = ({ page, firstPageContent }: SlideRendererProps): React.JSX.Element => {
  switch (page.design) {
    case 'gradient':
      return <GradientSlide page={page} firstPageContent={firstPageContent} />
    case 'card':
      return <CardSlide page={page} firstPageContent={firstPageContent} />
    case 'minimal':
      return <MinimalSlide page={page} firstPageContent={firstPageContent} />
    case 'funky':
      return <FunkySlide page={page} firstPageContent={firstPageContent} />
  }
}

export default SlideRenderer
