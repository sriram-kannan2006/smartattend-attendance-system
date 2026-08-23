import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { notificationService } from '@/services/notificationService';
import { useToast } from '@/context/ToastContext';
import { Bell, CheckCircle2, Clock, Calendar, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';

export default function StudentNotifications() {
  const { showSuccess, showError } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getNotifications({ page: 1, limit: 30 });
      setNotifications(res.data?.data?.notifications || []);
      setUnreadCount(res.data?.data?.unreadCount || 0);
    } catch (err) {
      showError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      showError('Failed to update notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      showSuccess('All notifications marked as read');
    } catch (err) {
      showError('Failed to mark all as read');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" /> Notifications & Alerts
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time updates regarding your class attendance, absences, and approvals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkAllAsRead}
              className="text-xs rounded-xl"
            >
              Mark all as read ({unreadCount})
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={fetchNotifications}
            className="text-xs rounded-xl"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs font-semibold">
            Loading your alerts...
          </div>
        ) : notifications.length === 0 ? (
          <Card className="p-8 text-center rounded-3xl border border-slate-200 bg-white">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">All caught up!</h3>
            <p className="text-xs text-slate-500 mt-1">You have no new attendance alerts or notifications.</p>
          </Card>
        ) : (
          notifications.map((notif) => {
            const isAbsence = notif.type === 'ABSENCE_ALERT' || notif.type === 'ATTENDANCE_ABSENT';
            return (
              <Card
                key={notif._id}
                className={`p-4 rounded-2xl border transition shadow-xs ${
                  notif.isRead
                    ? 'border-slate-200 bg-white opacity-85'
                    : isAbsence
                    ? 'border-red-200 bg-red-50/40 shadow-sm'
                    : 'border-blue-200 bg-blue-50/40 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      {isAbsence ? (
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                      <span className="font-bold text-xs text-slate-900">{notif.title}</span>
                      {!notif.isRead && (
                        <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-blue-600 text-white">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">{notif.message}</p>
                    <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(notif.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(notif.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </div>

                  {!notif.isRead && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleMarkAsRead(notif._id)}
                      className="text-[11px] text-blue-600 hover:text-blue-800"
                    >
                      Dismiss
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
