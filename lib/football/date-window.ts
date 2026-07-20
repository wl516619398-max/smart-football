const TIME_ZONE = "Asia/Shanghai";

export function toShanghaiDateKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getUpcomingDateWindow(days = 30) {
  const startKey = toShanghaiDateKey(new Date());
  const start = new Date(`${startKey}T00:00:00+08:00`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + days);
  const endKey = toShanghaiDateKey(end);

  return { start, end, startKey, endKey };
}

export function isInUpcomingDateWindow(value: string | Date, days = 30) {
  const key = toShanghaiDateKey(value);
  const window = getUpcomingDateWindow(days);
  return Boolean(key && key >= window.startKey && key <= window.endKey);
}

export function isTodayOrFuture(value: string | Date) {
  const key = toShanghaiDateKey(value);
  const todayKey = toShanghaiDateKey(new Date());
  return Boolean(key && todayKey && key >= todayKey);
}
