"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";

const DAYS = [
  ["dimanche", "dim"],
  ["lundi", "lun"],
  ["mardi", "mar"],
  ["mercredi", "mer"],
  ["jeudi", "jeu"],
  ["vendredi", "ven"],
  ["samedi", "sam"],
];

export type Schedule = {
  openDay: number;
  closeDay: number;
  opensAt: number;
  closesAt: number;
};

export function parseSchedule(hours: string): Schedule | undefined {
  const timeMatch = /(\d{1,2})[:h](\d{2})\s*[–-]\s*(\d{1,2})[:h](\d{2})/i.exec(hours);
  if (!timeMatch || timeMatch.index === undefined) return undefined;

  const prefix = hours.slice(0, timeMatch.index).toLocaleLowerCase("fr");
  const dayTokens = prefix.match(/lun(?:di)?|mar(?:di)?|mer(?:credi)?|jeu(?:di)?|ven(?:dredi)?|sam(?:edi)?|dim(?:anche)?/gi);
  let openDay = 0;
  let closeDay = 6;

  if (!/tous les jours|quotidien|7j\/7/.test(prefix)) {
    if (!dayTokens?.length) return undefined;
    const normalizeDay = (token: string) => {
      const normalized = token.toLocaleLowerCase("fr");
      return DAYS.findIndex(([full, short]) => normalized === full || normalized === short);
    };
    openDay = normalizeDay(dayTokens[0]);
    closeDay = normalizeDay(dayTokens[1] ?? dayTokens[0]);
    if (openDay < 0 || closeDay < 0) return undefined;
  }

  const values = timeMatch.slice(1).map(Number);
  const [openHour, openMinute, closeHour, closeMinute] = values;
  if (openHour > 23 || closeHour > 23 || openMinute > 59 || closeMinute > 59) return undefined;

  return {
    openDay,
    closeDay,
    opensAt: openHour * 60 + openMinute,
    closesAt: closeHour * 60 + closeMinute,
  };
}

export function isOpenDay(day: number, schedule: Schedule) {
  if (schedule.openDay <= schedule.closeDay) {
    return day >= schedule.openDay && day <= schedule.closeDay;
  }
  return day >= schedule.openDay || day <= schedule.closeDay;
}

export function formatTime(minutes: number) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return minute ? `${hour}h${String(minute).padStart(2, "0")}` : `${hour}h`;
}

export function getStoreOpenStatus(hours: string, now: Date) {
  const schedule = parseSchedule(hours);
  if (!schedule) return { label: "Horaires à confirmer", open: null };

  const day = now.getDay();
  const time = now.getHours() * 60 + now.getMinutes();
  if (
    isOpenDay(day, schedule) &&
    time >= schedule.opensAt &&
    time < schedule.closesAt
  ) {
    return { label: `Ouvert · ferme à ${formatTime(schedule.closesAt)}`, open: true };
  }

  for (let offset = 0; offset <= 7; offset++) {
    const upcomingDay = (day + offset) % 7;
    if (!isOpenDay(upcomingDay, schedule)) continue;
    if (offset === 0 && time >= schedule.closesAt) continue;

    const dayLabel = offset === 0
      ? ""
      : offset === 1
        ? "demain "
        : `${DAYS[upcomingDay][0]} `;
    return {
      label: `Fermé · ouvre ${dayLabel}à ${formatTime(schedule.opensAt)}`,
      open: false,
    };
  }
  return { label: "Horaires à confirmer", open: null };
}

export default function OpenStatusBadge({ hours }: { hours: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const status = now ? getStoreOpenStatus(hours, now) : { label: "Horaires à confirmer", open: null };
  const color = status.open === true
    ? "border-white/45 bg-[#214532]/85 text-white"
    : status.open === false
      ? "border-white/65 bg-[#f5f0e7]/85 text-stone-900"
      : "border-white/45 bg-stone-900/75 text-white";

  return (
    <span
      aria-label={status.label}
      className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold shadow-sm backdrop-blur-md ${color}`}
    >
      <Clock3 aria-hidden="true" className="h-4 w-4 shrink-0" />
      {status.label}
    </span>
  );
}
