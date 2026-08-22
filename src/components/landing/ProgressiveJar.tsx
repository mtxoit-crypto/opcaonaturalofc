import { useState } from "react";
import { productPhoto, type Product } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { JarViewer } from "@/components/JarViewer";

export function ProgressiveJar({ product }: { product: Product | undefined }) {
  const [show3d, setShow3d] = useState(false);
  const src = product ? productPhoto(product) : null;

  if (show3d) {
    return (
      <JarViewer
        compact
        jarColor={product?.jar_color ?? "#F2F1EE"}
        lidColor={product?.lid_color ?? "#6FC49A"}
        capsuleColor={product?.capsule_color ?? "#C9A227"}
        capsuleCount={product?.capsule_count ?? 24}
        name={product?.name}
        dosage={product?.dosage ?? undefined}
        subtitle={product?.subtitle ?? undefined}
        imageUrl={src ?? undefined}
      />
    );
  }

  return (
    <div className="rounded-2xl bg-sand p-4">
      {src ? (
        <img
          src={src}
          alt={product ? `Pote de ${product.name}` : ""}
          width={480}
          height={480}
          fetchPriority="high"
          decoding="async"
          className="mx-auto h-[220px] w-auto object-contain sm:h-[248px]"
        />
      ) : (
        <div className="mx-auto h-[220px] w-40 rounded-2xl bg-muted sm:h-[248px]" />
      )}
      <div className="mt-3 flex justify-center">
        <Button type="button" variant="outline" size="sm" onClick={() => setShow3d(true)}>
          Ver pote em 3D
        </Button>
      </div>
    </div>
  );
}
