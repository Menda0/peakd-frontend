import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

/**
 * Connect-account webhook proxy. Configure the Stripe Dashboard endpoint to
 * point here for `account.updated`, `transfer.*`, and `payout.*` events.
 *
 * The signing secret is `STRIPE_CONNECT_WEBHOOK_SECRET` if set, otherwise it
 * falls back to `STRIPE_WEBHOOK_SECRET` so a single endpoint setup still works.
 */
export const dynamic = "force-dynamic";

function apiBase(): string {
  const raw = process.env.PEAKD_API_BASE_URL?.trim();
  if (!raw) {
    throw new Error("PEAKD_API_BASE_URL is not set");
  }
  return raw.replace(/\/+$/, "");
}

function stripeConnectWebhookSecret(): string {
  const secret =
    process.env.STRIPE_CONNECT_WEBHOOK_SECRET?.trim() ||
    process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "Neither STRIPE_CONNECT_WEBHOOK_SECRET nor STRIPE_WEBHOOK_SECRET is set",
    );
  }
  return secret;
}

function billingWebhookInternalSecret(): string {
  const secret = process.env.BILLING_WEBHOOK_INTERNAL_SECRET?.trim();
  if (!secret) {
    throw new Error("BILLING_WEBHOOK_INTERNAL_SECRET is not set");
  }
  return secret;
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json(
        {
          message: "Missing stripe-signature header",
          error: "Bad Request",
          statusCode: 400,
        },
        { status: 400 },
      );
    }

    const rawBody = Buffer.from(await request.arrayBuffer());

    let event: Stripe.Event;
    try {
      event = Stripe.webhooks.constructEvent(
        rawBody,
        signature,
        stripeConnectWebhookSecret(),
      );
    } catch {
      return NextResponse.json(
        {
          message: "Invalid Stripe webhook signature",
          error: "Bad Request",
          statusCode: 400,
        },
        { status: 400 },
      );
    }

    const upstream = await fetch(`${apiBase()}/payouts/stripe/process-event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-peakd-billing-webhook-internal": billingWebhookInternalSecret(),
      },
      body: JSON.stringify({ event }),
    });

    const text = await upstream.text();
    const outContentType =
      upstream.headers.get("content-type") ?? "application/json";
    return new NextResponse(text, {
      status: upstream.status,
      headers: { "Content-Type": outContentType },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Webhook proxy error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
