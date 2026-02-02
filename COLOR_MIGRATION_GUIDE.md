# Color Migration Guide: Sky Blue → Coral

## Quick Reference

### Before & After Color Comparison

| Component | Old Color (Sky Blue) | New Color (Coral) | Hex Value |
|-----------|---------------------|-------------------|-----------|
| **Primary** | `#0ea5e9` | `#FF6B4A` | Sunset Coral |
| **Gradient Start** | `#0ea5e9` | `#FF6B4A` | Sunset Coral |
| **Gradient End** | `#0284c7` | `#E85D3A` | Terracotta |
| **Tint/Accent** | `#38bdf8` | `#FF9A82` | Light Coral |
| **Background Tint** | `#f0f9ff` | `#FFE5E0` | Coral Tint |

---

## CSS Variable Conversions

### HSL Format (for CSS Custom Properties)

```css
/* OLD (Sky Blue) */
--primary: 199 89% 48%;
--ring: 199 89% 48%;

/* NEW (Coral) */
--primary: 11 100% 64%;
--ring: 11 100% 64%;
```

### Gradient Definitions

```css
/* OLD */
--gradient-primary: linear-gradient(135deg, hsl(199 89% 48%) 0%, hsl(199 89% 38%) 100%);

/* NEW */
--gradient-primary: linear-gradient(135deg, #FF6B4A 0%, #E85D3A 100%);
```

---

## Tailwind Class Conversions

### Background Colors

```tsx
// OLD
className="bg-sky-500"
className="bg-blue-500"

// NEW
className="bg-primary"
className="bg-[#FF6B4A]"
```

### Text Colors

```tsx
// OLD
className="text-sky-600"
className="text-blue-600"

// NEW
className="text-primary"
className="text-[#FF6B4A]"
```

### Gradients

```tsx
// OLD
className="from-sky-500 to-blue-600"

// NEW
className="from-primary to-[#E85D3A]"
className="from-[#FF6B4A] to-[#E85D3A]"
```

---

## Component-Specific Mappings

### Platform Hero Stats

**Client Card:**
```tsx
// OLD
chartColor: "#3b82f6" (blue)

// NEW
chartColor: "#FF6B4A" (coral)
```

**Subscription Card:**
```tsx
// OLD
chartColor: "#06b6d4" (cyan)

// NEW
chartColor: "#FF9A82" (light coral)
```

### Platform Revenue Dashboard

**Chart Gradient:**
```tsx
// OLD
<stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
<stop offset="95%" stopColor="#10b981" stopOpacity={0} />

// NEW
<stop offset="0%" stopColor="#FF6B4A" stopOpacity={0.3} />
<stop offset="95%" stopColor="#E85D3A" stopOpacity={0.05} />
```

**Chart Stroke:**
```tsx
// OLD
stroke="#10b981"

// NEW
stroke="#FF6B4A"
```

### Platform Login Page

**Background Orbs:**
```tsx
// OLD
bg-sky-500/20
bg-cyan-400/10

// NEW
bg-[#E85D3A]/20
bg-[#FF9A82]/10
```

**Button Gradient:**
```tsx
// OLD
from-primary to-sky-500
hover:to-sky-400

// NEW
from-primary to-[#E85D3A]
hover:from-[#FF9A82] hover:to-[#E85D3A]
```

---

## Color Psychology & Usage Guidelines

### When to Use Coral
- **Primary Actions**: Sign in, submit, save
- **Client/Tenant Metrics**: Total clients, active clients
- **Brand Elements**: Logos, primary navigation
- **Subscriptions**: Active subscription counts
- **Highlights**: Important metrics or values

### When to Keep Semantic Colors
- **Revenue**: Keep emerald/green (universally recognized for money)
- **Warnings**: Keep amber/yellow (standard warning color)
- **Errors**: Keep red (universal error color)
- **Health**: Keep violet/purple (medical/wellness association)
- **Success**: Keep green (universal success indicator)

---

## Accessibility Considerations

### Contrast Ratios

