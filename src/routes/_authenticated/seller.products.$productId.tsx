import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/seller/products/$productId")({
  beforeLoad: ({ params }: { params: { productId: string } }) => {
    if (params.productId === "new") {
      throw redirect({ to: "/seller/products/new" });
    }
  },
  component: ProductIdLayout,
});

function ProductIdLayout() {
  return <Outlet />;
}
