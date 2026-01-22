# Liyaqa Demo Environment Setup

**Last Updated:** 2026-01-10
**Status:** Ready for Client Demo

---

## Quick Start

### 1. Start Docker Services
```bash
cd /Users/waraiotoko/Desktop/Liyaqa

# Start PostgreSQL, pgAdmin, and Mailhog
docker compose --profile email --profile admin up -d
```

### 2. Start Backend
```bash
cd /Users/waraiotoko/Desktop/Liyaqa/backend

# Run with CORS enabled for frontend
SPRING_PROFILES_ACTIVE=prod \
DATABASE_URL=jdbc:postgresql://localhost:5434/liyaqa \
DATABASE_USERNAME=liyaqa \
DATABASE_PASSWORD=liyaqa_dev_password \
JWT_SECRET=local-development-jwt-secret-key-must-be-at-least-32-characters-long \
EMAIL_ENABLED=false \
SMS_ENABLED=false \
CORS_ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3003,http://localhost:5173" \
java -jar build/libs/liyaqa-0.0.1-SNAPSHOT.jar > /tmp/backend.log 2>&1 &
```

### 3. Start Frontend
```bash
cd /Users/waraiotoko/Desktop/Liyaqa/frontend
npm run dev
```

---

## Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 or http://localhost:3003 | See Login Credentials |
| **Backend API** | http://localhost:8080 | - |
| **Swagger Docs** | http://localhost:8080/swagger-ui.html | - |
| **pgAdmin** | http://localhost:5050 | admin@liyaqa.com / admin |
| **Mailhog** | http://localhost:8025 | - |

---

## Login Credentials

All demo users use password: **`Test1234`**

| Email | Password | Role | Tenant ID |
|-------|----------|------|-----------|
| `admin@demo.com` | `Test1234` | CLUB_ADMIN | `22222222-2222-2222-2222-222222222222` |
| `superadmin@demo.com` | `Test1234` | SUPER_ADMIN | `22222222-2222-2222-2222-222222222222` |
| `staff@demo.com` | `Test1234` | STAFF | `22222222-2222-2222-2222-222222222222` |
| `test@demo.com` | `Test1234` | MEMBER | `22222222-2222-2222-2222-222222222222` |

**Important:** The login form requires all three fields: Email, Password, and Tenant ID.

---

## Demo Data

The database is pre-populated with:

### Organizations & Locations
- **1 Organization:** Fitness First Saudi (ID: `11111111-1111-1111-1111-111111111111`)
- **2 Clubs:**
  - Riyadh Main Branch (Tenant ID: `22222222-2222-2222-2222-222222222222`)
  - Jeddah Branch (Tenant ID: `22222222-2222-2222-2222-222222222223`)
- **3 Locations:** Riyadh Downtown, Riyadh North, Jeddah Corniche

### Membership Plans
| Plan | Price (SAR) | Duration |
|------|-------------|----------|
| Monthly Basic | 299 | 1 month |
| Quarterly Premium | 799 | 3 months |
| Annual VIP | 2499 | 12 months |
| Student Special | 199 | 1 month |

### Members (8 total)
- Ahmed Al-Rashid, Fatima Hassan, Mohammed Ali, Sara Abdullah
- Khalid Omar, Noura Al-Saud, Yusuf Ibrahim, Layla Ahmed

### Classes (5 total)
- Yoga Flow, HIIT Training, Strength & Power, Spin Cycle, Boxing Basics

### Other Data
- 8 Subscriptions (various statuses: ACTIVE, EXPIRED, FROZEN)
- 10 Class Sessions
- 11 Attendance Records
- 7 Invoices (PAID, PENDING, OVERDUE)

---

## Database Connection

```
Host: localhost
Port: 5434
Database: liyaqa
Username: liyaqa
Password: liyaqa_dev_password
```

### Connect via psql in Docker
```bash
docker exec -it liyaqa-postgres psql -U liyaqa -d liyaqa
```

---

## Troubleshooting

### Port Conflicts
- PostgreSQL uses port **5434** (not 5432) to avoid conflict with local PostgreSQL
- Frontend may use port **3003** if 3000 is occupied

### CORS Issues
If you get CORS errors, restart the backend with updated CORS_ALLOWED_ORIGINS including your frontend port.

### Backend Health Check Shows DOWN
The actuator health may show DOWN due to optional dependencies, but the API works correctly. Test with:
```bash
curl http://localhost:8080/api/auth/login -X OPTIONS -H "Origin: http://localhost:3003" -I
```

### Password Issues
All demo user passwords were set to `Test1234` using BCrypt. If login fails, register a new user via the API.

---

## Stop Services

```bash
# Stop backend
pkill -f "java.*liyaqa"

# Stop Docker services
docker compose down

# Stop and remove volumes (clears database)
docker compose down -v
```

---

## Configuration Changes Made

### docker-compose.yml
- Changed PostgreSQL port from 5432 to 5434

### application.yml (prod profile)
- Changed `ddl-auto` from `validate` to `update` for Hibernate to auto-create tables

### Frontend Login
- Added `tenantId` field to LoginRequest type (`/frontend/src/types/auth.ts`)
- Added Tenant ID input to login form (`/frontend/src/app/[locale]/(auth)/login/page.tsx`)

---

## Demo Walkthrough

1. **Login** at http://localhost:3000/en/login with admin@demo.com
2. **Dashboard** shows summary stats, today's attendance, expiring subscriptions
3. **Members** - View, search, filter the 8 demo members
4. **Subscriptions** - See active, frozen, expired subscriptions
5. **Classes** - Browse 5 gym classes with sessions
6. **Invoices** - View PAID, PENDING, OVERDUE invoices with PDF download
7. **Attendance** - Check-in/out records

---

## Next Session Checklist

- [ ] Start Docker: `docker compose --profile email --profile admin up -d`
- [ ] Start Backend: Run the java -jar command above
- [ ] Start Frontend: `cd frontend && npm run dev`
- [ ] Login with: admin@demo.com / Test1234 / 22222222-2222-2222-2222-222222222222
