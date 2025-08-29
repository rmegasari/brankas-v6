"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, ImageIcon } from "lucide-react"
import { AccountSelector } from "@/components/account-selector"
import { CategorySelector } from "@/components/category-selector"
import { TransferPreview } from "@/components/transfer-preview"
import { HelpTooltip } from "@/components/help-tooltip"
import type { Account, Category } from "@/types"
import { supabase } from "@/lib/supabase"

interface FloatingActionButtonProps {
  accounts: Account[]
  categories: Category[]
  onTransactionAdded: () => void
}

export function FloatingActionButton({ accounts, categories, onTransactionAdded }: FloatingActionButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

    let receiptUrl: string | null = null
    if (formData.receiptFile) {
      const file = formData.receiptFile
      const filePath = `public/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from("receipts").upload(filePath, file)

      if (uploadError) {
        console.error("Error uploading receipt:", uploadError)
        alert("Gagal mengunggah bukti transaksi.")
        return
      }

      const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(filePath)
      receiptUrl = urlData.publicUrl
    }

    const transactionData = {
      date: formData.date,
      description: formData.description,
      category: formData.category,
      "sub-category": formData.subcategory,
      nominal: formData.type === "expense" ? -amount : amount,
      account: fromAccount.name,
      destination_account: toAccountName,
      receipt_url: receiptUrl,
    }

    const { error: insertError } = await supabase.from("transactions").insert([transactionData])

    if (insertError) {
      console.error("Error inserting transaction:", insertError)
      alert("Gagal menyimpan transaksi.")
      return
    }

    // Update saldo akun
    const newFromBalance = fromAccount.balance + transactionData.nominal
    await supabase.from("platforms").update({ saldo: newFromBalance }).eq("id", fromAccount.id)

    if (formData.category === "Mutasi") {
      const toAccount = accounts.find((acc) => acc.name === toAccountName)
      if (toAccount) {
        const newToBalance = toAccount.balance + amount
        await supabase.from("platforms").update({ saldo: newToBalance }).eq("id", toAccount.id)
      }
    }

    onTransactionAdded()
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

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full neobrutalism-button bg-[#00A86B] text-white hover:bg-[#008A5A] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all duration-75 md:h-16 md:w-16"
        size="icon"
      >
        <Plus className="h-6 w-6 md:h-8 md:w-8" />
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
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

            {formData.category === "Mutasi" && fromAccountForPreview && toAccountForPreview && transferAmount > 0 && (
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
                (formData.category === "Mutasi" && formData.subcategory !== "Tarik Tunai dari" && !formData.toAccountId)
              }
            >
              Simpan Transaksi
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
