import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import type { UUID } from "@/types/api";
import type {
  AddToCartRequest,
  UpdateCartItemRequest,
  CheckoutRequest,
  OrderQueryParams,
  Cart,
} from "@/types/shop";
import * as shopApi from "@/lib/api/shop";
import type { ShopProductQueryParams, ShopCategoryQueryParams } from "@/lib/api/shop";

// ===========================
// QUERY KEYS
// ===========================

export const shopKeys = {
  all: ["shop"] as const,
  // Products (member browse view)
  products: () => [...shopKeys.all, "products"] as const,
  productsList: (params: ShopProductQueryParams) => [...shopKeys.products(), "list", params] as const,
  productDetail: (id: UUID) => [...shopKeys.products(), "detail", id] as const,
  // Categories (member browse view)
  categories: () => [...shopKeys.all, "categories"] as const,
  categoriesList: (params: ShopCategoryQueryParams) => [...shopKeys.categories(), "list", params] as const,
  // Cart - now supports memberId for client-service mode
  cart: (memberId?: UUID) => [...shopKeys.all, "cart", memberId ?? "self"] as const,
  // Orders - now supports memberId for client-service mode
  orders: (memberId?: UUID) => [...shopKeys.all, "orders", memberId ?? "self"] as const,
  ordersList: (memberId?: UUID, params?: OrderQueryParams) => [...shopKeys.orders(memberId), "list", params] as const,
  orderDetail: (id: UUID) => [...shopKeys.all, "orders", "detail", id] as const,
};

// ===========================
// BROWSE PRODUCTS HOOKS
// ===========================

export function useShopProducts(params: ShopProductQueryParams = {}) {
  return useQuery({
    queryKey: shopKeys.productsList(params),
    queryFn: () => shopApi.browseProducts(params),
  });
}

export function useShopProduct(id: UUID) {
  return useQuery({
    queryKey: shopKeys.productDetail(id),
    queryFn: () => shopApi.getShopProduct(id),
    enabled: !!id,
  });
}

// ===========================
// BROWSE CATEGORIES HOOKS
// ===========================

export function useShopCategories(params: ShopCategoryQueryParams = {}) {
  return useQuery({
    queryKey: shopKeys.categoriesList(params),
    queryFn: () => shopApi.browseCategories(params),
  });
}

// ===========================
// CART HOOKS
// ===========================

/**
 * Get cart for a member.
 * Admin/Staff can specify memberId for client-service mode.
 * Members get their own cart when memberId is not provided.
 *
 * @param memberId - Optional member ID for client-service mode
 * @param options - Optional query options (e.g., { enabled: false } to disable auto-fetch)
 */
export function useCart(
  memberId?: UUID,
  options?: Omit<UseQueryOptions<Cart>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: shopKeys.cart(memberId),
    queryFn: () => shopApi.getCart(memberId),
    ...options,
  });
}

/**
 * Add item to cart.
 * Admin/Staff can specify memberId for client-service mode.
 * Note: memberId is passed in mutation data to avoid stale closure issues.
 */
export function useAddToCart(memberId?: UUID) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddToCartRequest & { memberId?: UUID }) => {
      const { memberId: dataMemberId, ...cartData } = data;
      return shopApi.addToCart(cartData, dataMemberId ?? memberId);
    },
    onSuccess: (updatedCart, variables) => {
      // Optimistically update the cart cache
      const effectiveMemberId = variables.memberId ?? memberId;
      queryClient.setQueryData(shopKeys.cart(effectiveMemberId), updatedCart);
    },
  });
}

/**
 * Update cart item quantity.
 * Admin/Staff can specify memberId for client-service mode.
 * Note: memberId can be passed in mutation data to avoid stale closure issues.
 */
export function useUpdateCartItem(memberId?: UUID) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      data,
      memberId: dataMemberId,
    }: {
      productId: UUID;
      data: UpdateCartItemRequest;
      memberId?: UUID;
    }) => shopApi.updateCartItem(productId, data, dataMemberId ?? memberId),
    onSuccess: (updatedCart, variables) => {
      const effectiveMemberId = variables.memberId ?? memberId;
      queryClient.setQueryData(shopKeys.cart(effectiveMemberId), updatedCart);
    },
  });
}

/**
 * Remove item from cart.
 * Admin/Staff can specify memberId for client-service mode.
 * Note: memberId can be passed in mutation data to avoid stale closure issues.
 */
export function useRemoveFromCart(memberId?: UUID) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, memberId: dataMemberId }: { productId: UUID; memberId?: UUID }) =>
      shopApi.removeFromCart(productId, dataMemberId ?? memberId),
    onSuccess: (updatedCart, variables) => {
      const effectiveMemberId = variables.memberId ?? memberId;
      queryClient.setQueryData(shopKeys.cart(effectiveMemberId), updatedCart);
    },
  });
}

/**
 * Clear entire cart.
 * Admin/Staff can specify memberId for client-service mode.
 * Note: memberId can be passed in mutation data to avoid stale closure issues.
 */
export function useClearCart(memberId?: UUID) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data?: { memberId?: UUID }) => shopApi.clearCart(data?.memberId ?? memberId),
    onSuccess: (updatedCart, variables) => {
      const effectiveMemberId = variables?.memberId ?? memberId;
      queryClient.setQueryData(shopKeys.cart(effectiveMemberId), updatedCart);
    },
  });
}

// ===========================
// CHECKOUT HOOKS
// ===========================

/**
 * Checkout and create invoice.
 * Admin/Staff can specify memberId for client-service mode.
 * Note: memberId can be passed in mutation data to avoid stale closure issues.
 */
export function useCheckout(memberId?: UUID) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data?: CheckoutRequest & { memberId?: UUID }) => {
      const { memberId: dataMemberId, ...checkoutData } = data || {};
      return shopApi.checkout(checkoutData, dataMemberId ?? memberId);
    },
    onSuccess: (_result, variables) => {
      const effectiveMemberId = variables?.memberId ?? memberId;
      // Invalidate cart (it's now an order)
      queryClient.invalidateQueries({ queryKey: shopKeys.cart(effectiveMemberId) });
      // Invalidate orders list to show the new order
      queryClient.invalidateQueries({ queryKey: shopKeys.orders(effectiveMemberId) });
    },
  });
}

// ===========================
// ORDER HISTORY HOOKS
// ===========================

/**
 * Get orders for a member.
 * Admin/Staff can specify memberId for client-service mode.
 * Members get their own orders when memberId is not provided.
 */
export function useOrders(memberId?: UUID, params: OrderQueryParams = {}) {
  return useQuery({
    queryKey: shopKeys.ordersList(memberId, params),
    queryFn: () => shopApi.getOrders(params, memberId),
  });
}

// Alias for backward compatibility
export const useMyOrders = useOrders;

/**
 * Get a specific order by ID.
 */
export function useOrder(id: UUID) {
  return useQuery({
    queryKey: shopKeys.orderDetail(id),
    queryFn: () => shopApi.getOrder(id),
    enabled: !!id,
  });
}
