-- Analytics views for platform reporting
-- These are read-only views for expensive aggregations, cached at the service layer.

-- Monthly tenant growth over the last 12 months
CREATE OR REPLACE VIEW v_tenant_growth_monthly AS
SELECT
    m.month,
    COALESCE(n.new_tenants, 0)     AS new_tenants,
    COALESCE(c.churned_tenants, 0) AS churned_tenants,
    COALESCE(n.new_tenants, 0) - COALESCE(c.churned_tenants, 0) AS net_growth
FROM (
    SELECT date_trunc('month', gs)::date AS month
    FROM generate_series(
        date_trunc('month', now()) - interval '11 months',
        date_trunc('month', now()),
        interval '1 month'
    ) gs
) m
LEFT JOIN (
    SELECT date_trunc('month', created_at)::date AS month,
           count(*) AS new_tenants
    FROM tenants
    WHERE created_at >= date_trunc('month', now()) - interval '11 months'
    GROUP BY 1
) n ON n.month = m.month
LEFT JOIN (
    SELECT date_trunc('month', deactivated_at)::date AS month,
           count(*) AS churned_tenants
    FROM tenants
    WHERE deactivated_at IS NOT NULL
      AND deactivated_at >= date_trunc('month', now()) - interval '11 months'
    GROUP BY 1
) c ON c.month = m.month
ORDER BY m.month;

-- Revenue breakdown by subscription plan
CREATE OR REPLACE VIEW v_revenue_by_plan AS
SELECT
    sp.name        AS plan_name,
    sp.tier        AS plan_tier,
    count(ts.id)   AS tenant_count,
    sum(
        CASE ts.billing_cycle
            WHEN 'MONTHLY' THEN sp.monthly_price_amount
            WHEN 'ANNUAL'  THEN sp.annual_price_amount / 12
            ELSE sp.monthly_price_amount
        END
    ) AS monthly_revenue_sar
FROM tenant_subscriptions ts
JOIN subscription_plans sp ON sp.id = ts.plan_id
WHERE ts.status = 'ACTIVE'
GROUP BY sp.name, sp.tier
ORDER BY monthly_revenue_sar DESC;

-- Tenant geographic distribution by city
CREATE OR REPLACE VIEW v_tenant_geographic_distribution AS
SELECT
    COALESCE(city, 'Unknown') AS city,
    count(*)                  AS tenant_count
FROM tenants
WHERE status IN ('ACTIVE', 'SUSPENDED')
GROUP BY COALESCE(city, 'Unknown')
ORDER BY tenant_count DESC;
