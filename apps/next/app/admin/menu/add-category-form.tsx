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
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Add New Category</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
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
            Create Category
          </Button>
        </div>
      </form>
    </Card>
  );
}

