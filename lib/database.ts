import { supabase, type Transaction, type Platform, type Debt, type Goal } from "./supabase"

export class DatabaseService {
  // Transactions
  static async getTransactions(userId?: string): Promise<Transaction[]> {
    let query = supabase.from("transactions").select("*").order("date", { ascending: false })

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching transactions:", error)
      return []
    }

    return data || []
  }

  static async addTransaction(
    transaction: Omit<Transaction, "id" | "created_at">,
    userId?: string,
  ): Promise<Transaction | null> {
    const transactionData = userId ? { ...transaction, user_id: userId } : transaction
    const { data, error } = await supabase.from("transactions").insert([transactionData]).select().single()

    if (error) {
      console.error("Error adding transaction:", error)
      return null
    }

    return data
  }

  static async updateTransaction(
    id: number,
    transaction: Partial<Transaction>,
    userId?: string,
  ): Promise<Transaction | null> {
    let query = supabase.from("transactions").update(transaction).eq("id", id)

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data, error } = await query.select().single()

    if (error) {
      console.error("Error updating transaction:", error)
      return null
    }

    return data
  }

  static async deleteTransaction(id: number, userId?: string): Promise<boolean> {
    let query = supabase.from("transactions").delete().eq("id", id)

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { error } = await query

    if (error) {
      console.error("Error deleting transaction:", error)
      return false
    }

    return true
  }

  // Platforms
  static async getPlatforms(userId?: string): Promise<Platform[]> {
    let query = supabase.from("platforms").select("*").order("account")

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching platforms:", error)
      return []
    }

    return data || []
  }

  static async addPlatform(platform: Omit<Platform, "id" | "created_at">, userId?: string): Promise<Platform | null> {
    const platformData = userId ? { ...platform, user_id: userId } : platform
    const { data, error } = await supabase.from("platforms").insert([platformData]).select().single()

    if (error) {
      console.error("Error adding platform:", error)
      return null
    }

    return data
  }

  static async updatePlatform(id: number, platform: Partial<Platform>, userId?: string): Promise<Platform | null> {
    let query = supabase.from("platforms").update(platform).eq("id", id)

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data, error } = await query.select().single()

    if (error) {
      console.error("Error updating platform:", error)
      return null
    }

    return data
  }

  static async deletePlatform(id: number, userId?: string): Promise<boolean> {
    let query = supabase.from("platforms").delete().eq("id", id)

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { error } = await query

    if (error) {
      console.error("Error deleting platform:", error)
      return false
    }

    return true
  }

  // Debts
  static async getDebts(userId?: string): Promise<Debt[]> {
    let query = supabase.from("debts").select("*").order("due-date")

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching debts:", error)
      return []
    }

    return data || []
  }

  static async addDebt(debt: Omit<Debt, "id" | "created_at">, userId?: string): Promise<Debt | null> {
    const debtData = userId ? { ...debt, user_id: userId } : debt
    const { data, error } = await supabase.from("debts").insert([debtData]).select().single()

    if (error) {
      console.error("Error adding debt:", error)
      return null
    }

    return data
  }

  static async updateDebt(id: number, debt: Partial<Debt>, userId?: string): Promise<Debt | null> {
    let query = supabase.from("debts").update(debt).eq("id", id)

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data, error } = await query.select().single()

    if (error) {
      console.error("Error updating debt:", error)
      return null
    }

    return data
  }

  static async deleteDebt(id: number, userId?: string): Promise<boolean> {
    let query = supabase.from("debts").delete().eq("id", id)

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { error } = await query

    if (error) {
      console.error("Error deleting debt:", error)
      return false
    }

    return true
  }

  // Goals
  static async getGoals(userId?: string): Promise<Goal[]> {
    let query = supabase.from("goals").select("*").order("deadline")

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching goals:", error)
      return []
    }

    return data || []
  }

  static async addGoal(goal: Omit<Goal, "id" | "created_at">, userId?: string): Promise<Goal | null> {
    const goalData = userId ? { ...goal, user_id: userId } : goal
    const { data, error } = await supabase.from("goals").insert([goalData]).select().single()

    if (error) {
      console.error("Error adding goal:", error)
      return null
    }

    return data
  }

  static async updateGoal(id: number, goal: Partial<Goal>, userId?: string): Promise<Goal | null> {
    let query = supabase.from("goals").update(goal).eq("id", id)

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data, error } = await query.select().single()

    if (error) {
      console.error("Error updating goal:", error)
      return null
    }

    return data
  }

  static async deleteGoal(id: number, userId?: string): Promise<boolean> {
    let query = supabase.from("goals").delete().eq("id", id)

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { error } = await query

    if (error) {
      console.error("Error deleting goal:", error)
      return false
    }

    return true
  }

  // Budgets
  static async getBudgets(userId?: string): Promise<any[]> {
    let query = supabase.from("budgets").select("*").order("category")

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching budgets:", error)
      return []
    }

    return data || []
  }

  static async addBudget(budget: any, userId?: string): Promise<any | null> {
    const budgetData = userId ? { ...budget, user_id: userId } : budget
    const { data, error } = await supabase.from("budgets").insert([budgetData]).select().single()

    if (error) {
      console.error("Error adding budget:", error)
      return null
    }

    return data
  }

  static async updateBudget(id: number, budget: any, userId?: string): Promise<any | null> {
    let query = supabase.from("budgets").update(budget).eq("id", id)

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data, error } = await query.select().single()

    if (error) {
      console.error("Error updating budget:", error)
      return null
    }

    return data
  }

  static async deleteBudget(id: number, userId?: string): Promise<boolean> {
    let query = supabase.from("budgets").delete().eq("id", id)

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { error } = await query

    if (error) {
      console.error("Error deleting budget:", error)
      return false
    }

    return true
  }

  // Categories - Global categories don't need user filtering, but user-created ones do
  static async getCategories(userId?: string): Promise<any[]> {
    let query = supabase.from("categories").select("*").eq("is_active", true).order("name")

    // Get both default categories and user-specific categories
    if (userId) {
      query = query.or(`user_id.is.null,user_id.eq.${userId}`)
    } else {
      query = query.is("user_id", null)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching categories:", error)
      return []
    }

    return data || []
  }

  static async getCategoriesWithSubcategories(userId?: string): Promise<any[]> {
    let query = supabase
      .from("categories")
      .select(`
        id,
        name,
        type,
        parent_id,
        is_default,
        user_id,
        subcategories:categories!parent_id(id, name, type, is_default, user_id)
      `)
      .is("parent_id", null)
      .eq("is_active", true)
      .order("name")

    // Get both default categories and user-specific categories
    if (userId) {
      query = query.or(`user_id.is.null,user_id.eq.${userId}`)
    } else {
      query = query.is("user_id", null)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching categories with subcategories:", error)
      return []
    }

    return data || []
  }

  static async addCategory(
    category: {
      name: string
      type: string
      parent_id?: number
      is_default?: boolean
    },
    userId?: string,
  ): Promise<any | null> {
    const categoryData = userId ? { ...category, user_id: userId } : category
    const { data, error } = await supabase.from("categories").insert([categoryData]).select().single()

    if (error) {
      console.error("Error adding category:", error)
      return null
    }

    return data
  }

  static async updateCategory(id: number, category: Partial<any>, userId?: string): Promise<any | null> {
    let query = supabase.from("categories").update(category).eq("id", id)

    // Only allow updating user's own categories or default categories
    if (userId) {
      query = query.or(`user_id.is.null,user_id.eq.${userId}`)
    }

    const { data, error } = await query.select().single()

    if (error) {
      console.error("Error updating category:", error)
      return null
    }

    return data
  }

  static async deleteCategory(id: number, userId?: string): Promise<boolean> {
    // Soft delete by setting is_active to false
    let query = supabase.from("categories").update({ is_active: false }).eq("id", id)

    // Only allow deleting user's own categories (not default ones)
    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { error } = await query

    if (error) {
      console.error("Error deleting category:", error)
      return false
    }

    return true
  }

  static async getSubcategoriesByType(type: string, userId?: string): Promise<any[]> {
    let query = supabase
      .from("categories")
      .select("*")
      .eq("type", type)
      .not("parent_id", "is", null)
      .eq("is_active", true)
      .order("name")

    // Get both default subcategories and user-specific subcategories
    if (userId) {
      query = query.or(`user_id.is.null,user_id.eq.${userId}`)
    } else {
      query = query.is("user_id", null)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching subcategories:", error)
      return []
    }

    return data || []
  }
}
