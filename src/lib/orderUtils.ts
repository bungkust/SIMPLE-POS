/**
 * Generate a unique order code in the format KP-YYMMDD-XXXXXX
 * @param createdAt - The creation timestamp (defaults to current time)
 * @returns Order code string
 */
export function generateOrderCode(createdAt: Date = new Date()): string {
  const year = createdAt.getFullYear().toString().slice(-2);
  const month = (createdAt.getMonth() + 1).toString().padStart(2, '0');
  const day = createdAt.getDate().toString().padStart(2, '0');

  // Generate a random 6-character alphanumeric string
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();

  return `KP-${year}${month}${day}-${randomPart}`;
}
