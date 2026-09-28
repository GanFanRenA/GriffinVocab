import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

export const supabase = createClient(
    'https://hjlnubicstqnlappbrjc.supabase.co',
    'sb_publishable_oyxAGzlhR4oXmhH8rrs0rw_uHMbzsVx'
)

// 检查登录，未登录跳转到 login.html，并带上原地址
export async function requireLogin() {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        const redirect = encodeURIComponent(window.location.pathname + window.location.search)
        window.location.href = `login.html?redirect=${redirect}`
        return null
    }

    return session.user
}

// 登出
export async function logout() {
    await supabase.auth.signOut()
    window.location.href = 'login.html'
}

// ==================== 单元排序 ====================
// 自然排序：字母按本地化字母序，数字按数值比较
// 例：Unit 2 排在 Unit 10 之前；Chapter A 排在 Chapter B 之前
// sensitivity: 'base' 让大小写不敏感（"unit 1" 与 "Unit 1" 视为相同）
export function compareUnits(a, b) {
  return String(a ?? '').localeCompare(String(b ?? ''), 'zh-CN', {
    numeric: true,
    sensitivity: 'base'
  })
}

// 返回按字母序排好序的新数组（不修改原数组）
export function sortUnits(units) {
  return [...units].sort(compareUnits)
}