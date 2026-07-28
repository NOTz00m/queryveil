// shared settings logic used by the service worker and benchmark

export function shouldPauseForSchedule(settings, date = new Date()) {
  if (!settings?.schedule?.enabled) return false;

  const hour = date.getHours();
  const start = settings.schedule.startHour;
  const end = settings.schedule.endHour;

  if (start < end) {
    return hour < start || hour >= end;
  }

  if (start > end) {
    return hour < start && hour >= end;
  }

  return false;
}
