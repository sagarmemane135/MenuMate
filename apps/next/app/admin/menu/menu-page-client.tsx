"use client";

import { useState } from "react";
import { Card, Button } from "@menumate/app";
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
    if (!confirm(`Are you sure you want to delete "${categoryName}"? This will also delete all items in this category.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove category from state
        setCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
      } else {
        const result = await response.json();
        alert(result.error || "Failed to delete category");
      }
    } catch (error) {
      console.error("Failed to delete category:", error);
      alert("An error occurred while deleting the category");
    }
  };

  const allCategories = categories.map((cat) => ({ id: cat.id, name: cat.name }));

  return (
    <div className="px-4 py-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
          <p className="mt-2 text-gray-600">Manage your restaurant menu</p>
        </div>
        {!showAddCategoryForm && !showAddItemForm && !editingItem && (
          <Button onClick={() => setShowAddCategoryForm(true)}>
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
        <Card>
          <p className="text-gray-600 text-center py-8">
            No categories yet. Create your first category to get started.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => (
            <Card key={category.id}>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold">{category.name}</h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
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
                            // Update category name in state
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
                    onClick={() => handleDeleteCategory(category.id, category.name)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                {category.menuItems.length === 0 ? (
                  <p className="text-sm text-gray-500">No items in this category</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.menuItems.map((item) => (
                      <div
                        key={item.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-32 object-cover rounded-md mb-3"
                          />
                        )}
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900">{item.name}</h3>
                          <button
                            onClick={() => setEditingItem(item)}
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            Edit
                          </button>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        )}
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-lg font-bold text-blue-600">
                            ₹{parseFloat(item.price).toFixed(2)}
                          </p>
                          <button
                            onClick={() => handleToggleAvailability(item.id, item.isAvailable)}
                            className={`text-xs px-2 py-1 rounded font-medium ${
                              item.isAvailable
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-red-100 text-red-800 hover:bg-red-200"
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
