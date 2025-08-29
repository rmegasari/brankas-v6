"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Plus, Edit, Trash2, Target, AlertTriangle } from "lucide-react"
import { DatabaseService } from "@/lib/database"

interface Budget {
  id: number
  category: string
  subcategory: string
  amount: number
  period: string
  start_date: string
  end_date: string
  spent: number
  is_active: boolean
}

interface BudgetManagerProps {
  transactions: any[]
  onBudgetChange?: () => void
}

export function BudgetManager({ transactions, onBudgetChange }: BudgetManagerProps) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [formData, setFormData] = useState({
    category: "Pengeluaran",
    subcategory: "",
    amount: "",
  })

  const expenseSubcategories = [
    "Belanja Bulanan",
    "Internet",
    "Bensin",
    "Hiburan",
    "Makan & Minum",
    "Transport",
    "Kesehatan",
    "Pendidikan",
    "Lainnya",
  ]

  useEffect(() => {
    fetchBudgets()
  }, [])

  useEffect(() => {
    updateBudgetSpending()
  }, [transactions, budgets])

  const fetchBudgets = async () => {
    const data = await DatabaseService.getBudgets()
    setBudgets(data)
  }

  const updateBudgetSpending = () => {
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format

    const updatedBudgets = budgets.map((budget) => {
      const spent = transactions
        .filter(
          (tx) =>
            tx.category === "Pengeluaran" &&
            tx["sub-category"] === budget.subcategory &&
            tx.date.startsWith(currentMonth),
        )
        .reduce((sum, tx) => sum + tx.nominal, 0)

      return { ...budget, spent }
    })

    setBudgets(updatedBudgets)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const budgetData = {
      category: formData.category,
      subcategory: formData.subcategory,
      amount: Number.parseFloat(formData.amount),
      period: "monthly",
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
      spent: 0,
      is_active: true,
    }

    if (editingBudget) {
      await DatabaseService.updateBudget(editingBudget.id, budgetData)
    } else {
      await DatabaseService.addBudget(budgetData)
    }

    await fetchBudgets()
    setIsDialogOpen(false)
    setEditingBudget(null)
    setFormData({ category: "Pengeluaran", subcategory: "", amount: "" })
    onBudgetChange?.()
  }

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget)
    setFormData({
      category: budget.category,
      subcategory: budget.subcategory,
      amount: budget.amount.toString(),
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Hapus budget ini?")) {
      await DatabaseService.deleteBudget(id)
      await fetchBudgets()
      onBudgetChange?.()
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-red-500"
    if (percentage >= 80) return "bg-yellow-500"
    return "bg-green-500"
  }

  return (
    <Card className="neobrutalism-card">
      <CardHeader className="border-b-2 border-black bg-primary text-primary-foreground">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Budget Bulanan
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="neobrutalism-button bg-background text-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Budget
              </Button>
            </DialogTrigger>
            <DialogContent className="neobrutalism-card">
              <DialogHeader>
                <DialogTitle>{editingBudget ? "Edit Budget" : "Tambah Budget Baru"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="subcategory">Sub-Kategori</Label>
                  <Select
                    value={formData.subcategory}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, subcategory: value }))}
                  >
                    <SelectTrigger className="neobrutalism-input">
                      <SelectValue placeholder="Pilih sub-kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseSubcategories.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">Jumlah Budget</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                    className="neobrutalism-input"
                    placeholder="0"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="neobrutalism-button flex-1">
                    {editingBudget ? "Update" : "Tambah"} Budget
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
        <div className="space-y-4">
          {budgets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada budget yang dibuat. Klik "Tambah Budget" untuk memulai.
            </div>
          ) : (
            budgets.map((budget) => {
              const percentage = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0
              const isOverBudget = percentage >= 100
              const isWarning = percentage >= 80

              return (
                <div key={budget.id} className="border-2 border-black p-4 bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{budget.subcategory}</h3>
                      {(isOverBudget || isWarning) && (
                        <AlertTriangle className={`h-4 w-4 ${isOverBudget ? "text-red-500" : "text-yellow-500"}`} />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(budget)}
                        className="neobrutalism-button"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(budget.id)}
                        className="neobrutalism-button"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Terpakai: {formatCurrency(budget.spent)}</span>
                      <span>Budget: {formatCurrency(budget.amount)}</span>
                    </div>
                    <Progress value={Math.min(percentage, 100)} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{percentage.toFixed(1)}% terpakai</span>
                      <span>Sisa: {formatCurrency(Math.max(0, budget.amount - budget.spent))}</span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
