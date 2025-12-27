const COOLDOWN_MINUTES = 5;
const COOLDOWN_MS = COOLDOWN_MINUTES * 60 * 1000;

interface CooldownData {
  boardId: string;
  timestamp: number;
}

// Get cooldown data from localStorage
export function getCooldownData(boardId: string): CooldownData | null {
  const key = `crowdcolor_cooldown_${boardId}`;
  const data = localStorage.getItem(key);
  
  if (!data) return null;
  
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// Set cooldown data in localStorage
export function setCooldownData(boardId: string): void {
  const key = `crowdcolor_cooldown_${boardId}`;
  const data: CooldownData = {
    boardId,
    timestamp: Date.now(),
  };
  localStorage.setItem(key, JSON.stringify(data));
}

// Check if user can place a pixel
export function canPlacePixel(boardId: string): boolean {
  const cooldownData = getCooldownData(boardId);
  
  if (!cooldownData) return true;
  
  const elapsed = Date.now() - cooldownData.timestamp;
  return elapsed >= COOLDOWN_MS;
}

// Get remaining cooldown time in milliseconds
export function getRemainingCooldown(boardId: string): number {
  const cooldownData = getCooldownData(boardId);
  
  if (!cooldownData) return 0;
  
  const elapsed = Date.now() - cooldownData.timestamp;
  const remaining = COOLDOWN_MS - elapsed;
  
  return remaining > 0 ? remaining : 0;
}

// Format remaining time as human-readable string
export function formatCooldownTime(ms: number): string {
  if (ms <= 0) return 'Ready!';
  
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((ms % (60 * 1000)) / 1000);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}
