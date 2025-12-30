"use client";

import { useState } from "react";
import { Button, Input, Card } from "@menumate/app";

interface AddMenuItemFormProps {
  categoryId: string;
  categoryName: string;
  onSuccess: (menuItem: {
    id: string;
    name: string;
    description: string | null;
    price: string;
    imageUrl: string | null;
    isAvailable: boolean;
    categoryId: string;
  }) => void;
  onCancel: () => void;
}

export function AddMenuItemForm({
  categoryId,
  categoryName,
  onSuccess,
  onCancel,
}: AddMenuItemFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    isAvailable: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/menu-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          categoryId,
          price: formData.price,
          imageUrl: formData.imageUrl || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to create menu item");
        setIsLoading(false);
        return;
      }

      // Success - reset form and notify parent with new menu item
      setFormData({
        name: "",
        description: "",
        price: "",
        imageUrl: "",
        isAvailable: true,
      });
      onSuccess(result.menuItem);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Add Menu Item to {categoryName}</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Item Name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          disabled={isLoading}
          required
          autoFocus
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="flex h-20 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            disabled={isLoading}
          />
        </div>

        <Input
          label="Price"
          type="text"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          placeholder="0.00"
          disabled={isLoading}
          required
        />

        <Input
          label="Image URL (optional)"
          type="url"
          value={formData.imageUrl}
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          disabled={isLoading}
        />

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isAvailable"
            checked={formData.isAvailable}
            onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={isLoading}
          />
          <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-900">
            Available
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
            Create Item
          </Button>
        </div>
      </form>
    </Card>
  );
}

