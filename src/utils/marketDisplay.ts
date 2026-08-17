export const categoryIcons: Record<string, string> = {
  Politics: '🏛️',
  Sports: '🏴',
  Crypto: '₿',
  Entertainment: '🎤',
  Tech: '💻',
  Finance: '🏦',
  General: '🎯',
}

export const categoryIcon = (category?: string) =>
  categoryIcons[category ?? ''] ?? '🎯'
