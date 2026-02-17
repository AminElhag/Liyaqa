package com.liyaqa.shop.infrastructure.persistence

import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shop.domain.model.BundleItem
import com.liyaqa.shop.domain.model.Product
import com.liyaqa.shop.domain.model.ProductStatus
import com.liyaqa.shop.domain.model.ProductType
import com.liyaqa.shop.domain.model.ZoneAccessType
import com.liyaqa.shop.domain.ports.MemberProductAccess
import com.liyaqa.shop.domain.ports.ProductRepository
import jakarta.persistence.EntityManager
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA repository interface for Product.
 */
interface SpringDataProductRepository : JpaRepository<Product, UUID> {

    @Query("SELECT p FROM Product p")
    fun findAllWithCategory(pageable: Pageable): Page<Product>

    @Query("SELECT p FROM Product p WHERE p.id = :id")
    fun findByIdWithCategory(@Param("id") id: UUID): Optional<Product>

    @Query("SELECT p FROM Product p WHERE p.status = :status")
    fun findByStatusWithCategory(@Param("status") status: ProductStatus, pageable: Pageable): Page<Product>

    @Query("SELECT p FROM Product p WHERE p.productType = :productType")
    fun findByProductTypeWithCategory(@Param("productType") productType: ProductType, pageable: Pageable): Page<Product>

    @Query("SELECT p FROM Product p WHERE p.category.id = :categoryId")
    fun findByCategoryIdWithCategory(@Param("categoryId") categoryId: UUID, pageable: Pageable): Page<Product>

    @Query("SELECT p FROM Product p WHERE p.category.id = :categoryId AND p.status = :status")
    fun findByCategoryIdAndStatusWithCategory(@Param("categoryId") categoryId: UUID, @Param("status") status: ProductStatus, pageable: Pageable): Page<Product>

    @Query("SELECT p FROM Product p WHERE p.status = :status AND p.productType = :productType")
    fun findByStatusAndProductTypeWithCategory(
        @Param("status") status: ProductStatus,
        @Param("productType") productType: ProductType,
        pageable: Pageable
    ): Page<Product>

    fun findBySku(sku: String): Optional<Product>
    fun existsBySku(sku: String): Boolean

    @Query("""
        SELECT p FROM Product p
        WHERE LOWER(p.name.en) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(p.name.ar) LIKE LOWER(CONCAT('%', :query, '%'))
    """)
    fun searchByNameWithCategory(@Param("query") query: String, pageable: Pageable): Page<Product>

    @Query("""
        SELECT p FROM Product p
        WHERE p.status = :status
          AND (LOWER(p.name.en) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(p.name.ar) LIKE LOWER(CONCAT('%', :query, '%')))
    """)
    fun searchByNameAndStatusWithCategory(@Param("query") query: String, @Param("status") status: ProductStatus, pageable: Pageable): Page<Product>
}

/**
 * Spring Data JPA repository interface for BundleItem.
 */
interface SpringDataBundleItemRepository : JpaRepository<BundleItem, UUID> {
    fun findByBundleIdOrderBySortOrder(bundleId: UUID): List<BundleItem>

    @Modifying
    @Query("DELETE FROM BundleItem bi WHERE bi.bundle.id = :bundleId")
    fun deleteByBundleId(@Param("bundleId") bundleId: UUID)
}

/**
 * Adapter implementing the domain port using Spring Data JPA.
 */
