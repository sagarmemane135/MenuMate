"use client";

interface CategoryData {
  categoryName: string;
  revenue: string;
  revenuePercentage: string;
  itemsSold: number;
}

export function CategoryChart({ data }: { data: CategoryData[] }) {
  // Professional color palette
  const colors = [
    { bg: "bg-blue-500", shadow: "shadow-blue-200", border: "border-blue-600" },
    { bg: "bg-emerald-500", shadow: "shadow-emerald-200", border: "border-emerald-600" },
    { bg: "bg-amber-500", shadow: "shadow-amber-200", border: "border-amber-600" },
    { bg: "bg-rose-500", shadow: "shadow-rose-200", border: "border-rose-600" },
  ];

  const totalRevenue = data.reduce((sum, cat) => sum + parseFloat(cat.revenue), 0);

  return (
    <div className="space-y-8">
      {/* Bar Chart with Enhanced Design */}
      <div className="space-y-6">
        {data.map((category, index) => {
          const percentage = parseFloat(category.revenuePercentage);
          const color = colors[index % colors.length];
          
          return (
            <div key={category.categoryName} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded ${color.bg} shadow-md`}></div>
                  <span className="font-semibold text-neutral-900 text-base">{category.categoryName}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-neutral-500">{category.itemsSold} items</span>
                  <span className="text-base font-bold text-neutral-900">₹{category.revenue}</span>
                </div>
              </div>
              
              <div className="relative">
                <div className="h-12 bg-neutral-100 rounded-lg overflow-hidden border border-neutral-200">
                  <div
                    className={`h-full ${color.bg} transition-all duration-700 ease-out relative`}
                    style={{ width: `${percentage}%` }}
                  >
                    {/* Gradient overlay for depth */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10"></div>
                  </div>
                </div>
                {/* Percentage badge */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 bg-white border-2 border-neutral-900 px-3 py-1 rounded-full shadow-lg"
                  style={{ 
                    left: `${Math.min(percentage, 95)}%`,
                    transform: percentage > 90 ? 'translate(-100%, -50%)' : 'translateY(-50%)'
                  }}
                >
                  <span className="text-sm font-bold text-neutral-900">{percentage.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.map((category, index) => {
          const color = colors[index % colors.length];
          const percentage = parseFloat(category.revenuePercentage);
          
          return (
            <div key={category.categoryName} className="bg-white border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${color.bg}`}></div>
                <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                  {category.categoryName}
                </span>
              </div>
              <div className="text-2xl font-bold text-neutral-900 mb-1">
                {percentage.toFixed(1)}%
              </div>
              <div className="text-xs text-neutral-500">
                ₹{category.revenue} revenue
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


