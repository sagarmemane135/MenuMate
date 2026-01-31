"use client";

interface HourlyData {
  hour: number;
  orders: number;
  revenue: number;
}

export function DailyChart({ data }: { data: HourlyData[] }) {
  // Find max revenue for scaling
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const maxOrders = Math.max(...data.map((d) => d.orders), 1);

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary-500 rounded"></div>
          <span className="text-neutral-600 font-medium">Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-success-500 rounded"></div>
          <span className="text-neutral-600 font-medium">Orders</span>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-neutral-50 p-6 rounded-lg overflow-x-auto">
        <div className="flex items-end justify-between gap-1 min-h-[300px]" style={{ minWidth: "800px" }}>
          {data.map((item) => {
            const revenueHeight = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
            const ordersHeight = maxOrders > 0 ? (item.orders / maxOrders) * 100 : 0;

            return (
              <div key={item.hour} className="flex flex-col items-center gap-3 flex-1 group">
                {/* Bars container */}
                <div className="flex items-end gap-1 h-64 w-full justify-center">
                  {/* Revenue bar */}
                  <div 
                    className="w-5 bg-primary-500 rounded-t hover:bg-primary-600 transition-all duration-200 relative group/revenue"
                    style={{ height: `${Math.max(revenueHeight, 0.5)}%` }}
                  >
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover/revenue:block bg-neutral-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                      ₹{item.revenue.toFixed(0)}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-900"></div>
                    </div>
                  </div>
                  {/* Orders bar */}
                  <div 
                    className="w-5 bg-success-500 rounded-t hover:bg-success-600 transition-all duration-200 relative group/orders"
                    style={{ height: `${Math.max(ordersHeight * 0.8, 0.5)}%` }}
                  >
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover/orders:block bg-neutral-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                      {item.orders} orders
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-900"></div>
                    </div>
                  </div>
                </div>

                {/* Hour label */}
                <div className="text-xs text-neutral-700 font-semibold whitespace-nowrap">
                  {item.hour === 0 ? "12AM" : item.hour < 12 ? `${item.hour}AM` : item.hour === 12 ? "12PM" : `${item.hour - 12}PM`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

