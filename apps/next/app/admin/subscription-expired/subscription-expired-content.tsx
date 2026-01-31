"use client";

import { Card } from "@menumate/app";
import { AlertCircle, Mail } from "lucide-react";
import { LogoutButton } from "./logout-button";

export function SubscriptionExpiredContent() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-warning-100 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-warning-600" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          Subscription Expired
        </h1>
        <p className="text-neutral-600 mb-6">
          Your restaurant account is currently inactive. Your menu page is not visible to customers until your subscription is renewed.
        </p>
        <p className="text-sm text-neutral-500 mb-8">
          Please contact MenuMate support to renew your subscription or resolve any payment issues.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="mailto:support@menumate.com"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 font-medium text-sm"
          >
            <Mail className="w-4 h-4" />
            Contact Support
          </a>
          <LogoutButton />
        </div>
      </Card>
    </div>
  );
}
