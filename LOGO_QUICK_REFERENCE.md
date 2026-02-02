# Liyaqa Logo Quick Reference

## 📦 Logo Files

| Logo Variation | File Name | Size | Use Case |
|---|---|---|---|
| **Primary Horizontal** | `logo-liyaqa-primary.svg` | 280×80 | Website headers, presentations, marketing |
| **Vertical/Stacked** | `logo-liyaqa-vertical.svg` | 160×160 | Social media profiles, square formats |
| **Icon-Only** | `logo-liyaqa-icon.svg` | 64×64 | App icons, avatars, watermarks |
| **Black Monochrome** | `logo-liyaqa-black.svg` | 280×80 | Light backgrounds, B&W printing |
| **White Monochrome** | `logo-liyaqa-white.svg` | 280×80 | Dark backgrounds, reversed applications |
| **Favicon** | `favicon.svg` | 32×32 | Browser tabs, bookmarks |

## 🎨 Brand Colors

```css
/* Primary Brand Color */
--sunset-coral: #FF6B4A;

/* Secondary/Accent */
--terracotta: #E85D3A;

/* Lighter Tint */
--coral-light: #FF9A82;

/* Neutrals */
--warm-white: #FAFAF9;
--warm-black: #1C1917;
```

## ✅ Quick Do's

- ✓ Use primary horizontal for web headers
- ✓ Use icon-only for favicons and app icons
- ✓ Maintain 20% clear space around logo
- ✓ Ensure sufficient contrast with background
- ✓ Use SVG format for web (scales perfectly)

## ❌ Quick Don'ts

- ✗ Don't stretch or distort
- ✗ Don't change colors (except approved variations)
- ✗ Don't add effects (shadows, outlines)
- ✗ Don't rotate at angles
- ✗ Don't display smaller than 120px wide (horizontal)

## 📏 Minimum Sizes

- **Horizontal Logo:** 120px width
- **Vertical Logo:** 100px width
- **Icon-Only:** 32px × 32px
- **Favicon:** 16px × 16px

## 🚀 Implementation

### HTML (Favicon)
```html
<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
```

### Next.js Image Component
```tsx
<Image
  src="/assets/logo-liyaqa-primary.svg"
  alt="Liyaqa"
  width={280}
  height={80}
/>
```

### Direct SVG
```tsx
<img src="/assets/logo-liyaqa-primary.svg" alt="Liyaqa" />
```

## 📱 View Logo Showcase

Navigate to: `/[locale]/branding/logo-showcase`

See all variations on different backgrounds with full specifications.

---

**Location:** `/frontend/public/assets/`
**Format:** SVG (vector, infinitely scalable)
**Created:** 2026-01-31
