export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCurrencyCompact(value: number | undefined | null): string {
  if (value === undefined || value === null) return '-';
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return formatCurrency(value);
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatNumber(value: number | undefined | null): string {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatPercent(value: number | undefined | null): string {
  if (value === undefined || value === null) return '-';
  return `${value.toFixed(1)}%`;
}

export function formatSquareFeet(value: number | undefined | null): string {
  if (value === undefined || value === null) return '-';
  return `${formatNumber(value)} SF`;
}

export function formatProjectCode(code: string | undefined | null): string {
  if (!code) return '-';
  return code;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

export function getDaysUntil(dateStr: string | undefined | null): number | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - now.getTime()) / 86400000);
}

export function getUrgencyColor(daysUntil: number | null): string {
  if (daysUntil === null) return '#9CA3AF';
  if (daysUntil < 0) return '#EF4444';    // Overdue - red
  if (daysUntil <= 3) return '#F59E0B';    // Urgent - amber
  if (daysUntil <= 7) return '#3B82F6';    // Soon - blue
  return '#10B981';                         // On track - green
}
