"use client";

interface CategoryData {
  categoryName: string;
  revenue: string;
  revenuePercentage: string;
  itemsSold: number;
}

export function CategoryChart({ data }: { data: CategoryData[] }) {
  // Colors for the chart
  const colors = [
    { bg: "bg-primary-500", text: "text-primary-900" },
    { bg: "bg-success-500", text: "text-success-900" },
    { bg: "bg-warning-500", text: "text-warning-900" },
    { bg: "bg-error-500", text: "text-error-900" },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Bar Chart */}
      <div className="space-y-4">
        {data.map((category, index) => {
          const percentage = parseFloat(category.revenuePercentage);
          const color = colors[index % colors.length];
          
          return (
            <div key={category.categoryName} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-neutral-900">{category.categoryName}</span>
                <span className="text-neutral-600 font-medium">₹{category.revenue}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-10 bg-neutral-100 rounded-lg overflow-hidden relative">
                  <div
                    className={`h-full ${color.bg} transition-all duration-500 rounded-lg flex items-center`}
                    style={{ width: `${Math.max(percentage, 10)}%` }}
                  >
                    {percentage >= 15 && (
                      <span className="text-xs font-bold text-white ml-3">
                        {percentage.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                {percentage < 15 && (
                  <span className={`text-sm font-bold ${color.text} min-w-[45px]`}>
                    {percentage.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Details Table */}
      <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-3 gap-3 text-xs font-semibold text-neutral-600 pb-3 border-b border-neutral-200">
          <div>Category</div>
          <div className="text-right">Items Sold</div>
          <div className="text-right">Revenue</div>
        </div>
        {data.map((category, index) => {
          const color = colors[index % colors.length];
          return (
            <div key={category.categoryName} className="grid grid-cols-3 gap-3 text-sm items-center">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${color.bg}`}></div>
                <span className="truncate font-medium">{category.categoryName}</span>
              </div>
              <div className="text-right text-neutral-700 font-medium">{category.itemsSold}</div>
              <div className="text-right font-bold text-neutral-900">
                ₹{category.revenue}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

