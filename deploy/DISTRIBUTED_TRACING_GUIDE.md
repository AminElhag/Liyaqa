# Distributed Tracing Guide

This guide covers distributed tracing implementation using OpenTelemetry and Zipkin for the Liyaqa platform.

## Overview

Distributed tracing helps you:
- **Track requests** across multiple services and operations
- **Identify bottlenecks** and slow operations
- **Debug issues** in production by following request flow
- **Monitor performance** of individual operations
- **Understand dependencies** between services

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────┐     ┌─────────┐
│   Browser   │────▶│    Backend   │────▶│ Zipkin  │────▶│ Grafana │
└─────────────┘     │  (OpenTelemetry) │     └─────────┘     └─────────┘
                    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Prometheus  │
                    └──────────────┘
```

**Components:**
- **OpenTelemetry:** Instrumentation library (creates spans)
- **Micrometer Tracing:** Bridge between Spring Boot and OpenTelemetry
- **Zipkin:** Trace visualization and storage
- **Grafana:** Optional trace visualization with Tempo

## Getting Started

### 1. Start Zipkin

```bash
cd deploy

# Start monitoring stack (includes Zipkin)
docker-compose -f docker-compose.monitoring.yml up -d zipkin

# Verify Zipkin is running
curl http://localhost:9411/health

# Access Zipkin UI
open http://localhost:9411
```

### 2. Configure Backend

Environment variables in `.env`:

```bash
# Tracing configuration
TRACING_SAMPLE_RATE=1.0          # 100% sampling in dev (use 0.1 in prod)
ZIPKIN_ENDPOINT=http://zipkin:9411/api/v2/spans
ENVIRONMENT=development
```

### 3. Verify Tracing

```bash
# Make some API requests
curl http://localhost:8080/api/health
curl http://localhost:8080/api/members

# Check Zipkin for traces
open http://localhost:9411/zipkin/
```

## Using Distributed Tracing

### Automatic Tracing

Spring Boot automatically traces:
- **HTTP requests** (incoming and outgoing)
- **Database queries** (via JDBC instrumentation)
- **Cache operations** (via Spring Cache)

No code changes needed!

### Declarative Tracing with @Observed

Add `@Observed` annotation to methods you want to trace:

```kotlin
import io.micrometer.observation.annotation.Observed

@Service
class MemberService {

    @Observed(
        name = "member.create",
        contextualName = "creating-member",
        lowCardinalityKeyValues = ["operation", "member-creation"]
    )
    fun createMember(request: CreateMemberRequest): Member {
        // Your code here
        // Automatically creates a span named "member.create"
    }

    @Observed(name = "member.find-by-email")
    fun findByEmail(email: String): Member? {
        // Span created automatically
    }
}
```

### Manual Tracing with TracerProvider

For fine-grained control:

```kotlin
import com.liyaqa.config.TracerProvider

@Service
class BookingService(
    private val tracerProvider: TracerProvider
) {

    fun processBooking(bookingId: String) {
        tracerProvider.trace(
            name = "booking.process",
            tags = mapOf(
                "bookingId" to bookingId,
                "operation" to "process"
            )
        ) { span ->
            // Your code here

            // Add custom tags
            span.tag("member.id", memberId)
            span.tag("class.id", classId)

            // Add events for milestones
            span.event("validation-completed")
            span.event("spot-reserved")
            span.event("confirmation-sent")
        }
    }
}
```

### Nested Spans

Create child spans for sub-operations:

```kotlin
@Observed(name = "payment.process")
fun processPayment(amount: Double): String {
    // Main span: payment.process

    // Child span: validate-payment
    tracerProvider.trace("validate-payment") {
        validatePaymentDetails()
    }

    // Child span: charge-card
    val txId = tracerProvider.trace(
        name = "charge-card",
        tags = mapOf("amount" to amount.toString())
    ) { span ->
        val result = chargeCard(amount)
        span.tag("transaction.id", result)
        result
    }

    // Child span: save-transaction
    tracerProvider.trace("save-transaction") {
        saveToDatabase(txId)
    }

    return txId
}
```

### Error Tracking

Record errors in spans:

```kotlin
tracerProvider.trace("risky-operation") { span ->
    try {
        performRiskyOperation()
        span.tag("status", "success")
    } catch (e: Exception) {
        span.tag("status", "failed")
        span.tag("error.type", e.javaClass.simpleName)
        span.error(e)  // Records exception details
        throw e
    }
}
```

## Viewing Traces

### Zipkin UI

Access: http://localhost:9411

**Main Features:**

1. **Search Traces**
   - Filter by service name
   - Filter by span name
   - Filter by tags
   - Filter by duration (min/max)
   - Filter by time range

2. **Trace Details**
   - Timeline view of all spans
   - Span hierarchy (parent-child relationships)
   - Tags and annotations
   - Error information
   - Duration of each operation

3. **Dependencies**
   - Service dependency graph
   - Call frequency
   - Error rates between services

**Common Searches:**

```
# Find slow requests (>1 second)
minDuration=1000ms

