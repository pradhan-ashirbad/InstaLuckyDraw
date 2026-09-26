"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Edit2, Save, X } from "lucide-react"

interface PrizeCategory {
  id: string
  name: string
  icon: React.ReactNode
  winnerCount: number
  color: string
}

interface PrizeConfigurationProps {
  categories: PrizeCategory[]
  onCategoriesChange: (categories: PrizeCategory[]) => void
}

const colorOptions = [
  { name: "Yellow", value: "bg-yellow-500" },
  { name: "Blue", value: "bg-blue-500" },
  { name: "Green", value: "bg-green-500" },
  { name: "Red", value: "bg-red-500" },
  { name: "Purple", value: "bg-purple-500" },
  { name: "Orange", value: "bg-orange-500" },
  { name: "Pink", value: "bg-pink-500" },
  { name: "Indigo", value: "bg-indigo-500" },
]

export function PrizeConfiguration({ categories, onCategoriesChange }: PrizeConfigurationProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: "", winnerCount: 1, color: "bg-blue-500" })
  const [isAdding, setIsAdding] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: "", winnerCount: 1, color: "bg-blue-500" })

  const startEdit = (category: PrizeCategory) => {
    setEditingId(category.id)
    setEditForm({
      name: category.name,
      winnerCount: category.winnerCount,
      color: category.color,
    })
  }

  const saveEdit = () => {
    if (!editingId) return

    const updatedCategories = categories.map((cat) =>
      cat.id === editingId
        ? { ...cat, name: editForm.name, winnerCount: editForm.winnerCount, color: editForm.color }
        : cat,
    )

    onCategoriesChange(updatedCategories)
    setEditingId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({ name: "", winnerCount: 1, color: "bg-blue-500" })
  }

  const deleteCategory = (id: string) => {
    const updatedCategories = categories.filter((cat) => cat.id !== id)
    onCategoriesChange(updatedCategories)
  }

  const addCategory = () => {
    if (!newCategory.name.trim()) return

    const newCat: PrizeCategory = {
      id: `stage${Date.now()}`,
      name: newCategory.name,
      icon: <Badge className="w-4 h-4" />,
      winnerCount: newCategory.winnerCount,
      color: newCategory.color,
    }

    onCategoriesChange([...categories, newCat])
    setNewCategory({ name: "", winnerCount: 1, color: "bg-blue-500" })
    setIsAdding(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prize Categories Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
            {editingId === category.id ? (
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor={`name-${category.id}`}>Name</Label>
                  <Input
                    id={`name-${category.id}`}
                    value={editForm.name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor={`count-${category.id}`}>Winner Count</Label>
                  <Input
                    id={`count-${category.id}`}
                    type="number"
                    min="1"
                    value={editForm.winnerCount}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, winnerCount: Number.parseInt(e.target.value) || 1 }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor={`color-${category.id}`}>Color</Label>
                  <select
                    id={`color-${category.id}`}
                    value={editForm.color}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, color: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                  >
                    {colorOptions.map((color) => (
                      <option key={color.value} value={color.value}>
                        {color.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={saveEdit} size="sm">
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button onClick={cancelEdit} variant="outline" size="sm">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${category.color} text-white`}>{category.icon}</div>
                  <div>
                    <h4 className="font-medium">{category.name}</h4>
                    <p className="text-sm text-gray-600">
                      {category.winnerCount} winner{category.winnerCount > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => startEdit(category)} variant="outline" size="sm">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => deleteCategory(category.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}

        {/* Add New Category */}
        {isAdding ? (
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="new-name">Name</Label>
                <Input
                  id="new-name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Prize name"
                />
              </div>
              <div>
                <Label htmlFor="new-count">Winner Count</Label>
                <Input
                  id="new-count"
                  type="number"
                  min="1"
                  value={newCategory.winnerCount}
                  onChange={(e) =>
                    setNewCategory((prev) => ({ ...prev, winnerCount: Number.parseInt(e.target.value) || 1 }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="new-color">Color</Label>
                <select
                  id="new-color"
                  value={newCategory.color}
                  onChange={(e) => setNewCategory((prev) => ({ ...prev, color: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  {colorOptions.map((color) => (
                    <option key={color.value} value={color.value}>
                      {color.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={addCategory} size="sm">
                  <Save className="w-4 h-4" />
                </Button>
                <Button onClick={() => setIsAdding(false)} variant="outline" size="sm">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Button onClick={() => setIsAdding(true)} variant="outline" className="w-full border-dashed">
            <Plus className="w-4 h-4 mr-2" />
            Add New Prize Category
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
