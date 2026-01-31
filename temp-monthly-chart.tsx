"use client";

interface DailyData {
  day: number;
  date: string;
  orders: number;
  revenue: number;
}

export function MonthlyChart({ data }: { data: DailyData[] }) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  
  // Filter to only show days that have passed
  const today = new Date().getDate();
  const displayData = data.filter(d => d.day <= today);
  
  const chartHeight = 300; // Fixed height in pixels

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="bg-neutral-50 p-6 rounded-lg">
        <div className="flex gap-4">
          {/* Y-axis labels */}
          <div className="flex flex-col justify-between text-xs text-neutral-600 w-20" style={{ height: `${chartHeight}px` }}>
            <div className="text-right font-medium">₹{Math.round(maxRevenue)}</div>
            <div className="text-right">₹{Math.round(maxRevenue * 0.75)}</div>
            <div className="text-right">₹{Math.round(maxRevenue * 0.5)}</div>
            <div className="text-right">₹{Math.round(maxRevenue * 0.25)}</div>
            <div className="text-right font-medium">₹0</div>
          </div>

          {/* Chart area with scrolling */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex items-end gap-3 pb-2" style={{ height: `${chartHeight}px`, minWidth: `${displayData.length * 50}px` }}>
              {displayData.map((item) => {
                const heightPercent = maxRevenue > 0 ? (item.revenue / maxRevenue) : 0;
                const barHeightPx = Math.max(heightPercent * (chartHeight - 20), item.revenue > 0 ? 8 : 0);

                return (
                  <div
                    key={item.day}
                    className="group relative flex flex-col items-center justify-end flex-1 min-w-[40px]"
                  >
                    {/* Bar */}
                    <div
                      className="w-full bg-primary-500 hover:bg-primary-600 transition-all duration-200 rounded-t-lg cursor-pointer relative"
                      style={{ height: `${barHeightPx}px` }}
                    >
                      {/* Tooltip on hover */}
                      {item.revenue > 0 && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block">
                          <div className="bg-neutral-900 text-white text-xs px-3 py-2 rounded shadow-lg whitespace-nowrap">
                            <div className="font-semibold text-center mb-1">Day {item.day}</div>
                            <div className="text-primary-300">Revenue: ₹{item.revenue.toFixed(0)}</div>
                            <div className="text-neutral-300">Orders: {item.orders}</div>
                          </div>
                          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-900 mx-auto"></div>
                        </div>
                      )}
                    </div>
                    
                    {/* Day label */}
                    <div className="text-xs text-neutral-700 font-semibold mt-2">
                      {item.day}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="text-center text-sm text-neutral-600">
        Showing <span className="font-semibold text-neutral-900">{displayData.length} days</span> of current month
      </div>
    </div>
  );
}

