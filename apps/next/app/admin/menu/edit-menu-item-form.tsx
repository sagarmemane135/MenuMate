"use client";

import { useState, useEffect } from "react";
import { Button, Input, Card } from "@menumate/app";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  isAvailable: boolean;
  categoryId: string;
}

interface EditMenuItemFormProps {
  menuItem: MenuItem;
  categories: Array<{ id: string; name: string }>;
  onSuccess: (updatedItem: MenuItem) => void;
  onCancel: () => void;
  onDelete: (deletedItemId: string) => void;
}

export function EditMenuItemForm({
  menuItem,
  categories,
  onSuccess,
  onCancel,
  onDelete,
}: EditMenuItemFormProps) {
  const [formData, setFormData] = useState({
    name: menuItem.name,
    description: menuItem.description || "",
    price: menuItem.price,
    imageUrl: menuItem.imageUrl || "",
    isAvailable: menuItem.isAvailable,
    categoryId: menuItem.categoryId,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/menu-items/${menuItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          imageUrl: formData.imageUrl || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to update menu item");
        setIsLoading(false);
        return;
      }

      onSuccess(result.menuItem);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this menu item?")) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/menu-items/${menuItem.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        setError(result.error || "Failed to delete menu item");
        setIsDeleting(false);
        return;
      }

      onDelete(menuItem.id);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50/50">
        <h2 className="text-base font-semibold text-neutral-900">Edit Menu Item</h2>
      </div>
      
      <div className="p-5">
        {error && (
          <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-lg">
            <p className="text-sm text-error-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Item Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={isLoading || isDeleting}
            required
          />

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="flex h-20 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
              disabled={isLoading || isDeleting}
            />
          </div>

          <Input
            label="Price"
            type="text"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            disabled={isLoading || isDeleting}
            required
          />

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Category
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="flex h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
              disabled={isLoading || isDeleting}
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Image URL (optional)"
            type="url"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            disabled={isLoading || isDeleting}
          />

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isAvailable"
              checked={formData.isAvailable}
              onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
              disabled={isLoading || isDeleting}
            />
            <label htmlFor="isAvailable" className="ml-2 block text-sm text-neutral-900">
              Available
            </label>
          </div>

          <div className="flex gap-2 justify-between pt-2">
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleDelete}
              disabled={isLoading || isDeleting}
              isLoading={isDeleting}
            >
              Delete
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancel}
                disabled={isLoading || isDeleting}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isLoading} size="sm">
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

