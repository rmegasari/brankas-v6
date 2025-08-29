import { supabase } from "./supabase"

export interface UserProfile {
  id: string
  full_name?: string
  "phone-number"?: string
  location?: string
  birth_date?: string
  avatar_url?: string
}

export interface UserSettings {
  id: string
  language: string
  theme: string
  payroll_date: number
  budget_warning_threshold: number
  created_at?: string
  updated_at?: string
}

export class ProfileService {
  // Profile management
  static async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error fetching profile:", error)
      return null
    }

    return data
  }

  static async updateProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile | null> {
    const { data, error } = await supabase.from("profiles").update(profile).eq("id", userId).select().single()

    if (error) {
      console.error("Error updating profile:", error)
      return null
    }

    return data
  }

  // Settings management
  static async getSettings(userId: string): Promise<UserSettings | null> {
    const { data, error } = await supabase.from("user_settings").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error fetching settings:", error)
      return null
    }

    return data
  }

  static async updateSettings(userId: string, settings: Partial<UserSettings>): Promise<UserSettings | null> {
    const { data, error } = await supabase
      .from("user_settings")
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      console.error("Error updating settings:", error)
      return null
    }

    return data
  }

  // Avatar management
  static async uploadAvatar(userId: string, file: File): Promise<string | null> {
    const fileExt = file.name.split(".").pop()
    const fileName = `${userId}/avatar.${fileExt}`

    const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, { upsert: true })

    if (uploadError) {
      console.error("Error uploading avatar:", uploadError)
      return null
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(fileName)

    return data.publicUrl
  }

  static async deleteAvatar(userId: string): Promise<boolean> {
    const { error } = await supabase.storage.from("avatars").remove([`${userId}/avatar`])

    if (error) {
      console.error("Error deleting avatar:", error)
      return false
    }

    return true
  }

  // Default avatars
  static getDefaultAvatars(): string[] {
    return [
      "/diverse-user-avatars.png",
      "/professional-avatar.png",
      "/avatar-pria-profesional.png",
      "/avatar-wanita-profesional.png",
      "/avatar-casual-pria.png",
      "/avatar-casual-wanita.png",
    ]
  }
}
