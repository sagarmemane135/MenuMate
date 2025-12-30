"use client";

import { useState } from "react";
import { Card, Button } from "@menumate/app";
import { EditRestaurantForm } from "./edit-restaurant-form";
import { UtensilsCrossed, Edit, Menu, Package, ExternalLink } from "lucide-react";

interface DashboardClientProps {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
  } | null;
  userEmail: string;
}

export function DashboardClient({ restaurant, userEmail }: DashboardClientProps) {
  const [showEditForm, setShowEditForm] = useState(false);
  const [restaurantData, setRestaurantData] = useState(restaurant);

  const handleRestaurantUpdated = (updated: typeof restaurant) => {
    setRestaurantData(updated);
    setShowEditForm(false);
  };

  if (showEditForm && restaurantData) {
    return (
      <div>
        <EditRestaurantForm
          restaurant={restaurantData}
          onSuccess={handleRestaurantUpdated}
          onCancel={() => setShowEditForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Restaurant Card */}
      <Card className="overflow-hidden">
        {restaurantData ? (
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start space-x-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <UtensilsCrossed className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2 break-words">
                    {restaurantData.name}
                  </h2>
                  <p className="text-sm text-slate-600 font-mono bg-slate-100 px-3 py-1.5 rounded-lg inline-block">
                    /{restaurantData.slug}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</p>
                <span
                  className={`inline-flex items-center px-3 py-1.5 text-sm font-bold rounded-full ${
                    restaurantData.isActive 
                      ? "bg-green-100 text-green-700" 
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full mr-2 ${
                    restaurantData.isActive ? "bg-green-500" : "bg-red-500"
                  }`}></span>
                  {restaurantData.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditForm(true)}
                className="flex items-center space-x-1"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </Button>
            </div>

            <a
              href={`/r/${restaurantData.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2 w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl"
            >
              <ExternalLink className="w-5 h-5" />
              <span>View Public Menu</span>
            </a>
          </div>
        ) : (
          <div className="text-center py-12">
            <UtensilsCrossed className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">No restaurant found</p>
          </div>
        )}
      </Card>

      {/* Quick Actions Card */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <a
              href="/admin/menu"
              className="flex items-center space-x-4 p-4 bg-gradient-to-r from-orange-50 to-orange-100/50 border-2 border-orange-200 rounded-xl hover:border-orange-400 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <Menu className="w-6 h-6 text-orange-500" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-900">Manage Menu</p>
                <p className="text-xs text-slate-600">Add & edit items</p>
              </div>
              <ExternalLink className="w-5 h-5 text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>

            <a
              href="/admin/orders"
              className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <Package className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-900">View Orders</p>
                <p className="text-xs text-slate-600">Manage orders</p>
              </div>
              <ExternalLink className="w-5 h-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}
