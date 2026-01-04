"use client";

interface DailyData {
  day: number;
  date: string;
  orders: number;
  revenue: number;
}

export function MonthlyChart({ data }: { data: DailyData[] }) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="relative h-64 bg-neutral-50 p-4 rounded-lg">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-neutral-600 py-4">
          <div>₹{maxRevenue.toFixed(0)}</div>
          <div>₹{(maxRevenue * 0.75).toFixed(0)}</div>
          <div>₹{(maxRevenue * 0.5).toFixed(0)}</div>
          <div>₹{(maxRevenue * 0.25).toFixed(0)}</div>
          <div>₹0</div>
        </div>

        {/* Chart area */}
        <div className="ml-12 h-full flex items-end gap-px">
          {data.map((item, index) => {
            const height = (item.revenue / maxRevenue) * 100;

            return (
              <div
                key={item.day}
                className="flex-1 group relative"
              >
                <div
                  className="bg-primary-500 hover:bg-primary-600 transition-colors rounded-t cursor-pointer"
                  style={{ height: `${height}%` }}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-neutral-900 text-white text-xs px-3 py-2 rounded shadow-lg whitespace-nowrap z-10">
                    <div className="font-semibold">Day {item.day}</div>
                    <div>₹{item.revenue.toFixed(2)}</div>
                    <div className="text-neutral-300">{item.orders} orders</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* X-axis labels (show every 5th day) */}
      <div className="flex justify-between text-xs text-neutral-600 px-4">
        {[1, 5, 10, 15, 20, 25, 30].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
    </div>
  );
}

