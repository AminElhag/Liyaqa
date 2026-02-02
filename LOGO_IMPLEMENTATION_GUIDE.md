# Liyaqa Logo Implementation Guide

Quick reference for developers implementing the new logo system.

---

## 🚀 Quick Start

### Import and Use in Next.js

```tsx
import Image from 'next/image'

// Horizontal logo (headers, large displays)
<Image
  src="/assets/logo-liyaqa-primary.svg"
  alt="Liyaqa"
  width={280}
  height={80}
  className="h-12 w-auto"
/>

// Icon-only (collapsed sidebar, mobile, avatars)
<Image
  src="/assets/logo-liyaqa-icon.svg"
  alt="Liyaqa"
  width={64}
  height={64}
  className="h-8 w-8"
/>

// White logo (dark backgrounds)
<Image
  src="/assets/logo-liyaqa-white.svg"
  alt="Liyaqa"
  width={280}
  height={80}
  className="h-12 w-auto"
/>

// Vertical/stacked (social media, square formats)
<Image
  src="/assets/logo-liyaqa-vertical.svg"
  alt="Liyaqa"
  width={160}
  height={160}
  className="h-32 w-32"
/>
```

---

## 📐 Logo Selection Guide

### Use Primary Horizontal Logo When:
- Website header/navigation
- Email signatures
- Presentation title slides
- Marketing materials (brochures, banners)
- Desktop applications
- Wide format displays

**File:** `logo-liyaqa-primary.svg`
**Dimensions:** 280×80
**Min Width:** 120px

### Use Vertical/Stacked Logo When:
- Social media profile images (Instagram, Facebook)
- Square ad formats
- Mobile app splash screens
- Business cards (vertical layout)
- Print collateral (square layouts)

**File:** `logo-liyaqa-vertical.svg`
**Dimensions:** 160×160
**Min Width:** 100px

### Use Icon-Only When:
- App icons (iOS, Android)
- Favicons
- Social media avatars (Twitter, LinkedIn)
- Watermarks
- Loading indicators
- Push notification icons
- Collapsed sidebar/navigation

**File:** `logo-liyaqa-icon.svg`
**Dimensions:** 64×64
**Min Size:** 32×32

### Use Black Monochrome When:
- Light-colored backgrounds
- Black and white printing
- Newspaper ads
- Fax/photocopies
- Light merchandise (white shirts, bags)
- Engraving templates

**File:** `logo-liyaqa-black.svg`
**Dimensions:** 280×80

### Use White Monochrome When:
- Dark backgrounds
- Dark-colored merchandise (black shirts, caps)
- Dark mode applications
- Video overlays
- Night mode interfaces
- Reversed/negative applications

**File:** `logo-liyaqa-white.svg`
**Dimensions:** 280×80

### Use Favicon When:
- Browser tab icons
- Bookmarks
- Browser history
- PWA manifest

**File:** `favicon.svg`
**Dimensions:** 32×32 (optimized for 16×16)

---

## 🎨 Color Reference

```css
/* CSS Custom Properties */
:root {
  --brand-primary: #FF6B4A;    /* Sunset Coral */
  --brand-secondary: #E85D3A;  /* Terracotta */
  --brand-tint: #FF9A82;       /* Light Coral */
  --brand-white: #FAFAF9;      /* Warm White */
  --brand-black: #1C1917;      /* Warm Black */
}
```

```tsx
// Tailwind CSS
className="bg-[#FF6B4A]"  // Sunset coral
className="text-[#E85D3A]" // Terracotta
```

---

## 🔧 Common Implementations

### 1. Website Header with Responsive Logo

```tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

export function Header() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <header className="flex items-center justify-between px-4 h-16 border-b">
      <Link href="/" className="flex items-center">
        {isCollapsed ? (
          // Icon-only for collapsed state
          <Image
            src="/assets/logo-liyaqa-icon.svg"
            alt="Liyaqa"
            width={64}
            height={64}
            className="h-8 w-8"
          />
        ) : (
          // Full logo for expanded state
          <Image
            src="/assets/logo-liyaqa-primary.svg"
            alt="Liyaqa"
            width={280}
            height={80}
            className="h-10 w-auto"
            priority
          />
        )}
      </Link>
      {/* Rest of header */}
    </header>
  )
}
```

### 2. Favicon in Root Layout