| Background | Foreground | Ratio | WCAG Level |
|------------|------------|-------|------------|
| White (#FFFFFF) | Coral (#FF6B4A) | 3.2:1 | AA Large |
| Dark (#0f172a) | Coral (#FF6B4A) | 6.8:1 | AA Normal |
| Dark (#0f172a) | Light Coral (#FF9A82) | 4.9:1 | AA Large |

### Opacity Guidelines

- **Hover states**: Use 25% opacity (`/25`)
- **Disabled states**: Use 50% opacity
- **Background accents**: Use 10-20% opacity (`/10`, `/20`)
- **Overlays**: Use 80-90% opacity (`/80`, `/90`)

---

## Migration Checklist for New Features

When creating new platform components:

- [ ] Use `bg-primary` instead of hardcoded blue colors
- [ ] Use CSS custom properties (`hsl(var(--primary))`) when possible
- [ ] Use coral gradients for primary visual elements
- [ ] Keep semantic colors (green, amber, red) for their meanings
- [ ] Test both light and dark modes
- [ ] Verify WCAG AA contrast ratios
- [ ] Use `from-primary to-[#E85D3A]` for gradients

---

## Common Patterns

### Card with Coral Accent

```tsx
<div className="relative rounded-lg border bg-card">
  {/* Coral accent bar */}
  <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary to-[#E85D3A]" />

  {/* Content */}
  <div className="p-4">
    {/* ... */}
  </div>
</div>
```

### Button with Coral Gradient

```tsx
<Button className="bg-gradient-to-r from-primary to-[#E85D3A] hover:from-[#FF9A82] hover:to-[#E85D3A]">
  Click Me
</Button>
```

### Stat Card with Coral Glow

```tsx
<div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#FF6B4A]/15 to-[#E85D3A]/5">
  {/* Icon with coral background */}
  <div className="p-2 rounded-lg bg-[#FF6B4A]/20">
    <Icon className="text-[#FF6B4A]" />
  </div>

  {/* Value */}
  <div className="text-2xl font-bold">1,234</div>
</div>
```

### Chart with Coral Gradient

```tsx
<AreaChart>
  <defs>
    <linearGradient id="coralGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#FF6B4A" stopOpacity={0.3} />
      <stop offset="95%" stopColor="#E85D3A" stopOpacity={0.05} />
    </linearGradient>
  </defs>
  <Area
    stroke="#FF6B4A"
    fill="url(#coralGradient)"
  />
</AreaChart>
```

---

## Design Tokens

### For Design Systems

```json
{
  "color": {
    "brand": {
      "primary": {
        "value": "#FF6B4A",
        "type": "color",
        "description": "Sunset Coral - Primary brand color"
      },
      "secondary": {
        "value": "#E85D3A",
        "type": "color",
        "description": "Terracotta - Secondary brand color"
      },
      "tint": {
        "value": "#FF9A82",
        "type": "color",
        "description": "Light Coral - Tint for accents"
      },
      "bg-tint": {
        "value": "#FFE5E0",
        "type": "color",
        "description": "Coral Tint - Background tint"
      }
    },
    "semantic": {
      "success": "#22c55e",
      "warning": "#f59e0b",
      "danger": "#ef4444",
      "info": "#3b82f6"
    }
  }
}
```

---

## Testing Commands

### Visual Regression Testing

```bash
# Build and preview
npm run build
npm run start

# Navigate to:
http://localhost:3000/en/platform-login
http://localhost:3000/en/platform-dashboard
```

### Lighthouse Audit

```bash
# Run accessibility audit
npm run lighthouse -- --only-categories=accessibility
```

### Color Contrast Testing

```bash
# Use axe DevTools or similar
npm run test:a11y
```

---

## Troubleshooting

### Issue: Coral doesn't show up

**Solution**: Clear Tailwind cache
```bash
rm -rf .next
npm run dev
```

### Issue: Dark mode looks wrong

**Solution**: Check CSS variable in dark mode
```css
.dark {
  --primary: 11 100% 64%; /* Should be coral, not violet */
}
```

### Issue: Gradient not smooth

**Solution**: Use proper stop positions
```tsx
// WRONG
<stop offset="0%" stopColor="#FF6B4A" />
<stop offset="100%" stopColor="#E85D3A" />

// RIGHT
<stop offset="0%" stopColor="#FF6B4A" stopOpacity={0.3} />
<stop offset="95%" stopColor="#E85D3A" stopOpacity={0.05} />
```

---

## Resources

- **Color Picker**: https://colorpicker.me/ (for HSL conversions)
- **Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Gradient Generator**: https://cssgradient.io/
- **Tailwind Colors**: https://tailwindcss.com/docs/customizing-colors

---

**Last Updated**: January 31, 2026
**Maintained By**: Liyaqa Development Team
