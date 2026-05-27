import { auth0 } from "@/lib/auth0";
import { getSocialFeedNavProps } from "@/lib/social-feed-nav";
import { OrderReturnPanel } from "@/components/social-feed/order-return-panel";
import { SocialFeedLayout } from "@/components/social-feed/social-feed-layout";

export default async function OrderReturnPage({
  params,
  searchParams,
}: {
  params: Promise<{ userSub: string }>;
  searchParams: Promise<{
    order_id?: string;
    session_id?: string;
    canceled?: string;
  }>;
}) {
  const [{ userSub }, sp] = await Promise.all([params, searchParams]);
  const session = await auth0.getSession();
  if (!session?.user?.sub) {
    return null;
  }

  const nav = await getSocialFeedNavProps(session);
  const orderId = (sp.order_id ?? "").trim();
  const canceled = sp.canceled === "1";

  return (
    <SocialFeedLayout
      {...nav}
      userPicture={session.user.picture}
      userName={session.user.name}
      userEmail={session.user.email}
    >
      <header className="mb-6 border-b border-border pb-4">
        <h1 className="text-xl font-semibold text-foreground">
          {canceled ? "Checkout canceled" : "Confirming your unlock"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {canceled
            ? "No charge was made — your cart is still saved."
            : "We're confirming payment with Stripe and unlocking your videos…"}
        </p>
      </header>
      <OrderReturnPanel
        orderId={orderId}
        canceled={canceled}
        userSub={userSub}
      />
    </SocialFeedLayout>
  );
}
