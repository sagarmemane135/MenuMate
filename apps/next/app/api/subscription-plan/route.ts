/**
 * Public API: returns current Pro plan display config from DB only.
 * No hardcoded fallbacks. Used by ProGate.
 */

import { NextResponse } from "next/server";
import { db, platformSettings } from "@menumate/db";

export async function GET() {
  try {
    const rows = await db.select().from(platformSettings);
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

    const priceRaw = map.pro_plan_price != null && map.pro_plan_price !== "" ? map.pro_plan_price : null;
    const price = priceRaw != null ? parseInt(String(priceRaw), 10) : null;
    const currency = (map.pro_plan_currency ?? "").toString().toUpperCase() || null;
    const interval = (map.pro_plan_interval ?? "").toString().toLowerCase() || null;
    const name = (map.pro_plan_name ?? "").toString().trim() || null;

    if (price == null || !currency || !interval) {
      return NextResponse.json({ success: false, data: null }, { status: 200 });
    }

    const displayPrice =
      `${currency === "INR" ? "₹" : currency === "USD" ? "$" : ""}${price}${interval === "month" ? "/month" : "/year"}`;

    return NextResponse.json({
      success: true,
      data: {
        name: name ?? "",
        price,
        currency,
        interval,
        displayPrice,
      },
    });
  } catch (error) {
    console.error("[subscription-plan]", error);
    return NextResponse.json({ success: false, data: null }, { status: 200 });
  }
}
