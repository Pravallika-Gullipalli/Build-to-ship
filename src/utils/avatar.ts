/**
 * Avatar generation and fallback utilities for CivicFix
 */

export const getDefaultAvatar = (name = 'User', role = 'citizen'): string => {
  const cleanName = (name || 'User').trim();
  const initials = cleanName
    .split(/\s+/)
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('') || 'U';

  // Role tailored background gradient colors
  let bgGradientStart = '#2563eb'; // blue
  let bgGradientEnd = '#1d4ed8';
  let badgeColor = '#60a5fa';

  if (role === 'officer') {
    bgGradientStart = '#059669'; // emerald
    bgGradientEnd = '#047857';
    badgeColor = '#34d399';
  } else if (role === 'admin') {
    bgGradientStart = '#7c3aed'; // purple
    bgGradientEnd = '#6d28d9';
    badgeColor = '#a78bfa';
  }

  // Generate a clean SVG data URI
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bgGradientStart}" />
          <stop offset="100%" stop-color="${bgGradientEnd}" />
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="60" fill="url(#avatarGrad)" />
      <circle cx="60" cy="60" r="56" fill="none" stroke="${badgeColor}" stroke-width="2" stroke-opacity="0.4" />
      <text 
        x="60" 
        y="68" 
        text-anchor="middle" 
        fill="#ffffff" 
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
        font-size="42" 
        font-weight="700" 
        letter-spacing="1"
      >${initials}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const getAvatarUrl = (user?: { name?: string; avatarUrl?: string; role?: string } | null): string => {
  if (!user) return getDefaultAvatar('User');
  if (user.avatarUrl && user.avatarUrl.trim() !== '' && !user.avatarUrl.includes('photo-1535713875002-d1d0cf377fde') && !user.avatarUrl.includes('photo-1494790108377-be9c29b29330') && !user.avatarUrl.includes('photo-1507003211169') && !user.avatarUrl.includes('photo-1573496359142')) {
    return user.avatarUrl;
  }
  return getDefaultAvatar(user.name || user.role, user.role);
};
