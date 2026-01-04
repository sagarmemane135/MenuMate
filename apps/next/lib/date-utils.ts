/**
 * Date utility functions for Indian timezone (IST - Asia/Kolkata)
 * All dates in the application should be displayed in Indian Standard Time
 */

const INDIAN_TIMEZONE = "Asia/Kolkata";

/**
 * Format a date to Indian timezone with date and time
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted date string in IST (e.g., "1/1/2025, 5:30:00 PM")
 */
export function formatIndianDateTime(date: string | Date | number): string {
  const dateObj = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: INDIAN_TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
  }).format(dateObj);
}

/**
 * Format a date to Indian timezone with date only
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted date string in IST (e.g., "1/1/2025")
 */
export function formatIndianDate(date: string | Date | number): string {
  const dateObj = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: INDIAN_TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(dateObj);
}

/**
 * Format a date to Indian timezone with time only
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted time string in IST (e.g., "5:30:00 PM")
 */
export function formatIndianTime(date: string | Date | number): string {
  const dateObj = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: INDIAN_TIMEZONE,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
  }).format(dateObj);
}

/**
 * Get relative time ago (e.g., "5 minutes ago")
 * @param date - Date string, Date object, or timestamp
 * @returns Relative time string
 */
export function getTimeAgo(date: string | Date | number): string {
  const dateObj = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  const now = new Date();
  
  // Convert both to IST for accurate comparison
  const dateInIST = new Date(dateObj.toLocaleString("en-US", { timeZone: INDIAN_TIMEZONE }));
  const nowInIST = new Date(now.toLocaleString("en-US", { timeZone: INDIAN_TIMEZONE }));
  
  const diffInSeconds = Math.floor((nowInIST.getTime() - dateInIST.getTime()) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) {
    return "just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else {
    return formatIndianDate(date);
  }
}



