import { XpReason, XpEvent } from '@/types';

export const XP_AWARDS: Record<XpReason, number> = {
  'log-moment': 10,
  'start-pause': 10,
  'complete-1min-pause': 10,
  'complete-full-pause': 30,
  'post-pause-checkin': 10,
  'choose-outcome': 10,
  'coach-message': 5,
  'coach-helped': 10,
  'weekly-deck-open': 10,
  'flip-all-cards': 30,
  'save-highlight': 10,
  'comeback-24h': 20,
};

export const XP_DAILY_CAPS: Partial<Record<XpReason, number>> = {
  'coach-message': 30,
  'coach-helped': 2,
  'comeback-24h': 1,
};

export const DISTRESS_MODE_DAILY_CAP = 60;

export const getXPAmount = (reason: XpReason): number => {
  return XP_AWARDS[reason] || 0;
};

export const checkDailyCap = (
  reason: XpReason,
  todayEvents: XpEvent[]
): { allowed: boolean; current: number; cap?: number } => {
  const cap = XP_DAILY_CAPS[reason];
  
  if (cap === undefined) {
    return { allowed: true, current: 0 };
  }
  
  const todayCount = todayEvents.filter(e => e.reason === reason).length;
  
  return {
    allowed: todayCount < cap,
    current: todayCount,
    cap,
  };
};

export const checkDistressModeCap = (
  todayEvents: XpEvent[],
  isDistressMode: boolean
): { allowed: boolean; totalXP: number; remaining: number } => {
  if (!isDistressMode) {
    return { allowed: true, totalXP: 0, remaining: Infinity };
  }
  
  const totalXP = todayEvents.reduce((sum, event) => sum + event.amount, 0);
  const remaining = Math.max(0, DISTRESS_MODE_DAILY_CAP - totalXP);
  
  return {
    allowed: totalXP < DISTRESS_MODE_DAILY_CAP,
    totalXP,
    remaining,
  };
};

export const getTodayEvents = (events: XpEvent[]): XpEvent[] => {
  const now = Date.now();
  const todayStart = new Date(now).setHours(0, 0, 0, 0);
  return events.filter(e => e.timestamp >= todayStart);
};

export const shouldAwardXP = (
  reason: XpReason,
  events: XpEvent[],
  isDistressMode: boolean,
  lastActiveTimestamp?: number
): { allowed: boolean; reason?: string } => {
  const todayEvents = getTodayEvents(events);
  
  const dailyCapCheck = checkDailyCap(reason, todayEvents);
  if (!dailyCapCheck.allowed) {
    return { 
      allowed: false, 
      reason: `Daily cap reached for ${reason} (${dailyCapCheck.current}/${dailyCapCheck.cap})` 
    };
  }
  
  if (reason === 'comeback-24h') {
    if (!lastActiveTimestamp) {
      return { allowed: false, reason: 'No last active timestamp' };
    }
    const hoursSinceActive = (Date.now() - lastActiveTimestamp) / (1000 * 60 * 60);
    if (hoursSinceActive < 24) {
      return { allowed: false, reason: 'Less than 24h since last active' };
    }
  }
  
  const distressCheck = checkDistressModeCap(todayEvents, isDistressMode);
  if (!distressCheck.allowed) {
    return { 
      allowed: false, 
      reason: `Distress mode daily cap reached (${distressCheck.totalXP}/${DISTRESS_MODE_DAILY_CAP})` 
    };
  }
  
  return { allowed: true };
};

export const calculateXPToAward = (
  reason: XpReason,
  events: XpEvent[],
  isDistressMode: boolean
): number => {
  const baseXP = getXPAmount(reason);
  
  if (!isDistressMode) {
    return baseXP;
  }
  
  const todayEvents = getTodayEvents(events);
  const distressCheck = checkDistressModeCap(todayEvents, isDistressMode);
  
  return Math.min(baseXP, distressCheck.remaining);
};
