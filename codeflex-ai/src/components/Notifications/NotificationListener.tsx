"use client";

import React, { useEffect, useState } from 'react';
import { useSignalR } from '@/contexts/SignalRContext';
import { Notification } from '@/lib/signalr/hubConnection';
import { X, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface NotificationToast {
  id: string;
  notification: Notification;
}

export const NotificationListener: React.FC = () => {
  const { onNotification, offNotification } = useSignalR();
  const [notifications, setNotifications] = useState<NotificationToast[]>([]);

  useEffect(() => {
    const handleNotification = (notification: Notification) => {
      const id = Date.now().toString();
      setNotifications(prev => [...prev, { id, notification }]);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 5000);
    };

    onNotification(handleNotification);

    return () => {
      offNotification(handleNotification);
    };
  }, [onNotification, offNotification]);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map(({ id, notification }) => (
        <Card
          key={id}
          className="p-4 shadow-lg border-l-4 animate-in slide-in-from-right"
          style={{
            borderLeftColor: 
              notification.type === 'success' ? '#22c55e' :
              notification.type === 'error' ? '#ef4444' :
              notification.type === 'warning' ? '#eab308' :
              '#3b82f6'
          }}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(notification.type)}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">{notification.title}</h4>
              <p className="text-sm text-muted-foreground">{notification.message}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(notification.timestamp).toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => removeNotification(id)}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
};
