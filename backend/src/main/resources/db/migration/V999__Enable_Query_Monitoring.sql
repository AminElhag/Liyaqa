-- =============================================================================
-- Enable PostgreSQL Query Monitoring Extensions
-- =============================================================================
-- This migration enables extensions needed for performance monitoring:
-- - pg_stat_statements: Track query execution statistics
-- - pg_stat_kcache: Track kernel-level statistics (optional)
--
-- Note: Requires postgresql.conf to have:
--   shared_preload_libraries = 'pg_stat_statements'
--
-- Usage:
--   View slow queries:
--     SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;
--
--   Reset statistics:
--     SELECT pg_stat_statements_reset();
-- =============================================================================

-- Enable pg_stat_statements extension for query performance tracking
-- This must be enabled BEFORE collecting any statistics
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Create a view for easier access to slow queries
CREATE OR REPLACE VIEW slow_queries AS
SELECT
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time,
    stddev_exec_time,
    rows,
    100.0 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0) AS cache_hit_ratio
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- Queries taking more than 100ms on average
ORDER BY mean_exec_time DESC;

-- Create a view for top queries by total time
CREATE OR REPLACE VIEW top_queries_by_total_time AS
SELECT
    LEFT(query, 100) AS short_query,
    calls,
    ROUND(total_exec_time::numeric, 2) AS total_time_ms,
    ROUND(mean_exec_time::numeric, 2) AS mean_time_ms,
    ROUND(max_exec_time::numeric, 2) AS max_time_ms,
    ROUND((100.0 * total_exec_time / SUM(total_exec_time) OVER())::numeric, 2) AS percent_total_time
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'  -- Exclude monitoring queries
ORDER BY total_exec_time DESC
LIMIT 20;

-- Create a view for queries with low cache hit ratio
CREATE OR REPLACE VIEW queries_with_low_cache_hit AS
SELECT
    LEFT(query, 100) AS short_query,
    calls,
    ROUND(mean_exec_time::numeric, 2) AS mean_time_ms,
    shared_blks_hit,
    shared_blks_read,
    ROUND((100.0 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0))::numeric, 2) AS cache_hit_ratio
FROM pg_stat_statements
WHERE
    shared_blks_read > 0  -- Only queries that read from disk
    AND (shared_blks_hit + shared_blks_read) > 100  -- Meaningful sample size
    AND 100.0 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0) < 90  -- Less than 90% cache hit
ORDER BY shared_blks_read DESC
LIMIT 20;

-- Create a view for frequently executed queries
CREATE OR REPLACE VIEW most_frequent_queries AS
SELECT
    LEFT(query, 100) AS short_query,
    calls,
    ROUND(mean_exec_time::numeric, 2) AS mean_time_ms,
    ROUND(total_exec_time::numeric, 2) AS total_time_ms,
    ROUND((100.0 * calls / SUM(calls) OVER())::numeric, 2) AS percent_calls
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY calls DESC
LIMIT 20;

-- Create a function to get database size metrics
CREATE OR REPLACE FUNCTION get_database_size_metrics()
RETURNS TABLE (
    metric_name TEXT,
    metric_value BIGINT,
    metric_unit TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        'database_size_bytes'::TEXT,
        pg_database_size(current_database()),
        'bytes'::TEXT
    UNION ALL
    SELECT
        'table_count'::TEXT,
        COUNT(*)::BIGINT,
        'count'::TEXT
    FROM pg_tables
    WHERE schemaname = 'public'
    UNION ALL
    SELECT
        'index_count'::TEXT,
        COUNT(*)::BIGINT,
        'count'::TEXT
    FROM pg_indexes
    WHERE schemaname = 'public';
END;
$$ LANGUAGE plpgsql;

-- Create a function to get connection statistics
CREATE OR REPLACE FUNCTION get_connection_stats()
RETURNS TABLE (
    state TEXT,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(state, 'unknown')::TEXT,
        COUNT(*)::BIGINT
    FROM pg_stat_activity
    WHERE datname = current_database()
    GROUP BY state;
END;
$$ LANGUAGE plpgsql;

-- Create a function to reset query statistics (admin only)
CREATE OR REPLACE FUNCTION reset_query_stats()
RETURNS TEXT AS $$
BEGIN
    PERFORM pg_stat_statements_reset();
    RETURN 'Query statistics reset successfully';
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

-- Grant execute permission on monitoring functions
GRANT EXECUTE ON FUNCTION get_database_size_metrics() TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_connection_stats() TO PUBLIC;
GRANT EXECUTE ON FUNCTION reset_query_stats() TO ${flyway:defaultSchema};

-- Create comments for documentation
COMMENT ON VIEW slow_queries IS 'Queries with mean execution time > 100ms';
COMMENT ON VIEW top_queries_by_total_time IS 'Top 20 queries by total execution time';
COMMENT ON VIEW queries_with_low_cache_hit IS 'Queries with cache hit ratio < 90%';
COMMENT ON VIEW most_frequent_queries IS 'Top 20 most frequently executed queries';
COMMENT ON FUNCTION get_database_size_metrics() IS 'Returns current database size metrics';
COMMENT ON FUNCTION get_connection_stats() IS 'Returns connection statistics by state';
COMMENT ON FUNCTION reset_query_stats() IS 'Resets pg_stat_statements statistics (admin only)';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Query monitoring extensions enabled successfully';
    RAISE NOTICE 'Available views: slow_queries, top_queries_by_total_time, queries_with_low_cache_hit, most_frequent_queries';
    RAISE NOTICE 'Available functions: get_database_size_metrics(), get_connection_stats(), reset_query_stats()';
END $$;
