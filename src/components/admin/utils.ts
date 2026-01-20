export const formatDuration = (min: number) => {
  const hours = Math.floor(min / 60);
  const minutes = min % 60;
  return `${hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''}` : ''} ${minutes > 0 ? `${minutes} min` : ''}`.trim();
};

// Format currency as '₪ 2,080'
export const formatCurrency = (amount: number) => {
  if (typeof amount !== 'number' || isNaN(amount)) return '';
  return `₪ ${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

// Helper function to format price (handles ranges like "10-80")
export const formatPrice = (price: number | string): string => {
  if (typeof price === 'string' && price.includes('-')) {
    // Format as "10 - 80 ₪"
    const parts = price.split('-').map(p => p.trim());
    return `₪ ${parts.join(' - ')}`;
  }
  return formatCurrency(Number(price));
};

// Helper function to get numeric price for calculations (handles ranges by using minimum)
export const getNumericPrice = (price: number | string | undefined | null): number => {
  if (price === undefined || price === null) return 0;
  if (typeof price === 'string' && price.includes('-')) {
    const parts = price.split('-').map(p => p.trim());
    const min = Number(parts[0]);
    return isNaN(min) ? 0 : min;
  }
  const numPrice = Number(price);
  return isNaN(numPrice) ? 0 : numPrice;
};

