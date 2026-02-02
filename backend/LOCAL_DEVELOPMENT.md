# Local Development Setup

## Prerequisites

- Java 21
- Docker (for PostgreSQL)
- Gradle 8.11+

## Starting Local Development

### 1. Start PostgreSQL

```bash
cd /path/to/Liyaqa
docker-compose up -d postgres
```

This starts PostgreSQL on `localhost:5434` with:
- Database: `liyaqa`
- Username: `liyaqa`
- Password: `liyaqa`

### 2. Run Backend with Local Profile

```bash
cd backend
./gradlew bootRun --args='--spring.profiles.active=local'
```

Or with JAR:
```bash
./gradlew bootJar
java -jar -Dspring.profiles.active=local build/libs/liyaqa-backend-0.0.1-SNAPSHOT.jar
```

### 3. Verify Backend is Running

```bash
curl http://localhost:8080/actuator/health
```

Expected response:
```json
{"status":"UP"}
```

## Local Profile Configuration

The `local` profile disables:
- Redis (uses Caffeine in-memory cache)
- Email services (logs to console)
- SMS services (logs to console)
- Firebase push notifications
- AWS services
- Zatca e-invoicing

The `local` profile enables:
- PostgreSQL database (from Docker)
- Local file storage (`./uploads` directory)
- Debug logging
- SQL logging

## Troubleshooting

### Backend stops immediately after starting

**Symptom:** Logs "profile is active: 'local'" then exits

**Solution:** Ensure PostgreSQL is running on port 5434:
```bash
docker ps | grep postgres
```

### Connection refused to localhost:5434

**Solution:** Start PostgreSQL:
```bash
docker-compose up -d postgres
```

### Permission denied creating uploads directory

**Solution:** Create directory manually:
```bash
mkdir -p backend/uploads
chmod 755 backend/uploads
```
