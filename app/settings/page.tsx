"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ThemeToggle } from "@/components/theme-toggle"
import { CategoryManager } from "@/components/category-manager"
import { Calendar, AlertTriangle, SettingsIcon, Palette, Globe, User, LogOut, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { ProfileService, type UserSettings } from "@/lib/profile-service"

export default function SettingsPage() {
  const { signOut, user } = useAuth()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [language, setLanguage] = useState("id")

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return

      setLoading(true)
      const settingsData = await ProfileService.getSettings(user.id)

      if (settingsData) {
        setSettings(settingsData)
        setLanguage(settingsData.language)
      }
      setLoading(false)
    }

    if (user) {
      loadSettings()
    }
  }, [user])

  const saveSettings = async () => {
    if (!user || !settings) return

    setSaving(true)
    const updatedSettings = await ProfileService.updateSettings(user.id, {
      language,
      payroll_date: settings.payroll_date,
      budget_warning_threshold: settings.budget_warning_threshold,
    })

    if (updatedSettings) {
      setSettings(updatedSettings)
      alert("Pengaturan berhasil disimpan!")
    } else {
      alert("Gagal menyimpan pengaturan.")
    }
    setSaving(false)
  }

  const handleLogout = async () => {
    console.log("[v0] Logging out user")
    if (confirm("Apakah Anda yakin ingin keluar?")) {
      await signOut()
    }
  }

  const updateSetting = (key: keyof UserSettings, value: any) => {
    if (settings) {
      setSettings({ ...settings, [key]: value })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="h-8 w-8" />
        <h1 className="text-3xl font-bold font-manrope">Pengaturan</h1>
      </div>

      <div className="space-y-6 max-w-3xl">
        {/* Profile Settings */}
        <Card className="neobrutalism-card">
          <CardHeader className="border-b-2 border-black bg-primary text-primary-foreground">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Pengaturan Profil
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Bahasa
                </Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="neobrutalism-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="id">Bahasa Indonesia</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Tema
                </Label>
                <ThemeToggle />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t-2 border-black">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">Akun</h3>
                  <p className="text-sm text-muted-foreground">Kelola sesi akun Anda</p>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="destructive"
                  className="neobrutalism-button bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Keluar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payroll Date Settings */}
        <Card className="neobrutalism-card">
          <CardHeader className="border-b-2 border-black bg-secondary text-secondary-foreground">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Tanggal Gajian
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="payrollDate" className="text-sm font-semibold">
                  Tanggal Gajian Setiap Bulan
                </Label>
                <Input
                  id="payrollDate"
                  type="number"
                  min="1"
                  max="31"
                  value={settings?.payroll_date || 28}
                  onChange={(e) => updateSetting("payroll_date", Number.parseInt(e.target.value) || 1)}
                  className="neobrutalism-input mt-2 max-w-32"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Periode bulanan akan dihitung dari tanggal {settings?.payroll_date || 28} hingga tanggal{" "}
                  {(settings?.payroll_date || 28) - 1} bulan berikutnya
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget Warning Settings */}
        <Card className="neobrutalism-card">
          <CardHeader className="border-b-2 border-black bg-destructive text-destructive-foreground">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Peringatan Budget
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="warningThreshold" className="text-sm font-semibold">
                  Ambang Batas Peringatan (%)
                </Label>
                <Input
                  id="warningThreshold"
                  type="number"
                  min="50"
                  max="100"
                  value={settings?.budget_warning_threshold || 80}
                  onChange={(e) => updateSetting("budget_warning_threshold", Number.parseInt(e.target.value) || 80)}
                  className="neobrutalism-input mt-2 max-w-32"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Peringatan akan muncul ketika pengeluaran mencapai {settings?.budget_warning_threshold || 80}% dari
                  budget
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <CategoryManager />

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={saveSettings}
            className="neobrutalism-button bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3"
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Simpan Pengaturan
          </Button>
        </div>
      </div>
    </div>
  )
}
