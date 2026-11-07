import React, { useState } from 'react';
import { useJobs } from '../../context/JobContext';
import { Notification, NotificationType } from '../../types';
import {
  Bell,
  CheckCircle2,
  Calendar,
  Briefcase,
  MessageSquare,
  AlertCircle,
  Clock,
  Check,
  X
} from 'lucide-react';

interface NotificationCenterProps {
  onNavigateToView?: (view: string, id?: string) => void;
  onClose?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  onNavigateToView,
  onClose
}) => {
  const { notifications, unreadNotificationsCount, markNotificationAsRead, markAllNotificationsAsRead } = useJobs();
  const [filterUnread, setFilterUnread] = useState(false);

  const filtered = filterUnread
    ? notifications.filter((n) => !n.read)
    : notifications;

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'application_received':
        return <Briefcase className="w-4 h-4 text-[#2563EB]" />;
      case 'status_change':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'new_message':
        return <MessageSquare className="w-4 h-4 text-indigo-600" />;
      case 'job_update':
        return <Bell className="w-4 h-4 text-amber-500" />;
      case 'contact_request':
        return <Calendar className="w-4 h-4 text-purple-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.read) {
      await markNotificationAsRead(notif.id);
    }

    if (onNavigateToView) {
      if (notif.type === 'status_change' || notif.type === 'application_received') {
        onNavigateToView('applications');
      } else if (notif.type === 'new_message') {
        onNavigateToView('messages');
      } else if (notif.type === 'job_update') {
        onNavigateToView('jobs');
      } else if (notif.type === 'contact_request') {
        onNavigateToView('messages');
      }
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#2563EB]" />
            <span>Notifications</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time updates regarding job applications, interview calls, and employer messages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadNotificationsCount > 0 && (
            <button
              type="button"
              onClick={() => markAllNotificationsAsRead()}
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#2563EB] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark All as Read</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setFilterUnread(!filterUnread)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              filterUnread
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
          >
            {filterUnread ? 'Showing Unread Only' : 'Show All'}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-gray-100 mt-4">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-gray-800">No notifications</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">
              You will receive real-time alerts when employers review your profile or schedule interviews.
            </p>
          </div>
        ) : (
          filtered.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`py-4 px-3 sm:px-4 rounded-2xl transition-all cursor-pointer flex items-start gap-4 ${
                !notif.read ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="p-2.5 rounded-2xl bg-white shadow-2xs border border-gray-100 shrink-0">
                {getIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-gray-900 truncate">{notif.title}</h4>
                  <span className="text-[10px] text-gray-400 shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(
                      notif.createdAt?.seconds ? notif.createdAt.seconds * 1000 : notif.createdAt
                    ).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{notif.message}</p>
              </div>

              {!notif.read && (
                <span className="w-2.5 h-2.5 bg-[#2563EB] rounded-full shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
