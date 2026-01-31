/**
 * Razorpay webhook: marks session paid when customer closes tab after paying
 * (payment.captured) so session is still updated even if client never called verify-online-payment.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { getRazorpayInstance } from "@/lib/razorpay";
import { db, tableSessions, orders, eq } from "@menumate/db";

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("X-Razorpay-Signature") ?? "";

    if (!WEBHOOK_SECRET?.trim()) {
      console.warn("[WEBHOOK] RAZORPAY_WEBHOOK_SECRET not set, skipping verification");
      return NextResponse.json({ received: true }, { status: 200 });
    }

    if (!verifyWebhookSignature(rawBody, signature, WEBHOOK_SECRET.trim())) {
      console.error("[WEBHOOK] Razorpay webhook signature invalid");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const payload = JSON.parse(rawBody) as {
      event?: string;
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            order_id?: string;
            amount?: number;
            status?: string;
          };
        };
      };
    };

    if (payload.event !== "payment.captured" || !payload.payload?.payment?.entity) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const payment = payload.payload.payment.entity;
    if (payment.status !== "captured") {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const razorpayOrderId = payment.order_id;
    if (!razorpayOrderId) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const razorpay = getRazorpayInstance();
    const razorpayOrder = await razorpay.orders.fetch(razorpayOrderId);
    const receipt = (razorpayOrder as { receipt?: string }).receipt;
    if (!receipt) {
      console.warn("[WEBHOOK] Razorpay order has no receipt:", razorpayOrderId);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const [session] = await db
      .select()
      .from(tableSessions)
      .where(eq(tableSessions.id, receipt))
      .limit(1);

    if (!session) {
      console.warn("[WEBHOOK] Session not found for receipt:", receipt);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    if (session.status === "paid") {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const sessionOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.sessionId, session.id));
    const expectedTotalPaise = Math.round(
      sessionOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0) * 100
    );
    const paymentAmount = payment.amount ?? 0;
    if (Math.abs(paymentAmount - expectedTotalPaise) > 1) {
      console.error("[WEBHOOK] Payment amount mismatch", {
        paymentAmount,
        expectedTotalPaise,
        sessionId: session.id,
      });
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    await db
      .update(tableSessions)
      .set({
        status: "paid",
        paymentMethod: "online",
        paymentStatus: "paid",
        paymentId: payment.id ?? null,
        closedAt: new Date(),
      })
      .where(eq(tableSessions.id, session.id));

    await db
      .update(orders)
      .set({
        isPaid: true,
        paymentStatus: "paid",
        status: "paid",
        paymentId: payment.id ?? null,
      })
      .where(eq(orders.sessionId, session.id));

    console.log("[WEBHOOK] Session marked paid via payment.captured", session.sessionToken);
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[WEBHOOK] Razorpay webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
