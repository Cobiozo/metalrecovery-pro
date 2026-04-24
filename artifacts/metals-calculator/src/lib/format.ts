export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatMass = (value: number, unit: 'g' | 'kg' | 'pieces' = 'g') => {
  if (unit === 'pieces') {
    return `${value} szt.`;
  }
  return `${value.toFixed(2)} ${unit}`;
};

export const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`;
};
