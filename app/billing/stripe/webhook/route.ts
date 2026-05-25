import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function apiBase(): string {
  const raw = process.env.PEAKD_API_BASE_URL?.trim();
  if (!raw) {
    throw new Error("PEAKD_API_BASE_URL is not set");
  }
  return raw.replace(/\/+$/, "");
}

function stripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not set");
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
        { message: "Missing stripe-signature header", error: "Bad Request", statusCode: 400 },
        { status: 400 },
      );
    }

    const rawBody = Buffer.from(await request.arrayBuffer());

    let event: Stripe.Event;
    try {
      event = Stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret());
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

    const upstream = await fetch(`${apiBase()}/billing/stripe/process-event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-peakd-billing-webhook-internal": billingWebhookInternalSecret(),
      },
      body: JSON.stringify({ event }),
    });

    const text = await upstream.text();
    const outContentType = upstream.headers.get("content-type") ?? "application/json";
    return new NextResponse(text, {
      status: upstream.status,
      headers: { "Content-Type": outContentType },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Webhook proxy error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
