import { Bell, Check, CheckCheck, Trash2, X, Volume2, VolumeX, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { useNotifications } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';

export const NotificationCenter = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll, soundEnabled, setSoundEnabled } = useNotifications();
  const navigate = useNavigate();

  const getIcon = (type: string) => {
    const icons: Record<string, string> = {
      usage_alert: '⚠️',
      rate_limit: '🚫',
      payment: '💳',
      tier_upgrade: '🚀',
      api_key: '🔑',
      api_key_revoked: '⚠️',
      failed_login: '🚨',
      role_changed: '👤',
      org_invite: '📨',
      approval_request: '📋',
      approval_granted: '✅',
      approval_rejected: '❌',
      approval_escalated: '🚨',
      delegation_activated: '👥',
      delegation_received: '👥',
      general: '📢'
    };
    return icons[type] || '📢';
  };



  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => setSoundEnabled(!soundEnabled)} title={soundEnabled ? 'Mute' : 'Unmute'}>
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-muted-foreground">
              <Bell className="h-12 w-12 mb-2 opacity-20" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-accent transition-colors ${!notification.read ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => deleteNotification(notification.id)}
                        >
                           <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                      <div className="flex items-center justify-between mt-2 gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                        <div className="flex gap-1">
                          {notification.action_url && (
                            <Button
                              variant="default"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => {
                                navigate(notification.action_url!);
                                markAsRead(notification.id);
                              }}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              {notification.action_label || 'View'}
                            </Button>
                          )}
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Mark read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

      </DropdownMenuContent>
    </DropdownMenu>
  );
};
