import { format, parseISO } from 'date-fns';

export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr);
};

export const formatTime = (date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'hh:mm a');
};

export const formatPercentage = (value) => {
  if (value === null || value === undefined) return '0%';
  return `${Number(value).toFixed(1)}%`;
};

export const getStatusColor = (status) => {
  const colors = {
    PRESENT: 'success',
    ABSENT: 'error',
    OD: 'info',
    LATE: 'warning',
    EXCUSED: 'secondary',
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'error',
    ACTIVE: 'success',
    CLOSED: 'secondary',
  };
  return colors[status?.toUpperCase()] || 'secondary';
};

export const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

export const generateId = () => {
  return Math.random().toString(36).substring(2, 9);
};

export const classNames = (...classes) => {
  return classes.filter(Boolean).join(' ');
};
