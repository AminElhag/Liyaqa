package com.liyaqa.shop.api

import com.fasterxml.jackson.annotation.JsonProperty
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.LocalizedTextInput
import com.liyaqa.shared.domain.Money
import com.liyaqa.shop.application.commands.BundleItemCommand
import com.liyaqa.shop.application.commands.CreateProductCategoryCommand
import com.liyaqa.shop.application.commands.CreateProductCommand
import com.liyaqa.shop.application.commands.UpdateProductCategoryCommand
import com.liyaqa.shop.application.commands.UpdateProductCommand
import com.liyaqa.shop.application.services.CategoryStats
import com.liyaqa.shop.application.services.ProductStats
import com.liyaqa.shop.domain.model.BundleItem
import com.liyaqa.shop.domain.model.Department
import com.liyaqa.shop.domain.model.Product
import com.liyaqa.shop.domain.model.ProductCategory
import com.liyaqa.shop.domain.model.ProductStatus
import com.liyaqa.shop.domain.model.ProductType
import com.liyaqa.shop.domain.model.StockPricing
import com.liyaqa.shop.domain.model.ZoneAccessType
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.PositiveOrZero
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

// ===========================
// CATEGORY REQUEST DTOs
// ===========================

data class CreateProductCategoryRequest(
    @field:Valid
    @field:NotNull(message = "Name is required")
    val name: LocalizedTextInput,

    @field:Valid
    val description: LocalizedTextInput? = null,

    val icon: String? = null,

    val department: Department = Department.OTHER,

    val customDepartment: String? = null,

    @field:PositiveOrZero(message = "Sort order must be non-negative")
    val sortOrder: Int = 0
) {
    fun toCommand() = CreateProductCategoryCommand(
        name = name.toLocalizedText(),
        description = description?.toLocalizedText(),
        icon = icon,
        department = department,
        customDepartment = customDepartment,
        sortOrder = sortOrder
    )
}

data class UpdateProductCategoryRequest(
    @field:Valid
    val name: LocalizedTextInput? = null,

    @field:Valid
    val description: LocalizedTextInput? = null,

    val icon: String? = null,

    val department: Department? = null,

    val customDepartment: String? = null,

    @field:PositiveOrZero(message = "Sort order must be non-negative")
    val sortOrder: Int? = null
) {
    fun toCommand() = UpdateProductCategoryCommand(
        name = name?.toLocalizedText(),
        description = description?.toLocalizedText(),
        icon = icon,
        department = department,
        customDepartment = customDepartment,
        sortOrder = sortOrder
    )
}

// ===========================
// CATEGORY RESPONSE DTOs
// ===========================

data class ProductCategoryResponse(
    val id: UUID,
    val name: LocalizedText,
    val description: LocalizedText?,
    val icon: String?,
    val department: Department,
    val customDepartment: String?,
    val effectiveDepartment: String,
    val sortOrder: Int,
    @get:JsonProperty("isActive")
    val isActive: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(category: ProductCategory) = ProductCategoryResponse(
            id = category.id,
            name = category.name,
            description = category.description,
            icon = category.icon,
            department = category.department,
            customDepartment = category.customDepartment,
            effectiveDepartment = category.getEffectiveDepartment(),
            sortOrder = category.sortOrder,
            isActive = category.isActive,
            createdAt = category.createdAt,
            updatedAt = category.updatedAt
        )
    }
}

data class CategoryStatsResponse(
    val total: Long,
    val active: Long,
    val inactive: Long
) {
    companion object {
        fun from(stats: CategoryStats) = CategoryStatsResponse(
            total = stats.total,
            active = stats.active,
            inactive = stats.inactive
        )
    }
}

// ===========================
// PRODUCT REQUEST DTOs
// ===========================

