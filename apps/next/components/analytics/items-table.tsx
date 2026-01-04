"use client";

import { useState } from "react";
import { Card } from "@menumate/app";
import { TrendingUp, TrendingDown, Award, AlertCircle } from "lucide-react";

interface ItemData {
  topSellingByQuantity: Array<{
    name: string;
    quantitySold: number;
    revenue: string;
    ordersCount: number;
    averagePerOrder: string;
  }>;
  topSellingByRevenue: Array<{
    name: string;
    quantitySold: number;
    revenue: string;
    ordersCount: number;
    averagePerOrder: string;
  }>;
  leastSelling: Array<{
    name: string;
    quantitySold: number;
    revenue: string;
  }>;
  neverOrdered: Array<{
    name: string;
    price: number;
  }>;
}

export function ItemsTable({ data }: { data: ItemData }) {
  const [activeTab, setActiveTab] = useState<"top" | "least" | "never">("top");

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab("top")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "top"
              ? "text-success-600 border-b-2 border-success-600"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Top Sellers
          </div>
        </button>
        <button
          onClick={() => setActiveTab("least")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "least"
              ? "text-warning-600 border-b-2 border-warning-600"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Least Selling
          </div>
        </button>
        <button
          onClick={() => setActiveTab("never")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "never"
              ? "text-error-600 border-b-2 border-error-600"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Never Ordered
          </div>
        </button>
      </div>

      {/* Content */}
      <Card className="overflow-hidden">
        {activeTab === "top" && (
          <div className="p-6 space-y-6">
            {/* By Quantity */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-success-600" />
                Top Sellers by Quantity
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200 text-left">
                      <th className="pb-3 text-sm font-semibold text-neutral-600">#</th>
                      <th className="pb-3 text-sm font-semibold text-neutral-600">Item</th>
                      <th className="pb-3 text-sm font-semibold text-neutral-600 text-right">Qty Sold</th>
                      <th className="pb-3 text-sm font-semibold text-neutral-600 text-right">Revenue</th>
                      <th className="pb-3 text-sm font-semibold text-neutral-600 text-right">Orders</th>
                      <th className="pb-3 text-sm font-semibold text-neutral-600 text-right">Avg/Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topSellingByQuantity.map((item, index) => (
                      <tr key={index} className="border-b border-neutral-100 last:border-0">
                        <td className="py-3 text-sm text-neutral-600">{index + 1}</td>
                        <td className="py-3 text-sm font-medium text-neutral-900">{item.name}</td>
                        <td className="py-3 text-sm text-neutral-900 text-right font-semibold">
                          {item.quantitySold}
                        </td>
                        <td className="py-3 text-sm text-success-600 text-right font-semibold">
                          ₹{item.revenue}
                        </td>
                        <td className="py-3 text-sm text-neutral-600 text-right">{item.ordersCount}</td>
                        <td className="py-3 text-sm text-neutral-600 text-right">{item.averagePerOrder}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* By Revenue */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-primary-600" />
                Top Sellers by Revenue
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200 text-left">
                      <th className="pb-3 text-sm font-semibold text-neutral-600">#</th>
                      <th className="pb-3 text-sm font-semibold text-neutral-600">Item</th>
                      <th className="pb-3 text-sm font-semibold text-neutral-600 text-right">Revenue</th>
                      <th className="pb-3 text-sm font-semibold text-neutral-600 text-right">Qty Sold</th>
                      <th className="pb-3 text-sm font-semibold text-neutral-600 text-right">Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topSellingByRevenue.map((item, index) => (
                      <tr key={index} className="border-b border-neutral-100 last:border-0">
                        <td className="py-3 text-sm text-neutral-600">{index + 1}</td>
                        <td className="py-3 text-sm font-medium text-neutral-900">{item.name}</td>
                        <td className="py-3 text-sm text-primary-600 text-right font-semibold">
                          ₹{item.revenue}
                        </td>
                        <td className="py-3 text-sm text-neutral-600 text-right">{item.quantitySold}</td>
                        <td className="py-3 text-sm text-neutral-600 text-right">{item.ordersCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "least" && (
          <div className="p-6">
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-warning-800">
                <strong>Tip:</strong> Consider promoting these items or removing them from the menu to optimize inventory.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 text-left">
                    <th className="pb-3 text-sm font-semibold text-neutral-600">Item</th>
                    <th className="pb-3 text-sm font-semibold text-neutral-600 text-right">Qty Sold</th>
                    <th className="pb-3 text-sm font-semibold text-neutral-600 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.leastSelling.map((item, index) => (
                    <tr key={index} className="border-b border-neutral-100 last:border-0">
                      <td className="py-3 text-sm font-medium text-neutral-900">{item.name}</td>
                      <td className="py-3 text-sm text-warning-600 text-right">{item.quantitySold}</td>
                      <td className="py-3 text-sm text-neutral-600 text-right">₹{item.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "never" && (
          <div className="p-6">
            <div className="bg-error-50 border border-error-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-error-800">
                <strong>Action Required:</strong> These items have never been ordered. Consider revising descriptions, pricing, or removing them.
              </p>
            </div>
            {data.neverOrdered.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200 text-left">
                      <th className="pb-3 text-sm font-semibold text-neutral-600">Item</th>
                      <th className="pb-3 text-sm font-semibold text-neutral-600 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.neverOrdered.map((item, index) => (
                      <tr key={index} className="border-b border-neutral-100 last:border-0">
                        <td className="py-3 text-sm font-medium text-neutral-900">{item.name}</td>
                        <td className="py-3 text-sm text-neutral-600 text-right">₹{item.price.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-600">
                <p className="text-sm">Great! All menu items have been ordered at least once.</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