# Find all member creation requests
spanName=member.create

# Find requests with errors
tags=error

# Find requests for specific member
tags=member.id=123
```

### Grafana with Tempo (Optional)

If you integrate Tempo with Grafana:

1. **Add Tempo datasource** in Grafana
2. **Explore traces** in Explore view
3. **Link traces to logs** using trace IDs
4. **Create dashboards** with trace metrics

## Best Practices

### 1. Span Naming

**Good:**
- `member.create`
- `payment.process`
- `email.send`
- `database.query.members`

**Bad:**
- `createMember` (inconsistent case)
- `process` (too generic)
- `member-creation-service` (too verbose)
- `api_call` (unclear operation)

### 2. Tag Guidelines

**Use tags for:**
- Business identifiers (userId, tenantId, orderId)
- Operation type (operation=create)
- Status (status=success/failed)
- Error type (error.type=ValidationException)

**Avoid:**
- High cardinality values (UUIDs, timestamps)
- Sensitive data (passwords, tokens, PII)
- Large text blobs (>100 chars)

**Example:**
```kotlin
span.tag("user.id", userId)              // ✅ Good
span.tag("user.email", email)            // ❌ PII
span.tag("request.id", uuid)             // ❌ High cardinality
span.tag("operation", "create")          // ✅ Good
span.tag("status", "success")            // ✅ Good
```

### 3. Sampling Strategy

**Development:**
```yaml
management.tracing.sampling.probability: 1.0  # 100% of requests
```

**Production:**
```yaml
management.tracing.sampling.probability: 0.1  # 10% of requests
```

**High-traffic endpoints:**
```yaml
management.tracing.sampling.probability: 0.01  # 1% of requests
```

**Critical operations:**
```yaml
# Always trace critical operations
@Observed(name = "payment.charge")  # Override sampling
```

### 4. Performance Considerations

**Do:**
- Sample traces in production (10-20%)
- Limit spans per request (< 100)
- Use async exporting (default)
- Set appropriate timeouts

**Don't:**
- Create spans in tight loops
- Add large payloads as tags
- Trace every database query individually
- Create unnecessary nested spans

### 5. Correlation with Logs

Include trace ID in logs:

```kotlin
import org.slf4j.MDC

@Service
class MyService(private val tracerProvider: TracerProvider) {

    fun doSomething() {
        val traceId = tracerProvider.currentTraceId()

        // Add to MDC for logging
        MDC.put("traceId", traceId)

        logger.info("Processing request")  // Logs include traceId

        // Structured logging automatically includes traceId
        logger.info("Operation completed: {}", data)
    }
}
```

Logback configuration (already configured):
```xml
<encoder class="net.logstash.logback.encoder.LogstashEncoder">
    <includeMdcKeyName>traceId</includeMdcKeyName>
    <includeMdcKeyName>spanId</includeMdcKeyName>
</encoder>
```

## Advanced Features

### Custom Propagators

For cross-service tracing (future microservices):

```kotlin
@Configuration
class TracingPropagationConfig {

    @Bean
    fun propagationFactory(): PropagationFactory {
        return B3Propagation.newFactoryBuilder()
            .injectFormat(B3Propagation.Format.MULTI)
            .build()
    }
}
```

### Baggage

Propagate metadata across services:

```kotlin
tracer.currentSpan()?.run {
    // Add baggage (propagates to child spans and services)
    baggage().updateBaggage("tenant.id", tenantId)
    baggage().updateBaggage("user.role", userRole)
}

