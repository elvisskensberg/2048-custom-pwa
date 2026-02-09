# Templates Screenshots

This folder contains 1:1 ratio (1080×1080) screenshots of all 50 template design variations.

## Overview

- **50 total screenshots** showcasing design system templates
- **17 unique content themes** (Data Visualization, Creative Portfolio, Abstract Geometry, etc.)
- **3 design variants** per theme (gradient, card, minimal) × varied color schemes
- **1080×1080 resolution** for consistent 1:1 aspect ratio

## Files

All screenshots follow the naming pattern:
```
template-[NN]-[theme-slug]-[variant].png
```

Examples:
- `template-01-data-visualization-gradient.png`
- `template-02-creative-portfolio-card.png`
- `template-03-abstract-geometry-minimal.png`

## When to Regenerate

Regenerate screenshots whenever **any** of these files change:

### Content Changes
- `src/services/slidesService.ts` - Template content definitions
- Template theme titles, subtitles, or content text

### UI Changes
- `src/components/TemplatesSection.tsx` - Templates page UI
- `src/components/slides/` - Slide rendering components

### Test Changes
- `e2e/app.spec.ts` - Templates test definitions

### Color Changes
- `src/components/aboutData.ts` - colorSchemes array (50 color schemes)

## Regeneration Workflow

```bash
# From project root
cd cube-swipe

# 1. Clean old screenshots
rm e2e/screenshots/Templates/template-*.png

# 2. Regenerate all 50 template screenshots
npx playwright test --project=Square-1080p --grep="should navigate to Templates screen"

# 3. Verify screenshot count
ls e2e/screenshots/Templates | wc -l
# Should show: 50

# 4. Check total size
du -sh e2e/screenshots/Templates
# Expected: ~30-35 MB
```

## Expected Output

After regeneration, you should have:
- ✅ Exactly 50 screenshot files
- ✅ Clean sequential numbering (template-01 through template-50)
- ✅ Total folder size ~30-35 MB
- ✅ All 17 template themes represented

## File Organization

Templates cycle through themes and variants:
- Templates 01-17: First cycle (gradient → card → minimal pattern)
- Templates 18-34: Second cycle (continues pattern)
- Templates 35-50: Third cycle (continues pattern)

Each template showcases a unique combination of:
- Content theme (17 themes cycling)
- Design variant (gradient, card, minimal cycling)
- Color scheme (50 unique color palettes)

## Troubleshooting

**Incorrect count (not 50):**
- Clean all screenshots: `rm template-*.png`
- Verify slidesService.ts generates 50 slides
- Regenerate from scratch

**Missing themes:**
- Check templateContents array has 17 items
- Verify loop generates 50 iterations

**Old content visible:**
- Verify slidesService.ts was updated
- Clear browser cache
- Check dev server reloaded (HMR)

## See Also

- [CLAUDE.md](../../../../CLAUDE.md) - Full E2E regeneration workflow
- [slidesService.ts](../../../src/services/slidesService.ts) - Template generation logic
- [playwright.config.ts](../../playwright.config.ts) - Square-1080p device config
