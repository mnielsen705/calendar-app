import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Calendar, CalendarInsert, CalendarUpdate, CalendarWithPermission } from '../types/database';
import { useAuth } from './useAuth';

export function useCalendars() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const calendarsQuery = useQuery({
    queryKey: ['calendars', user?.id],
    queryFn: async (): Promise<CalendarWithPermission[]> => {
      if (!user) return [];

      // Fetch own calendars
      const { data: ownCalendars, error: ownError } = await supabase
        .from('calendars')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('name');

      if (ownError) throw ownError;

      // Fetch shared calendars
      const { data: shares, error: sharesError } = await supabase
        .from('calendar_shares')
        .select('calendar_id, permission')
        .eq('shared_with_user_id', user.id);

      if (sharesError) throw sharesError;

      let sharedCalendars: CalendarWithPermission[] = [];
      if (shares && shares.length > 0) {
        const calendarIds = shares.map((s: { calendar_id: string }) => s.calendar_id);
        const { data: sharedData, error: sharedError } = await supabase
          .from('calendars')
          .select('*')
          .in('id', calendarIds);

        if (sharedError) throw sharedError;

        sharedCalendars = ((sharedData || []) as Calendar[]).map((cal) => ({
          ...cal,
          permission: (shares.find((s: { calendar_id: string; permission: string }) => s.calendar_id === cal.id)?.permission as 'view' | 'edit'),
        }));
      }

      const ownWithPermission: CalendarWithPermission[] = ((ownCalendars || []) as Calendar[]).map((cal) => ({
        ...cal,
        permission: 'owner' as const,
      }));

      return [...ownWithPermission, ...sharedCalendars];
    },
    enabled: !!user,
  });

  const createCalendar = useMutation({
    mutationFn: async (data: Omit<CalendarInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data: calendar, error } = await supabase
        .from('calendars')
        .insert({ ...data, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return calendar as Calendar;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendars'] });
    },
  });

  const updateCalendar = useMutation({
    mutationFn: async ({ id, ...data }: CalendarUpdate & { id: string }) => {
      const { data: calendar, error } = await supabase
        .from('calendars')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return calendar as Calendar;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendars'] });
    },
  });

  const deleteCalendar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('calendars').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendars'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  return {
    calendars: calendarsQuery.data || [],
    isLoading: calendarsQuery.isLoading,
    error: calendarsQuery.error,
    createCalendar,
    updateCalendar,
    deleteCalendar,
  };
}
