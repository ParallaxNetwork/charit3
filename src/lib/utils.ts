import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { DateTime } from "luxon";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDollar = (amount: number) => {
  return `$${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;
};

export const countDownTo = (time: number) => {
  // 14 : 20 : 11
  const now = DateTime.now();
  const target = DateTime.fromSeconds(time);
  const diff = target.diff(now, ["hours", "minutes", "seconds"]);
  return diff.toFormat("hh : mm : ss");
};
