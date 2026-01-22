"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { Product } from "@/types/product";
import type { Member } from "@/types/member";
import type { Money } from "@/types/api";

const STORAGE_KEY = "pos-local-cart";
const VAT_RATE = 0.15;

export interface LocalCartItem {
  productId: string;
  product: Product;
  quantity: number;
}

export interface LocalCartCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface LocalCartState {
  items: LocalCartItem[];
  customer: LocalCartCustomer | null;
}

const emptyCart: LocalCartState = {
  items: [],
  customer: null,
};

function loadCartFromStorage(): LocalCartState {
  if (typeof window === "undefined") return emptyCart;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as LocalCartState;
    }
  } catch {
    // Invalid JSON, reset cart
    localStorage.removeItem(STORAGE_KEY);
  }
  return emptyCart;
}

function saveCartToStorage(cart: LocalCartState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // localStorage full or unavailable
    console.warn("[useLocalCart] Failed to save cart to localStorage");
  }
}

export function useLocalCart() {
  const [cart, setCart] = useState<LocalCartState>(emptyCart);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = loadCartFromStorage();
    setCart(stored);
    setIsHydrated(true);
  }, []);

  // Persist to localStorage on every change (after hydration)
  useEffect(() => {
    if (isHydrated) {
      saveCartToStorage(cart);
    }
  }, [cart, isHydrated]);

  // ===========================
  // CART ITEM ACTIONS
  // ===========================

  const addItem = useCallback((product: Product, quantity: number = 1) => {
    setCart((prev) => {
      const existingIndex = prev.items.findIndex(
        (item) => item.productId === product.id
      );

      if (existingIndex >= 0) {
        // Update quantity of existing item
        const newItems = [...prev.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + quantity,
        };
        return { ...prev, items: newItems };
      }

      // Add new item
      return {
        ...prev,
        items: [...prev.items, { productId: product.id, product, quantity }],
      };
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      setCart((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.productId !== productId),
      }));
      return;
    }

    setCart((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      ),
    }));
  }, []);

  const removeItem = useCallback((productId: string) => {
    setCart((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.productId !== productId),
    }));
  }, []);

  const clearItems = useCallback(() => {
    setCart((prev) => ({ ...prev, items: [] }));
  }, []);

  // ===========================
  // CUSTOMER ACTIONS
  // ===========================

  const setCustomer = useCallback((member: Member | null) => {
    if (!member) {
      setCart((prev) => ({ ...prev, customer: null }));
      return;
    }

    const customerName =
      typeof member.firstName === "object"
        ? member.firstName.en || member.firstName.ar || ""
        : member.firstName;
    const customerLastName =
      typeof member.lastName === "object"
        ? member.lastName.en || member.lastName.ar || ""
        : member.lastName;

    setCart((prev) => ({
      ...prev,
      customer: {
        id: member.id,
        name: `${customerName} ${customerLastName}`.trim(),
        email: member.email,
        phone: member.phone,
      },
    }));
  }, []);

  const clearCustomer = useCallback(() => {
    setCart((prev) => ({ ...prev, customer: null }));
  }, []);

  // ===========================
  // CLEAR ALL
  // ===========================

  const clearCart = useCallback(() => {
    setCart(emptyCart);
  }, []);

  // ===========================
  // COMPUTED VALUES
  // ===========================

  const subtotal = useMemo(() => {
    return cart.items.reduce((sum, item) => {
      // Product always has listPrice as Money object with amount
      const price = item.product.listPrice?.amount ?? 0;
      return sum + price * item.quantity;
    }, 0);
  }, [cart.items]);

  const taxTotal = useMemo(() => {
    return subtotal * VAT_RATE;
  }, [subtotal]);

  const grandTotal = useMemo(() => {
    return subtotal + taxTotal;
  }, [subtotal, taxTotal]);

  const itemCount = useMemo(() => {
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart.items]);

  const isEmpty = useMemo(() => {
    return cart.items.length === 0;
  }, [cart.items]);

  const hasCustomer = useMemo(() => {
    return cart.customer !== null;
  }, [cart.customer]);

  const canCheckout = useMemo(() => {
    return !isEmpty && hasCustomer;
  }, [isEmpty, hasCustomer]);

  return {
    // State
    items: cart.items,
    customer: cart.customer,
    isHydrated,

    // Item actions
    addItem,
    updateQuantity,
    removeItem,
    clearItems,

    // Customer actions
    setCustomer,
    clearCustomer,

    // Clear all
    clearCart,

    // Computed
    subtotal,
    taxTotal,
    grandTotal,
    itemCount,
    isEmpty,
    hasCustomer,
    canCheckout,
  };
}

export type UseLocalCartReturn = ReturnType<typeof useLocalCart>;