@Repository
class JpaProductRepository(
    private val springDataRepository: SpringDataProductRepository,
    private val bundleItemRepository: SpringDataBundleItemRepository,
    private val entityManager: EntityManager
) : ProductRepository {

    // === PRODUCT CRUD ===

    override fun save(product: Product): Product {
        return springDataRepository.save(product)
    }

    override fun findById(id: UUID): Optional<Product> {
        // Use the method with JOIN FETCH to eagerly load category
        return springDataRepository.findByIdWithCategory(id)
    }

    override fun findAll(pageable: Pageable): Page<Product> {
        // Use the method with JOIN FETCH to eagerly load category
        return springDataRepository.findAllWithCategory(pageable)
    }

    override fun deleteById(id: UUID) {
        springDataRepository.deleteById(id)
    }

    override fun existsById(id: UUID): Boolean {
        return springDataRepository.existsById(id)
    }

    override fun count(): Long {
        return springDataRepository.count()
    }

    // === QUERIES ===

    override fun findByStatus(status: ProductStatus, pageable: Pageable): Page<Product> {
        // Use the method with JOIN FETCH to eagerly load category
        return springDataRepository.findByStatusWithCategory(status, pageable)
    }

    override fun findByProductType(type: ProductType, pageable: Pageable): Page<Product> {
        // Use the method with JOIN FETCH to eagerly load category
        return springDataRepository.findByProductTypeWithCategory(type, pageable)
    }

    override fun findByCategoryId(categoryId: UUID, pageable: Pageable): Page<Product> {
        // Use the method with JOIN FETCH to eagerly load category
        return springDataRepository.findByCategoryIdWithCategory(categoryId, pageable)
    }

    override fun findByCategoryIdAndStatus(categoryId: UUID, status: ProductStatus, pageable: Pageable): Page<Product> {
        // Use the method with JOIN FETCH to eagerly load category
        return springDataRepository.findByCategoryIdAndStatusWithCategory(categoryId, status, pageable)
    }

    override fun findByStatusAndProductType(status: ProductStatus, type: ProductType, pageable: Pageable): Page<Product> {
        // Use the method with JOIN FETCH to eagerly load category
        return springDataRepository.findByStatusAndProductTypeWithCategory(status, type, pageable)
    }

    override fun findBySku(sku: String): Optional<Product> {
        return springDataRepository.findBySku(sku)
    }

    override fun existsBySku(sku: String): Boolean {
        return springDataRepository.existsBySku(sku)
    }

    override fun searchByName(query: String, pageable: Pageable): Page<Product> {
        // Use the method with JOIN FETCH to eagerly load category
        return springDataRepository.searchByNameWithCategory(query, pageable)
    }

    override fun searchByNameAndStatus(query: String, status: ProductStatus, pageable: Pageable): Page<Product> {
        // Use the method with JOIN FETCH to eagerly load category
        return springDataRepository.searchByNameAndStatusWithCategory(query, status, pageable)
    }

    // === BUNDLE ITEMS ===

    override fun findBundleItems(bundleId: UUID): List<BundleItem> {
        return bundleItemRepository.findByBundleIdOrderBySortOrder(bundleId)
    }

    override fun saveBundleItem(item: BundleItem): BundleItem {
        return bundleItemRepository.save(item)
    }

    override fun deleteBundleItem(itemId: UUID) {
        bundleItemRepository.deleteById(itemId)
    }

    override fun deleteBundleItemsByBundleId(bundleId: UUID) {
        bundleItemRepository.deleteByBundleId(bundleId)
    }

    // === MEMBER TRACKING ===

    override fun hasMemberPurchased(memberId: UUID, productId: UUID): Boolean {
        val query = entityManager.createNativeQuery("""
            SELECT COUNT(*) > 0 FROM member_product_purchases
            WHERE member_id = :memberId AND product_id = :productId
        """)
        query.setParameter("memberId", memberId)
        query.setParameter("productId", productId)
        return query.singleResult as Boolean
    }

    override fun recordMemberPurchase(memberId: UUID, productId: UUID, invoiceId: UUID) {
        val tenantId = TenantContext.getCurrentTenant()?.value
            ?: throw IllegalStateException("No tenant context")

        entityManager.createNativeQuery("""
            INSERT INTO member_product_purchases (id, tenant_id, member_id, product_id, invoice_id, purchased_at)
            VALUES (:id, :tenantId, :memberId, :productId, :invoiceId, :purchasedAt)
        """)
            .setParameter("id", UUID.randomUUID())
            .setParameter("tenantId", tenantId)
            .setParameter("memberId", memberId)
            .setParameter("productId", productId)
            .setParameter("invoiceId", invoiceId)
            .setParameter("purchasedAt", Instant.now())
            .executeUpdate()
    }

    override fun grantMemberAccess(
        memberId: UUID,
        productId: UUID,
        zone: ZoneAccessType,
        expiresAt: Instant?,
        invoiceId: UUID
    ) {
        val tenantId = TenantContext.getCurrentTenant()?.value
            ?: throw IllegalStateException("No tenant context")

        entityManager.createNativeQuery("""
            INSERT INTO member_product_access (id, tenant_id, member_id, product_id, zone_type, granted_at, expires_at, invoice_id, is_active, created_at)
            VALUES (:id, :tenantId, :memberId, :productId, :zoneType, :grantedAt, :expiresAt, :invoiceId, true, :createdAt)
        """)
            .setParameter("id", UUID.randomUUID())
            .setParameter("tenantId", tenantId)
            .setParameter("memberId", memberId)
            .setParameter("productId", productId)
            .setParameter("zoneType", zone.name)
            .setParameter("grantedAt", Instant.now())
            .setParameter("expiresAt", expiresAt)
            .setParameter("invoiceId", invoiceId)
            .setParameter("createdAt", Instant.now())
            .executeUpdate()
    }

    override fun getMemberActiveAccess(memberId: UUID): List<MemberProductAccess> {
        @Suppress("UNCHECKED_CAST")
        val results = entityManager.createNativeQuery("""
            SELECT id, member_id, product_id, zone_type, granted_at, expires_at, invoice_id, is_active
            FROM member_product_access
            WHERE member_id = :memberId
              AND is_active = true
              AND (expires_at IS NULL OR expires_at > :now)
        """)
            .setParameter("memberId", memberId)
            .setParameter("now", Instant.now())
            .resultList as List<Array<Any?>>

        return results.map { row ->
            MemberProductAccess(
                id = row[0] as UUID,
                memberId = row[1] as UUID,
                productId = row[2] as UUID,
                zoneType = ZoneAccessType.valueOf(row[3] as String),
                grantedAt = (row[4] as java.sql.Timestamp).toInstant(),
                expiresAt = (row[5] as? java.sql.Timestamp)?.toInstant(),
                invoiceId = row[6] as? UUID,
                isActive = row[7] as Boolean
            )
        }
    }

    override fun getMemberAccessByZone(memberId: UUID, zone: ZoneAccessType): List<MemberProductAccess> {
        @Suppress("UNCHECKED_CAST")
        val results = entityManager.createNativeQuery("""
            SELECT id, member_id, product_id, zone_type, granted_at, expires_at, invoice_id, is_active
            FROM member_product_access
            WHERE member_id = :memberId
              AND zone_type = :zoneType
              AND is_active = true
              AND (expires_at IS NULL OR expires_at > :now)
        """)
            .setParameter("memberId", memberId)
            .setParameter("zoneType", zone.name)
            .setParameter("now", Instant.now())
            .resultList as List<Array<Any?>>

        return results.map { row ->
            MemberProductAccess(
                id = row[0] as UUID,
                memberId = row[1] as UUID,
                productId = row[2] as UUID,
                zoneType = ZoneAccessType.valueOf(row[3] as String),
                grantedAt = (row[4] as java.sql.Timestamp).toInstant(),
                expiresAt = (row[5] as? java.sql.Timestamp)?.toInstant(),
                invoiceId = row[6] as? UUID,
                isActive = row[7] as Boolean
            )
        }
    }
}
