// Shared avatar helpers — colored initials used on profile, compete, friends.

// Initials: "Marcus T." -> "MT", "kim" -> "K", "you@x.com" -> "Y"
export function initials(nameOrHandle: string) {
  const base = nameOrHandle.includes('@') ? nameOrHandle.split('@')[0] : nameOrHandle
  const p = base.replace(/[._]/g, ' ').trim().split(/\s+/)
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || '?'
}

const AVATAR_COLORS = ['#3B82F6', '#8B5CF6', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899']

// Deterministic color from a name/handle.
export function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}
