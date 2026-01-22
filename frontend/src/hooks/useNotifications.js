import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

// Notification types and their configurations
const NOTIFICATION_TYPES = {
  success: {
    icon: '✅',
    style: { background: '#065f46', color: '#d1fae5', border: '1px solid #10b981' },
  },
  error: {
    icon: '❌',
    style: { background: '#7f1d1d', color: '#fecaca', border: '1px solid #ef4444' },
  },
  warning: {
    icon: '⚠️',
    style: { background: '#78350f', color: '#fef3c7', border: '1px solid #f59e0b' },
  },
  info: {
    icon: 'ℹ️',
    style: { background: '#1e3a5f', color: '#bfdbfe', border: '1px solid #3b82f6' },
  },
  loading: {
    icon: '⏳',
    style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid #374151' },
  },
};

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);

  const notify = useCallback((message, type = 'info', options = {}) => {
    const config = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.info;
    
    const toastId = toast(message, {
      icon: config.icon,
      style: config.style,
      duration: options.duration || 4000,
      position: options.position || 'top-right',
      ...options,
    });

    const notification = {
      id: toastId,
      message,
      type,
      timestamp: Date.now(),
    };

    setNotifications(prev => [notification, ...prev].slice(0, 50));

    return toastId;
  }, []);

  const notifySuccess = useCallback((message, options) => {
    return notify(message, 'success', options);
  }, [notify]);

  const notifyError = useCallback((message, options) => {
    return notify(message, 'error', { duration: 6000, ...options });
  }, [notify]);

  const notifyWarning = useCallback((message, options) => {
    return notify(message, 'warning', options);
  }, [notify]);

  const notifyInfo = useCallback((message, options) => {
    return notify(message, 'info', options);
  }, [notify]);

  const notifyLoading = useCallback((message, options) => {
    return toast.loading(message, {
      style: NOTIFICATION_TYPES.loading.style,
      ...options,
    });
  }, []);

  const dismissNotification = useCallback((toastId) => {
    toast.dismiss(toastId);
  }, []);

  const updateNotification = useCallback((toastId, message, type = 'success') => {
    const config = NOTIFICATION_TYPES[type];
    toast.success(message, {
      id: toastId,
      icon: config.icon,
      style: config.style,
    });
  }, []);

  // Transaction-specific notifications
  const notifyTxPending = useCallback((txHash) => {
    return notifyLoading(`Transacción pendiente...`, {
      id: txHash,
    });
  }, [notifyLoading]);

  const notifyTxSuccess = useCallback((txHash, message = 'Transacción exitosa') => {
    toast.success(message, {
      id: txHash,
      icon: '✅',
      style: NOTIFICATION_TYPES.success.style,
    });
  }, []);

  const notifyTxError = useCallback((txHash, message = 'Transacción fallida') => {
    toast.error(message, {
      id: txHash,
      icon: '❌',
      style: NOTIFICATION_TYPES.error.style,
    });
  }, []);

  const clearAllNotifications = useCallback(() => {
    toast.dismiss();
    setNotifications([]);
  }, []);

  return {
    notifications,
    notify,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    notifyLoading,
    dismissNotification,
    updateNotification,
    notifyTxPending,
    notifyTxSuccess,
    notifyTxError,
    clearAllNotifications,
  };
}

export default useNotifications;
