"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Store } from "lucide-react";
import { ProductGrid } from "@/components/shop/product-grid";
import { PosCartSidebar } from "@/components/shop/pos-cart-sidebar";
import { CustomerSelectModal } from "@/components/shop/customer-select-modal";
import { useLocalCart } from "@liyaqa/shared/hooks/use-local-cart";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import * as shopApi from "@liyaqa/shared/lib/api/shop";
import type { Product } from "@liyaqa/shared/types/product";
import type { Member } from "@liyaqa/shared/types/member";

export default function PosPage() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const {
    items,
    customer,
    subtotal,
    taxTotal,
    grandTotal,
    itemCount,
    isEmpty,
    canCheckout,
    addItem,
    updateQuantity,
    removeItem,
    clearItems,
    setCustomer,
    clearCustomer,
    clearCart,
  } = useLocalCart();

  const texts = {
    title: locale === "ar" ? "نقطة البيع" : "Point of Sale",
    subtitle:
      locale === "ar"
        ? "أضف المنتجات إلى السلة ثم اختر العميل للدفع"
        : "Add products to cart, then select customer to checkout",
    addSuccess: locale === "ar" ? "تمت الإضافة إلى السلة" : "Added to cart",
    syncError:
      locale === "ar"
        ? "فشل في مزامنة السلة مع الخادم"
        : "Failed to sync cart with server",
    syncing: locale === "ar" ? "جاري المزامنة..." : "Syncing...",
  };

  // Handle adding product to local cart
  const handleAddToCart = (productId: string, quantity: number, product?: Product) => {
    if (!product) return;

    addItem(product, quantity);
    toast({
      title: texts.addSuccess,
    });
  };

  // Handle customer selection
  const handleSelectCustomer = (member: Member) => {
    setCustomer(member);
    setCustomerModalOpen(false);
  };

  // Handle checkout - sync local cart to backend and navigate
  const handleCheckout = async () => {
    if (!customer || isEmpty) return;

    setIsSyncing(true);
    try {
      // Clear the member's existing cart first
      await shopApi.clearCart(customer.id);

      // Add all items from local cart to backend
      for (const item of items) {
        await shopApi.addToCart(
          { productId: item.productId, quantity: item.quantity },
          customer.id
        );
      }

      // Navigate to checkout page
      router.push(`/${locale}/pos/checkout?memberId=${customer.id}`);
    } catch {
      toast({
        title: texts.syncError,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-lg bg-teal-100 flex items-center justify-center">
            <Store className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{texts.title}</h1>
            <p className="text-sm text-neutral-500">{texts.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Main Content - Product Grid + Cart Sidebar */}
      <div className="flex-1 grid lg:grid-cols-4 gap-6 min-h-0">
        {/* Product Grid (3 cols on lg) */}
        <div className="lg:col-span-3 overflow-auto">
          <ProductGrid
            onAddToCart={handleAddToCart}
            disabled={false}
            isLoading={false}
          />
        </div>

        {/* Cart Sidebar (1 col on lg) */}
        <div className="lg:col-span-1 h-full">
          <PosCartSidebar
            items={items}
            customer={customer}
            subtotal={subtotal}
            taxTotal={taxTotal}
            grandTotal={grandTotal}
            itemCount={itemCount}
            isEmpty={isEmpty}
            canCheckout={canCheckout}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onClearItems={clearItems}
            onSelectCustomer={() => setCustomerModalOpen(true)}
            onClearCustomer={clearCustomer}
            onCheckout={handleCheckout}
            isCheckoutLoading={isSyncing}
          />
        </div>
      </div>

      {/* Customer Selection Modal */}
      <CustomerSelectModal
        open={customerModalOpen}
        onOpenChange={setCustomerModalOpen}
        onSelect={handleSelectCustomer}
      />
    </div>
  );
}
