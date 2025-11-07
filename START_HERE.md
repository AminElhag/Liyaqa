# START HERE - Liyaqa Architecture Documentation

Welcome! You've asked for a comprehensive exploration of the liyaqa-backend architecture. All documentation has been created and is ready to read.

## Where to Start (Choose Your Path)

### I have 5 minutes
Read **QUICK_REFERENCE.md** - Get the essential patterns and quick reminders

### I have 15 minutes
1. Read **QUICK_REFERENCE.md** (5 min)
2. Skim **EXPLORATION_SUMMARY.md** (10 min)

### I have 30 minutes
1. Read **QUICK_REFERENCE.md** (5 min)
2. Read **EXPLORATION_SUMMARY.md** (10 min)
3. Browse **DOCUMENTATION_INDEX.md** (15 min)

### I have 90 minutes (Complete Understanding)
1. Read **QUICK_REFERENCE.md** (5 min)
2. Read **EXPLORATION_SUMMARY.md** (10 min)
3. Read **LIYAQA_BACKEND_ARCHITECTURE_OVERVIEW.md** (45 min)
4. Read **FRONTEND_ARCHITECTURE_PATTERNS.md** (30 min)

## By Role

**Backend Developer:**
→ Start with QUICK_REFERENCE.md, then LIYAQA_BACKEND_ARCHITECTURE_OVERVIEW.md

**Frontend Developer:**
→ Start with FRONTEND_ARCHITECTURE_PATTERNS.md, reference QUICK_REFERENCE.md

**New to the Project:**
→ Start with DOCUMENTATION_INDEX.md, then choose path above

**Code Reviewer:**
→ Use QUICK_REFERENCE.md as checklist for the 7 critical patterns

## The 5 Documentation Files

1. **QUICK_REFERENCE.md** (11 KB, 370 lines)
   - Quick patterns overview with code examples
   - Perfect for reminders and lookups
   - Read: 5 minutes

2. **EXPLORATION_SUMMARY.md** (12 KB, 361 lines)
   - What was explored and what was found
   - Key discoveries and findings
   - Read: 10 minutes

3. **DOCUMENTATION_INDEX.md** (10 KB, 394 lines)
   - Navigation guide for all documentation
   - How to use each document
   - When to read what
   - Read: 10 minutes

4. **LIYAQA_BACKEND_ARCHITECTURE_OVERVIEW.md** (40 KB, 1,255 lines)
   - Complete architectural analysis
   - Deep dive into patterns, security, database
   - Detailed explanations of design decisions
   - Read: 45 minutes

5. **FRONTEND_ARCHITECTURE_PATTERNS.md** (22 KB, 845 lines)
   - How to replicate backend patterns in frontend
   - Feature-based structure for React
   - Type safety, state management, hooks
   - Read: 30 minutes

## The Most Critical Thing to Understand

The backend uses **FEATURE-BASED ORGANIZATION** (not layer-based).

This means:
- Each feature owns its domain, service, controller, and DTOs
- You organize by FEATURE, not by LAYER
- This is the foundation of everything

Example of RIGHT way:
```
feature/booking/
├── domain/Booking.kt
├── service/BookingService.kt
├── controller/BookingController.kt
└── dto/BookingDto.kt
```

Example of WRONG way (don't do this):
```
domain/booking/
service/booking/
controller/booking/
```

## The 7 Critical Patterns

1. **Feature-Based Organization** - Each feature is self-contained
2. **DTO Mapping** - With companion objects in Kotlin, factory functions in TypeScript
3. **Rich Domain Models** - Business logic lives in entities
4. **Service Layer Audit** - Every state change logged
5. **Controller Permissions** - Method-level security checks
6. **Multi-Tenancy** - All entities extend BaseEntity (includes tenantId)
7. **Async Audit** - Batch writes for performance

## The 7 Golden Rules

1. Maintain feature-based structure
2. Check permissions in service layer (not just controllers)
3. Preserve multi-tenancy (all entities extend BaseEntity)
4. Use Liquibase for schema changes only
5. Use LAZY loading by default
6. Audit all state changes
7. Never commit directly to main

## Tech Stack at a Glance

- **Language:** Kotlin
- **Framework:** Spring Boot 3.5.7
- **Database:** PostgreSQL with Liquibase
- **Cache:** Redis (sessions + token blacklist)
- **Security:** JWT + Spring Security (40+ permissions)
- **Build:** Gradle Kotlin DSL

## Quick Links to Files

All files are in `/Users/waraiotoko/Liyaqa/`:

```
START_HERE.md                                  ← You are reading this
QUICK_REFERENCE.md                             ← Read this first (5 min)
EXPLORATION_SUMMARY.md                         ← What was found (10 min)
DOCUMENTATION_INDEX.md                         ← Navigation guide (10 min)
LIYAQA_BACKEND_ARCHITECTURE_OVERVIEW.md        ← Deep dive (45 min)
FRONTEND_ARCHITECTURE_PATTERNS.md              ← Build frontend (30 min)

liyaqa-backend/                                ← Actual backend code
├── CLAUDE.md                                  ← AI developer guidance
├── README.md
├── .env.example
└── src/main/kotlin/com/liyaqa/backend/       ← Source code
```

## What This Documentation Covers

- Full project structure with descriptions
- 7 critical architecture patterns
- Security model (JWT + Spring Security + fine-grained RBAC)
- Database patterns (PostgreSQL + Liquibase)
- Multi-tenancy strategy (row-level isolation)
- Audit logging system (async batch processing)
- API architecture and endpoint patterns
- Frontend patterns to replicate (React/TypeScript)
- Development workflow and git practices
- 40+ permissions and group-based RBAC
- Configuration and environment setup
- Performance characteristics
- Recommended practices and critical rules

## Next Steps

1. **Right now:** Choose your reading path above
2. **First document:** Read QUICK_REFERENCE.md (5 minutes)
3. **Second:** Read the summary or deep dive based on your role
4. **Reference:** Keep QUICK_REFERENCE.md handy for patterns
5. **Coding:** Reference the backend code as examples
6. **Follow:** The 7 golden rules when developing

## Questions?

If you're confused about something:

1. Check **QUICK_REFERENCE.md** for code examples
2. Check **DOCUMENTATION_INDEX.md** for which document covers what
3. Check **LIYAQA_BACKEND_ARCHITECTURE_OVERVIEW.md** for detailed explanations
4. Look at actual code in `/Users/waraiotoko/Liyaqa/liyaqa-backend/src/main/kotlin/`

## Key Statistics

- 200+ Kotlin files analyzed
- 3,208 lines of documentation created
- 5 comprehensive documentation files
- 7 critical architecture patterns documented
- 40+ backend permissions documented
- 6 modules analyzed (core, internal, facility, api, payment, shared)
- 15+ features identified and documented

---

**Ready to get started?** Open **QUICK_REFERENCE.md** now!

**When you're done reading:** You'll have complete understanding of:
- How the backend is architected
- Why patterns were chosen
- How to replicate patterns in frontend
- Critical rules to follow when coding
- How to build new features

Good luck! You've got this.
