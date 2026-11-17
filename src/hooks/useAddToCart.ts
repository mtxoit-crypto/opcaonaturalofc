import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cartStore";
import { productPhoto, productsQuery } from "@/lib/products";

/** Uses the store catalog as the source of truth; the server revalidates price and stock. */
export function useAddToCart() {
  const { data: products, isLoading: loadingProducts } = useQuery(productsQuery);
  const addItem = useCartStore((state) => state.addItem);
  const isLoading = useCartStore((state) => state.isLoading);

  function getVariant(slug: string, _name?: string) {
    const product = products?.find((entry) => entry.slug === slug) ?? null;
    return {
      product,
      variant: product
        ? {
            availableForSale:
              product.is_active && product.price !== null && (product.stock_quantity ?? 0) > 0,
            price: { amount: String(product.price ?? 0), currencyCode: "BRL" as const },
          }
        : undefined,
    };
  }

  async function addToCart(slug: string, _name: string, quantity = 1) {
    const product = products?.find((entry) => entry.slug === slug);
    if (
      !product ||
      !product.is_active ||
      product.price === null ||
      (product.stock_quantity ?? 0) < 1
    ) {
      toast.error("Produto indisponível para compra no momento.");
      return false;
    }
    await addItem({
      slug: product.slug,
      title: product.name,
      image: productPhoto(product),
      price: { amount: String(product.price), currencyCode: "BRL" },
      quantity,
    });
    const { track } = await import("@/lib/analytics");
    track({ name: "add_to_cart", slug });
    return true;
  }

  return { addToCart, getVariant, isLoading: isLoading || loadingProducts };
}
