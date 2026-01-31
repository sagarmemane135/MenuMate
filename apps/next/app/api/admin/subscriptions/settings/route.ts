/**
 * Super admin only: get or update platform subscription settings.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db, platformSettings, eq } from "@menumate/db";

const ALLOWED_KEYS = ["pro_plan_price", "pro_plan_currency", "pro_plan_interval", "pro_plan_name"] as const;

function requireSuperAdmin(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const user = await getCurrentUser();
  const err = requireSuperAdmin(user);
  if (err) return err;

  try {
    const rows = await db.select().from(platformSettings);
    const data = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return NextResponse.json({
      success: true,
      data: {
        pro_plan_price: (data.pro_plan_price ?? "").toString(),
        pro_plan_currency: (data.pro_plan_currency ?? "").toString(),
        pro_plan_interval: (data.pro_plan_interval ?? "").toString(),
        pro_plan_name: (data.pro_plan_name ?? "").toString(),
      },
    });
  } catch (e) {
    console.error("[admin subscriptions settings GET]", e);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  const err = requireSuperAdmin(user);
  if (err) return err;

  try {
    const body = await request.json();
    for (const key of ALLOWED_KEYS) {
      if (body[key] !== undefined) {
        const value = String(body[key]).trim();
        await db
          .insert(platformSettings)
          .values({ key, value, updatedAt: new Date() })
          .onConflictDoUpdate({
            target: platformSettings.key,
            set: { value, updatedAt: new Date() },
          });
      }
    }
    const rows = await db.select().from(platformSettings);
    const data = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return NextResponse.json({
      success: true,
      data: {
        pro_plan_price: (data.pro_plan_price ?? "").toString(),
        pro_plan_currency: (data.pro_plan_currency ?? "").toString(),
        pro_plan_interval: (data.pro_plan_interval ?? "").toString(),
        pro_plan_name: (data.pro_plan_name ?? "").toString(),
      },
    });
  } catch (e) {
    console.error("[admin subscriptions settings PATCH]", e);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
