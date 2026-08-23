import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { cva } from "class-variance-authority"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export { cva }
