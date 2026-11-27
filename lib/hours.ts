import type { DayHours } from "@/site.config";

export const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SHORT: Record<string, string> = {
  Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun",
};

export const DEFAULT_WEEK: DayHours[] = WEEK_DAYS.map((day) => ({
  day,
  open: day !== "Sunday",
  from: "08:00",
  to: "18:00",
}));

/** "08:00" -> "8 AM", "17:30" -> "5:30 PM" */
export function formatTime(t: string): string {
  const [hStr, mStr = "00"] = (t || "").split(":");
  const h = Number(hStr);
  if (Number.isNaN(h)) return t;
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return mStr === "00" ? `${h12} ${suffix}` : `${h12}:${mStr} ${suffix}`;
}

/** Groups days with the same hours: [{days: "Mon – Fri", time: "8 AM – 6 PM"}, {days: "Sun", time: "Closed"}] */
export function groupHours(week: DayHours[]): { days: string; time: string }[] {
  const out: { days: string; time: string }[] = [];
  let i = 0;
  while (i < week.length) {
    const key = (d: DayHours) => (d.open ? `${d.from}-${d.to}` : "closed");
    let j = i;
    while (j + 1 < week.length && key(week[j + 1]) === key(week[i])) j++;
    const first = week[i];
    const last = week[j];
    const days = i === j ? first.day : `${SHORT[first.day] ?? first.day} – ${SHORT[last.day] ?? last.day}`;
    const time = first.open ? `${formatTime(first.from)} – ${formatTime(first.to)}` : "Closed";
    out.push({ days, time });
    i = j + 1;
  }
  return out;
}
