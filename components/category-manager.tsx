"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, X, Settings, Trash2, Edit } from "lucide-react"
import { DatabaseService } from "@/lib/database"

interface Category {
  id: number
  name: string
  type: string
  parent_id?: number
  is_default: boolean
  subcategories?: Category[]
}

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    type: "expense",
    parent_id: null as number | null,
  })
  const [loading, setLoading] = useState(true)

  const categoryTypes = [
    { value: "expense", label: "Pengeluaran" },
    { value: "income", label: "Pemasukan" },
    { value: "transfer", label: "Mutasi" },
    { value: "debt", label: "Hutang" },
  ]

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    const data = await DatabaseService.getCategoriesWithSubcategories()
    setCategories(data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const categoryData = {
      name: formData.name,
      type: formData.type,
      parent_id: formData.parent_id,
      is_default: false,
    }

    if (editingCategory) {
      await DatabaseService.updateCategory(editingCategory.id, categoryData)
    } else {
      await DatabaseService.addCategory(categoryData)
    }

    await fetchCategories()
    setIsDialogOpen(false)
    setEditingCategory(null)
    setFormData({ name: "", type: "expense", parent_id: null })
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      type: category.type,
      parent_id: category.parent_id || null,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number, isDefault: boolean) => {
    if (isDefault) {
      alert("Kategori default tidak dapat dihapus")
      return
    }

    if (confirm("Hapus kategori ini? Tindakan ini tidak dapat dibatalkan.")) {
      await DatabaseService.deleteCategory(id)
      await fetchCategories()
    }
  }

  const getParentCategories = () => {
    return categories.filter((cat) => !cat.parent_id)
  }

  const getTypeLabel = (type: string) => {
    return categoryTypes.find((t) => t.value === type)?.label || type
  }

  if (loading) {
    return (
      <Card className="neobrutalism-card">
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">Memuat kategori...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="neobrutalism-card">
      <CardHeader className="border-b-2 border-black bg-accent text-accent-foreground">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Kelola Kategori & Sub-Kategori
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="neobrutalism-button bg-background text-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Kategori
              </Button>
            </DialogTrigger>
            <DialogContent className="neobrutalism-card">
              <DialogHeader>
                <DialogTitle>{editingCategory ? "Edit Kategori" : "Tambah Kategori Baru"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nama Kategori</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="neobrutalism-input"
                    placeholder="Masukkan nama kategori"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Tipe</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value, parent_id: null }))}
                  >
                    <SelectTrigger className="neobrutalism-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="parent">Kategori Induk (Opsional)</Label>
                  <Select
                    value={formData.parent_id?.toString() || "none"}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, parent_id: value === "none" ? null : Number(value) }))
                    }
                  >
                    <SelectTrigger className="neobrutalism-input">
                      <SelectValue placeholder="Pilih kategori induk (untuk sub-kategori)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tidak ada (Kategori Utama)</SelectItem>
                      {getParentCategories()
                        .filter((cat) => cat.type === formData.type)
                        .map((parent) => (
                          <SelectItem key={parent.id} value={parent.id.toString()}>
                            {parent.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="neobrutalism-button flex-1">
                    {editingCategory ? "Update" : "Tambah"} Kategori
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="neobrutalism-button"
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category.id} className="border-2 border-black p-4 bg-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-lg">{category.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {getTypeLabel(category.type)}
                  </Badge>
                  {category.is_default && (
                    <Badge variant="secondary" className="text-xs">
                      Default
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(category)}
                    className="neobrutalism-button"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  {!category.is_default && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(category.id, category.is_default)}
                      className="neobrutalism-button"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              {category.subcategories && category.subcategories.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Sub-Kategori:</h4>
                  <div className="flex flex-wrap gap-2">
                    {category.subcategories.map((sub) => (
                      <div key={sub.id} className="flex items-center gap-1">
                        <Badge
                          variant="outline"
                          className="neobrutalism-button bg-muted hover:bg-muted/80 text-muted-foreground font-medium px-2 py-1"
                        >
                          {sub.name}
                          {sub.is_default && <span className="ml-1 text-xs">(Default)</span>}
                        </Badge>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(sub)}
                            className="h-6 w-6 p-0 hover:bg-muted"
                          >
                            <Edit className="h-2 w-2" />
                          </Button>
                          {!sub.is_default && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(sub.id, sub.is_default)}
                              className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <X className="h-2 w-2" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {categories.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada kategori. Klik "Tambah Kategori" untuk memulai.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
