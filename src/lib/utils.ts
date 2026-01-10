import { type ClassValue, clsx } from "clsx"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function createPageUrl(path: string, params?: Record<string, string>) {
  if (!params) return path;
  
  const searchParams = new URLSearchParams(params);
  return `${path}?${searchParams.toString()}`;
}