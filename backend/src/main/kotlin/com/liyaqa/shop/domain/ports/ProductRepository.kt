package com.liyaqa.shop.domain.ports

import com.liyaqa.shop.domain.model.BundleItem
import com.liyaqa.shop.domain.model.Product
import com.liyaqa.shop.domain.model.ProductStatus
import com.liyaqa.shop.domain.model.ProductType
import com.liyaqa.shop.domain.model.ZoneAccessType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.util.Optional
import java.util.UUID

/**
 * Repository port for Product aggregate.
 */
interface ProductRepository {
    // === PRODUCT CRUD ===
    fun save(product: Product): Product
    fun findById(id: UUID): Optional<Product>
    fun findAll(pageable: Pageable): Page<Product>
    fun deleteById(id: UUID)
    fun existsById(id: UUID): Boolean
    fun count(): Long

    // === QUERIES ===
    fun findByStatus(status: ProductStatus, pageable: Pageable): Page<Product>
    fun findByProductType(type: ProductType, pageable: Pageable): Page<Product>
    fun findByCategoryId(categoryId: UUID, pageable: Pageable): Page<Product>
    fun findByCategoryIdAndStatus(categoryId: UUID, status: ProductStatus, pageable: Pageable): Page<Product>
    fun findByStatusAndProductType(status: ProductStatus, type: ProductType, pageable: Pageable): Page<Product>
    fun findBySku(sku: String): Optional<Product>
    fun existsBySku(sku: String): Boolean
    fun searchByName(query: String, pageable: Pageable): Page<Product>
    fun searchByNameAndStatus(query: String, status: ProductStatus, pageable: Pageable): Page<Product>

    // === BUNDLE ITEMS ===
    fun findBundleItems(bundleId: UUID): List<BundleItem>
    fun saveBundleItem(item: BundleItem): BundleItem
    fun deleteBundleItem(itemId: UUID)
    fun deleteBundleItemsByBundleId(bundleId: UUID)

    // === MEMBER TRACKING ===
    fun hasMemberPurchased(memberId: UUID, productId: UUID): Boolean
    fun recordMemberPurchase(memberId: UUID, productId: UUID, invoiceId: UUID)
    fun grantMemberAccess(memberId: UUID, productId: UUID, zone: ZoneAccessType, expiresAt: Instant?, invoiceId: UUID)
    fun getMemberActiveAccess(memberId: UUID): List<MemberProductAccess>
    fun getMemberAccessByZone(memberId: UUID, zone: ZoneAccessType): List<MemberProductAccess>
}

/**
 * Data class representing a member's granted product access.
 */
data class MemberProductAccess(
    val id: UUID,
    val memberId: UUID,
    val productId: UUID,
    val zoneType: ZoneAccessType,
    val grantedAt: Instant,
    val expiresAt: Instant?,
    val invoiceId: UUID?,
    val isActive: Boolean
)
