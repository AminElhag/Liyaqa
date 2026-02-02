# Liyaqa Logo Assets

## Complete Logo System (Updated 2026-01-31)

This directory contains the complete Liyaqa logo system featuring contemporary Arabic calligraphy with a sunset coral color palette.

### SVG Files (Vector - Recommended)

| File | Dimensions | Description | Use Cases |
|------|-----------|-------------|-----------|
| `logo-liyaqa-primary.svg` | 280×80 | Horizontal wordmark in sunset coral | Website headers, presentations, marketing materials |
| `logo-liyaqa-vertical.svg` | 160×160 | Circular icon + wordmark stacked | Social media profiles, square formats |
| `logo-liyaqa-icon.svg` | 64×64 | Circular icon with "لياقة" on gradient | App icons, avatars, profile pictures |
| `favicon.svg` | 32×32 | Optimized circular favicon | Browser tabs, bookmarks (displays at 16×16) |
| `logo-liyaqa-black.svg` | 280×80 | Monochrome black wordmark | Light backgrounds, B&W printing |
| `logo-liyaqa-white.svg` | 280×80 | Monochrome white wordmark | Dark backgrounds, reversed applications |

### Icon Design (Updated)

**Current Icon:** Option 3 - Circular Gradient with White Text

The icon features:
- ⭕ **Circular background** with coral-to-terracotta gradient (#FF6B4A → #E85D3A)
- ✍️ **White Arabic text** "لياقة" (Liyaqa) in professional calligraphy fonts
- 🎨 **High contrast** design for excellent visibility on all backgrounds
- 📱 **Perfect circle** shape ideal for app icons and social media
- 📏 **Scalable** from 16px favicon to large display sizes

### Legacy Files (Old Logo System)

These files are kept for backward compatibility but should be replaced with the new logo system:

- `logo.svg` - Old primary logo
- `logo-white.svg` - Old white logo
- `logo-icon.svg` - Old geometric "ل" icon (blue gradient)
- `logo-minimal.svg` - Old minimal version
- `logo-minimal-white.svg` - Old minimal white version

**Note:** New implementations should use the `logo-liyaqa-*` files.

### Brand Colors

```css
/* Primary Brand Color - Sunset Coral */
--brand-primary: #FF6B4A;

/* Secondary - Terracotta */
--brand-secondary: #E85D3A;

/* Tint - Light Coral */
--brand-tint: #FF9A82;

/* Neutrals */
--brand-white: #FAFAF9;
--brand-black: #1C1917;
--brand-gray: #78716C;
```

### Usage Guidelines

#### ✅ DO
- Use SVG format for web (infinitely scalable)
- Maintain 20% clear space around logo
- Use primary horizontal for main website headers
- Use icon-only for app icons, favicons, and profile pictures
- Use monochrome versions when color is restricted
- Ensure sufficient contrast with background
- Use circular icon for social media profiles

#### ❌ DON'T
- Don't stretch or distort the logo
- Don't change the colors (except approved variations: primary, black, white)
- Don't add effects (shadows, outlines, gradients)
- Don't rotate at angles
- Don't place on busy backgrounds that reduce legibility
- Don't display smaller than minimum sizes:
  - Horizontal wordmark: 120px width
  - Vertical logo: 100px width
  - Icon: 32px × 32px
  - Favicon: 16px × 16px

### Implementation Examples

#### Next.js (Recommended)

```tsx
import Image from 'next/image'

// Horizontal logo in header
<Image
  src="/assets/logo-liyaqa-primary.svg"
  alt="Liyaqa"
  width={280}
  height={80}
  className="h-12 w-auto"
/>

// Circular icon for mobile or collapsed sidebar
<Image
  src="/assets/logo-liyaqa-icon.svg"
  alt="Liyaqa"
  width={64}
  height={64}
  className="h-10 w-10"
/>

// Vertical logo for square formats
<Image
  src="/assets/logo-liyaqa-vertical.svg"
  alt="Liyaqa"
  width={160}
  height={160}
  className="w-40"
/>

// White logo on dark background
<Image
  src="/assets/logo-liyaqa-white.svg"
  alt="Liyaqa"
  width={280}
  height={80}
  className="h-12 w-auto"
/>
```

#### HTML Favicon

```html
<!-- In <head> -->
<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
<link rel="apple-touch-icon" href="/assets/logo-liyaqa-icon.svg">
```

#### Direct Image Tag

```html
<!-- Primary logo -->
<img src="/assets/logo-liyaqa-primary.svg" alt="Liyaqa" style="height: 48px;">

<!-- Circular icon -->
<img src="/assets/logo-liyaqa-icon.svg" alt="Liyaqa" style="width: 64px; height: 64px;">
```

### Design Specifications

#### Icon (logo-liyaqa-icon.svg)
- **Size:** 64×64px
- **Shape:** Circle (radius: 30px)
- **Background:** Linear gradient (0° to 100°)
  - Start: #FF6B4A (Sunset Coral)
  - End: #E85D3A (Terracotta)
- **Text:** "لياقة" in white (#FFFFFF)
- **Fonts:** Lateef, Scheherazade New, Amiri (fallback: serif)
- **Font Size:** 24px
- **Font Weight:** 700 (Bold)

#### Favicon (favicon.svg)
- **Size:** 32×32px
- **Shape:** Circle (radius: 15px)
- **Background:** Same gradient as icon
- **Text:** "لياقة" in white
- **Font Size:** 13px (optimized for small display)

#### Vertical Logo (logo-liyaqa-vertical.svg)
- **Size:** 160×160px
- **Top:** Circular icon (64×64)
- **Middle:** "لياقة" wordmark in Amiri (36px, coral)
- **Bottom:** "ادير ناديك بأناقة" tagline (10px, gray)

#### Horizontal Logos (primary, black, white)
- **Size:** 280×80px
- **Text:** "لياقة" in Amiri (48px, bold)
- **Colors:**
  - Primary: #FF6B4A (coral) with #E85D3A outline
  - Black: #1C1917 with #292524 outline
  - White: #FAFAF9 with #E7E5E4 outline
- **Accent:** Decorative curved underline

### File History

- **2026-01-31**: Icon design updated to Option 3
  - Circular gradient background with white text
  - Full "لياقة" brand name visible
  - High contrast for all backgrounds
  - Perfect for app icons and social media

- **2026-01-31**: New logo system created (Phase 1 of Visual Identity)
  - Contemporary Arabic calligraphy style
  - Sunset coral color palette
  - 6 SVG variations
  - Professional fonts (Amiri, Lateef, Scheherazade)

- **2025-01-11**: Original logo system
  - Geometric Cairo font design
  - Sky blue color scheme

### Related Documentation

- **Logo Preview:** `/final-icon-preview.html` - View all icon sizes
- **Icon Comparison:** `/all-icons-comparison.html` - Compare design options
- **Complete Specs:** See `/PHASE_1_LOGO_SYSTEM_COMPLETE.md` in project root
- **Quick Reference:** See `/LOGO_QUICK_REFERENCE.md` in project root

### Future Enhancements (Planned)

- PNG exports in multiple sizes (16, 32, 64, 128, 256, 512, 1024px)
- Retina variants (@1x, @2x, @3x)
- Animated logo for loading states
- Social media optimized variations
- Print-ready formats (EPS, PDF)
- Dark mode variations
- Branded templates (presentations, documents)

---

**Created:** Phase 1 - Arabic Visual Identity & Design System
**Updated:** 2026-01-31 - Icon redesign (Option 3)
**Style:** Contemporary Calligraphic
**Fonts:** Amiri, Lateef, Scheherazade New
**Color Philosophy:** Desert sunset, warm Middle Eastern palette
**Icon Style:** Circular gradient with white Arabic text
