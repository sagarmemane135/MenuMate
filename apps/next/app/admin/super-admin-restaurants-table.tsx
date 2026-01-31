"use client";

import { useState } from "react";
import { UtensilsCrossed, ExternalLink, Power, PowerOff } from "lucide-react";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

interface SuperAdminRestaurantsTableProps {
  restaurants: Restaurant[];
  onActivate: (restaurantId: string) => Promise<void>;
  onDeactivate: (restaurantId: string) => Promise<void>;
}

export function SuperAdminRestaurantsTable({
  restaurants,
  onActivate,
  onDeactivate,
}: SuperAdminRestaurantsTableProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleToggle = async (restaurant: Restaurant) => {
    setPendingId(restaurant.id);
    try {
      if (restaurant.isActive) {
        await onDeactivate(restaurant.id);
      } else {
        await onActivate(restaurant.id);
      }
    } finally {
      setPendingId(null);
    }
  };

  if (restaurants.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto mb-3">
          <UtensilsCrossed className="w-6 h-6 text-neutral-400" />
        </div>
        <p className="text-sm font-medium text-neutral-600">No restaurants yet</p>
        <p className="text-xs text-neutral-500 mt-1">New signups will appear after approval</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto -mx-1">
      <table className="w-full table-fixed min-w-[360px]">
        <colgroup>
          <col style={{ width: "40%" }} />
          <col style={{ width: "30%" }} />
          <col style={{ width: "30%" }} />
        </colgroup>
        <thead>
          <tr className="border-b border-neutral-200">
            <th className="text-left py-2.5 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Restaurant
            </th>
            <th className="text-left py-2.5 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Status
            </th>
            <th className="text-left py-2.5 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {restaurants.map((restaurant) => {
            const isPending = pendingId === restaurant.id;
            return (
              <tr
                key={restaurant.id}
                className="group hover:bg-neutral-50/80 transition-colors"
              >
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <UtensilsCrossed className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-900 truncate">{restaurant.name}</p>
                      <p className="text-xs text-neutral-500 font-mono truncate mt-0.5">{restaurant.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => handleToggle(restaurant)}
                    disabled={isPending}
                    className={`
                      inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                      focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500
                      disabled:opacity-60 disabled:pointer-events-none
                      ${restaurant.isActive
                        ? "bg-success-50 text-success-700 hover:bg-success-100"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      }
                    `}
                    title={restaurant.isActive ? "Click to deactivate" : "Click to activate"}
                  >
                    {isPending ? (
                      <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : restaurant.isActive ? (
                      <Power className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <PowerOff className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span className="truncate">{restaurant.isActive ? "Active" : "Inactive"}</span>
                  </button>
                </td>
                <td className="py-3 px-3 text-left">
                  {restaurant.isActive ? (
                    <a
                      href={`/r/${restaurant.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View menu
                    </a>
                  ) : (
                    <span className="text-xs text-neutral-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
