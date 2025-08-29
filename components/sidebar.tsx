"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  LayoutDashboard, BarChart3, History, Settings, Wallet, CreditCard,
  PiggyBank, Eye, EyeOff, ChevronLeft, ChevronRight, Target, User, Loader2
} from "lucide-react"
import type { Account } from "@/types"
import { supabase } from "@/lib/supabase"

interface SidebarProps {
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function Sidebar({ isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [showBalances, setShowBalances] = useState(true)

  // Fetch data akun (platforms) dari Supabase
  useEffect(() => {
    const fetchAccounts = async () => {
      setLoadingAccounts(true);
      const { data, error } = await supabase
        .from("platforms")
        .select("*")
        .order("account", { ascending: true });

      if (error) {
        console.error("Error fetching accounts for sidebar:", error);
      } else {
        setAccounts(data.map(p => ({
          id: p.id,
          name: p.account,
          // Sesuaikan tipe agar cocok dengan logika ikon
          type: p.type_account === 'Rekening Bank' ? 'bank' : 'ewallet',
          balance: p.saldo,
          isSavings: p.saving,
          color: `bg-${p.color}-500`,
        })) || []);
      }
      setLoadingAccounts(false);
    };

    fetchAccounts();
  }, []);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const menuItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/transactions", label: "Riwayat", icon: History },
    { href: "/platforms", label: "Platform", icon: Settings },
    { href: "/goals", label: "Tujuan", icon: Target },
    { href: "/debts", label: "Hutang", icon: CreditCard },
    { href: "/profile", label: "Profil", icon: User },
    { href: "/settings", label: "Pengaturan", icon: Settings },
  ]

  return (
    <div
      className={`bg-sidebar border-r-2 border-sidebar-border transition-all duration-300 ${isCollapsed ? "w-16" : "w-80"} min-h-screen flex flex-col`}
    >
      {/* Header */}
      <div className="p-4 border-b-2 border-sidebar-border flex items-center justify-between">
        {!isCollapsed && <h1 className="text-xl font-bold font-manrope text-sidebar-foreground">Brankas Pribadi</h1>}
        <div className="flex items-center gap-2">
          {!isCollapsed && <ThemeToggle />}
          <Button variant="ghost" size="sm" onClick={onToggleCollapse} className="p-1 hover:bg-sidebar-accent/10">
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={`w-full justify-start p-3 h-auto font-semibold transition-all duration-75 ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
                    : "hover:bg-sidebar-accent/10 text-sidebar-foreground"
                } ${isCollapsed ? "px-2" : ""}`}
              >
                <Icon className={`h-5 w-5 ${isCollapsed ? "" : "mr-3"}`} />
                {!isCollapsed && item.label}
              </Button>
            </Link>
          )
        })}
      </div>

      {/* Platform Accounts */}
      {!isCollapsed && (
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-sidebar-foreground/60">BRANKAS</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBalances(!showBalances)}
              className="p-1 hover:bg-sidebar-accent/10"
            >
              {showBalances ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </div>

          <div className="space-y-1">
            {loadingAccounts ? (
                <div className="flex justify-center items-center h-20">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            ) : (
                accounts.map((account) => (
                    <Link key={account.id} href={`/platforms/${account.id}`}>
                      <div className="border-2 border-sidebar-border bg-sidebar hover:bg-sidebar-accent/10 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-75 cursor-pointer p-2 rounded-none">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {account.type === "bank" ? (
                              <CreditCard className="h-3 w-3 text-sidebar-foreground" />
                            ) : (
                              <Wallet className="h-3 w-3 text-sidebar-foreground" />
                            )}
                            <span className="font-medium text-xs text-sidebar-foreground truncate max-w-[80px]">
                              {account.name}
                            </span>
                            {account.isSavings && <PiggyBank className="h-2 w-2 text-sidebar-foreground/60" />}
                          </div>

                          {showBalances && (
                            <span className="font-medium text-xs text-sidebar-foreground">
                              {formatCurrency(account.balance).replace("Rp", "").trim()}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
