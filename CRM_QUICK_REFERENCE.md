# CRM & Lead Management - Quick Reference Guide

## 🚀 Quick Start

### Accessing the CRM

**Base URL:** `/[locale]/leads` (e.g., `/en/leads` or `/ar/leads`)

**Main Navigation:**
```
/leads                  → Lead list with filters
/leads/new              → Create new lead
/leads/[id]             → Lead detail view
/leads/pipeline         → Kanban pipeline view
/leads/dashboard        → Analytics dashboard
/leads/follow-ups       → Follow-ups management (NEW)
/leads/forms            → Lead capture forms
```

---

## 📋 Key Features by Page

### Lead List (`/leads`)

**Actions Available:**
- 🔍 Search by name, email, phone
- 🎯 Filter by status, source, date range
- 📊 View stats by status (clickable cards)
- ➕ Create new lead
- 🔄 Refresh data
- 📈 Navigate to dashboard
- 📋 Navigate to pipeline
- 🔔 Navigate to follow-ups

**Bulk Operations:**
- Select multiple leads
- Bulk assign to user
- Bulk delete

### Lead Detail (`/leads/[id]`)

**Tabs:**
1. **Details**: Contact info, journey timeline, campaign attribution, notes
2. **Timeline**: Activity history with follow-up indicators

**Quick Actions:**
- 📞 Call, ✉️ Email, 💬 SMS, 📱 WhatsApp
- 🏢 Schedule Tour (when contacted)
- 📝 Log Activity

**Status Transitions:**
- NEW → Mark Contacted
- CONTACTED → Schedule Tour
- TOUR_SCHEDULED → Start Trial
- Any → Mark Lost
- LOST → Reopen

### Pipeline (`/leads/pipeline`)

**Features:**
- Kanban board with 7 columns (NEW → WON/LOST)
- Drag-and-drop between stages
- Filter by assignee, source, date range
- Stats summary (total, active, won, conversion rate)

### Dashboard (`/leads/dashboard`)

**Widgets:**
- 📊 Pipeline stats cards
- 📈 Conversion funnel chart
- 🥧 Source breakdown chart
- 📋 Activity breakdown
- 🚨 Overdue follow-ups
- 🆕 Recent leads

### Follow-ups (`/leads/follow-ups`) ✨ NEW

**Tabs:**
1. **Pending**: Scheduled follow-ups not yet due
2. **Overdue**: Past-due follow-ups needing attention

**Features:**
- Stats cards (pending, overdue, total)
- View lead details
- Complete follow-up
- Overdue indicators (red text)

---

## 🎨 UI Components Reference

### Badge Components (NEW)

```typescript
import { LeadStatusBadge } from "@/components/admin/leads/lead-status-badge";
import { LeadPriorityBadge } from "@/components/admin/leads/lead-priority-badge";
import { LeadSourceBadge } from "@/components/admin/leads/lead-source-badge";

// Usage
<LeadStatusBadge status="NEW" />
<LeadPriorityBadge priority="HIGH" />
<LeadSourceBadge source="REFERRAL" showIcon={true} />
```

### Query Hooks

```typescript
import {
  useLeads,
  useLead,
  useCreateLead,
  useUpdateLead,
  useDeleteLead,
  useMarkLeadContacted,
  useAssignLead,
  useLogLeadActivity,
  usePendingFollowUps,
  useOverdueFollowUps,
  usePipelineStats
} from "@/queries/use-leads";

// Example usage
const { data, isLoading } = useLeads({
  page: 0,
  size: 20,
  status: "NEW"
});

const createMutation = useCreateLead();
createMutation.mutate({
  name: "John Doe",
  email: "john@example.com",
  source: "WEBSITE"
});
```

### Validation Schemas

```typescript
import {
  createLeadSchema,
  logActivitySchema,
  bulkAssignSchema
} from "@/lib/validations/lead";

// Example usage with React Hook Form
const form = useForm({
  resolver: zodResolver(createLeadSchema),
  defaultValues: {
    name: "",
    email: "",
    source: "WEBSITE"
  }
});
```

---

## 📊 Lead Statuses

| Status | Color | Next Transition |
|--------|-------|-----------------|
| NEW | Blue | Mark Contacted |
| CONTACTED | Purple | Schedule Tour |
| TOUR_SCHEDULED | Yellow | Start Trial |
| TRIAL | Orange | Move to Negotiation |
| NEGOTIATION | Indigo | Mark Won or Lost |
| WON | Green | Final (converted) |
| LOST | Red | Reopen |

---

## 🎯 Lead Sources

| Source | Icon | Usage |
|--------|------|-------|
| REFERRAL | Users | Member referrals |
| WALK_IN | Footprints | Direct gym visits |
| SOCIAL_MEDIA | Share2 | Facebook, Instagram, etc. |
| PAID_ADS | DollarSign | Google Ads, Facebook Ads |
| WEBSITE | Globe | Website form submissions |
| PHONE_CALL | Phone | Inbound calls |
| EMAIL | Mail | Email inquiries |
| PARTNER | Handshake | Partner referrals |
| EVENT | Calendar | Events, expos |
| OTHER | MoreHorizontal | Other sources |

---

## 🔔 Activity Types

| Type | When to Use |
|------|-------------|
| CALL | Phone conversation |
| EMAIL | Email sent/received |
| SMS | Text message |
| WHATSAPP | WhatsApp message |
| MEETING | In-person meeting |
| TOUR | Facility tour |
| NOTE | General note |
| STATUS_CHANGE | Auto-logged on status change |
| ASSIGNMENT | Auto-logged on assignment |
| FOLLOW_UP_SCHEDULED | Auto-logged when scheduling |
| FOLLOW_UP_COMPLETED | Auto-logged when completing |

