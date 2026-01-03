"use client";

import React from "react";
import { Card } from "../../ui/card";
import { UtensilsCrossed, CheckCircle } from "lucide-react";

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  isAvailable: boolean;
}

export interface Category {
  id: string;
  name: string;
  sortOrder: number;
  menuItems: MenuItem[];
}

export interface MenuDisplayProps {
  restaurantName: string;
  categories: Category[];
}

export function MenuDisplay({ restaurantName, categories }: MenuDisplayProps) {
  const sortedCategories = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="min-h-screen bg-gradient-to-br neutral-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-100 flex items-center justify-center">
            <UtensilsCrossed className="w-12 h-12 text-primary-600" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r primary-700 bg-clip-text text-transparent mb-4">
            {restaurantName}
          </h1>
          <p className="text-slate-600 text-lg font-medium">Explore our delicious menu</p>
        </div>
        
        {/* Menu Categories */}
        <div className="space-y-16">
          {sortedCategories.map((category) => (
            <div key={category.id}>
              <div className="flex items-center mb-8">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent"></div>
                <h2 className="px-6 text-3xl font-bold text-slate-900">{category.name}</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {category.menuItems
                  .filter((item) => item.isAvailable)
                  .map((item) => (
                    <Card key={item.id} className="overflow-hidden hover:scale-105 transition-transform duration-200 bg-white">
                      {item.imageUrl && (
                        <div className="relative h-56 overflow-hidden">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-3">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-slate-600 mb-4 line-clamp-2">{item.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <p className="text-2xl font-bold bg-gradient-to-r primary-700 bg-clip-text text-transparent">
                            ₹{parseFloat(item.price).toFixed(2)}
                          </p>
                          <span className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            <span>Available</span>
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


