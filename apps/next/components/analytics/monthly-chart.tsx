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
      <div className="bg-neutral-50 p-6 rounded-lg overflow-hidden">
        <div className="flex gap-4">
          {/* Y-axis labels */}
          <div className="flex flex-col justify-between text-xs text-neutral-600 py-2" style={{ minHeight: "300px" }}>
            <div className="text-right">₹{Math.round(maxRevenue)}</div>
            <div className="text-right">₹{Math.round(maxRevenue * 0.75)}</div>
            <div className="text-right">₹{Math.round(maxRevenue * 0.5)}</div>
            <div className="text-right">₹{Math.round(maxRevenue * 0.25)}</div>
            <div className="text-right">₹0</div>
          </div>

          {/* Chart area */}
          <div className="flex-1 flex items-end justify-start gap-1 overflow-x-auto" style={{ minHeight: "300px" }}>
            {data.map((item) => {
              const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
              const barHeight = `${Math.max(height, 0.5)}%`; // Minimum 0.5% for visibility

              return (
                <div
                  key={item.day}
                  className="group relative flex-shrink-0"
                  style={{ width: `${100 / data.length}%`, minWidth: "8px" }}
                >
                  <div
                    className="bg-primary-500 hover:bg-primary-600 transition-all duration-200 rounded-t cursor-pointer w-full"
                    style={{ height: barHeight }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col bg-neutral-900 text-white text-xs px-3 py-2 rounded shadow-lg whitespace-nowrap z-20 pointer-events-none">
                      <div className="font-semibold text-center">Day {item.day}</div>
                      <div className="text-primary-300">₹{item.revenue.toFixed(0)}</div>
                      <div className="text-neutral-300">{item.orders} orders</div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-900"></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-neutral-600 font-medium px-6">
        <span>Day 1</span>
        <span>Day 5</span>
        <span>Day 10</span>
        <span>Day 15</span>
        <span>Day 20</span>
        <span>Day 25</span>
        <span>Day 30</span>
      </div>
    </div>
  );
}

