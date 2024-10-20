import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import mime from "mime"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function checkFileExtension(file: File, types: string[]): boolean {
  const fileType = mime.getType(file.name)
  if (!fileType) {
    return false
  }
  const fileExtension = mime.getExtension(fileType)!
  return types.includes(fileExtension)
}
