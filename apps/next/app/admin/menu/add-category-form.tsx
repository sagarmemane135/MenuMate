"use client";

import { useState } from "react";
import { Button, Input, Card } from "@menumate/app";

interface AddCategoryFormProps {
  onSuccess: (category: { id: string; name: string; sortOrder: number }) => void;
  onCancel: () => void;
}

export function AddCategoryForm({ onSuccess, onCancel }: AddCategoryFormProps) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to create category");
        setIsLoading(false);
        return;
      }

      // Success - reset form and notify parent with new category
      setName("");
      onSuccess(result.category);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50/50">
        <h2 className="text-base font-semibold text-neutral-900">Add New Category</h2>
      </div>
      
      <div className="p-5">
        {error && (
          <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-lg">
            <p className="text-sm text-error-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Category Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={error && !name ? "Category name is required" : undefined}
            disabled={isLoading}
            required
            autoFocus
          />

          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading} size="sm">
              Create Category
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

