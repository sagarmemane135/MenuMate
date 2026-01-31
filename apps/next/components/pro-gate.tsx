"use client";

import { useState, useEffect } from "react";
import { Button } from "@menumate/app";
import { Crown, Check, TrendingUp, BarChart3, Zap } from "lucide-react";

interface ProGateProps {
  userName: string;
}

interface PlanData {
  name: string;
  price: number;
  currency: string;
  interval: string;
  displayPrice: string;
}

const features = [
  { title: "Daily Analytics", desc: "Hour-by-hour revenue tracking" },
  { title: "Monthly Trends", desc: "Growth metrics & comparisons" },
  { title: "Item Performance", desc: "Best & worst sellers analysis" },
  { title: "Category Insights", desc: "Revenue by category breakdown" },
  { title: "Advanced Charts", desc: "Clear visualizations" },
  { title: "Priority Support", desc: "Get help faster" },
];

const benefits = [
  { icon: TrendingUp, title: "Increase Revenue", desc: "Identify top sellers and optimize your menu" },
  { icon: BarChart3, title: "Data-Driven Decisions", desc: "Real insights, not guesswork" },
  { icon: Zap, title: "Save Time", desc: "Automated reports and insights" },
];

export function ProGate({ userName }: ProGateProps) {
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/subscription-plan")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setPlan({
            name: data.data.name ?? "",
            price: data.data.price,
            currency: data.data.currency ?? "",
            interval: data.data.interval ?? "",
            displayPrice: data.data.displayPrice ?? "",
          });
        } else {
          setPlan(null);
        }
      })
      .catch(() => setPlan(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header - same style as admin pages */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
          <Crown className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Upgrade to Pro</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Unlock powerful analytics to grow your restaurant business
          </p>
        </div>
      </div>

      {/* Pricing card - same card style as admin dashboard; data from DB only */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
              <Crown className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">
                {loading ? "—" : plan?.name ?? "—"}
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">Everything you need to succeed</p>
            </div>
          </div>
          <div className="text-2xl font-semibold text-primary-600 tabular-nums">
            {loading ? "—" : plan?.displayPrice ?? "—"}
          </div>
        </div>
        <div className="p-5">
          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50/80 border border-neutral-100">
                <div className="w-8 h-8 rounded-lg bg-success-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-success-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">{f.title}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <Button
            size="sm"
            className="!min-w-0 w-fit justify-center gap-2"
            onClick={() => {
              alert("Payment integration coming soon! Please contact support@menumate.com to upgrade.");
            }}
          >
            <Crown className="w-4 h-4 shrink-0" />
            Upgrade to Pro Now
          </Button>
        </div>
      </div>

      {/* Benefits - stat-card style */}
      <div className="grid sm:grid-cols-3 gap-4">
        {benefits.map((b) => {
          const Icon = b.icon;
          return (
            <div
              key={b.title}
              className="stat-card flex-row flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-900">{b.title}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{b.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Contact */}
      <p className="text-center text-xs text-neutral-500">
        Questions?{" "}
        <a href="mailto:support@menumate.com" className="text-primary-600 hover:underline font-medium">
          support@menumate.com
        </a>
      </p>
    </div>
  );
}
