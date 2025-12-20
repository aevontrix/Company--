/**
 * Utility for conditionally joining class names
 * A simple alternative to clsx/classnames
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export default cn;
