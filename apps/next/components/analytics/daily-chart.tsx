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
          <span className="text-neutral-600">Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-success-500 rounded"></div>
          <span className="text-neutral-600">Orders</span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex items-end justify-between gap-1 h-64 bg-neutral-50 p-4 rounded-lg">
        {data.map((item) => {
          const revenueHeight = (item.revenue / maxRevenue) * 100;
          const ordersHeight = (item.orders / maxOrders) * 100;

          return (
            <div key={item.hour} className="flex flex-col items-center gap-2 flex-1 group">
              {/* Bars */}
              <div className="flex items-end gap-1 h-48 w-full">
                {/* Revenue bar */}
                <div className="flex-1 bg-primary-500 rounded-t hover:bg-primary-600 transition-colors relative group"
                     style={{ height: `${revenueHeight}%` }}>
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-neutral-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    ₹{item.revenue.toFixed(0)}
                  </div>
                </div>
                {/* Orders bar */}
                <div className="flex-1 bg-success-500 rounded-t hover:bg-success-600 transition-colors relative group"
                     style={{ height: `${ordersHeight * 0.8}%` }}>
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-neutral-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {item.orders} orders
                  </div>
                </div>
              </div>

              {/* Hour label */}
              <div className="text-xs text-neutral-600 font-medium">
                {item.hour === 0 ? "12AM" : item.hour < 12 ? `${item.hour}AM` : item.hour === 12 ? "12PM" : `${item.hour - 12}PM`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

