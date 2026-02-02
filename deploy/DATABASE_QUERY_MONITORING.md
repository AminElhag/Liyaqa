# Database Query Monitoring Guide

Complete guide for monitoring PostgreSQL query performance in the Liyaqa platform.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Setup](#setup)
- [Accessing Query Statistics](#accessing-query-statistics)
- [Prometheus Metrics](#prometheus-metrics)
- [Common Monitoring Tasks](#common-monitoring-tasks)
- [Performance Optimization](#performance-optimization)
- [Alerts and Thresholds](#alerts-and-thresholds)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Overview

The database monitoring stack provides comprehensive visibility into PostgreSQL query performance:

- **pg_stat_statements**: Track query execution statistics
- **Custom Views**: Simplified access to performance metrics
- **Postgres Exporter**: Export metrics to Prometheus
- **Grafana Dashboards**: Visualize database performance
- **Alerts**: Automated detection of performance issues

### Key Features

✅ **Query Performance**: Track execution time, calls, and resource usage
✅ **Slow Query Detection**: Automatically identify slow queries
✅ **Cache Monitoring**: Track buffer cache hit ratios
✅ **Index Usage**: Identify unused or inefficient indexes
✅ **Connection Pool**: Monitor connection states and limits
✅ **Vacuum Statistics**: Track maintenance operations

---

## Architecture

```
┌──────────────┐     ┌────────────────┐     ┌────────────┐     ┌─────────┐
│  PostgreSQL  │────▶│  pg_stat_      │────▶│ Postgres   │────▶│Prometheus│
│              │     │  statements    │     │ Exporter   │     └─────────┘
│  + Custom    │     │                │     │            │           │
│    Views     │     │  + Custom      │     │ Port: 9187 │           ▼
└──────────────┘     │    Queries     │     └────────────┘     ┌─────────┐
                     └────────────────┘                         │ Grafana │
                                                                 │Dashboards│
                                                                 └─────────┘
```

### Components

1. **pg_stat_statements Extension**
   - Tracks all SQL statements executed
   - Records timing, rows affected, buffer usage
   - Enabled via Flyway migration `V999__Enable_Query_Monitoring.sql`

2. **Custom PostgreSQL Views**
   - `slow_queries` - Queries with mean_exec_time > 100ms
   - `top_queries_by_total_time` - Highest total time consumers
   - `queries_with_low_cache_hit` - Poor cache performance
   - `most_frequent_queries` - Most executed queries

3. **Postgres Exporter**
   - Exports database metrics to Prometheus
   - Custom queries defined in `postgres-exporter-queries.yml`
   - Scrapes metrics every 15 seconds

4. **Prometheus**
   - Stores time-series metrics
   - Provides alerting rules
   - Retention: 30 days

5. **Grafana**
   - Visualizes metrics in dashboards
   - Provides drill-down capabilities
   - Access: http://localhost:3001

---

## Setup

### 1. Enable pg_stat_statements

#### Update postgresql.conf

Add to `/var/lib/postgresql/data/postgresql.conf`:

```conf
# Shared preload libraries
shared_preload_libraries = 'pg_stat_statements'

# pg_stat_statements configuration
pg_stat_statements.max = 10000
pg_stat_statements.track = all
pg_stat_statements.track_utility = on
pg_stat_statements.track_planning = on
pg_stat_statements.save = on
```

#### For Docker Setup

Create `postgres-custom.conf`:

```conf
# Performance monitoring
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.max = 10000
pg_stat_statements.track = all
```

Mount in `docker-compose.yml`:

```yaml
services:
  postgres:
    volumes:
      - ./postgres-custom.conf:/etc/postgresql/postgresql.conf:ro
    command: postgres -c config_file=/etc/postgresql/postgresql.conf
```

### 2. Run Database Migration

The extension will be enabled automatically by Flyway migration:

```bash
cd backend
./gradlew bootRun

# Or manually:
psql -U liyaqa -d liyaqa -c "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"
```

### 3. Start Monitoring Stack

```bash
cd deploy

# Start all monitoring services
docker-compose -f docker-compose.monitoring.yml up -d

# Verify postgres-exporter is running
curl http://localhost:9187/metrics

# Should see metrics like:
# pg_stat_statements_calls{query_short="SELECT * FROM members..."} 1234
```

### 4. Verify Setup

```sql
-- Check extension is loaded
SELECT * FROM pg_extension WHERE extname = 'pg_stat_statements';

-- Check views exist
SELECT table_name FROM information_schema.views
WHERE table_schema = 'public'
AND table_name LIKE '%queries%';

-- Test a view
SELECT * FROM slow_queries LIMIT 5;
```

---

## Accessing Query Statistics

### Via PostgreSQL

#### View Slow Queries

```sql
-- Queries with mean execution time > 100ms
SELECT * FROM slow_queries
ORDER BY mean_exec_time DESC
LIMIT 10;
```

Output:
```
 query                          | calls | total_exec_time | mean_exec_time | max_exec_time | cache_hit_ratio
--------------------------------+-------+-----------------+----------------+---------------+-----------------
 SELECT * FROM members WHERE... | 1234  | 456789.23       | 370.12         | 2500.45       | 85.3
```

#### Top Queries by Total Time

```sql
-- Queries consuming the most total execution time
SELECT * FROM top_queries_by_total_time
LIMIT 10;
```

#### Queries with Low Cache Hit Ratio

```sql
-- Queries reading from disk frequently (< 90% cache hits)
SELECT * FROM queries_with_low_cache_hit
LIMIT 10;
```

#### Most Frequently Executed Queries

```sql
-- Top queries by call count
SELECT * FROM most_frequent_queries
LIMIT 10;
```

### Via Direct pg_stat_statements

#### Get All Query Statistics

```sql
SELECT
  LEFT(query, 100) AS query,
  calls,
  ROUND(total_exec_time::numeric, 2) AS total_ms,
  ROUND(mean_exec_time::numeric, 2) AS mean_ms,
  ROUND(max_exec_time::numeric, 2) AS max_ms
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY mean_exec_time DESC
LIMIT 20;
```

#### Find Queries with Many Rows

```sql
-- Queries returning/affecting the most rows
SELECT
  LEFT(query, 100) AS query,
  calls,
  rows,
  ROUND((rows::numeric / calls), 2) AS avg_rows_per_call
FROM pg_stat_statements
WHERE calls > 0
ORDER BY rows DESC
LIMIT 20;
```

#### Find Queries Using Temp Space

```sql
-- Queries spilling to disk (need more work_mem)
SELECT
  LEFT(query, 100) AS query,
  calls,
  temp_blks_read,
  temp_blks_written,
  ROUND((temp_blks_written * 8192 / 1024 / 1024)::numeric, 2) AS temp_mb
FROM pg_stat_statements
WHERE temp_blks_written > 0
ORDER BY temp_blks_written DESC
LIMIT 20;
```

### Using Custom Functions

#### Get Database Size Metrics

```sql
SELECT * FROM get_database_size_metrics();
```

Output:
```
 metric_name         | metric_value | metric_unit
---------------------+--------------+-------------
 database_size_bytes | 524288000    | bytes
 table_count         | 45           | count
 index_count         | 78           | count
```

#### Get Connection Statistics

```sql
SELECT * FROM get_connection_stats();
```

Output:
```
 state  | count
--------+-------
 active | 5
 idle   | 15
```

---

## Prometheus Metrics

### Available Metrics

#### Query Execution Metrics

```promql
# Total queries executed
rate(pg_stat_statements_calls{query_short="..."}[5m])

# Average query execution time
pg_stat_statements_mean_exec_time{query_short="..."}

# Maximum query execution time
pg_stat_statements_max_exec_time{query_short="..."}

# Total time spent in query
rate(pg_stat_statements_total_exec_time{query_short="..."}[5m])
```

#### Slow Query Metrics

```promql
# Number of slow queries (> 100ms)
pg_slow_queries_slow_query_count

# Number of very slow queries (> 500ms)
pg_slow_queries_very_slow_query_count

# Number of critical slow queries (> 1000ms)
pg_slow_queries_critical_slow_query_count

# Maximum mean execution time across all queries
pg_slow_queries_max_mean_exec_time
```

#### Database Size Metrics

```promql
# Database size in bytes
pg_database_size_size_bytes

# Database size in megabytes
pg_database_size_size_mb

# Number of tables
pg_database_size_table_count

# Number of indexes
pg_database_size_index_count
```

#### Connection Metrics

```promql
# Active connections
pg_connection_stats_count{state="active"}

# Idle connections
pg_connection_stats_count{state="idle"}

# Maximum connection duration
pg_connection_stats_max_duration_seconds{state="active"}
```

#### Cache Hit Ratio

```promql
# Table cache hit ratio
pg_cache_hit_ratio_hit_ratio{type="cache"}

# Index cache hit ratio
pg_cache_hit_ratio_hit_ratio{type="index"}

# Overall hits
rate(pg_cache_hit_ratio_hits{type="cache"}[5m])

# Overall reads (from disk)
rate(pg_cache_hit_ratio_reads{type="cache"}[5m])
```

#### Long Running Queries

```promql
# Queries running > 1 second
pg_long_running_queries_running_1s

# Queries running > 5 seconds
pg_long_running_queries_running_5s

# Queries running > 1 minute
pg_long_running_queries_running_1m

# Maximum query duration
pg_long_running_queries_max_query_duration_seconds
```

#### Index Usage

```promql
# Index scans
rate(pg_index_usage_scans{table_name="public.members"}[5m])

# Unused indexes
pg_unused_indexes_never_used

# Size of unused indexes
pg_unused_indexes_never_used_size_bytes / 1024 / 1024  # Convert to MB
```

#### Transaction Statistics

```promql
# Commit rate
rate(pg_transaction_stats_commits[5m])

# Rollback rate
rate(pg_transaction_stats_rollbacks[5m])

# Commit ratio
pg_transaction_stats_commit_ratio

# Deadlock count
rate(pg_transaction_stats_deadlocks[5m])
```

### Example Prometheus Queries

#### Find Slowest Queries

```promql
topk(10, pg_stat_statements_mean_exec_time)
```

#### Calculate Query Throughput

```promql
sum(rate(pg_stat_statements_calls[5m])) by (query_short)
```

#### Detect Cache Performance Degradation

```promql
pg_cache_hit_ratio_hit_ratio{type="cache"} < 90
```

#### Monitor Connection Pool Usage

```promql
sum(pg_connection_stats_count) by (state)
```

---

## Common Monitoring Tasks

### 1. Identify Slow Queries

**PostgreSQL:**
```sql
SELECT
  LEFT(query, 100) AS query,
  calls,
  ROUND(mean_exec_time::numeric, 2) AS mean_ms,
  ROUND(max_exec_time::numeric, 2) AS max_ms
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Prometheus:**
```promql
pg_stat_statements_mean_exec_time > 100
```

**Action:**
- Review query execution plan: `EXPLAIN ANALYZE <query>`
- Add missing indexes
- Optimize WHERE clauses
- Consider query rewriting

---

### 2. Find Missing Indexes

**PostgreSQL:**
```sql
-- Queries with sequential scans on large tables
SELECT
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  seq_tup_read / seq_scan AS avg_seq_tup_read
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC
LIMIT 20;
```

**Check Table Size:**
```sql
SELECT
  schemaname || '.' || tablename AS table,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS size,
  seq_scan,
  idx_scan
FROM pg_stat_user_tables
WHERE seq_scan > idx_scan
  AND pg_total_relation_size(schemaname || '.' || tablename) > 1000000  -- > 1MB
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;
```

**Action:**
- Create indexes on frequently queried columns
- Use EXPLAIN to verify index usage
- Monitor index bloat

---

### 3. Detect Unused Indexes

**PostgreSQL:**
```sql
SELECT
  schemaname || '.' || tablename AS table,
  indexrelname AS index,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

**Prometheus:**
```promql
pg_index_usage_scans == 0
```

**Action:**
- Consider dropping unused indexes
- Verify index is not needed for constraints
- Check if index is used in rare queries

---

### 4. Monitor Cache Hit Ratio

**PostgreSQL:**
```sql
-- Overall cache hit ratio (should be > 95%)
SELECT
  'cache' AS type,
  ROUND(100.0 * SUM(heap_blks_hit) /
    NULLIF(SUM(heap_blks_hit) + SUM(heap_blks_read), 0), 2) AS hit_ratio
FROM pg_statio_user_tables
UNION ALL
SELECT
  'index' AS type,
  ROUND(100.0 * SUM(idx_blks_hit) /
    NULLIF(SUM(idx_blks_hit) + SUM(idx_blks_read), 0), 2) AS hit_ratio
FROM pg_statio_user_indexes;
```

**Prometheus:**
```promql
# Alert if cache hit ratio drops below 95%
pg_cache_hit_ratio_hit_ratio{type="cache"} < 95
```

**Action if < 95%:**
- Increase `shared_buffers` in postgresql.conf
- Increase `effective_cache_size`
- Review query patterns
- Consider adding more RAM

---

### 5. Find Bloated Tables

**PostgreSQL:**
```sql
SELECT
  schemaname || '.' || tablename AS table,
  n_live_tup AS live_tuples,
  n_dead_tup AS dead_tuples,
  ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup, 0), 2) AS dead_ratio,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY dead_ratio DESC;
```

**Prometheus:**
```promql
pg_vacuum_stats_dead_tuple_ratio > 10
```

**Action:**
- Run manual VACUUM if autovacuum is lagging
- Tune autovacuum settings
- Schedule maintenance windows

---

### 6. Monitor Long-Running Queries

**PostgreSQL:**
```sql
SELECT
  pid,
  usename,
  LEFT(query, 100) AS query,
  NOW() - query_start AS duration,
  state
FROM pg_stat_activity
WHERE state = 'active'
  AND query NOT LIKE '%pg_stat_activity%'
  AND NOW() - query_start > interval '5 seconds'
ORDER BY duration DESC;
```

**Kill Long-Running Query:**
```sql
SELECT pg_terminate_backend(<pid>);
```

**Prometheus:**
```promql
# Alert if queries run > 30 seconds
pg_long_running_queries_running_30s > 0
```

**Action:**
- Investigate query execution plan
- Consider adding query timeout
- Optimize query or add indexes

---

### 7. Connection Pool Monitoring

**PostgreSQL:**
```sql
-- Current connections by state
SELECT state, COUNT(*)
FROM pg_stat_activity
WHERE datname = 'liyaqa'
GROUP BY state;

-- Connection limit
SELECT setting::int AS max_connections
FROM pg_settings
WHERE name = 'max_connections';
```

**Prometheus:**
```promql
# Total active connections
sum(pg_connection_stats_count)

# Percentage of max connections used
sum(pg_connection_stats_count) / pg_settings_max_connections * 100
```

**Action if near limit:**
- Investigate connection leaks in application
- Increase max_connections (with caution)
- Implement connection pooling (PgBouncer)

---

## Performance Optimization

### Query Optimization Workflow

1. **Identify Slow Query**
   ```sql
   SELECT * FROM slow_queries LIMIT 1;
   ```

2. **Get Execution Plan**
   ```sql
   EXPLAIN (ANALYZE, BUFFERS) <your_query>;
   ```

3. **Look For:**
   - Sequential Scans on large tables → Add index
   - High planning time → Simplify query
   - High buffer usage → Optimize joins
   - Nested loops on large tables → Consider hash join

4. **Test Index**
   ```sql
   CREATE INDEX CONCURRENTLY idx_members_email ON members(email);
   EXPLAIN ANALYZE <your_query>;
   ```

5. **Verify Improvement**
   ```sql
   -- Wait 1 hour, then check
   SELECT * FROM pg_stat_statements
   WHERE query LIKE '%your_query%';
   ```

### Common Optimizations

#### 1. Add Index

```sql
-- Before: Sequential scan (slow)
EXPLAIN SELECT * FROM members WHERE email = 'user@example.com';
-- Seq Scan on members (cost=0.00..1234.00 rows=1)

-- Create index
CREATE INDEX CONCURRENTLY idx_members_email ON members(email);

-- After: Index scan (fast)
EXPLAIN SELECT * FROM members WHERE email = 'user@example.com';
-- Index Scan using idx_members_email (cost=0.29..8.30 rows=1)
```

#### 2. Add Composite Index

```sql
-- Query using multiple columns
SELECT * FROM bookings
WHERE member_id = 123 AND class_id = 456 AND status = 'CONFIRMED';

-- Create composite index
CREATE INDEX CONCURRENTLY idx_bookings_member_class_status
ON bookings(member_id, class_id, status);
```

#### 3. Increase work_mem for Sort Operations

```sql
-- Check current setting
SHOW work_mem;  -- Default: 4MB

-- Increase for session (or in postgresql.conf)
SET work_mem = '64MB';

-- Verify sort now uses memory instead of disk
EXPLAIN ANALYZE SELECT * FROM members ORDER BY created_at DESC LIMIT 100;
```

#### 4. Optimize N+1 Queries

```kotlin
// Bad: N+1 queries
members.forEach { member ->
    val bookings = bookingRepository.findByMemberId(member.id)  // N queries
}

// Good: Single query with join
@Query("""
    SELECT m FROM Member m
    LEFT JOIN FETCH m.bookings
    WHERE m.status = 'ACTIVE'
""")
fun findAllActiveWithBookings(): List<Member>
```

#### 5. Add Partial Index

```sql
-- Index only active members
CREATE INDEX CONCURRENTLY idx_members_active
ON members(email) WHERE status = 'ACTIVE';

-- Much smaller than full index, faster updates
```

---

## Alerts and Thresholds

### Recommended Alert Rules

Add to `prometheus/alerts.yml`:

```yaml
groups:
  - name: database_performance
    interval: 30s
    rules:
      # Slow query alert
      - alert: DatabaseSlowQueries
        expr: pg_slow_queries_critical_slow_query_count > 0
        for: 5m
        labels:
          severity: warning
          category: database
        annotations:
          summary: "Database has slow queries (> 1000ms)"
          description: "{{ $value }} queries have mean execution time > 1000ms"

      # Low cache hit ratio
      - alert: DatabaseLowCacheHitRatio
        expr: pg_cache_hit_ratio_hit_ratio{type="cache"} < 90
        for: 10m
        labels:
          severity: warning
          category: database
        annotations:
          summary: "Database cache hit ratio is low"
          description: "Cache hit ratio is {{ $value }}% (should be > 95%)"

      # Connection pool near limit
      - alert: DatabaseConnectionPoolHigh
        expr: |
          sum(pg_connection_stats_count) /
          on() group_left() pg_settings_max_connections{name="max_connections"} > 0.8
        for: 5m
        labels:
          severity: warning
          category: database
        annotations:
          summary: "Database connection pool usage high"
          description: "Using {{ $value | humanizePercentage }} of max connections"

      # Long running query
      - alert: DatabaseLongRunningQuery
        expr: pg_long_running_queries_running_5m > 0
        for: 1m
        labels:
          severity: critical
          category: database
        annotations:
          summary: "Database has long-running queries"
          description: "{{ $value }} queries have been running > 5 minutes"

      # Dead tuples building up
      - alert: DatabaseHighDeadTuples
        expr: pg_vacuum_stats_dead_tuple_ratio > 20
        for: 15m
        labels:
          severity: warning
          category: database
        annotations:
          summary: "Database table has high dead tuple ratio"
          description: "Dead tuple ratio is {{ $value }}% (autovacuum may be falling behind)"

      # Database size growing rapidly
      - alert: DatabaseSizeGrowthHigh
        expr: |
          rate(pg_database_size_size_bytes[1h]) > 100000000  # > 100MB/hour
        for: 2h
        labels:
          severity: warning
          category: database
        annotations:
          summary: "Database growing rapidly"
          description: "Database growing at {{ $value | humanize }}B/hour"
```

---

## Troubleshooting

### Issue: pg_stat_statements Not Loading

**Symptoms:**
```sql
SELECT * FROM pg_stat_statements;
ERROR:  relation "pg_stat_statements" does not exist
```

**Solution:**
```bash
# 1. Check if extension exists
docker exec liyaqa-postgres psql -U liyaqa -d liyaqa -c "\dx"

# 2. Check if loaded in shared_preload_libraries
docker exec liyaqa-postgres psql -U liyaqa -d liyaqa -c "SHOW shared_preload_libraries;"

# 3. If not, add to postgresql.conf and restart
echo "shared_preload_libraries = 'pg_stat_statements'" >> /var/lib/postgresql/data/postgresql.conf
docker restart liyaqa-postgres

# 4. Create extension
docker exec liyaqa-postgres psql -U liyaqa -d liyaqa -c "CREATE EXTENSION pg_stat_statements;"
```

---

### Issue: Postgres Exporter Not Scraping

**Symptoms:**
- No metrics in Prometheus with prefix `pg_`

**Solution:**
```bash
# 1. Check postgres-exporter is running
docker ps | grep postgres-exporter

# 2. Check metrics endpoint
curl http://localhost:9187/metrics

# 3. Check logs
docker logs liyaqa-postgres-exporter

# 4. Verify connection string
docker exec liyaqa-postgres-exporter env | grep DATA_SOURCE

# 5. Test connection manually
docker exec liyaqa-postgres psql "postgresql://liyaqa:password@postgres:5432/liyaqa?sslmode=disable" -c "SELECT 1;"
```

---

### Issue: No Custom Metrics

**Symptoms:**
- Default metrics appear but not custom ones from queries.yml

**Solution:**
```bash
# 1. Check queries file is mounted
docker exec liyaqa-postgres-exporter cat /etc/postgres-exporter/queries.yml

# 2. Check environment variable
docker exec liyaqa-postgres-exporter env | grep PG_EXPORTER_EXTEND_QUERY_PATH

# 3. Check for YAML syntax errors
yamllint deploy/postgres-exporter-queries.yml

# 4. Restart exporter
docker restart liyaqa-postgres-exporter

# 5. Check logs for query errors
docker logs liyaqa-postgres-exporter | grep -i error
```

---

## Best Practices

### 1. Regular Maintenance

✅ **Do:**
```sql
-- Weekly: Reset statistics to avoid overflow
SELECT pg_stat_statements_reset();

-- Monthly: Vacuum and analyze
VACUUM ANALYZE;

-- Check for bloat
SELECT * FROM pg_stat_user_tables WHERE n_dead_tup > 10000;
```

### 2. Index Management

✅ **Do:**
```sql
-- Regularly review unused indexes
SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;

-- Drop if truly unused (after verification)
DROP INDEX CONCURRENTLY idx_name;
```

❌ **Don't:**
- Create too many indexes (slows down writes)
- Index low-cardinality columns (gender, status)
- Forget to use CONCURRENTLY (locks table)

### 3. Query Optimization

✅ **Do:**
```sql
-- Always use EXPLAIN ANALYZE before optimizing
EXPLAIN (ANALYZE, BUFFERS) SELECT ...;

-- Test in production-like environment
-- Verify improvement in pg_stat_statements
```

❌ **Don't:**
- Optimize without measuring first
- Add indexes blindly
- Ignore execution plan

### 4. Monitoring Hygiene

✅ **Do:**
- Review slow queries weekly
- Set up alerts for critical metrics
- Document optimization efforts
- Track improvements over time

❌ **Don't:**
- Ignore slow query alerts
- Let dead tuples accumulate
- Run monitoring queries excessively (adds load)

---

## Quick Reference

### Essential Queries

```sql
-- Top 10 slowest queries
SELECT * FROM slow_queries LIMIT 10;

-- Current running queries
SELECT pid, query, NOW() - query_start AS duration
FROM pg_stat_activity
WHERE state = 'active' AND query NOT LIKE '%pg_stat%'
ORDER BY duration DESC;

-- Cache hit ratio
SELECT * FROM pg_cache_hit_ratio;

-- Connection count
SELECT COUNT(*) FROM pg_stat_activity WHERE datname = 'liyaqa';

-- Database size
SELECT pg_size_pretty(pg_database_size('liyaqa'));

-- Table sizes
SELECT schemaname || '.' || tablename AS table,
       pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC
LIMIT 10;
```

### Essential Prometheus Queries

```promql
# Slow query count
pg_slow_queries_slow_query_count

# Cache hit ratio
pg_cache_hit_ratio_hit_ratio{type="cache"}

# Active connections
pg_connection_stats_count{state="active"}

# Database size (MB)
pg_database_size_size_mb

# Long running queries
pg_long_running_queries_running_1m
```

---

## Resources

- **PostgreSQL Documentation:** https://www.postgresql.org/docs/
- **pg_stat_statements:** https://www.postgresql.org/docs/current/pgstatstatements.html
- **Postgres Exporter:** https://github.com/prometheus-community/postgres_exporter
- **Query Optimization:** https://www.postgresql.org/docs/current/using-explain.html

---

**Last Updated:** 2026-01-31
**Maintainer:** DevOps Team
**PostgreSQL Version:** 15+