data class CreateProductRequest(
    @field:Valid
    @field:NotNull(message = "Name is required")
    val name: LocalizedTextInput,

    @field:Valid
    val description: LocalizedTextInput? = null,

    val sku: String? = null,

    @field:NotNull(message = "Product type is required")
    val productType: ProductType,

    val categoryId: UUID? = null,

    @field:NotNull(message = "List price is required")
    @field:PositiveOrZero(message = "List price must be non-negative")
    val listPrice: BigDecimal,

    val currency: String? = null,

    @field:PositiveOrZero(message = "Tax rate must be non-negative")
    val taxRate: BigDecimal? = null,

    @field:Valid
    val stockPricing: StockPricingRequest? = null,

    @field:PositiveOrZero(message = "Stock quantity must be non-negative")
    val stockQuantity: Int? = null,

    val trackInventory: Boolean? = null,

    val hasExpiration: Boolean? = null,

    @field:Positive(message = "Expiration days must be positive")
    val expirationDays: Int? = null,

    val zoneAccess: Set<ZoneAccessType>? = null,

    @field:Positive(message = "Access duration days must be positive")
    val accessDurationDays: Int? = null,

    val isSingleUse: Boolean? = null,

    @field:Positive(message = "Max quantity per order must be positive")
    val maxQuantityPerOrder: Int? = null,

    @field:PositiveOrZero(message = "Sort order must be non-negative")
    val sortOrder: Int? = null,

    val imageUrl: String? = null,

    @field:Valid
    val bundleItems: List<BundleItemRequest>? = null
) {
    fun toCommand(): CreateProductCommand {
        val effectiveCurrency = currency ?: "SAR"
        val effectiveTaxRate = taxRate ?: BigDecimal("15.00")
        return CreateProductCommand(
            name = name.toLocalizedText(),
            description = description?.toLocalizedText(),
            sku = sku,
            productType = productType,
            categoryId = categoryId,
            listPrice = Money(listPrice, effectiveCurrency),
            taxRate = effectiveTaxRate,
            stockPricing = stockPricing?.toStockPricing(effectiveCurrency),
            stockQuantity = stockQuantity,
            trackInventory = trackInventory ?: false,
            hasExpiration = hasExpiration ?: false,
            expirationDays = expirationDays,
            zoneAccess = zoneAccess ?: emptySet(),
            accessDurationDays = accessDurationDays,
            isSingleUse = isSingleUse ?: false,
            maxQuantityPerOrder = maxQuantityPerOrder,
            sortOrder = sortOrder ?: 0,
            imageUrl = imageUrl,
            bundleItems = bundleItems?.map { it.toCommand() }
        )
    }
}

data class UpdateProductRequest(
    @field:Valid
    val name: LocalizedTextInput? = null,

    @field:Valid
    val description: LocalizedTextInput? = null,

    val sku: String? = null,

    val categoryId: UUID? = null,

    @field:PositiveOrZero(message = "List price must be non-negative")
    val listPrice: BigDecimal? = null,

    val currency: String? = null,

    @field:PositiveOrZero(message = "Tax rate must be non-negative")
    val taxRate: BigDecimal? = null,

    @field:Valid
    val stockPricing: StockPricingRequest? = null,

    @field:PositiveOrZero(message = "Stock quantity must be non-negative")
    val stockQuantity: Int? = null,

    val trackInventory: Boolean? = null,

    val hasExpiration: Boolean? = null,

    @field:Positive(message = "Expiration days must be positive")
    val expirationDays: Int? = null,

    val zoneAccess: Set<ZoneAccessType>? = null,

    @field:Positive(message = "Access duration days must be positive")
    val accessDurationDays: Int? = null,

    val isSingleUse: Boolean? = null,

    @field:Positive(message = "Max quantity per order must be positive")
    val maxQuantityPerOrder: Int? = null,

    @field:PositiveOrZero(message = "Sort order must be non-negative")
    val sortOrder: Int? = null,

    val imageUrl: String? = null,

    @field:Valid
    val bundleItems: List<BundleItemRequest>? = null
) {
    fun toCommand(currentCurrency: String = "SAR") = UpdateProductCommand(
        name = name?.toLocalizedText(),
        description = description?.toLocalizedText(),
        sku = sku,
        categoryId = categoryId,
        listPrice = listPrice?.let { Money(it, currency ?: currentCurrency) },
        taxRate = taxRate,
        stockPricing = stockPricing?.toStockPricing(currency ?: currentCurrency),
        stockQuantity = stockQuantity,
        trackInventory = trackInventory,
        hasExpiration = hasExpiration,
        expirationDays = expirationDays,
        zoneAccess = zoneAccess,
        accessDurationDays = accessDurationDays,
        isSingleUse = isSingleUse,
        maxQuantityPerOrder = maxQuantityPerOrder,
        sortOrder = sortOrder,
        imageUrl = imageUrl,
        bundleItems = bundleItems?.map { it.toCommand() }
    )
}

data class StockPricingRequest(
    @field:PositiveOrZero(message = "Low stock threshold must be non-negative")
    val lowStockThreshold: Int = 10,

    @field:PositiveOrZero(message = "Low stock price must be non-negative")
    val lowStockPrice: BigDecimal? = null,

    @field:PositiveOrZero(message = "Out of stock price must be non-negative")
    val outOfStockPrice: BigDecimal? = null
) {
    fun toStockPricing(currency: String) = StockPricing(
        lowStockThreshold = lowStockThreshold,
        lowStockPrice = lowStockPrice?.let { Money(it, currency) },
        outOfStockPrice = outOfStockPrice?.let { Money(it, currency) }
    )
}

data class BundleItemRequest(
    @field:NotNull(message = "Product ID is required")
    val productId: UUID,

    @field:Positive(message = "Quantity must be positive")
    val quantity: Int = 1
) {
    fun toCommand() = BundleItemCommand(
        productId = productId,
        quantity = quantity
    )
}

data class AdjustStockRequest(
    @field:NotNull(message = "Quantity is required")
    val quantity: Int,

    val reason: String? = null
)

// ===========================
// PRODUCT RESPONSE DTOs
// ===========================

