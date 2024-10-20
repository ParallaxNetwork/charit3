import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { DateTime } from "luxon";
import mime from "mime"

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

export function checkFileExtension(file: File, types: string[]): boolean {
  const fileType = mime.getType(file.name)
  if (!fileType) {
    return false
  }
  const fileExtension = mime.getExtension(fileType)!
  return types.includes(fileExtension)
}

export function fileToBase64(file?: File): Promise<string> {
  if (!file) {
    return Promise.resolve("");
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const shortAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}