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