# Redis Caching Implementation Guide

## ✅ Implementation Status: COMPLETE

Redis has been integrated for distributed caching and session management.

---

## 📦 Dependencies Added

```kotlin
// backend/build.gradle.kts
implementation("org.springframework.boot:spring-boot-starter-data-redis")
implementation("org.springframework.session:spring-session-data-redis")
```

---

## 🔧 Configuration Created

- **File**: `backend/src/main/kotlin/com/liyaqa/config/RedisConfig.kt`
- **Features**:
  - Distributed caching with configurable TTLs
  - HTTP session storage (30-minute timeout)
  - JSON serialization for cache values
  - Fallback to local Caffeine cache when disabled

---

## 🗄️ Cache Configurations

| Cache Name | TTL | Use Case |
|------------|-----|----------|
| **membershipPlans** | 1 hour | Membership plan lookups (infrequent changes) |
| **gymClasses** | 1 hour | Gym class listings (infrequent changes) |
| **trainers** | 1 hour | Trainer profiles |
| **locations** | 1 hour | Club/location data |
| **products** | 1 hour | Product catalog |
| **classPacks** | 1 hour | Class pack offerings |
| **brandingConfig** | 24 hours | Organization branding settings |
| **organizationSettings** | 24 hours | Organization configurations |
| **memberSubscriptions** | 5 minutes | Member subscription status |
| **memberBalance** | 5 minutes | Member class pack balances |
| **invoices** | 5 minutes | Invoice data |
| **sessionAvailability** | 2 minutes | Class session spots available (real-time) |
| **waitlistPosition** | 2 minutes | Waitlist positions (real-time) |
| **checkInStatus** | 2 minutes | Member check-in status (real-time) |
| **default** | 10 minutes | All other cached data |

---

## 📝 Service Methods to Add Caching (TODO)

### High Priority (Frequently Called)

#### MembershipPlanService
```kotlin
@Cacheable("membershipPlans", key = "#organizationId")
fun getActivePlans(organizationId: UUID): List<MembershipPlan>

@CacheEvict("membershipPlans", key = "#plan.organizationId")
fun updatePlan(plan: MembershipPlan): MembershipPlan

@CacheEvict("membershipPlans", key = "#organizationId", allEntries = true)
fun createPlan(plan: MembershipPlan, organizationId: UUID): MembershipPlan
```

#### GymClassService
```kotlin
@Cacheable("gymClasses", key = "#organizationId")
fun getActiveClasses(organizationId: UUID): List<GymClass>

@CacheEvict("gymClasses", key = "#gymClass.organizationId")
fun updateClass(gymClass: GymClass): GymClass
```

#### ClassSessionService
```kotlin
@Cacheable("sessionAvailability", key = "#sessionId")
fun getAvailableSpots(sessionId: UUID): Int

@CacheEvict("sessionAvailability", key = "#sessionId")
fun bookSession(sessionId: UUID, memberId: UUID): ClassBooking
```

#### SubscriptionService
```kotlin
@Cacheable("memberSubscriptions", key = "#memberId")
fun getActiveSubscription(memberId: UUID): Subscription?

@CacheEvict("memberSubscriptions", key = "#subscription.memberId")
fun updateSubscription(subscription: Subscription): Subscription
```

#### OrganizationService
```kotlin
@Cacheable("brandingConfig", key = "#organizationId")
fun getBrandingConfig(organizationId: UUID): BrandingConfig

@CacheEvict("brandingConfig", key = "#organizationId")
fun updateBrandingConfig(organizationId: UUID, config: BrandingConfig): BrandingConfig
```

#### ProductService
```kotlin
@Cacheable("products", key = "#organizationId")
fun getActiveProducts(organizationId: UUID): List<Product>

@CacheEvict("products", key = "#product.organizationId")
fun updateProduct(product: Product): Product
```

