"use client";

interface CategoryData {
  categoryName: string;
  revenue: string;
  revenuePercentage: string;
  itemsSold: number;
}

export function CategoryChart({ data }: { data: CategoryData[] }) {
  // Colors for the pie chart
  const colors = [
    "bg-primary-500",
    "bg-success-500",
    "bg-warning-500",
    "bg-error-500",
    "bg-neutral-500",
    "bg-primary-300",
    "bg-success-300",
    "bg-warning-300",
  ];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Bar Chart */}
      <div className="space-y-3">
        {data.map((category, index) => (
          <div key={category.categoryName} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-neutral-900">{category.categoryName}</span>
              <span className="text-neutral-600">₹{category.revenue}</span>
            </div>
            <div className="h-8 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${colors[index % colors.length]} transition-all duration-500 flex items-center justify-end px-3`}
                style={{ width: `${category.revenuePercentage}%` }}
              >
                <span className="text-xs font-semibold text-white">
                  {category.revenuePercentage}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Details Table */}
      <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
        <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-neutral-600 pb-2 border-b border-neutral-200">
          <div>Category</div>
          <div className="text-right">Items Sold</div>
          <div className="text-right">Revenue</div>
        </div>
        {data.map((category, index) => (
          <div key={category.categoryName} className="grid grid-cols-3 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${colors[index % colors.length]}`}></div>
              <span className="truncate">{category.categoryName}</span>
            </div>
            <div className="text-right text-neutral-600">{category.itemsSold}</div>
            <div className="text-right font-semibold text-neutral-900">
              ₹{category.revenue}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