---

## 🔧 API Endpoints Used

**CRUD:**
- `GET /api/leads` - List leads with filters
- `GET /api/leads/{id}` - Get single lead
- `POST /api/leads` - Create lead
- `PUT /api/leads/{id}` - Update lead
- `DELETE /api/leads/{id}` - Delete lead

**Status Transitions:**
- `POST /api/leads/{id}/contact` - Mark contacted
- `POST /api/leads/{id}/schedule-tour` - Schedule tour
- `POST /api/leads/{id}/start-trial` - Start trial
- `POST /api/leads/{id}/convert` - Convert to member
- `POST /api/leads/{id}/mark-lost` - Mark as lost
- `POST /api/leads/{id}/reopen` - Reopen lead

**Assignment:**
- `POST /api/leads/{id}/assign` - Assign lead
- `POST /api/leads/bulk-assign` - Bulk assign

**Activities:**
- `GET /api/leads/{id}/activities` - Get activities
- `POST /api/leads/{id}/activities` - Log activity
- `POST /api/leads/activities/{id}/complete` - Complete follow-up
- `DELETE /api/leads/activities/{id}` - Delete activity

**Follow-ups:**
- `GET /api/leads/follow-ups/pending` - Pending follow-ups
- `GET /api/leads/follow-ups/overdue` - Overdue follow-ups

**Statistics:**
- `GET /api/leads/stats/pipeline` - Pipeline statistics
- `GET /api/leads/stats/sources` - Source statistics
- `GET /api/leads/stats/activities` - Activity statistics

---

## 🌍 Bilingual Support

All text is available in **English (EN)** and **Arabic (AR)**:

```typescript
// Status labels
LEAD_STATUS_LABELS.NEW.en // "New"
LEAD_STATUS_LABELS.NEW.ar // "جديد"

// Source labels
LEAD_SOURCE_LABELS.REFERRAL.en // "Referral"
LEAD_SOURCE_LABELS.REFERRAL.ar // "إحالة"

// Priority labels
LEAD_PRIORITY_LABELS.HIGH.en // "High"
LEAD_PRIORITY_LABELS.HIGH.ar // "عالي"
```

**Usage in components:**
```typescript
const locale = useLocale();
const isArabic = locale === "ar";
const label = LEAD_STATUS_LABELS[status];

return <span>{isArabic ? label.ar : label.en}</span>;
```

---

## 🎓 Common Workflows

### 1. Creating a New Lead

```
Navigate to /leads
↓
Click "Add Lead"
↓
Fill form (name, email, phone, source)
↓
Set priority (optional)
↓
Assign to user (optional)
↓
Add notes (optional)
↓
Submit
```

### 2. Following Up on a Lead

```
Navigate to lead detail
↓
Click "Log Activity" or quick action
↓
Select activity type
↓
Add notes
↓
Check "Schedule Follow-up"
↓
Set follow-up date
↓
Submit
```

### 3. Converting a Lead to Member

```
Lead reaches NEGOTIATION status
↓
Create member in Members section
↓
Return to lead detail
↓
Click conversion button
↓
Select member from dropdown
↓
Confirm conversion
↓
Lead status → WON
```

### 4. Managing Overdue Follow-ups

```
Navigate to /leads/follow-ups
↓
Click "Overdue" tab
↓
Review overdue items
↓
Click "View Lead" to see context
↓
Complete follow-up or reschedule
↓
Click "Complete" button
```

---

## 💡 Pro Tips

1. **Use Kanban for Visual Management**: Pipeline view is great for team meetings
2. **Filter by Status Cards**: Click stat cards on list page for quick filtering
3. **Quick Actions Save Time**: Use quick action buttons instead of full activity form
4. **Schedule Follow-ups Proactively**: Always set a follow-up when logging activities
5. **Monitor Dashboard Daily**: Check overdue follow-ups every morning
6. **Use Bulk Operations**: Select multiple leads to assign them at once
7. **Add Campaign Data**: Track marketing ROI by filling campaign attribution
8. **Review Source Stats**: Identify best-performing lead sources monthly

---

## 🐛 Troubleshooting

**Issue:** Lead not showing in list
- **Solution**: Check filters, ensure status matches filter

**Issue:** Can't transition status
- **Solution**: Ensure lead is in correct current status (e.g., can't schedule tour if not contacted)

**Issue:** Follow-up not appearing in overdue list
- **Solution**: Ensure follow-up date is in the past and not yet completed

**Issue:** Statistics not updating
- **Solution**: Click refresh button or reload page

**Issue:** Arabic text not displaying correctly
- **Solution**: Ensure locale is set to 'ar' in URL

---

## 📞 Quick Reference: Status Colors

```
NEW          → Blue (bg-blue-100 text-blue-800)
CONTACTED    → Purple (bg-purple-100 text-purple-800)
TOUR_SCHEDULED → Yellow (bg-yellow-100 text-yellow-800)
TRIAL        → Orange (bg-orange-100 text-orange-800)
NEGOTIATION  → Indigo (bg-indigo-100 text-indigo-800)
WON          → Green (bg-green-100 text-green-800)
LOST         → Red (bg-red-100 text-red-800)
```

---

## 🎯 Performance Notes

- **Pagination**: 20 items per page (configurable)
- **Cache**: TanStack Query caches for 5 minutes
- **Search**: Debounced by 300ms
- **Optimistic Updates**: Status changes reflect immediately

---

**Last Updated:** January 31, 2026
**Version:** 1.0.0
**Status:** Production Ready ✅
