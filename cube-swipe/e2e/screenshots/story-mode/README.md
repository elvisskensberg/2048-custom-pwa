# Story Mode Screenshots & PDF Generation

This folder contains 1:1 ratio (1080×1080) screenshots of the About section for PDF generation.

## Files

- `page01-page10.png` - About section screenshots (10 pages)
- `elvis-ai-showcase.pdf` - Generated PDF from screenshots
- `generate-pdf.cjs` - Script to generate PDF from screenshots

## When to Regenerate

Regenerate screenshots and PDF whenever **any** of these files change:

### Content Changes
- `src/components/aboutData.ts` - About page content/topics
- `src/services/slidesService.ts` - Slide generation logic

### UI Changes
- `src/components/AboutSection.tsx` - About page UI
- `src/components/slides/` - Slide components

### Test Changes
- `e2e/app.spec.ts` - E2E test definitions

## Regeneration Workflow

```bash
# From project root
cd cube-swipe

# 1. Clean old screenshots
rm e2e/screenshots/story-mode/page*.png

# 2. Regenerate screenshots (Square-1080p device for 1:1 ratio)
npx playwright test --project=Square-1080p --grep="should navigate to About screen"

# 3. Verify screenshots
ls e2e/screenshots/story-mode

# 4. Generate PDF
cd e2e/screenshots/story-mode
node generate-pdf.cjs

# 5. Verify PDF
ls -lh elvis-ai-showcase.pdf
```

## Expected Output

After regeneration, you should have:
- ✅ Exactly 10 screenshot files (page01-page10)
- ✅ Clean sequential page numbering (no duplicates)
- ✅ PDF file (~10-15 MB)
- ✅ First screenshot (page01) shows current About page headline

## Troubleshooting

**Duplicate page numbers:**
- Clean all screenshots first: `rm page*.png`
- Regenerate from scratch

**PDF file too large (>20 MB):**
- Check for duplicate screenshots
- Verify only 10 images in folder

**Old content in PDF:**
- Verify aboutData.ts was updated
- Clear browser cache: `npx playwright test --grep="About" --project=Square-1080p`
- Check dev server reloaded changes (HMR)

## See Also

- [CLAUDE.md](../../../../CLAUDE.md) - Full E2E regeneration workflow
- [generate-pdf.cjs](./generate-pdf.cjs) - PDF generation script
- [playwright.config.ts](../../playwright.config.ts) - Square-1080p device config
