import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  UserX, 
  RefreshCw, 
  MessageSquare,
  Calendar,
  User
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppToast } from '@/components/ui/toast-provider';
import { deactivateSubscriber } from '@/lib/telegram-webhook';
import { colors, typography, components, sizes, spacing, cn } from '@/lib/design-system';

interface Subscriber {
  id: string;
  chat_id: string;
  username: string | null;
  first_name: string | null;
  registered_at: string | null;
  is_active: boolean | null;
}

interface SubscribersListProps {
  tenantId?: string;
}

export function SubscribersList({ tenantId }: SubscribersListProps) {
  const { showSuccess, showError } = useAppToast();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [deactivating, setDeactivating] = useState<string | null>(null);

  const loadSubscribers = async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('telegram_subscribers')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('registered_at', { ascending: false });

      if (error) throw error;
      setSubscribers(data || []);
    } catch (error) {
      console.error('Error loading subscribers:', error);
      showError('Error', 'Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscribers();
  }, [tenantId]);

  const handleDeactivate = async (subscriberId: string, chatId: string) => {
    if (!tenantId) return;

    try {
      setDeactivating(subscriberId);
      const result = await deactivateSubscriber(tenantId, chatId);
      
      if (result.success) {
        showSuccess('Success', 'Subscriber deactivated successfully');
        await loadSubscribers(); // Refresh the list
      } else {
        showError('Error', result.error || 'Failed to deactivate subscriber');
      }
    } catch (error) {
      console.error('Error deactivating subscriber:', error);
      showError('Error', 'Failed to deactivate subscriber');
    } finally {
      setDeactivating(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDisplayName = (subscriber: Subscriber) => {
    if (subscriber.first_name) {
      return subscriber.username 
        ? `${subscriber.first_name} (@${subscriber.username})`
        : subscriber.first_name;
    }
    return subscriber.username ? `@${subscriber.username}` : `Chat ${subscriber.chat_id}`;
  };

  if (loading) {
    return (
      <Card className={cn(components.card)}>
        <CardHeader>
          <CardTitle className={cn(typography.h4)}>Telegram Subscribers</CardTitle>
          <CardDescription className={cn(typography.body.medium, colors.text.secondary)}>
            Users registered to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading subscribers...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(components.card)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className={cn(typography.h4)}>Telegram Subscribers</CardTitle>
            <CardDescription className={cn(typography.body.medium, colors.text.secondary)}>
              Users registered to receive notifications ({subscribers.length})
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadSubscribers}
            disabled={loading}
            className={cn(components.buttonOutline)}
          >
            <RefreshCw className={cn(sizes.icon.sm, loading ? "animate-spin" : "")} />
            <span className="ml-2">Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {subscribers.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className={cn(typography.h4, "text-muted-foreground mb-2")}>No Subscribers</h3>
            <p className={cn(typography.body.medium, colors.text.secondary)}>
              No users have registered for Telegram notifications yet.
            </p>
            <p className={cn(typography.body.small, colors.text.secondary, "mt-2")}>
              Users need to chat with the bot and send /start to register.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {subscribers.map((subscriber) => (
              <div key={subscriber.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className={cn(typography.body.medium, "font-medium")}>
                        {getDisplayName(subscriber)}
                      </h4>
                      <Badge 
                        variant={subscriber.is_active ? "default" : "secondary"}
                        className={cn(
                          subscriber.is_active 
                            ? "bg-green-100 text-green-800" 
                            : "bg-gray-100 text-gray-600"
                        )}
                      >
                        {subscriber.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(subscriber.registered_at)}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <MessageSquare className="h-3 w-3" />
                        <span>Chat ID: {subscriber.chat_id}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {subscriber.is_active && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeactivate(subscriber.id, subscriber.chat_id)}
                      disabled={deactivating === subscriber.id}
                      className={cn(components.buttonOutline, "text-red-600 hover:text-red-700 hover:bg-red-50")}
                    >
                      {deactivating === subscriber.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserX className="h-4 w-4" />
                      )}
                      <span className="ml-2">Deactivate</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {subscribers.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="text-center">
              <p className={cn(typography.body.small, colors.text.secondary)}>
                💡 Users can reactivate by sending /start to the bot again
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
