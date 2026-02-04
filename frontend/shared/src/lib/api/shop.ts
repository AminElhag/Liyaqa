import { api } from "./client";
import type { PaginatedResponse, UUID } from "../types/api";
import type { Product, ProductCategory } from "../types/product";
import type {
  Cart,
  Order,
  CheckoutResult,
  AddToCartRequest,
  UpdateCartItemRequest,
  CheckoutRequest,
  OrderQueryParams,
} from "../types/shop";

const SHOP_ENDPOINT = "api/shop";

// ===========================
// BROWSE PRODUCTS (Member View)
// ===========================

export interface ShopProductQueryParams {
  categoryId?: UUID;
  search?: string;
  page?: number;
  size?: number;
}

export async function browseProducts(
  params: ShopProductQueryParams = {}
): Promise<PaginatedResponse<Product>> {
  const searchParams = new URLSearchParams();
  if (params.categoryId) searchParams.set("categoryId", params.categoryId);
  if (params.search) searchParams.set("search", params.search);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  const url = query ? `${SHOP_ENDPOINT}/products?${query}` : `${SHOP_ENDPOINT}/products`;
  return api.get(url).json();
}

export async function getShopProduct(id: UUID): Promise<Product> {
  return api.get(`${SHOP_ENDPOINT}/products/${id}`).json();
}

// ===========================
// BROWSE CATEGORIES (Member View)
// ===========================

export interface ShopCategoryQueryParams {
  page?: number;
  size?: number;
}

export async function browseCategories(
  params: ShopCategoryQueryParams = {}
): Promise<PaginatedResponse<ProductCategory>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  const url = query ? `${SHOP_ENDPOINT}/categories?${query}` : `${SHOP_ENDPOINT}/categories`;
  return api.get(url).json();
}

// ===========================
// CART MANAGEMENT
// ===========================

/**
 * Get cart for a member.
 * Admin/Staff can specify memberId for client-service mode.
 * Members get their own cart.
 */
export async function getCart(memberId?: UUID): Promise<Cart> {
  const searchParams = memberId ? `?memberId=${memberId}` : "";
  return api.get(`${SHOP_ENDPOINT}/cart${searchParams}`).json();
}

/**
 * Add item to cart.
 * Admin/Staff can specify memberId for client-service mode.
 */
export async function addToCart(
  data: AddToCartRequest,
  memberId?: UUID
): Promise<Cart> {
  console.log("[shop.addToCart] data:", data);
  console.log("[shop.addToCart] memberId:", memberId);
  const searchParams = memberId ? `?memberId=${memberId}` : "";
  console.log("[shop.addToCart] URL:", `${SHOP_ENDPOINT}/cart/items${searchParams}`);
  return api.post(`${SHOP_ENDPOINT}/cart/items${searchParams}`, { json: data }).json();
}

/**
 * Update cart item quantity.
 * Admin/Staff can specify memberId for client-service mode.
 */
export async function updateCartItem(
  productId: UUID,
  data: UpdateCartItemRequest,
  memberId?: UUID
): Promise<Cart> {
  const searchParams = memberId ? `?memberId=${memberId}` : "";
  return api.patch(`${SHOP_ENDPOINT}/cart/items/${productId}${searchParams}`, { json: data }).json();
}

/**
 * Remove item from cart.
 * Admin/Staff can specify memberId for client-service mode.
 */
export async function removeFromCart(productId: UUID, memberId?: UUID): Promise<Cart> {
  const searchParams = memberId ? `?memberId=${memberId}` : "";
  return api.delete(`${SHOP_ENDPOINT}/cart/items/${productId}${searchParams}`).json();
}

/**
 * Clear entire cart.
 * Admin/Staff can specify memberId for client-service mode.
 */
export async function clearCart(memberId?: UUID): Promise<Cart> {
  const searchParams = memberId ? `?memberId=${memberId}` : "";
  return api.delete(`${SHOP_ENDPOINT}/cart${searchParams}`).json();
}

// ===========================
// CHECKOUT
// ===========================

/**
 * Checkout and create invoice.
 * Admin/Staff can specify memberId for client-service mode.
 */
export async function checkout(data?: CheckoutRequest, memberId?: UUID): Promise<CheckoutResult> {
  const searchParams = memberId ? `?memberId=${memberId}` : "";
  return api.post(`${SHOP_ENDPOINT}/checkout${searchParams}`, { json: data || {} }).json();
}

// ===========================
// ORDER HISTORY
// ===========================

/**
 * Get orders for a member.
 * Admin/Staff can specify memberId for client-service mode.
 */
export async function getOrders(
  params: OrderQueryParams = {},
  memberId?: UUID
): Promise<PaginatedResponse<Order>> {
  const searchParams = new URLSearchParams();
  if (memberId) searchParams.set("memberId", memberId);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  const url = query ? `${SHOP_ENDPOINT}/orders?${query}` : `${SHOP_ENDPOINT}/orders`;
  return api.get(url).json();
}

/**
 * Get a specific order by ID.
 */
export async function getOrder(id: UUID): Promise<Order> {
  return api.get(`${SHOP_ENDPOINT}/orders/${id}`).json();
}

// Alias for backward compatibility
export const getMyOrders = getOrders;