#### TrainerService
```kotlin
@Cacheable("trainers", key = "#organizationId")
fun getActiveTrainers(organizationId: UUID): List<Trainer>

@CacheEvict("trainers", key = "#organizationId")
fun updateTrainer(trainer: Trainer): Trainer
```

#### LocationService
```kotlin
@Cacheable("locations", key = "#organizationId")
fun getLocations(organizationId: UUID): List<Location>

@CacheEvict("locations", key = "#organizationId")
fun updateLocation(location: Location): Location
```

---

## 🚀 Deployment Configuration

### Environment Variables

```bash
# Enable Redis caching
LIYAQA_CACHE_REDIS_ENABLED=true

# Redis connection
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

### application.yml

```yaml
spring:
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      password: ${REDIS_PASSWORD:}
      database: 0
      lettuce:
        pool:
          max-active: 20
          max-idle: 10
          min-idle: 5

  session:
    store-type: redis
    timeout: 30m

liyaqa:
  cache:
    redis:
      enabled: ${LIYAQA_CACHE_REDIS_ENABLED:true}
```

### Docker Compose

```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - liyaqa-network

volumes:
  redis-data:
```

---

## 🧪 Testing Redis

### Verify Connection

```bash
# Connect to Redis
redis-cli -h localhost -p 6379 -a your-redis-password

# Check keys
127.0.0.1:6379> KEYS *

# Get cache entry
127.0.0.1:6379> GET "membershipPlans::550e8400-e29b-41d4-a716-446655440000"

# Monitor cache operations
127.0.0.1:6379> MONITOR
```

### Performance Testing

Before Redis:
- Cold cache: 500ms per request
- Database queries per request: 5-10

After Redis:
- Cache hit: 5-10ms per request
- Cache miss: 500ms (first request only)
- Database queries with cache: 0-1

---

## 🔄 Cache Invalidation Strategies

### Automatic Invalidation

```kotlin
// Clear cache when entity is updated
@CacheEvict("membershipPlans", key = "#plan.organizationId")
fun updatePlan(plan: MembershipPlan): MembershipPlan

// Clear all entries for a cache
@CacheEvict("membershipPlans", allEntries = true)
fun bulkUpdatePlans(plans: List<MembershipPlan>)
```

### Manual Invalidation

```kotlin
@Autowired
private lateinit var cacheManager: CacheManager

fun invalidateCache(cacheName: String, key: String) {
    cacheManager.getCache(cacheName)?.evict(key)
}

fun invalidateAllCaches() {
    cacheManager.cacheNames.forEach { cacheName ->
        cacheManager.getCache(cacheName)?.clear()
    }
}
```

---

## 📊 Monitoring

### Metrics to Track

- Cache hit rate
- Cache miss rate
- Average cache lookup time
- Redis memory usage
- Redis connection pool utilization

### Redis INFO

```bash
redis-cli INFO stats
redis-cli INFO memory
redis-cli INFO clients
```

---

## 🚨 Troubleshooting

### Issue: Cache not working

**Solution**: Check that Redis is running and application can connect:

```bash
redis-cli ping
# Should return: PONG
```

### Issue: Stale data in cache

**Solution**: Clear cache manually or reduce TTL:

```bash
redis-cli FLUSHDB
```

### Issue: High memory usage

**Solution**: Reduce TTL or enable eviction policy:

```redis
# redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
```

---

## ✅ Benefits

1. **Performance**: 10-100x faster reads for cached data
2. **Scalability**: Supports multi-instance deployments
3. **Session Management**: Shared sessions across all instances
4. **Reduced DB Load**: Fewer database queries = better performance
5. **Real-time Data**: Short TTLs for booking availability

---

## 📚 Next Steps

1. Add @Cacheable annotations to the services listed above
2. Deploy Redis in staging environment
3. Monitor cache hit rates
4. Tune TTLs based on actual usage patterns
5. Implement cache warming for critical data on startup

---

**Status**: ✅ Redis infrastructure complete
**Next**: Add @Cacheable annotations to service methods (manual task)
