package com.liyaqa.shop.domain.model

/**
 * Type of product
 */
enum class ProductType {
    GOODS,      // Physical products (water bottle, shake, snack bar)
    SERVICE,    // Intangible services (personal training, towel service)
    BUNDLE      // Package of goods/services
}

/**
 * Product lifecycle status
 */
enum class ProductStatus {
    DRAFT,          // Not yet published
    ACTIVE,         // Available for sale
    INACTIVE,       // Temporarily unavailable
    DISCONTINUED    // No longer sold
}

/**
 * Department categories for product organization
 */
enum class Department {
    FOOD_AND_BEVERAGE,  // F&B items (drinks, snacks, shakes)
    MERCHANDISE,        // Clothing, accessories, branded items
    EQUIPMENT,          // Gym equipment, workout accessories
    SERVICES,           // PT sessions, classes, treatments
    SUPPLEMENTS,        // Protein, vitamins, wellness products
    RENTALS,            // Locker rental, towel service
    OTHER               // Custom/miscellaneous
}

/**
 * Types of facility zones that products can grant access to
 */
enum class ZoneAccessType {
    LOCKER_ROOM,
    SAUNA,
    POOL,
    SPA,
    VIP_AREA,
    STUDIO,
    OTHER
}

/**
 * Order lifecycle status
 */
enum class OrderStatus {
    CART,           // Items being added (shopping cart)
    PENDING,        // Awaiting payment
    PAID,           // Payment received
    PROCESSING,     // Being fulfilled
    COMPLETED,      // Delivered/fulfilled
    CANCELLED       // Order cancelled
}
