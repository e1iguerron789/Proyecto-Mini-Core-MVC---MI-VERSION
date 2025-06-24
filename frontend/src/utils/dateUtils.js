import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatDate = (date, formatString = 'dd/MM/yyyy') => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '';
    
    return format(dateObj, formatString, { locale: es });
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return '';
  }
};

export const formatDateForAPI = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '';
    
    return format(dateObj, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error al formatear fecha para API:', error);
    return '';
  }
};

export const toInputDate = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '';
    
    return format(dateObj, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error al convertir fecha para input:', error);
    return '';
  }
};

export const getCurrentMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  
  return {
    start: formatDateForAPI(start),
    end: formatDateForAPI(end),
  };
};