data class ProductResponse(
    val id: UUID,
    val name: LocalizedText,
    val description: LocalizedText?,
    val sku: String?,
    val productType: ProductType,
    val category: ProductCategoryResponse?,
    val status: ProductStatus,

    // Pricing
    val listPrice: MoneyResponse,
    val effectivePrice: MoneyResponse,
    val grossPrice: MoneyResponse,
    val taxRate: BigDecimal,
    val stockPricing: StockPricingResponse?,

    // Inventory
    val stockQuantity: Int?,
    val trackInventory: Boolean,
    @get:JsonProperty("isAvailable")
    val isAvailable: Boolean,

    // Expiration
    val hasExpiration: Boolean,
    val expirationDays: Int?,

    // Zone access
    val zoneAccess: Set<ZoneAccessType>,
    val accessDurationDays: Int?,
    val grantsAccess: Boolean,

    // Restrictions
    @get:JsonProperty("isSingleUse")
    val isSingleUse: Boolean,
    val maxQuantityPerOrder: Int?,

    // Display
    val sortOrder: Int,
    val imageUrl: String?,

    // Bundle (only for BUNDLE type)
    val bundleItems: List<BundleItemResponse>?,
    val bundleValue: MoneyResponse?,

    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(product: Product, bundleItems: List<BundleItem>? = null) = ProductResponse(
            id = product.id,
            name = product.name,
            description = product.description,
            sku = product.sku,
            productType = product.productType,
            category = product.category?.let { ProductCategoryResponse.from(it) },
            status = product.status,
            listPrice = MoneyResponse.from(product.listPrice),
            effectivePrice = MoneyResponse.from(product.getEffectivePrice()),
            grossPrice = MoneyResponse.from(product.getGrossPrice()),
            taxRate = product.taxRate,
            stockPricing = product.stockPricing?.let { StockPricingResponse.from(it) },
            stockQuantity = product.stockQuantity,
            trackInventory = product.trackInventory,
            isAvailable = product.isAvailable(),
            hasExpiration = product.hasExpiration,
            expirationDays = product.expirationDays,
            zoneAccess = product.zoneAccess,
            accessDurationDays = product.accessDurationDays,
            grantsAccess = product.grantsAccess(),
            isSingleUse = product.isSingleUse,
            maxQuantityPerOrder = product.maxQuantityPerOrder,
            sortOrder = product.sortOrder,
            imageUrl = product.imageUrl,
            bundleItems = bundleItems?.map { BundleItemResponse.from(it) },
            bundleValue = bundleItems?.let { items ->
                if (items.isEmpty()) null
                else {
                    val total = items.sumOf { it.lineValue().amount }
                    MoneyResponse(total, product.listPrice.currency)
                }
            },
            createdAt = product.createdAt,
            updatedAt = product.updatedAt
        )
    }
}

data class ProductSummaryResponse(
    val id: UUID,
    val name: LocalizedText,
    val productType: ProductType,
    val status: ProductStatus,
    val listPrice: MoneyResponse,
    @get:JsonProperty("isAvailable")
    val isAvailable: Boolean
) {
    companion object {
        fun from(product: Product) = ProductSummaryResponse(
            id = product.id,
            name = product.name,
            productType = product.productType,
            status = product.status,
            listPrice = MoneyResponse.from(product.listPrice),
            isAvailable = product.isAvailable()
        )
    }
}

data class MoneyResponse(
    val amount: BigDecimal,
    val currency: String
) {
    companion object {
        val ZERO = MoneyResponse(BigDecimal.ZERO, "SAR")

        fun from(money: Money) = MoneyResponse(
            amount = money.amount,
            currency = money.currency
        )
    }
}

data class StockPricingResponse(
    val lowStockThreshold: Int,
    val lowStockPrice: MoneyResponse?,
    val outOfStockPrice: MoneyResponse?
) {
    companion object {
        fun from(pricing: StockPricing) = StockPricingResponse(
            lowStockThreshold = pricing.lowStockThreshold,
            lowStockPrice = pricing.lowStockPrice?.let { MoneyResponse.from(it) },
            outOfStockPrice = pricing.outOfStockPrice?.let { MoneyResponse.from(it) }
        )
    }
}

data class BundleItemResponse(
    val id: UUID,
    val product: ProductSummaryResponse,
    val quantity: Int,
    val lineValue: MoneyResponse,
    val sortOrder: Int
) {
    companion object {
        fun from(item: BundleItem) = BundleItemResponse(
            id = item.id,
            product = ProductSummaryResponse.from(item.product),
            quantity = item.quantity,
            lineValue = MoneyResponse.from(item.lineValue()),
            sortOrder = item.sortOrder
        )
    }
}

data class ProductStatsResponse(
    val total: Long,
    val active: Long,
    val inactive: Long,
    val draft: Long,
    val discontinued: Long,
    val goods: Long,
    val services: Long,
    val bundles: Long
) {
    companion object {
        fun from(stats: ProductStats) = ProductStatsResponse(
            total = stats.total,
            active = stats.active,
            inactive = stats.inactive,
            draft = stats.draft,
            discontinued = stats.discontinued,
            goods = stats.goods,
            services = stats.services,
            bundles = stats.bundles
        )
    }
}
