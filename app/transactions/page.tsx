"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Search,
  Filter,
  Download,
  CalendarIcon,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  X,
  ChevronDown,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { TransactionActions } from "@/components/transaction-actions"
import type { Account, Category, Transaction } from "@/types"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"

export default function TransactionsPage() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAccount, setSelectedAccount] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [sortBy, setSortBy] = useState<"date" | "amount" | "description">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      setLoading(true)
      setError(null)
      try {
        const { data: transactionData, error: transactionError } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
        if (transactionError) throw transactionError

        const { data: platformData, error: platformError } = await supabase
          .from("platforms")
          .select("*")
          .eq("user_id", user.id)
        if (platformError) throw platformError

        const { data: categoryData, error: categoryError } = await supabase
          .from("categories")
          .select("*")
          .eq("user_id", user.id)
        if (categoryError) throw categoryError

        setAccounts(
          platformData.map((p) => ({
            id: p.id,
            name: p.account,
            type: p.type_account,
            balance: p.saldo,
            isSavings: p.saving,
            color: `bg-${p.color}-500`,
          })) || [],
        )

        setCategories(categoryData || [])

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
          })) || [],
        )
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Gagal memuat data riwayat.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleTransactionUpdate = async (updatedTransaction: Transaction) => {
    setTransactions(transactions.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t)))
  }

  const handleTransactionDelete = async (transactionId: string) => {
    if (!user) return

    const originalTransactions = transactions
    setTransactions(transactions.filter((t) => t.id !== transactionId))

    const { error } = await supabase.from("transactions").delete().eq("id", transactionId).eq("user_id", user.id)
    if (error) {
      console.error("Failed to delete transaction:", error)
      alert("Gagal menghapus transaksi.")
      setTransactions(originalTransactions)
    }
  }

  const handleStruckToggle = async (transactionId: string) => {
    if (!user) return

    const transaction = transactions.find((t) => t.id === transactionId)
    if (!transaction) return

    const newStruckValue = !transaction.struck
    setTransactions(transactions.map((t) => (t.id === transactionId ? { ...t, struck: newStruckValue } : t)))

    const { error } = await supabase
      .from("transactions")
      .update({ struck: newStruckValue })
      .eq("id", transactionId)
      .eq("user_id", user.id)
    if (error) {
      console.error("Failed to update struck status:", error)
      alert("Gagal memperbarui status transaksi.")
      setTransactions(transactions.map((t) => (t.id === transactionId ? { ...t, struck: !newStruckValue } : t)))
    }
  }

  const filteredAndSortedTransactions = useMemo(() => {
    const filtered = transactions.filter((transaction) => {
      if (searchTerm && !transaction.description.toLowerCase().includes(searchTerm.toLowerCase())) return false

      // DIUBAH: Logika filter akun diperbaiki
      if (selectedAccount !== "all") {
        const selectedAccountName = accounts.find((a) => a.id === selectedAccount)?.name
        if (transaction.accountId !== selectedAccountName && transaction.toAccountId !== selectedAccountName) {
          return false
        }
      }

      if (selectedCategory !== "all" && transaction.category !== selectedCategory) return false
      if (selectedType !== "all" && transaction.type !== selectedType) return false
      if (dateRange.from || dateRange.to) {
        const transactionDate = new Date(transaction.date)
        if (dateRange.from && transactionDate < dateRange.from) return false
        if (dateRange.to && transactionDate > dateRange.to) return false
      }
      return true
    })

    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case "date":
          comparison = new Date(b.date).getTime() - new Date(a.date).getTime()
          break // Desc by default
        case "amount":
          comparison = Math.abs(b.amount) - Math.abs(a.amount)
          break // Desc by default
        case "description":
          comparison = a.description.localeCompare(b.description)
          break // Asc by default
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

    return filtered
  }, [
    transactions,
    accounts,
    searchTerm,
    selectedAccount,
    selectedCategory,
    selectedType,
    dateRange,
    sortBy,
    sortOrder,
  ])

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedTransactions.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedTransactions, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredAndSortedTransactions.length / itemsPerPage)

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedAccount("all")
    setSelectedCategory("all")
    setSelectedType("all")
    setDateRange({})
    setCurrentPage(1)
  }

  const exportToCSV = () => {
    /* ... */
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "income":
        return <TrendingUp className="h-4 w-4 text-secondary" />
      case "expense":
        return <TrendingDown className="h-4 w-4 text-destructive" />
      case "transfer":
        return <ArrowRightLeft className="h-4 w-4 text-primary" />
      default:
        return null
    }
  }

  const getTransactionBadgeColor = (type: string) => {
    switch (type) {
      case "income":
        return "bg-secondary/10 text-secondary border-secondary/20"
      case "expense":
        return "bg-destructive/10 text-destructive border-destructive/20"
      case "transfer":
        return "bg-primary/10 text-primary border-primary/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const activeFiltersCount = [
    searchTerm,
    selectedAccount !== "all" ? selectedAccount : null,
    selectedCategory !== "all" ? selectedCategory : null,
    selectedType !== "all" ? selectedType : null,
    dateRange.from || dateRange.to ? "dateRange" : null,
  ].filter(Boolean).length

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
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-foreground font-manrope">Riwayat Transaksi</h1>
          <Popover>
            <PopoverTrigger asChild>
              <Button className="neobrutalism-button bg-secondary text-secondary-foreground">
                <Download className="h-4 w-4 mr-2" />
                Export
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="end">
              <Button variant="ghost" className="w-full justify-start text-sm" onClick={exportToCSV}>
                Export CSV
              </Button>
            </PopoverContent>
          </Popover>
        </div>

        {/* Filters */}
        <Card className="neobrutalism-card mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold font-manrope flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter & Pencarian
              </CardTitle>
              {activeFiltersCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="neobrutalism-button bg-transparent"
                >
                  <X className="h-4 w-4 mr-2" />
                  Hapus Filter ({activeFiltersCount})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <div className="xl:col-span-2">
                <label className="text-sm font-semibold mb-2 block">Cari Transaksi</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari deskripsi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="neobrutalism-input pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">Akun</label>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger className="neobrutalism-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Akun</SelectItem>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${account.color}`} />
                          {account.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">Kategori</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="neobrutalism-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">Tipe</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="neobrutalism-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    <SelectItem value="income">Pemasukan</SelectItem>
                    <SelectItem value="expense">Pengeluaran</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">Rentang Tanggal</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="neobrutalism-input w-full justify-start text-left font-normal bg-transparent"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd MMM", { locale: id })} -{" "}
                            {format(dateRange.to, "dd MMM yyyy", { locale: id })}
                          </>
                        ) : (
                          format(dateRange.from, "dd MMM yyyy", { locale: id })
                        )
                      ) : (
                        "Pilih tanggal"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Menampilkan {paginatedTransactions.length} dari {filteredAndSortedTransactions.length} transaksi
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold">Tampilkan:</label>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="neobrutalism-input w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value={filteredAndSortedTransactions.length.toString()}>Semua</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold">Urutkan:</label>
              <Select
                value={`${sortBy}-${sortOrder}`}
                onValueChange={(value) => {
                  const [field, order] = value.split("-")
                  setSortBy(field as any)
                  setSortOrder(order as any)
                }}
              >
                <SelectTrigger className="neobrutalism-input w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Tanggal (Terbaru)</SelectItem>
                  <SelectItem value="date-asc">Tanggal (Terlama)</SelectItem>
                  <SelectItem value="amount-desc">Jumlah (Tertinggi)</SelectItem>
                  <SelectItem value="amount-asc">Jumlah (Terendah)</SelectItem>
                  <SelectItem value="description-asc">Deskripsi (A-Z)</SelectItem>
                  <SelectItem value="description-desc">Deskripsi (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <Card className="neobrutalism-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-black">
                  <TableHead className="font-bold text-foreground">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        if (sortBy === "date") {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                        } else {
                          setSortBy("date")
                          setSortOrder("desc")
                        }
                      }}
                      className="h-auto p-0 font-bold hover:bg-transparent"
                    >
                      Tanggal
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="font-bold text-foreground">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        if (sortBy === "description") {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                        } else {
                          setSortBy("description")
                          setSortOrder("asc")
                        }
                      }}
                      className="h-auto p-0 font-bold hover:bg-transparent"
                    >
                      Deskripsi
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="font-bold text-foreground">Akun</TableHead>
                  <TableHead className="font-bold text-foreground">Kategori</TableHead>
                  <TableHead className="font-bold text-foreground">Tipe</TableHead>
                  <TableHead className="font-bold text-foreground text-right">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        if (sortBy === "amount") {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                        } else {
                          setSortBy("amount")
                          setSortOrder("desc")
                        }
                      }}
                      className="h-auto p-0 font-bold hover:bg-transparent"
                    >
                      Jumlah
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="font-bold text-foreground w-16">Struck</TableHead>
                  <TableHead className="font-bold text-foreground w-20">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Tidak ada transaksi yang ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTransactions.map((transaction) => {
                    // DIUBAH: Logika pencocokan dibuat lebih aman dengan trim()
                    const account = accounts.find((acc) => acc.name.trim() === transaction.accountId?.trim())
                    const toAccount = transaction.toAccountId
                      ? accounts.find((acc) => acc.name.trim() === transaction.toAccountId?.trim())
                      : null
                    return (
                      <TableRow
                        key={transaction.id}
                        className={`neobrutalism-table-row border-b border-border transition-all duration-75 ${
                          transaction.struck ? "opacity-60" : ""
                        }`}
                      >
                        <TableCell className="font-medium">
                          {format(new Date(transaction.date), "dd MMM yyyy", { locale: id })}
                        </TableCell>
                        <TableCell>
                          <div className={transaction.struck ? "line-through" : ""}>
                            <div className="font-medium">{transaction.description}</div>
                            {transaction.subcategory && (
                              <div className="text-xs text-muted-foreground">{transaction.subcategory}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${account?.color}`} />
                            <span className="text-sm">{account?.name}</span>
                            {transaction.type === "transfer" && toAccount && (
                              <>
                                <span className="text-xs text-muted-foreground">→</span>
                                <div className={`w-2 h-2 rounded-full ${toAccount.color}`} />
                                <span className="text-sm">{toAccount.name}</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{transaction.category}</div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${getTransactionBadgeColor(transaction.type)} flex items-center gap-1 w-fit`}
                          >
                            {getTransactionIcon(transaction.type)}
                            {transaction.type === "income"
                              ? "Masuk"
                              : transaction.type === "expense"
                                ? "Keluar"
                                : "Transfer"}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold ${
                            transaction.type === "income"
                              ? "text-secondary"
                              : transaction.type === "transfer"
                                ? "text-primary"
                                : "text-destructive"
                          } ${transaction.struck ? "line-through" : ""}`}
                        >
                          {formatCurrency(Math.abs(transaction.amount))}
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={transaction.struck || false}
                            onCheckedChange={() => handleStruckToggle(transaction.id)}
                            className="neobrutalism-input"
                          />
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
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="neobrutalism-button bg-transparent"
            >
              Sebelumnya
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    onClick={() => setCurrentPage(pageNum)}
                    className="neobrutalism-button w-10 h-10 p-0"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="neobrutalism-button bg-transparent"
            >
              Selanjutnya
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
