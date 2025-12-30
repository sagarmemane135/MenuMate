"use client";

import { useState } from "react";
import { Button, Input, Card } from "@menumate/app";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

interface EditRestaurantFormProps {
  restaurant: Restaurant;
  onSuccess: (updatedRestaurant: Restaurant) => void;
  onCancel: () => void;
}

export function EditRestaurantForm({
  restaurant,
  onSuccess,
  onCancel,
}: EditRestaurantFormProps) {
  const [formData, setFormData] = useState({
    name: restaurant.name,
    slug: restaurant.slug,
    isActive: restaurant.isActive,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/restaurants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to update restaurant");
        setIsLoading(false);
        return;
      }

      onSuccess(result.restaurant);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Edit Restaurant</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Restaurant Name"
          type="text"
          value={formData.name}
          onChange={(e) => {
            setFormData({
              ...formData,
              name: e.target.value,
              slug: generateSlug(e.target.value),
            });
          }}
          disabled={isLoading}
          required
          autoFocus
        />

        <Input
          label="Slug (URL-friendly name)"
          type="text"
          value={formData.slug}
          onChange={(e) =>
            setFormData({
              ...formData,
              slug: e.target.value
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, "-")
                .replace(/-+/g, "-")
                .replace(/(^-|-$)/g, ""),
            })
          }
          disabled={isLoading}
          required
        />
        <p className="text-xs text-gray-500">
          This will be used in your menu URL: /r/{formData.slug}
        </p>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={isLoading}
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
            Restaurant is active (menu is visible to customers)
          </label>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Card>
  );
}

