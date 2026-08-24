/**
 * Indian Rupee (INR / ₹) Formatting Utilities
 * Adheres to Indian Numbering System (Crores, Lakhs, Thousands)
 */

export function formatINR(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

export function formatINRCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0 INR';
  return `₹${Number(amount).toLocaleString('en-IN')} INR`;
}

/**
 * Formats large amounts into Indian terminology:
 * >= 1,00,00,000 (1 Crore / 10M) -> ₹X.XX Cr
 * >= 1,00,000 (1 Lakh / 100K) -> ₹X.XX L (or Lakhs)
 * >= 1,000 -> ₹X.X k
 */
export function formatINRLarge(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 10000000) {
    const cr = abs / 10000000;
    return `${sign}₹${cr >= 100 ? cr.toFixed(1) : cr.toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    const l = abs / 100000;
    return `${sign}₹${l >= 100 ? l.toFixed(1) : l.toFixed(2)} L`;
  }
  if (abs >= 1000) {
    return `${sign}₹${(abs / 1000).toFixed(1)}k`;
  }
  return `${sign}₹${abs.toLocaleString('en-IN')}`;
}

/**
 * Compact format specifically for graph labels and tight badges
 */
export function formatINRGraph(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 10000000) {
    return `${sign}₹${(abs / 10000000).toFixed(1)}Cr`;
  }
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(1)}L`;
  }
  if (abs >= 1000) {
    return `${sign}₹${(abs / 1000).toFixed(0)}k`;
  }
  return `${sign}₹${abs.toLocaleString('en-IN')}`;
}
