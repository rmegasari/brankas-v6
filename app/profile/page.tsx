"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Camera, Save, User, Mail, Phone, MapPin, Calendar, Loader2, ImageIcon } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { ProfileService, type UserProfile, type UserSettings } from "@/lib/profile-service"

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showAvatarDialog, setShowAvatarDialog] = useState(false)

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    location: "",
    birth_date: "",
  })

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return

      setLoading(true)
      const [profileData, settingsData] = await Promise.all([
        ProfileService.getProfile(user.id),
        ProfileService.getSettings(user.id),
      ])

      if (profileData) {
        setProfile(profileData)
        setFormData({
          full_name: profileData.full_name || "",
          phone: profileData.phone || "",
          location: profileData.location || "",
          birth_date: profileData.birth_date || "",
        })
      }

      if (settingsData) {
        setSettings(settingsData)
      }

      setLoading(false)
    }

    if (user) {
      loadUserData()
    }
  }, [user])

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    const updatedProfile = await ProfileService.updateProfile(user.id, formData)

    if (updatedProfile) {
      setProfile(updatedProfile)
      setIsEditing(false)
    }
    setSaving(false)
  }

  const handleAvatarUpload = async (file: File) => {
    if (!user) return

    setSaving(true)
    const avatarUrl = await ProfileService.uploadAvatar(user.id, file)

    if (avatarUrl) {
      const updatedProfile = await ProfileService.updateProfile(user.id, { avatar_url: avatarUrl })
      if (updatedProfile) {
        setProfile(updatedProfile)
      }
    }
    setSaving(false)
    setShowAvatarDialog(false)
  }

  const handleDefaultAvatarSelect = async (avatarUrl: string) => {
    if (!user) return

    setSaving(true)
    const updatedProfile = await ProfileService.updateProfile(user.id, { avatar_url: avatarUrl })
    if (updatedProfile) {
      setProfile(updatedProfile)
    }
    setSaving(false)
    setShowAvatarDialog(false)
  }

  const handleSettingsUpdate = async (newSettings: Partial<UserSettings>) => {
    if (!user || !settings) return

    const updatedSettings = await ProfileService.updateSettings(user.id, newSettings)
    if (updatedSettings) {
      setSettings(updatedSettings)
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
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground font-manrope mb-2">Profil Saya</h1>
          <p className="text-muted-foreground">Kelola informasi profil dan preferensi akun Anda</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="neobrutalism-card lg:col-span-1">
            <CardHeader className="text-center">
              <div className="relative mx-auto w-24 h-24 mb-4">
                <Avatar className="w-24 h-24 border-2 border-black">
                  <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} alt={profile?.full_name || "User"} />
                  <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
                    {(profile?.full_name || user?.user_metadata?.full_name || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
                  <DialogTrigger asChild>
                    <button className="absolute bottom-0 right-0 p-1 bg-primary text-primary-foreground rounded-full border-2 border-black cursor-pointer hover:bg-primary/90 transition-colors">
                      <Camera className="h-4 w-4" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="neobrutalism-card">
                    <DialogHeader>
                      <DialogTitle>Pilih Avatar</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-semibold">Upload Foto Baru</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          className="neobrutalism-input mt-2"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleAvatarUpload(file)
                          }}
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-semibold mb-3 block">Atau Pilih Avatar Default</Label>
                        <div className="grid grid-cols-3 gap-3">
                          {ProfileService.getDefaultAvatars().map((avatarUrl, index) => (
                            <button
                              key={index}
                              onClick={() => handleDefaultAvatarSelect(avatarUrl)}
                              className="p-2 border-2 border-black hover:bg-muted transition-colors"
                            >
                              <Avatar className="w-16 h-16">
                                <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={`Avatar ${index + 1}`} />
                                <AvatarFallback>
                                  <ImageIcon className="h-6 w-6" />
                                </AvatarFallback>
                              </Avatar>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <CardTitle className="text-xl font-bold font-manrope">
                {profile?.full_name || user?.user_metadata?.full_name || "User"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Member sejak {new Date(user?.created_at || "").getFullYear()}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>Email terverifikasi</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card className="neobrutalism-card lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold font-manrope">Informasi Profil</CardTitle>
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant="outline"
                  className="neobrutalism-button bg-transparent"
                  disabled={saving}
                >
                  {isEditing ? "Batal" : "Edit"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nama Lengkap
                  </Label>
                  <Input
                    id="name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="neobrutalism-input"
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input id="email" type="email" value={user?.email || ""} className="neobrutalism-input" disabled />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Nomor Telepon
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="neobrutalism-input"
                    placeholder="Belum diisi"
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Lokasi
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="neobrutalism-input"
                    placeholder="Belum diisi"
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="birthDate" className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Tanggal Lahir
                  </Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    className="neobrutalism-input"
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {isEditing && (
                <div className="mt-6 flex gap-3">
                  <Button
                    onClick={handleSave}
                    className="neobrutalism-button bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Simpan Perubahan
                  </Button>
                  <Button
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                    className="neobrutalism-button bg-transparent"
                    disabled={saving}
                  >
                    Batal
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Account Settings */}
        <Card className="neobrutalism-card mt-6">
          <CardHeader>
            <CardTitle className="text-xl font-bold font-manrope">Pengaturan Akun</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Bahasa</Label>
                <Select
                  value={settings?.language || "id"}
                  onValueChange={(value) => handleSettingsUpdate({ language: value })}
                >
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
                <Label className="text-sm font-semibold">Tema</Label>
                <Select
                  value={settings?.theme || "light"}
                  onValueChange={(value) => handleSettingsUpdate({ theme: value })}
                >
                  <SelectTrigger className="neobrutalism-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light Mode</SelectItem>
                    <SelectItem value="dark">Dark Mode</SelectItem>
                    <SelectItem value="pink">Pink Theme</SelectItem>
                    <SelectItem value="blue">Blue Theme</SelectItem>
                    <SelectItem value="green">Green Theme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t-2 border-black">
              <h3 className="text-lg font-bold font-manrope mb-4">Zona Bahaya</h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="neobrutalism-button bg-transparent text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  Ubah Password
                </Button>
                <Button
                  variant="outline"
                  className="neobrutalism-button bg-transparent text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  Hapus Akun
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
