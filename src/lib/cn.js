import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes safely — resolves conflicts and conditionals.
 * Usage: cn('text-red-500', condition && 'text-blue-500', 'p-4')
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
