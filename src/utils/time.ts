/**
 * Utility functions for calculating and managing order and table timing in real-time.
 */

export const calculateElapsedMinutes = (timeStr?: string, fallback: number = 0): number => {
  if (!timeStr) return fallback;
  try {
    // Try ISO format first
    let targetDate = new Date(timeStr);
    if (isNaN(targetDate.getTime())) {
      // Try parsing "hh:mm AM/PM" or "hh:mm:ss"
      const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
      if (match) {
        let hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const period = match[3]?.toUpperCase();
        if (period === 'PM' && hours < 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        const now = new Date();
        targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
        
        // If the calculated time is more than 5 minutes into the future (e.g. booked before midnight, viewed after midnight), subtract 1 day
        if (targetDate.getTime() - now.getTime() > 5 * 60 * 1000) {
          targetDate.setDate(targetDate.getDate() - 1);
        }
      } else {
        return fallback;
      }
    }
    const diffMs = Date.now() - targetDate.getTime();
    const elapsed = Math.max(0, Math.floor(diffMs / (1000 * 60)));
    return Math.max(elapsed, fallback);
  } catch {
    return fallback;
  }
};

/**
 * Returns timing status info and color classes based on elapsed minutes.
 * Maximum waiting time is 20 minutes as per operations requirements.
 */
export const getTimingStatus = (elapsedMinutes: number, status: string) => {
  if (status === 'COMPLETED' || status === 'CANCELLED') {
    return {
      level: 'COMPLETED',
      label: 'Completed',
      colorClass: 'text-on-surface-variant bg-surface-container font-medium border-outline-variant/30',
      cardBorder: 'border-outline-variant/30',
      cardBg: 'bg-white',
      badgeClass: 'bg-surface-container text-on-surface-variant',
      icon: '✓'
    };
  }

  if (elapsedMinutes >= 20) {
    return {
      level: 'CRITICAL',
      label: 'MAX TIME EXCEEDED (>20m)',
      colorClass: 'text-white bg-error font-bold shadow-sm border-error animate-pulse',
      cardBorder: 'border-error border-2 shadow-error/10 shadow-lg',
      cardBg: 'bg-error-container/15',
      badgeClass: 'bg-error text-white font-extrabold animate-pulse',
      icon: '⚠️'
    };
  }

  if (elapsedMinutes >= 12) {
    return {
      level: 'WARNING',
      label: 'Approaching Max (20m limit)',
      colorClass: 'text-amber-950 bg-amber-400 font-bold border-amber-500 shadow-sm',
      cardBorder: 'border-amber-500/80 border-2 shadow-amber-500/10 shadow-md',
      cardBg: 'bg-amber-50/50',
      badgeClass: 'bg-amber-400 text-amber-950 font-bold',
      icon: '⏳'
    };
  }

  return {
    level: 'NORMAL',
    label: 'On Schedule',
    colorClass: 'text-primary bg-primary/10 font-semibold border-primary/20',
    cardBorder: 'border-outline-variant/60 hover:border-primary/50',
    cardBg: 'bg-white',
    badgeClass: 'bg-primary-container/30 text-primary font-semibold',
    icon: '🟢'
  };
};
