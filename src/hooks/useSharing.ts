import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { CalendarShare, ShareInvitation } from '../types/database';
import { useAuth } from './useAuth';

export function useSharing(calendarId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const sharesQuery = useQuery({
    queryKey: ['calendar-shares', calendarId],
    queryFn: async (): Promise<CalendarShare[]> => {
      if (!calendarId) return [];

      const { data, error } = await supabase
        .from('calendar_shares')
        .select('*')
        .eq('calendar_id', calendarId);

      if (error) throw error;
      return (data || []) as CalendarShare[];
    },
    enabled: !!calendarId,
  });

  const invitationsQuery = useQuery({
    queryKey: ['share-invitations', calendarId],
    queryFn: async (): Promise<ShareInvitation[]> => {
      if (!calendarId) return [];

      const { data, error } = await supabase
        .from('share_invitations')
        .select('*')
        .eq('calendar_id', calendarId);

      if (error) throw error;
      return (data || []) as ShareInvitation[];
    },
    enabled: !!calendarId,
  });

  const inviteUser = useMutation({
    mutationFn: async (data: { email: string; permission: 'view' | 'edit' }) => {
      if (!user || !calendarId) throw new Error('Missing required data');

      const { data: invitation, error } = await supabase
        .from('share_invitations')
        .insert({
          calendar_id: calendarId,
          invited_email: data.email,
          permission: data.permission,
          invited_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return invitation as ShareInvitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['share-invitations', calendarId] });
    },
  });

  const updateSharePermission = useMutation({
    mutationFn: async (data: { shareId: string; permission: 'view' | 'edit' }) => {
      const { error } = await supabase
        .from('calendar_shares')
        .update({ permission: data.permission })
        .eq('id', data.shareId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-shares', calendarId] });
    },
  });

  const removeShare = useMutation({
    mutationFn: async (shareId: string) => {
      const { error } = await supabase.from('calendar_shares').delete().eq('id', shareId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-shares', calendarId] });
      queryClient.invalidateQueries({ queryKey: ['calendars'] });
    },
  });

  const cancelInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase.from('share_invitations').delete().eq('id', invitationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['share-invitations', calendarId] });
    },
  });

  return {
    shares: sharesQuery.data || [],
    invitations: invitationsQuery.data || [],
    isLoading: sharesQuery.isLoading || invitationsQuery.isLoading,
    inviteUser,
    updateSharePermission,
    removeShare,
    cancelInvitation,
  };
}