// Read baggage in downstream service
val tenantId = tracer.currentSpan()?.baggage()?.get("tenant.id")
```

### Custom Exporters

Export traces to multiple backends:

```kotlin
@Configuration
class MultiExporterConfig {

    @Bean
    fun spanExporter(): SpanExporter {
        return CompositeSpanExporter.create(
            ZipkinSpanExporter.create(zipkinEndpoint),
            JaegerSpanExporter.create(jaegerEndpoint)
        )
    }
}
```

## Troubleshooting

### Traces Not Appearing in Zipkin

**1. Check backend logs:**
```bash
docker logs liyaqa-backend | grep -i trace
docker logs liyaqa-backend | grep -i zipkin
```

**2. Verify Zipkin is running:**
```bash
curl http://localhost:9411/health
# Should return: {"status":"UP"}
```

**3. Check sampling rate:**
```bash
# In application.yml
management.tracing.sampling.probability: 1.0  # Make sure it's > 0
```

**4. Check Zipkin endpoint:**
```bash
# Should be accessible from backend container
docker exec liyaqa-backend curl http://zipkin:9411/health
```

### Slow Performance

**1. Reduce sampling rate:**
```yaml
management.tracing.sampling.probability: 0.1  # 10% instead of 100%
```

**2. Limit span count:**
- Remove unnecessary @Observed annotations
- Avoid creating spans in loops
- Combine multiple operations into one span

**3. Use async export (default):**
```yaml
management.tracing.exporter.zipkin.timeout: 1s
```

### Missing Span Data

**1. Ensure span is closed:**
```kotlin
// ✅ Good - using .use() ensures span.end() is called
tracerProvider.trace("operation") { span ->
    // ...
}

// ❌ Bad - manual management can leak spans
val span = tracer.nextSpan().start()
// ... (if exception, span.end() won't be called)
span.end()
```

**2. Check for exceptions:**
- Exceptions before span.end() prevent data export
- Use try-finally or .use() for cleanup

## Monitoring Tracing

### Metrics

Tracing exports metrics via Prometheus:

```promql
# Total spans exported
rate(otel_exporter_exported_spans_total[5m])

# Span export failures
rate(otel_exporter_failed_spans_total[5m])

# Span processing latency
histogram_quantile(0.95, rate(otel_exporter_span_processing_seconds_bucket[5m]))
```

### Alerts

Create alerts for tracing health:

```yaml
# In alerts.yml
- alert: TracingExportFailures
  expr: rate(otel_exporter_failed_spans_total[5m]) > 0.1
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High trace export failure rate"
```

### Dashboards

Import Zipkin/OpenTelemetry dashboard in Grafana:
- Dashboard ID: 11449 (Zipkin dashboard)
- Dashboard ID: 15988 (OpenTelemetry dashboard)

## Integration Examples

### Trace + Log Correlation

Search logs by trace ID:

```bash
# In Loki (via Grafana)
{app="liyaqa-backend"} |= "traceId=abc123xyz"

# In Zipkin
# Click on a span -> "Show Logs" (if configured)
```

### Trace + Metrics Correlation

Link traces to metrics in Grafana:

```json
{
  "datasource": "Prometheus",
  "targets": [{
    "expr": "http_server_requests_seconds_count{traceId=\"$traceId\"}"
  }]
}
```

### Trace-based Alerts

Alert on slow traces:

```yaml
- alert: SlowMemberCreation
  expr: histogram_quantile(0.95, sum(rate(member_create_seconds_bucket[5m])) by (le)) > 1
  for: 5m
  annotations:
    summary: "Member creation is slow"
    description: "95th percentile is {{ $value }}s"
```

## Resources

- **OpenTelemetry Docs:** https://opentelemetry.io/docs/
- **Zipkin:** https://zipkin.io/
- **Micrometer Tracing:** https://micrometer.io/docs/tracing
- **Spring Boot Observability:** https://spring.io/blog/2022/10/12/observability-with-spring-boot-3

---

**Last Updated:** 2026-01-31
**Maintainer:** DevOps Team
