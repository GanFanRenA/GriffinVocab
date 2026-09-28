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

/* ==================== 更新弹窗 ==================== */
const UPDATE_VERSION = '2026-09-28-01'
const UPDATE_NOTES = [
  'Subjects are now searchable, and you can create new ones on the fly.',
  'Units use a structured format: Prefix + Number + optional Title.',
  'Unit prefix can be set to "None" for free-form titles.',
  'Comments can be collapsed or expanded; auto-opens when study is done.'
]
const UPDATE_STORAGE_KEY = 'griffinVocab_seenVersion'

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]))
}

function showUpdatePopup() {
  // 登录页不显示；已读过当前版本也不显示
  if (window.location.pathname.endsWith('login.html')) return
  if (localStorage.getItem(UPDATE_STORAGE_KEY) === UPDATE_VERSION) return

  const overlay = document.createElement('div')
  overlay.className = 'update-overlay'
  overlay.innerHTML = `
    <div class="update-popup" role="dialog" aria-modal="true" aria-labelledby="update-title">
      <div class="update-popup-head">
        <h3 id="update-title">What's New</h3>
        <button class="update-popup-close" type="button" aria-label="Close">×</button>
      </div>
      <p class="update-popup-version">Version ${escapeHtml(UPDATE_VERSION)}</p>
      <ul class="update-popup-list">
        ${UPDATE_NOTES.map(n => `<li>${escapeHtml(n)}</li>`).join('')}
      </ul>
      <div class="update-popup-foot">
        <button class="update-popup-ok" type="button">Got it</button>
      </div>
    </div>
  `
  document.body.appendChild(overlay)

  let closed = false
  const close = () => {
    if (closed) return
    closed = true
    overlay.classList.add('closing')
    setTimeout(() => overlay.remove(), 200)
    localStorage.setItem(UPDATE_STORAGE_KEY, UPDATE_VERSION)
  }

  overlay.querySelector('.update-popup-close').addEventListener('click', close)
  overlay.querySelector('.update-popup-ok').addEventListener('click', close)
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close() })
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close() })
}

// 稍作延迟，避免与 requireLogin 的未登录重定向冲突
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(showUpdatePopup, 300))
} else {
  setTimeout(showUpdatePopup, 300)
}