import dayjs from "dayjs";
import LocalizedFormat from "dayjs/plugin/localizedFormat";

dayjs.extend(LocalizedFormat);

/**
 * Format a date using standard app formats
 *
 * Uses dayjs format tokens:
 * - 'll' for date only: "Oct 13, 2014"
 * - 'lll' for date with time: "Oct 13, 2014 1:30 PM"
 */
export function formatDate(date: Date | string, includeTime = false): string {
  const format = includeTime ? "lll" : "ll";
  return dayjs(date).format(format);
}

/**
 * Format a date for display (date only)
 * Example: "Oct 13, 2014"
 */
export function formatDateOnly(date: Date | string): string {
  return formatDate(date, false);
}

/**
 * Format a date with time for display
 * Example: "Oct 13, 2014 1:30 PM"
 */
export function formatDateTime(date: Date | string): string {
  return formatDate(date, true);
}