```tsx
// app/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Liyaqa - Gym Management System',
  description: 'Modern gym and fitness center management platform',
  icons: {
    icon: '/assets/favicon.svg',
    apple: '/assets/logo-liyaqa-icon.svg',
  },
}
```

### 3. PWA Manifest

```ts
// app/manifest.ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Liyaqa - Gym Management',
    short_name: 'Liyaqa',
    theme_color: '#FF6B4A',
    icons: [
      {
        src: '/assets/logo-liyaqa-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/assets/favicon.svg',
        sizes: '32x32',
        type: 'image/svg+xml',
      },
    ],
  }
}
```

### 4. Dark Mode Aware Logo

```tsx
'use client'

import Image from 'next/image'
import { useTheme } from 'next-themes'

export function AdaptiveLogo() {
  const { theme } = useTheme()

  return (
    <Image
      src={theme === 'dark' ? '/assets/logo-liyaqa-white.svg' : '/assets/logo-liyaqa-primary.svg'}
      alt="Liyaqa"
      width={280}
      height={80}
      className="h-10 w-auto"
    />
  )
}
```

### 5. Loading Spinner with Logo

```tsx
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative">
        {/* Outer rotating ring */}
        <div className="absolute inset-0 border-4 border-transparent border-t-[#FF6B4A] rounded-full animate-spin" />

        {/* Logo icon in center */}
        <Image
          src="/assets/logo-liyaqa-icon.svg"
          alt="Loading"
          width={64}
          height={64}
          className="h-16 w-16"
        />
      </div>
    </div>
  )
}
```

### 6. Social Share Image (OG Image)

```tsx
// app/layout.tsx or page.tsx
export const metadata: Metadata = {
  openGraph: {
    images: ['/assets/logo-liyaqa-vertical.svg'],
  },
  twitter: {
    card: 'summary',
    images: ['/assets/logo-liyaqa-icon.svg'],
  },
}
```

### 7. Email Template

```html
<!-- HTML Email -->
<table>
  <tr>
    <td style="padding: 20px;">
      <img
        src="https://yourdomain.com/assets/logo-liyaqa-primary.svg"
        alt="Liyaqa"
        width="280"
        height="80"
        style="height: 60px; width: auto;"
      />
    </td>
  </tr>
</table>
```

### 8. Print Stylesheet

```css
/* print.css */
@media print {
  .logo {
    content: url('/assets/logo-liyaqa-black.svg');
    height: 40px;
    width: auto;
  }
}
```

---

## 📏 Size Guidelines

### Recommended Sizes by Context

| Context | Logo Type | Width | Height | CSS Class Example |
|---------|-----------|-------|--------|-------------------|
| **Desktop Header** | Primary | 200-280px | auto | `h-12 w-auto` |
| **Mobile Header** | Icon | 32-40px | 32-40px | `h-8 w-8` |
| **Sidebar (expanded)** | White | 160-200px | auto | `h-10 w-auto` |
| **Sidebar (collapsed)** | Icon | 32-40px | 32-40px | `h-8 w-8` |
| **Login Hero** | White | 280-320px | auto | `h-16 w-auto` |
| **Email Header** | Primary | 240-280px | auto | `height: 60px` |
| **Social Profile** | Vertical | 160-200px | 160-200px | `h-32 w-32` |
| **App Icon** | Icon | 1024px | 1024px | Native size |
| **Favicon** | Favicon | 32px | 32px | Native size |
| **Footer** | Primary | 120-160px | auto | `h-8 w-auto` |

---

## ✅ Do's and Don'ts

### ✓ DO

```tsx
// ✓ Use Next.js Image component
<Image src="/assets/logo-liyaqa-primary.svg" alt="Liyaqa" width={280} height={80} />

// ✓ Maintain aspect ratio
className="h-12 w-auto"

// ✓ Use appropriate variation for context
{isDarkBg ? 'logo-liyaqa-white.svg' : 'logo-liyaqa-primary.svg'}

// ✓ Ensure minimum sizes
<Image src="/assets/logo-liyaqa-primary.svg" width={280} height={80} className="min-w-[120px]" />

// ✓ Add alt text
alt="Liyaqa - Gym Management"
```

### ✗ DON'T

