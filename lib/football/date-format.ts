const TIME_ZONE = "Asia/Shanghai";

export type FormattedMatchDateTime = {
  label: string;
  date: string;
  time: string;
};

export function formatMatchDateTime(value: string | Date | null | undefined): FormattedMatchDateTime {
  const date = value instanceof Date ? value : new Date(value ?? "");
  if (Number.isNaN(date.getTime())) {
    return { label: "时间待定", date: "时间待定", time: "" };
  }

  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("zh-CN", {
      timeZone: TIME_ZONE,
      month: "numeric",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  const formattedDate = `${parts.month}月${parts.day}日 ${parts.weekday}`;
  const formattedTime = `${parts.hour}:${parts.minute}`;
  return { label: `${formattedDate} ${formattedTime}`, date: formattedDate, time: formattedTime };
}
