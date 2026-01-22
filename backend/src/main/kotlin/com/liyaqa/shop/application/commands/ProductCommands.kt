package com.liyaqa.shop.application.commands

import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import com.liyaqa.shop.domain.model.Department
import com.liyaqa.shop.domain.model.ProductType
import com.liyaqa.shop.domain.model.StockPricing
import com.liyaqa.shop.domain.model.ZoneAccessType
import java.math.BigDecimal
import java.util.UUID

// === CATEGORY COMMANDS ===

data class CreateProductCategoryCommand(
    val name: LocalizedText,
    val description: LocalizedText? = null,
    val icon: String? = null,
    val department: Department = Department.OTHER,
    val customDepartment: String? = null,
    val sortOrder: Int = 0
)

data class UpdateProductCategoryCommand(
    val name: LocalizedText? = null,
    val description: LocalizedText? = null,
    val icon: String? = null,
    val department: Department? = null,
    val customDepartment: String? = null,
    val sortOrder: Int? = null
)

// === PRODUCT COMMANDS ===

data class CreateProductCommand(
    val name: LocalizedText,
    val description: LocalizedText? = null,
    val sku: String? = null,
    val productType: ProductType,
    val categoryId: UUID? = null,
    val listPrice: Money,
    val taxRate: BigDecimal = BigDecimal("15.00"),
    val stockPricing: StockPricing? = null,
    val stockQuantity: Int? = null,
    val trackInventory: Boolean = false,
    val hasExpiration: Boolean = false,
    val expirationDays: Int? = null,
    val zoneAccess: Set<ZoneAccessType> = emptySet(),
    val accessDurationDays: Int? = null,
    val isSingleUse: Boolean = false,
    val maxQuantityPerOrder: Int? = null,
    val sortOrder: Int = 0,
    val imageUrl: String? = null,
    val bundleItems: List<BundleItemCommand>? = null
)

data class BundleItemCommand(
    val productId: UUID,
    val quantity: Int = 1
)

data class UpdateProductCommand(
    val name: LocalizedText? = null,
    val description: LocalizedText? = null,
    val sku: String? = null,
    val categoryId: UUID? = null,
    val listPrice: Money? = null,
    val taxRate: BigDecimal? = null,
    val stockPricing: StockPricing? = null,
    val stockQuantity: Int? = null,
    val trackInventory: Boolean? = null,
    val hasExpiration: Boolean? = null,
    val expirationDays: Int? = null,
    val zoneAccess: Set<ZoneAccessType>? = null,
    val accessDurationDays: Int? = null,
    val isSingleUse: Boolean? = null,
    val maxQuantityPerOrder: Int? = null,
    val sortOrder: Int? = null,
    val imageUrl: String? = null,
    val bundleItems: List<BundleItemCommand>? = null
)

// === INVENTORY COMMANDS ===

data class AdjustStockCommand(
    val productId: UUID,
    val quantity: Int,
    val reason: String? = null
)

// === PURCHASE COMMANDS ===

data class ProductPurchaseItem(
    val productId: UUID,
    val quantity: Int = 1
)
