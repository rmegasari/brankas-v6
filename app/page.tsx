"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, TrendingUp, TrendingDown, Wallet, Loader2, ImageIcon } from "lucide-react"
import { AccountSelector } from "@/components/account-selector"
import { CategorySelector } from "@/components/category-selector"
import { TransferPreview } from "@/components/transfer-preview"
import { TransactionActions } from "@/components/transaction-actions"
import { HelpTooltip } from "@/components/help-tooltip"
import { ClockWidget } from "@/components/clock-widget"
import { useAuth } from "@/contexts/auth-context"
import { DatabaseService } from "@/lib/database"
import { ProfileService, type UserProfile } from "@/lib/profile-service"
import type { Account, Transaction, DashboardPeriod, Category } from "@/types"

export default function DashboardPage() {
  const { user } = useAuth()

  // State untuk data dari Supabase
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State untuk UI
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [dashboardPeriod, setDashboardPeriod] = useState<DashboardPeriod>("monthly")
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: "expense",
    category: "",
    subcategory: "",
    accountId: "",
    toAccountId: "",
    date: new Date().toISOString().split("T")[0],
    receiptFile: null as File | null,
  })

  const fetchData = async () => {
    if (!user) return

    try {
      const [platformData, transactionData, categoryData, profileData] = await Promise.all([
        DatabaseService.getPlatforms(user.id),
        DatabaseService.getTransactions(user.id),
        DatabaseService.getCategories(user.id),
        ProfileService.getProfile(user.id),
      ])

      const categoryMap = new Map<string, { type: string; subcategories: string[] }>()
      categoryData.forEach((item) => {
        if (!categoryMap.has(item.name)) {
          categoryMap.set(item.name, {
            type: item.type,
            subcategories: [],
          })
        }
      })

      categoryMap.set("Mutasi", { type: "transfer", subcategories: ["Alokasi saldo ke", "Tarik Tunai dari"] })

      const structuredCategories = Array.from(categoryMap.entries()).map(([name, data]) => ({
        id: name,
        name,
        ...data,
      }))

      setAccounts(
        platformData.map((p) => ({
          id: p.id,
          name: p.account,
          type: p.type_account,
          balance: p.saldo,
          isSavings: p.saving,
          color: `bg-${p.color}-500`,
        })),
      )
      setCategories(structuredCategories)
      setTransactions(
        transactionData.map((tx) => ({
          id: tx.id,
          date: tx.date,
          description: tx.description,
          category: tx.category,
          subcategory: tx["sub-category"],
          amount: tx.nominal,
          type: tx.category === "Pemasukan" ? "income" : tx.category === "Mutasi" ? "transfer" : "expense",
          accountId: tx.account,
          toAccountId: tx.destination_account,
          receiptUrl: tx.receipt_url,
          struck: tx.struck || false,
        })),
      )

      if (profileData) {
        setUserProfile(profileData)
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err)
      setError("Gagal memuat data dashboard.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  useEffect(() => {
    const handleTransactionAdded = () => {
      fetchData()
    }

    window.addEventListener("transactionAdded", handleTransactionAdded)
    return () => {
      window.removeEventListener("transactionAdded", handleTransactionAdded)
    }
  }, [])

  const { totalBalance, savingsBalance, dailyBalance, periodData } = useMemo(() => {
    const total = accounts.reduce((sum, account) => sum + account.balance, 0)
    const savings = accounts.filter((account) => account.isSavings).reduce((sum, account) => sum + account.balance, 0)

    const now = new Date()
    let startDate: Date
    switch (dashboardPeriod) {
      case "daily":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case "weekly":
        const day = now.getDay()
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day)
        break
      case "yearly":
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
    }

    const currentPeriodTransactions = transactions.filter((t) => new Date(t.date) >= startDate)
    const currentIncome = currentPeriodTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0)
    const currentExpense = Math.abs(
      currentPeriodTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0),
    )

    return {
      totalBalance: total,
      savingsBalance: savings,
      dailyBalance: total - savings,
      periodData: { currentIncome, currentExpense },
    }
  }, [accounts, transactions, dashboardPeriod])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const amount = Number.parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      alert("Jumlah harus berupa angka positif.")
      return
    }

    const fromAccount = accounts.find((acc) => String(acc.id) === String(formData.accountId))
    if (!fromAccount) {
      alert("Akun asal tidak valid.")
      return
    }

    let toAccountName = null
    if (formData.category === "Mutasi") {
      if (formData.subcategory === "Tarik Tunai dari") {
        const cashAccount = accounts.find((acc) => acc.type === "Cash")
        if (!cashAccount) {
          alert("Akun dengan tipe 'Cash' tidak ditemukan. Mohon buat akun CASH terlebih dahulu.")
          return
        }
        toAccountName = cashAccount.name
      } else {
        toAccountName = accounts.find((acc) => String(acc.id) === String(formData.toAccountId))?.name || null
      }
    }

    const transactionData = {
      date: formData.date,
      description: formData.description,
      category: formData.category,
      "sub-category": formData.subcategory,
      nominal: formData.type === "expense" ? -amount : amount,
      account: fromAccount.name,
      destination_account: toAccountName,
      receipt_url: null,
      user_id: user.id,
    }

    const result = await DatabaseService.addTransaction(transactionData, user.id)
    if (!result) {
      alert("Gagal menyimpan transaksi.")
      return
    }

    const newFromBalance = fromAccount.balance + transactionData.nominal
    await DatabaseService.updatePlatform(fromAccount.id, { saldo: newFromBalance }, user.id)

    if (formData.category === "Mutasi") {
      const toAccount = accounts.find((acc) => acc.name === toAccountName)
      if (toAccount) {
        const newToBalance = toAccount.balance + amount
        await DatabaseService.updatePlatform(toAccount.id, { saldo: newToBalance }, user.id)
      }
    }

    await fetchData()
    setIsModalOpen(false)
    setFormData({
      description: "",
      amount: "",
      type: "expense",
      category: "",
      subcategory: "",
      accountId: "",
      toAccountId: "",
      date: new Date().toISOString().split("T")[0],
      receiptFile: null,
    })
  }

  const handleTransactionUpdate = async (updatedTransaction: Transaction) => {
    if (!user) return

    const transactionDataToUpdate = {
      date: updatedTransaction.date,
      description: updatedTransaction.description,
      category: updatedTransaction.category,
      "sub-category": updatedTransaction.subcategory,
      nominal: updatedTransaction.amount,
      account: updatedTransaction.accountId,
      destination_account: updatedTransaction.toAccountId,
    }

    const result = await DatabaseService.updateTransaction(updatedTransaction.id, transactionDataToUpdate, user.id)
    if (!result) {
      alert("Gagal memperbarui transaksi.")
    } else {
      await fetchData()
    }
  }

  const handleTransactionDelete = async (transactionId: string) => {
    if (!user) return

    const transactionToDelete = transactions.find((t) => t.id === transactionId)
    if (!transactionToDelete) return

    const success = await DatabaseService.deleteTransaction(transactionId, user.id)
    if (!success) {
      alert("Gagal menghapus transaksi.")
      return
    }

    const fromAccount = accounts.find((acc) => acc.name === transactionToDelete.accountId)
    if (fromAccount) {
      const newBalance = fromAccount.balance - transactionToDelete.amount
      await DatabaseService.updatePlatform(fromAccount.id, { saldo: newBalance }, user.id)
    }

    if (transactionToDelete.type === "transfer" && transactionToDelete.toAccountId) {
      const toAccount = accounts.find((acc) => acc.name === transactionToDelete.toAccountId)
      if (toAccount) {
        const newBalance = toAccount.balance - Math.abs(transactionToDelete.amount)
        await DatabaseService.updatePlatform(toAccount.id, { saldo: newBalance }, user.id)
      }
    }

    await fetchData()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(
      amount,
    )
  }

  const handleCategoryChange = (category: string) => {
    const categoryData = categories.find((cat) => cat.name === category)
    setFormData({ ...formData, category, subcategory: "", type: categoryData?.type || "expense" })
  }

  const handleSubcategoryChange = (subcategory: string) => {
    setFormData({ ...formData, subcategory })
  }

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData({ ...formData, receiptFile: file })
  }

  const fromAccountForPreview = accounts.find((acc) => String(acc.id) === String(formData.accountId))
  const toAccountForPreview = accounts.find((acc) => String(acc.id) === String(formData.toAccountId))
  const transferAmount = Number.parseFloat(formData.amount) || 0

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return <div className="text-center py-20 text-destructive">{error}</div>
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <img
                src={userProfile?.avatar_url || "/diverse-user-avatars.png"}
                alt="Avatar"
                className="w-10 h-10 rounded-full border-2 border-black"
              />
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground font-manrope break-words">
                {user
                  ? `Brankas ${userProfile?.full_name || user.user_metadata?.full_name || "User"}`
                  : "Brankas Pribadi"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4 justify-end">
            <ClockWidget />
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="neobrutalism-button bg-[#00A86B] text-white hover:bg-[#008A5A] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all duration-75 text-sm sm:text-base">
                  <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">+ Transaksi Baru</span>
                  <span className="sm:hidden">+ Transaksi</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="neobrutalism-card max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold font-manrope flex items-center gap-2">
                    Tambah Transaksi Baru
                    <HelpTooltip content="Formulir untuk menambah transaksi baru." />
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="date" className="text-sm font-semibold">
                      Tanggal
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      className="neobrutalism-input mt-1"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Kategori & Sub Kategori</Label>
                    <CategorySelector
                      categories={categories}
                      selectedCategory={formData.category}
                      selectedSubcategory={formData.subcategory}
                      onCategoryChange={handleCategoryChange}
                      onSubcategoryChange={handleSubcategoryChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-sm font-semibold">
                      Deskripsi
                    </Label>
                    <Input
                      id="description"
                      className="neobrutalism-input mt-1"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Masukkan deskripsi transaksi"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount" className="text-sm font-semibold">
                      Jumlah
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      className="neobrutalism-input mt-1"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="account" className="text-sm font-semibold">
                      {formData.category === "Mutasi" ? "Akun Asal" : "Akun"}
                    </Label>
                    <AccountSelector
                      accounts={accounts}
                      value={formData.accountId}
                      onValueChange={(value) => setFormData({ ...formData, accountId: value })}
                      placeholder="Pilih akun"
                    />
                  </div>

                  {formData.category === "Mutasi" && formData.subcategory !== "Tarik Tunai dari" && (
                    <div>
                      <Label htmlFor="toAccount" className="text-sm font-semibold">
                        Akun Tujuan
                      </Label>
                      <AccountSelector
                        accounts={accounts}
                        value={formData.toAccountId}
                        onValueChange={(value) => setFormData({ ...formData, toAccountId: value })}
                        placeholder="Pilih akun tujuan"
                        excludeAccountId={formData.accountId}
                      />
                    </div>
                  )}

                  {formData.category === "Mutasi" &&
                    fromAccountForPreview &&
                    toAccountForPreview &&
                    transferAmount > 0 && (
                      <TransferPreview
                        fromAccount={fromAccountForPreview}
                        toAccount={toAccountForPreview}
                        amount={transferAmount}
                        subcategory={formData.subcategory}
                      />
                    )}
                  <div>
                    <Label htmlFor="receipt" className="text-sm font-semibold">
                      Bukti Transaksi (Opsional)
                    </Label>
                    <div className="mt-1">
                      <Input
                        id="receipt"
                        type="file"
                        accept="image/*"
                        className="neobrutalism-input"
                        onChange={handleReceiptChange}
                      />
                      {formData.receiptFile && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                          <ImageIcon className="h-4 w-4" />
                          <span>{formData.receiptFile.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="neobrutalism-button w-full bg-[#00A86B] text-white"
                    disabled={
                      !formData.category ||
                      !formData.accountId ||
                      (formData.category === "Mutasi" &&
                        formData.subcategory !== "Tarik Tunai dari" &&
                        !formData.toAccountId)
                    }
                  >
                    Simpan Transaksi
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl">
          <Card className="neobrutalism-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-semibold leading-tight">Pemasukan Bulan Ini</CardTitle>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-secondary flex-shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-sm sm:text-base lg:text-lg font-bold text-secondary break-words hyphens-auto leading-tight">
                {formatCurrency(periodData.currentIncome)}
              </div>
            </CardContent>
          </Card>

          <Card className="neobrutalism-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-semibold leading-tight">Pengeluaran Bulan Ini</CardTitle>
              <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-destructive flex-shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-sm sm:text-base lg:text-lg font-bold text-destructive break-words hyphens-auto leading-tight">
                {formatCurrency(periodData.currentExpense)}
              </div>
            </CardContent>
          </Card>

          <Card className="neobrutalism-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-semibold leading-tight">Saldo Harian</CardTitle>
              <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-sm sm:text-base lg:text-lg font-bold text-primary break-words hyphens-auto leading-tight">
                {formatCurrency(dailyBalance)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Tersedia untuk pengeluaran</div>
            </CardContent>
          </Card>

          <Card className="neobrutalism-card">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl font-bold font-manrope">Saldo Tabungan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm sm:text-base lg:text-lg font-bold text-chart-1 break-words hyphens-auto leading-tight">
                {formatCurrency(savingsBalance)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="neobrutalism-card max-w-6xl">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl font-bold font-manrope">Transaksi Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow className="border-b-2 border-black">
                    <TableHead className="font-bold text-foreground text-xs sm:text-sm min-w-[80px]">Tanggal</TableHead>
                    <TableHead className="font-bold text-foreground text-xs sm:text-sm min-w-[120px]">
                      Deskripsi
                    </TableHead>
                    <TableHead className="font-bold text-foreground text-xs sm:text-sm min-w-[100px]">Akun</TableHead>
                    <TableHead className="font-bold text-foreground text-xs sm:text-sm min-w-[100px]">
                      Kategori
                    </TableHead>
                    <TableHead className="font-bold text-foreground text-right text-xs sm:text-sm min-w-[100px]">
                      Jumlah
                    </TableHead>
                    <TableHead className="font-bold text-foreground w-12 sm:w-16">Bukti</TableHead>
                    <TableHead className="font-bold text-foreground w-16 sm:w-20">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.slice(0, 5).map((transaction) => {
                    const account = accounts.find((acc) => acc.name === transaction.accountId)
                    const toAccount = transaction.toAccountId
                      ? accounts.find((acc) => acc.name === transaction.toAccountId)
                      : null
                    return (
                      <TableRow key={transaction.id} className="neobrutalism-table-row border-b border-border">
                        <TableCell className="font-medium text-xs sm:text-sm">
                          {new Date(transaction.date).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <div className="max-w-[120px] sm:max-w-none truncate" title={transaction.description}>
                            {transaction.description}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <div className={`w-2 h-2 rounded-full ${account?.color} flex-shrink-0`} />
                            <span className="truncate max-w-[60px] sm:max-w-none" title={account?.name}>
                              {account?.name}
                            </span>
                            {toAccount && (
                              <>
                                <span className="text-xs text-muted-foreground">→</span>
                                <div className={`w-2 h-2 rounded-full ${toAccount.color} flex-shrink-0`} />
                                <span className="truncate max-w-[60px] sm:max-w-none" title={toAccount.name}>
                                  {toAccount.name}
                                </span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <div>
                            <div className="truncate max-w-[80px] sm:max-w-none" title={transaction.category}>
                              {transaction.category}
                            </div>
                            {transaction.subcategory && (
                              <div
                                className="text-xs text-muted-foreground truncate max-w-[80px] sm:max-w-none"
                                title={transaction.subcategory}
                              >
                                {transaction.subcategory}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold text-xs sm:text-sm ${
                            transaction.type === "income"
                              ? "text-secondary"
                              : transaction.type === "transfer"
                                ? "text-primary"
                                : "text-destructive"
                          }`}
                        >
                          <div className="min-w-[80px]">{formatCurrency(Math.abs(transaction.amount))}</div>
                        </TableCell>
                        <TableCell>
                          {transaction.receiptUrl ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-6 w-6 sm:h-8 sm:w-8"
                              onClick={() => window.open(transaction.receiptUrl, "_blank")}
                            >
                              <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                            </Button>
                          ) : (
                            <div className="h-6 w-6 sm:h-8 sm:w-8" />
                          )}
                        </TableCell>
                        <TableCell>
                          <TransactionActions
                            transaction={transaction}
                            accounts={accounts}
                            onUpdate={handleTransactionUpdate}
                            onDelete={handleTransactionDelete}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
