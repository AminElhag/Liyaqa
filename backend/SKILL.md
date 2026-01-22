---
name: backend-to-figma
description: "Analyze Spring Boot backend code and generate UI designs. Use when creating designs from API endpoints, entities, or DTOs. Outputs HTML prototypes convertible to Figma."
---

# Backend to Figma Design Skill

Analyze Spring Boot/Kotlin backend code and generate production-ready HTML prototypes that can be converted to Figma files.

## Workflow

1. **Analyze** backend entities, DTOs, and endpoints
2. **Map** data structures to UI components
3. **Generate** HTML/CSS prototypes
4. **Serve** locally for Figma conversion

## Step 1: Backend Analysis

When given backend code, extract:

### From Entities/DTOs
Entity Field → UI Element Mapping:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
String (short)      → Text input
String (long)       → Textarea
String (email)      → Email input
String (phone)      → Phone input with mask
Boolean             → Toggle switch / Checkbox
Enum                → Dropdown / Radio group
LocalDate           → Date picker
LocalDateTime       → DateTime picker
LocalTime           → Time picker
BigDecimal (money)  → Currency input
Int/Long (count)    → Number input
UUID (reference)    → Select dropdown (async)
List<T>             → Multi-select / Table
Set<T>              → Tag input / Chips

### From REST Endpoints
HTTP Method → UI Pattern:
━━━━━━━━━━━━━━━━━━━━━━━━━
GET /items          → List/Table view
GET /items/{id}     → Detail view
POST /items         → Create form
PUT /items/{id}     → Edit form
DELETE /items/{id}  → Delete confirmation modal
GET /items/search   → Search + Filter panel

### From Validation Annotations
@NotNull/@NotBlank  → Required field indicator (*)
@Size(min,max)      → Character counter
@Min/@Max           → Number range hint
@Email              → Email format validation
@Pattern            → Input mask or hint
@Past/@Future       → Date restriction

## Step 2: Generate Screen Inventory

Create a screen list based on backend structure:
```markdown
## Screen Inventory for [Entity]

### List Screen
- Table with columns: [mapped from DTO fields]
- Search bar: [searchable fields]
- Filters: [enum/boolean/date fields]
- Actions: Create, Edit, Delete, View

### Detail Screen
- Header: [primary identifier]
- Info cards: [grouped fields]
- Related data: [referenced entities]
- Actions: Edit, Delete, Back

### Create/Edit Form
- Form fields: [mapped from CreateDTO/UpdateDTO]
- Validation: [from annotations]
- Actions: Save, Cancel

### Dashboard (if applicable)
- Stats cards: [aggregated counts]
- Charts: [time-series data]
- Quick actions: [common operations]
```

## Step 3: Generate HTML Prototype

### Project Structure
prototype/
├── index.html          # Dashboard/Home
├── [entity]/
│   ├── list.html       # List view
│   ├── detail.html     # Detail view
│   ├── form.html       # Create/Edit form
│   └── components/     # Reusable parts
├── css/
│   └── styles.css      # Tailwind + custom
├── js/
│   └── app.js          # Interactions
└── assets/
└── images/

### HTML Template (List View)
```html
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Entity] List - Liyaqa</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #0F172A;
      --accent: #3B82F6;
      --success: #10B981;
      --warning: #F59E0B;
      --danger: #EF4444;
      --surface: #F8FAFC;
      --border: #E2E8F0;
    }
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
  </style>
</head>
<body class="bg-gray-50 min-h-screen">
  <!-- Sidebar -->
  <aside class="fixed left-0 top-0 w-64 h-full bg-slate-900 text-white">
    <!-- Navigation -->
  </aside>
  
  <!-- Main Content -->
  <main class="ml-64 p-8">
    <!-- Page Header -->
    <header class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">[Entity] Management</h1>
        <p class="text-slate-500">Manage your [entities]</p>
      </div>
      <button class="bg-blue-600 text-white px-4 py-2 rounded-lg">
        + Add [Entity]
      </button>
    </header>
    
    <!-- Search & Filters -->
    <div class="bg-white rounded-xl shadow-sm p-4 mb-6">
      <!-- Filter controls -->
    </div>
    
    <!-- Data Table -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <table class="w-full">
        <thead class="bg-slate-50 border-b">
          <tr>
            <!-- Column headers from DTO -->
          </tr>
        </thead>
        <tbody>
          <!-- Sample data rows -->
        </tbody>
      </table>
    </div>
  </main>
</body>
</html>
```

