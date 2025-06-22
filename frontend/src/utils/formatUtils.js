// src/utils/formatUtils.js

export const formatCurrency = (amount, currency = 'USD') => {
  if (isNaN(amount) || amount === null || amount === undefined) return '$0.00';
  
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch (error) {
    console.error('Error al formatear moneda:', error);
    return `$${Number(amount).toFixed(2)}`;
  }
};

export const formatNumber = (number, decimals = 2) => {
  if (isNaN(number) || number === null || number === undefined) return '0';
  
  try {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(Number(number));
  } catch (error) {
    console.error('Error al formatear número:', error);
    return Number(number).toFixed(decimals);
  }
};

export const formatPercentage = (value, decimals = 2) => {
  if (isNaN(value) || value === null || value === undefined) return '0%';
  
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(Number(value));
  } catch (error) {
    console.error('Error al formatear porcentaje:', error);
    return `${(Number(value) * 100).toFixed(decimals)}%`;
  }
};