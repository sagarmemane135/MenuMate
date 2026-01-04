"use client";

import { Card, Button } from "@menumate/app";
import { Crown, Check, TrendingUp, BarChart3, PieChart, Zap } from "lucide-react";

interface ProGateProps {
  userName: string;
}

export function ProGate({ userName }: ProGateProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-warning-50 p-6">
      <div className="max-w-4xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">
            Upgrade to Pro
          </h1>
          <p className="text-lg text-neutral-600">
            Unlock powerful analytics to grow your restaurant business
          </p>
        </div>

        {/* Pricing Card */}
        <Card className="p-8 mb-6 border-2 border-primary-200 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-6 w-6 text-primary-600" />
                <h2 className="text-2xl font-bold text-neutral-900">Pro Plan</h2>
              </div>
              <p className="text-neutral-600">Everything you need to succeed</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary-600">₹999</div>
              <div className="text-sm text-neutral-600">/month</div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-success-50 rounded-lg mt-1">
                <Check className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Daily Analytics</h3>
                <p className="text-sm text-neutral-600">Hour-by-hour revenue tracking</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-success-50 rounded-lg mt-1">
                <Check className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Monthly Trends</h3>
                <p className="text-sm text-neutral-600">Growth metrics & comparisons</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-success-50 rounded-lg mt-1">
                <Check className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Item Performance</h3>
                <p className="text-sm text-neutral-600">Best & worst sellers analysis</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-success-50 rounded-lg mt-1">
                <Check className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Category Insights</h3>
                <p className="text-sm text-neutral-600">Revenue by category breakdown</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-success-50 rounded-lg mt-1">
                <Check className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Advanced Charts</h3>
                <p className="text-sm text-neutral-600">Beautiful visualizations</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-success-50 rounded-lg mt-1">
                <Check className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Priority Support</h3>
                <p className="text-sm text-neutral-600">Get help faster</p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 text-lg font-semibold"
            onClick={() => {
              // TODO: Implement payment integration
              alert("Payment integration coming soon! Please contact support@menumate.com to upgrade.");
            }}
          >
            <Crown className="h-5 w-5 mr-2" />
            Upgrade to Pro Now
          </Button>
        </Card>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-50 rounded-full mb-3">
              <TrendingUp className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-neutral-900 mb-1">Increase Revenue</h3>
            <p className="text-sm text-neutral-600">
              Identify top sellers and optimize your menu
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-50 rounded-full mb-3">
              <BarChart3 className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-neutral-900 mb-1">Make Data-Driven Decisions</h3>
            <p className="text-sm text-neutral-600">
              Real insights, not guesswork
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-50 rounded-full mb-3">
              <Zap className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-neutral-900 mb-1">Save Time</h3>
            <p className="text-sm text-neutral-600">
              Automated reports and insights
            </p>
          </Card>
        </div>

        {/* Contact */}
        <p className="text-center text-sm text-neutral-600 mt-6">
          Questions? Contact us at{" "}
          <a href="mailto:support@menumate.com" className="text-primary-600 hover:underline">
            support@menumate.com
          </a>
        </p>
      </div>
    </div>
  );
}