## Step 4: Serve for Figma Conversion
```bash
# Option 1: Python simple server
cd prototype
python -m http.server 3000

# Option 2: Live Server (VS Code)
# Right-click index.html → Open with Live Server

# Option 3: Vite (for more complex prototypes)
npm create vite@latest prototype -- --template vanilla
cd prototype && npm run dev
```

## Step 5: Convert to Figma

### Using html.to.design Plugin
1. Open Figma Desktop
2. Install "html.to.design" plugin from Community
3. Run the plugin
4. Paste: `http://localhost:3000/members/list.html`
5. Click "Import"
6. Result: Fully editable Figma layers with Auto Layout

### Post-Import Cleanup
- [ ] Organize into pages (Dashboard, Members, Bookings, etc.)
- [ ] Create component library from repeated elements
- [ ] Define color/text styles
- [ ] Add states (hover, active, disabled)
- [ ] Create interactive prototypes

## Design System Output

Also generate a design tokens file:
```json
{
  "colors": {
    "primary": { "value": "#0F172A" },
    "accent": { "value": "#3B82F6" },
    "success": { "value": "#10B981" },
    "warning": { "value": "#F59E0B" },
    "danger": { "value": "#EF4444" },
    "surface": { "value": "#F8FAFC" },
    "border": { "value": "#E2E8F0" }
  },
  "typography": {
    "fontFamily": "Plus Jakarta Sans",
    "heading1": { "fontSize": "24px", "fontWeight": "700" },
    "heading2": { "fontSize": "20px", "fontWeight": "600" },
    "body": { "fontSize": "14px", "fontWeight": "400" },
    "caption": { "fontSize": "12px", "fontWeight": "400" }
  },
  "spacing": {
    "xs": "4px",
    "sm": "8px",
    "md": "16px",
    "lg": "24px",
    "xl": "32px"
  },
  "borderRadius": {
    "sm": "4px",
    "md": "8px",
    "lg": "12px",
    "xl": "16px"
  }
}
```

## RTL Support (Arabic)

For Saudi Arabian market, include RTL variant:
```html
<html lang="ar" dir="rtl">
```
```css
/* RTL-specific styles */
[dir="rtl"] .sidebar { left: auto; right: 0; }
[dir="rtl"] .main { margin-left: 0; margin-right: 16rem; }
[dir="rtl"] .icon-chevron { transform: scaleX(-1); }
```

## Example Usage
User: "Create designs for my Member entity"
Claude analyzes:

MemberResponse DTO
MemberController endpoints
Validation rules

Claude generates:

members/list.html - Members table with search/filter
members/detail.html - Member profile view
members/form.html - Create/Edit member form
Design tokens JSON
Screen inventory document

User converts to Figma using html.to.design


Quick Setup Commands
bash# 1. Create the skill
mkdir -p ~/.claude/skills/backend-to-figma
# Copy SKILL.md content above

# 2. Verify
claude
/skills
# Should show: backend-to-figma

Complete Workflow Steps
Step 1: Analyze Your Backend
In Claude Code, navigate to your Liyaqa project:
bashcd /path/to/liyaqa-backend
claude
Then prompt:
Analyze my Spring Boot backend and create a complete
UI design prototype. Focus on:
- Member management (list, create, edit, detail)
- Class scheduling and booking
- Trainer management
- Dashboard with key metrics

Generate HTML prototypes I can convert to Figma.
Step 2: Serve the Prototype
bashcd prototype
python -m http.server 3000
# Open http://localhost:3000
Step 3: Convert to Figma

Install Plugin: In Figma → Plugins → Search "html.to.design"
Run Plugin: Right-click canvas → Plugins → html.to.design
Import Each Page:

http://localhost:3000/dashboard.html
http://localhost:3000/members/list.html
http://localhost:3000/members/form.html
etc.


Organize: Create Figma pages for each section

Step 4: Polish in Figma
After import:

Create reusable components
Define color/text styles
Add hover/active states
Build interactive prototypes
Export design system