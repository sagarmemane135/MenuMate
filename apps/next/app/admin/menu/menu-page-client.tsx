"use client";

import { useState } from "react";
import { Card, Button } from "@menumate/app";
import { useToast } from "@menumate/app";
import { AddCategoryForm } from "./add-category-form";
import { AddMenuItemForm } from "./add-menu-item-form";
import { EditMenuItemForm } from "./edit-menu-item-form";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  isAvailable: boolean;
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
  sortOrder: number;
  menuItems: MenuItem[];
}

interface MenuPageClientProps {
  restaurantId: string;
  initialCategories: Category[];
}

export function MenuPageClient({
  restaurantId,
  initialCategories,
}: MenuPageClientProps) {
  const [categories, setCategories] = useState(initialCategories);
  const { showToast } = useToast();
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [showAddItemForm, setShowAddItemForm] = useState<{ categoryId: string; categoryName: string } | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const handleCategoryAdded = (newCategory: { id: string; name: string; sortOrder: number }) => {
    setShowAddCategoryForm(false);
    // Add new category to state
    setCategories((prev) => {
      const updated = [...prev, { ...newCategory, menuItems: [] }];
      return updated.sort((a, b) => a.sortOrder - b.sortOrder);
    });
  };

  const handleItemAdded = (newItem: {
    id: string;
    name: string;
    description: string | null;
    price: string;
    imageUrl: string | null;
    isAvailable: boolean;
    categoryId: string;
  }) => {
    setShowAddItemForm(null);
    // Add new item to the appropriate category
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === newItem.categoryId
          ? { ...cat, menuItems: [...cat.menuItems, newItem] }
          : cat
      )
    );
  };

  const handleItemUpdated = (updatedItem: MenuItem) => {
    // Store old category ID before clearing editingItem
    const oldCategoryId = editingItem?.categoryId;
    const newCategoryId = updatedItem.categoryId;
    setEditingItem(null);
    
    // Update the item in state - handle category change
    setCategories((prev) => {
      // If category changed, move item from old category to new category
      if (oldCategoryId && newCategoryId !== oldCategoryId) {
        return prev.map((cat) => {
          if (cat.id === oldCategoryId) {
            // Remove from old category
            return {
              ...cat,
              menuItems: cat.menuItems.filter((item) => item.id !== updatedItem.id),
            };
          } else if (cat.id === newCategoryId) {
            // Add to new category
            return {
              ...cat,
              menuItems: [...cat.menuItems, updatedItem],
            };
          }
          return cat;
        });
      } else {
        // Same category, just update the item
        return prev.map((cat) => ({
          ...cat,
          menuItems: cat.menuItems.map((item) =>
            item.id === updatedItem.id ? updatedItem : item
          ),
        }));
      }
    });
  };

  const handleItemDeleted = (deletedItemId: string) => {
    setEditingItem(null);
    // Remove the item from state
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        menuItems: cat.menuItems.filter((item) => item.id !== deletedItemId),
      }))
    );
  };

  const handleToggleAvailability = async (itemId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/menu-items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !currentStatus }),
      });

      if (response.ok) {
        const result = await response.json();
        // Update the item availability in state
        setCategories((prev) =>
          prev.map((cat) => ({
            ...cat,
            menuItems: cat.menuItems.map((item) =>
              item.id === itemId
                ? { ...item, isAvailable: result.menuItem.isAvailable }
                : item
            ),
          }))
        );
      }
    } catch (error) {
      console.error("Failed to toggle availability:", error);
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    // Use window.confirm for now (can be replaced with custom modal later)
    if (!window.confirm(`Are you sure you want to delete "${categoryName}"? This will also delete all items in this category.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove category from state
        setCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
        showToast(`Category "${categoryName}" deleted successfully`, "success");
      } else {
        const result = await response.json();
        showToast(result.error || "Failed to delete category", "error");
      }
    } catch (error) {
      console.error("Failed to delete category:", error);
      showToast("An error occurred while deleting the category", "error");
    }
  };

  const allCategories = categories.map((cat) => ({ id: cat.id, name: cat.name }));

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Menu Management</h1>
          <p className="mt-1 text-sm text-neutral-600">Organize and manage your restaurant menu</p>
        </div>
        {!showAddCategoryForm && !showAddItemForm && !editingItem && (
          <Button onClick={() => setShowAddCategoryForm(true)} className="btn-primary">
            Add Category
          </Button>
        )}
      </div>

      {showAddCategoryForm && (
        <div className="mb-6">
          <AddCategoryForm
            onSuccess={handleCategoryAdded}
            onCancel={() => setShowAddCategoryForm(false)}
          />
        </div>
      )}

      {showAddItemForm && (
        <div className="mb-6">
          <AddMenuItemForm
            categoryId={showAddItemForm.categoryId}
            categoryName={showAddItemForm.categoryName}
            onSuccess={handleItemAdded}
            onCancel={() => setShowAddItemForm(null)}
          />
        </div>
      )}

      {editingItem && (
        <div className="mb-6">
          <EditMenuItemForm
            menuItem={editingItem}
            categories={allCategories}
            onSuccess={handleItemUpdated}
            onCancel={() => setEditingItem(null)}
            onDelete={handleItemDeleted}
          />
        </div>
      )}

      {categories.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-card shadow-card p-12 text-center">
          <p className="text-sm text-neutral-600">
            No categories yet. Create your first category to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category.id} className="bg-white border border-neutral-200 rounded-card shadow-card">
              <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
                <h2 className="text-base font-semibold text-neutral-900">{category.name}</h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="btn-secondary text-sm"
                    onClick={async () => {
                      const newName = prompt("Enter new category name:", category.name);
                      if (newName && newName.trim() && newName !== category.name) {
                        try {
                          const response = await fetch(`/api/categories/${category.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ name: newName.trim() }),
                          });
                          if (response.ok) {
                            const result = await response.json();
                            setCategories((prev) =>
                              prev.map((cat) =>
                                cat.id === category.id
                                  ? { ...cat, name: result.category.name }
                                  : cat
                              )
                            );
                          }
                        } catch (error) {
                          console.error("Failed to update category:", error);
                        }
                      }
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="text-sm"
                    onClick={() => handleDeleteCategory(category.id, category.name)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {category.menuItems.length === 0 ? (
                  <p className="text-sm text-neutral-500">No items in this category</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.menuItems.map((item) => (
                      <div
                        key={item.id}
                        className="border border-neutral-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-soft transition-all"
                      >
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-32 object-cover rounded-lg mb-3"
                          />
                        )}
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-neutral-900 text-sm">{item.name}</h3>
                          <button
                            onClick={() => setEditingItem(item)}
                            className="text-primary-600 hover:text-primary-700 text-xs font-medium"
                          >
                            Edit
                          </button>
                        </div>
                        {item.description && (
                          <p className="text-xs text-neutral-600 mb-2 line-clamp-2">{item.description}</p>
                        )}
                        <div className="flex justify-between items-center">
                          <p className="text-base font-semibold text-neutral-900">
                            ₹{parseFloat(item.price).toFixed(2)}
                          </p>
                          <button
                            onClick={() => handleToggleAvailability(item.id, item.isAvailable)}
                            className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                              item.isAvailable
                                ? "bg-success-50 text-success-700 hover:bg-success-100"
                                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                            }`}
                          >
                            {item.isAvailable ? "Available" : "Unavailable"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!showAddItemForm && !editingItem && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="btn-secondary"
                    onClick={() =>
                      setShowAddItemForm({
                        categoryId: category.id,
                        categoryName: category.name,
                      })
                    }
                  >
                    + Add Item to {category.name}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
