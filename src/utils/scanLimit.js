const STORAGE_KEY = 'safeclick_ai_daily_scans';
export const DAILY_FREE_LIMIT = 3;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * @returns {{ count: number, remaining: number, canScan: boolean, isAtLimit: boolean, dailyLimit: number }}
 */
export function getScanStatus() {
  let count = 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === todayKey()) {
        count = Number(parsed.count) || 0;
      }
    }
  } catch {
    // ignore
  }
  const remaining = Math.max(0, DAILY_FREE_LIMIT - count);
  return {
    count,
    remaining,
    canScan: remaining > 0,
    isAtLimit: remaining === 0,
    dailyLimit: DAILY_FREE_LIMIT,
  };
}

/** Call after a successful scan (API OK, before navigation). */
export function consumeScan() {
  const status = getScanStatus();
  if (!status.canScan) return false;
  const next = status.count + 1;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ date: todayKey(), count: next })
    );
  } catch {
    return false;
  }
  return true;
}
