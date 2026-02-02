# Quick Reference: Coral Design System

## 🎨 Color Palette

```
Primary (Sunset Coral):     #FF6B4A
Secondary (Terracotta):      #E85D3A
Tint (Light Coral):          #FF9A82
Background Tint:             #FFE5E0
```

## 📝 CSS Variables

```css
/* Use in your code */
hsl(var(--primary))              /* #FF6B4A */
hsl(var(--brand-coral))          /* #FF6B4A */
hsl(var(--brand-terracotta))     /* #E85D3A */
hsl(var(--brand-tint))           /* #FF9A82 */
```

## 🔧 Tailwind Classes

```tsx
/* Background */
bg-primary                       /* Coral background */
bg-[#FF6B4A]                     /* Direct hex */

/* Text */
text-primary                     /* Coral text */
text-[#FF6B4A]                   /* Direct hex */

/* Gradients */
from-primary to-[#E85D3A]        /* Coral gradient */
from-[#FF6B4A] to-[#E85D3A]      /* Full gradient */
```

## 📊 Component Examples

### Button
```tsx
<Button className="bg-gradient-to-r from-primary to-[#E85D3A]">
  Click Me
</Button>
```

### Stat Card
```tsx
<div className="rounded-xl bg-gradient-to-br from-[#FF6B4A]/15 to-[#E85D3A]/5">
  {/* Content */}
</div>
```

### Chart
```tsx
<linearGradient id="coral" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0%" stopColor="#FF6B4A" stopOpacity={0.3} />
  <stop offset="95%" stopColor="#E85D3A" stopOpacity={0.05} />
</linearGradient>
```

## 🗂 Files Changed

1. `tailwind.config.ts` - Primary colors
2. `globals.css` - CSS variables
3. `platform-hero-stats.tsx` - Stat cards
4. `platform-revenue-dashboard.tsx` - Charts
5. `revenue-chart.tsx` - Progress bars
6. `platform-login/page.tsx` - Login page

## ✅ Checklist

- [x] Tailwind config updated
- [x] CSS variables updated
- [x] Hero stats updated
- [x] Revenue dashboard updated
- [x] Login page updated
- [ ] Visual QA complete
- [ ] Accessibility tested
- [ ] Production deployed

## 🔗 Resources

- **Full Changelog**: `DESIGN_SYSTEM_APPLIED.md`
- **Migration Guide**: `COLOR_MIGRATION_GUIDE.md`
- **Visual Preview**: `frontend/public/design-system-preview.html`
- **Complete Summary**: `IMPLEMENTATION_COMPLETE.md`

## 🚀 Test It

```bash
npm run dev
# Visit: http://localhost:3000/en/platform-dashboard
```

---
**Last Updated**: January 31, 2026
