import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
  action_url?: string;
  action_label?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('notificationSoundEnabled');
    return saved !== 'false';
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element for notification sound
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGe77OeeSwwNUKXh8LdjHAU7k9nyz3ovBSF1xe/glEILElyx6OyrWBUIRJze8sFuJAUug9Dx2oo2CBZltuvnnUsMC1Cl4fC3YxwFO5PZ8s96LwUhdsXv4JRCCxJcsevsq1gVCESc3vLBbiQFLoHQ8dqKNggWZbbr551LDAtQpeHwt2McBTuT2fLPei8FIXbF7+CUQgsSXLHr7KtYFQhEnN7ywW4kBS6B0PHaijYIFmW26+edSwwLUKXh8LdjHAU7k9nyz3ovBSF2xe/glEILElyx6+yrWBUIRJze8sFuJAUugdDx2oo2CBZltuvnnUsMC1Cl4fC3YxwFO5PZ8s96LwUhdsXv4JRCCxJcsevsq1gVCESc3vLBbiQFLoHQ8dqKNggWZbbr551LDAtQpeHwt2McBTuT2fLPei8FIXbF7+CUQgsSXLHr7KtYFQhEnN7ywW4kBS6B0PHaijYIFmW26+edSwwLUKXh8LdjHAU7k9nyz3ovBSF2xe/glEILElyx6+yrWBUIRJze8sFuJAUugdDx2oo2CBZltuvnnUsMC1Cl4fC3YxwFO5PZ8s96LwUhdsXv4JRCCxJcsevsq1gVCESc3vLBbiQFLoHQ8dqKNggWZbbr551LDAtQpeHwt2McBTuT2fLPei8FIXbF7+CUQgsSXLHr7KtYFQhEnN7ywW4kBS6B0PHaijYIFmW26+edSwwLUKXh8LdjHAU7k9nyz3ovBSF2xe/glEILElyx6+yrWBUIRJze8sFuJAUugdDx2oo2CBZltuvnnUsMC1Cl4fC3YxwFO5PZ8s96LwUhdsXv4JRCCxJcsevsq1gVCESc3vLBbiQFLoHQ8dqKNggWZbbr551LDAtQpeHwt2McBTuT2fLPei8FIXbF7+CUQgsSXLHr7KtYFQhEnN7ywW4kBS6B0PHaijYIFmW26+edSwwLUKXh8LdjHAU7k9nyz3ovBSF2xe/glEILElyx6+yrWBUIRJze8sFuJAUugdDx2oo2CBZltuvnnUsMC1Cl4fC3Yx==');
  }, []);

  useEffect(() => {
    localStorage.setItem('notificationSoundEnabled', soundEnabled.toString());
  }, [soundEnabled]);


  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    fetchNotifications();
    subscribeToNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) setNotifications(data);
  };

  const subscribeToNotifications = () => {
    if (!user) return;

    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const newNotification = payload.new as Notification;
        setNotifications(prev => [newNotification, ...prev]);
        showToast(newNotification);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const showToast = (notification: Notification) => {
    // Play sound if enabled
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }

    const iconMap: Record<string, string> = {
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
    
    const icon = iconMap[notification.type] || '📢';

    toast(`${icon} ${notification.title}`, {
      description: notification.message,
      duration: 5000
    });
  };



  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = async () => {
    if (!user) return;
    await supabase.from('notifications').delete().eq('user_id', user.id);
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;


  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      markAsRead, 
      markAllAsRead, 
      deleteNotification, 
      clearAll,
      soundEnabled,
      setSoundEnabled
    }}>
      {children}
    </NotificationContext.Provider>
  );

};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};