```tsx
// ✗ Don't set fixed width and height (distorts aspect ratio)
<Image src="..." width={200} height={200} /> // Wrong!

// ✗ Don't use CSS filters to change color
className="grayscale brightness-150" // Use monochrome versions instead!

// ✗ Don't add effects
className="drop-shadow-lg blur-sm" // Don't!

// ✗ Don't display too small
<Image src="..." className="h-2" /> // Below minimum!

// ✗ Don't rotate
className="rotate-45" // Don't!
```

---

## 🎯 Accessibility

```tsx
// Always include meaningful alt text
<Image
  src="/assets/logo-liyaqa-primary.svg"
  alt="Liyaqa - Gym Management System"
  width={280}
  height={80}
/>

// For decorative instances (rare), use empty alt
<Image
  src="/assets/logo-liyaqa-icon.svg"
  alt=""
  aria-hidden="true"
  width={64}
  height={64}
/>

// Link logos to homepage with aria-label
<Link href="/" aria-label="Liyaqa Homepage">
  <Image src="/assets/logo-liyaqa-primary.svg" alt="" width={280} height={80} />
</Link>
```

---

## 📱 Responsive Examples

### Mobile-First Logo

```tsx
export function ResponsiveLogo() {
  return (
    <>
      {/* Mobile: Icon only */}
      <Image
        src="/assets/logo-liyaqa-icon.svg"
        alt="Liyaqa"
        width={64}
        height={64}
        className="h-8 w-8 md:hidden"
      />

      {/* Desktop: Full logo */}
      <Image
        src="/assets/logo-liyaqa-primary.svg"
        alt="Liyaqa"
        width={280}
        height={80}
        className="hidden md:block h-10 w-auto"
      />
    </>
  )
}
```

### Tablet/Desktop Breakpoint

```tsx
export function AdaptiveHeaderLogo() {
  return (
    <div className="flex items-center">
      {/* Small screens: Icon */}
      <Image
        src="/assets/logo-liyaqa-icon.svg"
        alt="Liyaqa"
        width={64}
        height={64}
        className="h-8 w-8 sm:hidden"
      />

      {/* Medium screens: Smaller logo */}
      <Image
        src="/assets/logo-liyaqa-primary.svg"
        alt="Liyaqa"
        width={280}
        height={80}
        className="hidden sm:block lg:hidden h-8 w-auto"
      />

      {/* Large screens: Full size logo */}
      <Image
        src="/assets/logo-liyaqa-primary.svg"
        alt="Liyaqa"
        width={280}
        height={80}
        className="hidden lg:block h-12 w-auto"
      />
    </div>
  )
}
```

---

## 🔍 File Paths Reference

```
All logos are in: /frontend/public/assets/

Primary logo:     /assets/logo-liyaqa-primary.svg
Vertical logo:    /assets/logo-liyaqa-vertical.svg
Icon-only:        /assets/logo-liyaqa-icon.svg
Black monochrome: /assets/logo-liyaqa-black.svg
White monochrome: /assets/logo-liyaqa-white.svg
Favicon:          /assets/favicon.svg
```

---

## 🧪 Testing Checklist

When implementing logos, verify:

- [ ] Logo displays correctly at minimum size (120px horizontal, 32px icon)
- [ ] Logo maintains aspect ratio (no squishing/stretching)
- [ ] Logo is crisp on retina displays
- [ ] Logo works on light backgrounds (primary or black version)
- [ ] Logo works on dark backgrounds (white version)
- [ ] Logo works on brand color backgrounds (white or black version)
- [ ] Logo has proper alt text for accessibility
- [ ] Favicon appears in browser tab
- [ ] Logo links to homepage (if applicable)
- [ ] Logo loads quickly (SVG should be ~1-3KB)
- [ ] Logo is responsive (adapts to screen size if needed)

---

## 📞 Questions?

**Where are the logos?**
`/frontend/public/assets/logo-liyaqa-*.svg`

**Which logo should I use?**
See "Logo Selection Guide" above

**Can I change the color?**
Use the monochrome (black/white) versions instead of CSS filters

**Can I add effects?**
No - use logos as-is for brand consistency

**What's the minimum size?**
120px width for horizontal, 32×32 for icon

**Do I need PNG versions?**
No - SVG works everywhere and scales perfectly

---

**Need more help?** See full documentation in:
- `PHASE_1_LOGO_SYSTEM_COMPLETE.md`
- `LOGO_QUICK_REFERENCE.md`
- `frontend/public/assets/README.md`

---

**Created:** 2026-01-31
**Phase:** 1 - Logo System Implementation
